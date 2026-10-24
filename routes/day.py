"""The Today tab: today's calendar events as a checklist, and ticking one updates its calendar title."""
import datetime as dt
import json
import os
import re
import subprocess
import threading
import time
import urllib.parse

import config
import settings
import util

SCRIPT = os.path.join(config.STUDIO_DIR, "cal_day.py")
DAY_CACHE_TTL = 5 * 60
DAY_CACHE_OFFSETS = (-1, 0, 1, 2)
_DAY_CACHE = {}       # YYYY-MM-DD -> (saved_monotonic, response)
_DAY_CACHE_LOCK = threading.RLock()
_DAY_PREFETCHING = set()


def _signed_in():
    """Accounts with their own sign-in (calendar-auto-buffer/calendar_accounts.json, written by accounts.py)."""
    try:
        with open(os.path.join(config.CALENDAR_BUFFER_DIR, "calendar_accounts.json")) as f:
            return set((json.load(f).get("tokens") or {}).keys())
    except (OSError, ValueError):
        return set()


def _run(args):
    py = config.CALENDAR_VENV_PY if os.path.exists(config.CALENDAR_VENV_PY) else None
    if py is None and not os.environ.get("CAL_FAKE_FILE"):
        return {"error": "The calendar-auto-buffer folder with the Google libraries wasn't found."}
    env = os.environ.copy()
    s = settings.load_settings()
    if s.get("demoActive") and s.get("demoCalendar"):   # Demo mode is on: read (and tick) the demo calendar's events instead
        if s["demoCalendar"] in _signed_in():
            env["CAL_ACCOUNT"] = s["demoCalendar"]   # its own sign-in
        else:
            env["CAL_ID"] = s["demoCalendar"]   # a calendar shared with the account in use (a Google error if it isn't -- never the real one)
    r = subprocess.run([py or "python3", SCRIPT, *args], capture_output=True, text=True, timeout=60, env=env)
    for line in reversed((r.stdout or "").strip().splitlines()):
        try:
            return json.loads(line)
        except ValueError:
            continue
    return {"error": (r.stderr or "no answer from the calendar helper").strip()[-300:]}


def _cache_window():
    today = dt.datetime.now().astimezone().date()
    return {(today + dt.timedelta(days=n)).isoformat() for n in DAY_CACHE_OFFSETS}


def _clear_day_cache():
    with _DAY_CACHE_LOCK:
        _DAY_CACHE.clear()


def _read_day(day):
    """Read one day, using the five-minute cache only inside yesterday..two days ahead."""
    cacheable = day in _cache_window()
    if cacheable:
        with _DAY_CACHE_LOCK:
            hit = _DAY_CACHE.get(day)
            if hit and time.monotonic() - hit[0] < DAY_CACHE_TTL:
                return hit[1]
    ans = _run(["list", "--date", day])
    if cacheable and "error" not in ans:
        with _DAY_CACHE_LOCK:
            _DAY_CACHE[day] = (time.monotonic(), ans)
    return ans


def _prefetch_one(day):
    try:
        _read_day(day)
    finally:
        with _DAY_CACHE_LOCK:
            _DAY_PREFETCHING.discard(day)


def _prefetch_window(exclude=""):
    """Warm the rest of the rolling four-day window without delaying the HTTP response."""
    wanted = _cache_window()
    with _DAY_CACHE_LOCK:
        for old in set(_DAY_CACHE) - wanted:
            _DAY_CACHE.pop(old, None)
        todo = []
        now = time.monotonic()
        for day in sorted(wanted):
            hit = _DAY_CACHE.get(day)
            if day == exclude or day in _DAY_PREFETCHING or (hit and now - hit[0] < DAY_CACHE_TTL):
                continue
            _DAY_PREFETCHING.add(day)
            todo.append(day)
    for day in todo:
        threading.Thread(target=_prefetch_one, args=(day,), daemon=True, name="calendar-cache-" + day).start()


def food_today(handler):
    """GET /api/food-today -- today's food lines {items: [{time, cal, name}]} from the calendar tracker (the Tracker's hover chart for Calories)."""
    ans = _run(["food"])
    handler._json(502 if "error" in ans else 200, ans)
    return


def day_events(handler):
    """GET /api/day-events[?date=YYYY-MM-DD] -- that day's events (default today)."""
    qs = util.query(handler)
    day = qs.get("date", [""])[0]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
        day = dt.datetime.now().astimezone().date().isoformat()
    ans = _read_day(day)
    handler._json(502 if "error" in ans else 200, ans)
    if "error" not in ans:
        _prefetch_window(exclude=day)
    return


def create_calendar_event(title, day, start, minutes=30, color="9"):
    """Create a primary-calendar event through the same authenticated helper used by the Today tab."""
    ans = _run(["create", "--title", title, "--date", day, "--start", start, "--minutes", str(minutes), "--color", str(color)])
    if "error" not in ans:
        _clear_day_cache()
    return ans


def day_tick(handler):
    qs = util.query(handler)
    event_id = qs.get("id", [""])[0]
    if not event_id:
        handler._json(400, {"error": "no event id"})
        return
    ans = _run(["tick", "--id", event_id, "--done", "1" if qs.get("done", ["1"])[0] == "1" else "0",
                "--cross", "1" if qs.get("cross", ["0"])[0] == "1" else "0"])
    if "error" not in ans:
        _clear_day_cache()
    handler._json(502 if "error" in ans else 200, ans)
    return


def day_note(handler):
    """Body: {"start": ISO time of the call, "text": the note}. Adds the banana note event."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        payload = {}
    start, text = payload.get("start", ""), (payload.get("text") or "").strip()
    if not start or not text:
        handler._json(400, {"error": "need a start time and some note text"})
        return
    ans = _run(["note", "--start", start, "--text", text])
    if "error" not in ans:
        _clear_day_cache()
    handler._json(502 if "error" in ans else 200, ans)
    return


def day_desc(handler):
    """GET /api/day-desc?id=<event id> -> {"title", "description"}; POST the same with {"text": "..."} -> replaces the description.
    (The Today tab's right-click -> Edit description; follows Demo mode's calendar like the rest of this tab.)"""
    ev_id = util.query(handler).get("id", [""])[0]
    if not re.fullmatch(r"[A-Za-z0-9_]{5,200}", ev_id):
        handler._json(400, {"error": "need an event id"})
        return
    if handler.command == "GET":
        ans = _run(["desc-get", "--id", ev_id])
    else:
        try:
            text = str(json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}").get("text", ""))[:8000]
        except ValueError:
            text = None
        if text is None:
            handler._json(400, {"error": "body must be JSON"})
            return
        ans = _run(["desc-set", "--id", ev_id, "--text", text])
        if "error" not in ans:
            _clear_day_cache()
    handler._json(502 if "error" in ans else 200, ans)


def day_time(handler):
    """Body: {"id": event id, "date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM"}. Moves the event to those times."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        payload = {}
    event_id, day, start, end = (payload.get(k, "") for k in ("id", "date", "start", "end"))
    if not event_id or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day) or not all(re.fullmatch(r"\d{2}:\d{2}", t) for t in (start, end)):
        handler._json(400, {"error": "need an event, a date and two times"})
        return
    ans = _run(["retime", "--id", event_id, "--date", day, "--start", start, "--end", end])
    if "error" not in ans:
        _clear_day_cache()
    handler._json(502 if "error" in ans else 200, ans)
    return


def day_split(handler):
    """Body: {"id": event id, "name1": ..., "name2": ...}. Splits the event in two at its halfway point."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        payload = {}
    event_id, n1, n2 = payload.get("id", ""), (payload.get("name1") or "").strip(), (payload.get("name2") or "").strip()
    if not event_id or not n1 or not n2:
        handler._json(400, {"error": "give both halves a name"})
        return
    ans = _run(["split", "--id", event_id, "--name1", n1, "--name2", n2])
    if "error" not in ans:
        _clear_day_cache()
    handler._json(502 if "error" in ans else 200, ans)
    return
