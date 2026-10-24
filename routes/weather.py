"""Weather (the Home chip and the 🌤 Weather page, frontend/src/pages/WeatherPage.tsx) from Open-Meteo: free, no account or key.
GET /api/weather -> {"place", "at", "current": {...}, "days": [today + the next 4], "hours": [hourly for those days]}
(the hours come in the same request, so they cost nothing extra). Kept in live_docs/weather.json and only looked up
again when that's over 4 hours old (or ?refresh=1), so opening pages never waits on the internet. POST /api/weather {"place": "Belgrade"}
changes the town (looked up by name with Open-Meteo's geocoder) and fetches it straight away."""
import json
import os
import threading
import time
import urllib.parse
import urllib.request

import config
import util

PATH = os.path.join(config.LIVE_DOCS_DIR, "weather.json")
MAX_AGE = 4 * 3600
DEFAULT = {"place": "Belgrade", "lat": 44.8125, "lon": 20.4612}   # (the Mac's timezone is Europe/Belgrade)
_LOCK = threading.Lock()


def _read():
    try:
        with open(PATH, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return dict(DEFAULT)


def _write(data):
    util.write_json(PATH, data, ensure_ascii=False, indent=1)


def _get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Call Studio"}), timeout=8) as r:
        return json.loads(r.read().decode("utf-8"))


def _fetch(data):
    q = urllib.parse.urlencode({
        "latitude": data["lat"], "longitude": data["lon"], "timezone": "auto", "forecast_days": 5,
        "current": "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
        "hourly": "temperature_2m,weather_code,precipitation_probability,is_day",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset"})
    d = _get("https://api.open-meteo.com/v1/forecast?" + q)
    c, dl = d.get("current", {}), d.get("daily", {})
    data["current"] = {"temp": c.get("temperature_2m"), "feels": c.get("apparent_temperature"), "code": c.get("weather_code"),
                       "wind": c.get("wind_speed_10m"), "day": bool(c.get("is_day", 1))}
    data["days"] = [{"date": dl["time"][i], "code": dl["weather_code"][i], "max": dl["temperature_2m_max"][i], "min": dl["temperature_2m_min"][i],
                     "rain": dl["precipitation_probability_max"][i], "sunrise": dl["sunrise"][i][-5:], "sunset": dl["sunset"][i][-5:]}
                    for i in range(len(dl.get("time", [])))]
    h = d.get("hourly", {})
    data["hours"] = [{"t": h["time"][i], "temp": h["temperature_2m"][i], "code": h["weather_code"][i], "rain": h["precipitation_probability"][i],
                      "day": bool(h["is_day"][i])} for i in range(len(h.get("time", [])))]
    data["at"] = time.time()
    data.pop("error", None)
    return data


def weather_get(handler):
    refresh = util.query(handler).get("refresh", ["0"])[0] == "1"
    with _LOCK:
        data = _read()
        if refresh or not data.get("days") or "hours" not in data or time.time() - data.get("at", 0) > MAX_AGE:
            try:
                data = _fetch(data)
                _write(data)
            except Exception as e:   # offline: keep showing the last forecast, marked stale
                data["error"] = str(e)[:200]
    handler._json(200, data)


def weather_place(handler):
    try:
        place = str(json.loads(handler._read_body().decode("utf-8") or "{}").get("place", "")).strip()[:80]
    except ValueError:
        place = ""
    if not place:
        handler._json(400, {"error": "type a town or city"})
        return
    try:
        hits = _get("https://geocoding-api.open-meteo.com/v1/search?" + urllib.parse.urlencode({"name": place, "count": 1})).get("results") or []
        if not hits:
            handler._json(404, {"error": f"couldn't find {place}"})
            return
        h = hits[0]
        data = {"place": ", ".join(x for x in (h.get("name"), h.get("country")) if x), "lat": h["latitude"], "lon": h["longitude"]}
        with _LOCK:
            data = _fetch(data)
            _write(data)
    except Exception as e:
        handler._json(502, {"error": str(e)[:200]})
        return
    handler._json(200, data)
