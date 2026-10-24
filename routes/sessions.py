"""Calls -> 📅 Sessions: every Complimentary session from the calendar (cal_day.py sessions) with its Aloware link and outcome colour,
matched to the recordings in Call Studio by name (the Follow up tab's matching, routes/agent.py _fu_score) so the tab can say which
calls are already in Call Studio and which are missing. Used by static/js/sessions.js."""
import datetime as dt
import os
import re
import threading
import time
import urllib.parse

import config
from . import day
from .agent import _fu_score
import util

_CACHE = {}               # (since, until) -> (saved_at, payload)
_LOCK = threading.Lock()
CACHE_SECONDS = 120


def _call_dates():
    """call name -> the day it happened: its MM-DD- prefix, else the day the recording file arrived (close enough for matching)."""
    out = {}
    for f in os.listdir(config.MANIFESTS_DIR):
        if not f.endswith(".json"):
            continue
        name = f[:-5]
        m = re.match(r"^(\d{1,2})-(\d{1,2})-", name)
        if m:
            out[name] = dt.date(2026, int(m.group(1)), int(m.group(2)))   # (the calls all fall in 2026 so far)
            continue
        try:
            with open(os.path.join(config.MANIFESTS_DIR, f)) as mf:
                mp3 = os.path.join(config.AUDIO_DIR, __import__("json").load(mf).get("mp3", ""))
            out[name] = dt.date.fromtimestamp(os.path.getmtime(mp3))
        except (OSError, ValueError):
            out[name] = None
    return out


def _match(session, calls, dates):
    """The recordings that look like this session's person, best first. A full-name match counts at any date; a weaker one (only a
    first name to go on: "Ruth" -> 09-24-Ruth-teacher, "Jeanann Thompson" -> JeanAnn) only when the recording is within 3 days."""
    d = dt.date.fromisoformat(session["date"])
    found = []
    for c in calls:
        score = _fu_score(session["name"], c)
        cd = dates.get(c)
        gap = abs((cd - d).days) if cd else 999
        if score >= 1.5 or (score >= 1 and gap <= 3):
            found.append((score >= 1.5, -gap, score, c))
    found.sort(reverse=True)
    return [c for *_, c in found[:3]]


def calendar_sessions(since, until, refresh=False):
    """The raw calendar sessions (cal_day.py sessions) for a date range, cached CACHE_SECONDS. Raises if the calendar can't be read."""
    key = (since, until)
    with _LOCK:
        hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < CACHE_SECONDS and not refresh:
        return hit[1]["items"]
    raw = day._run(["sessions", "--since", since, "--until", until])
    if "error" in raw:
        raise RuntimeError(raw["error"])
    with _LOCK:
        _CACHE[key] = (time.time(), raw)
    return raw["items"]


def sessions_get(handler):
    """GET /api/sessions?since=YYYY-MM-DD&until=YYYY-MM-DD[&refresh=1] (default: 23 Aug 2026 to two weeks from today)."""
    qs = util.query(handler)
    today = dt.date.today()
    since = qs.get("since", ["2026-08-23"])[0]
    until = qs.get("until", [(today + dt.timedelta(days=14)).isoformat()])[0]
    if not (re.fullmatch(r"\d{4}-\d{2}-\d{2}", since) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", until)):
        handler._json(400, {"error": "dates must look like 2026-08-23"})
        return
    key = (since, until)
    with _LOCK:
        hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < CACHE_SECONDS and qs.get("refresh", ["0"])[0] != "1":
        raw = hit[1]
    else:
        raw = day._run(["sessions", "--since", since, "--until", until])
        if "error" in raw:
            handler._json(502, raw)
            return
        with _LOCK:
            _CACHE[key] = (time.time(), raw)
    dates = _call_dates()
    calls = list(dates)
    items = []
    for s in raw["items"]:
        matched = _match(s, calls, dates) if s["name"] else []
        upcoming = s["date"] > today.isoformat() or (s["date"] == today.isoformat() and s["time"] > dt.datetime.now().strftime("%H:%M"))
        items.append({**s, "calls": [{"name": c, "link": "/?" + urllib.parse.urlencode({"person": c})} for c in matched],
                      "inStudio": bool(matched), "upcoming": upcoming})
    for i in items:   # a session that happened and could have a recording (not cancelled, not a no-show / N/A, not still to come)
        i["expected"] = not i["cancelled"] and not i["upcoming"] and i["outcome"] not in ("No show", "N/A")
    held = [i for i in items if i["expected"]]
    handler._json(200, {"since": since, "until": until, "items": items,
                        "counts": {"sessions": len(items), "held": len(held), "inStudio": sum(1 for i in held if i["inStudio"]),
                                   "missing": sum(1 for i in held if not i["inStudio"]), "cancelled": sum(1 for i in items if i["cancelled"]), "noShow": sum(1 for i in items if i["outcome"] == "No show" and not i["cancelled"]),
                                   "upcoming": sum(1 for i in items if i["upcoming"] and not i["cancelled"])}})


MARKS = {"noshow": "6", "cancelled": "1", "closed": "10", "clear": ""}   # Stefan's call-outcome colours: tangerine = no show, lavender = cancelled, basil = closed won


def session_mark(handler):
    """POST {"id": calendar event id, "mark": "noshow" | "cancelled" | "closed" | "clear"}: recolours that calendar call (the call list's right-click
    on a not-transcribed call; "clear" = Restore from Archived calls). Clears the sessions cache so lists update at once."""
    try:
        body = __import__("json").loads(handler._read_body().decode("utf-8") or "{}")
    except ValueError:
        body = {}
    mark, ev_id = str(body.get("mark", "")), str(body.get("id", ""))
    if mark not in MARKS or not re.fullmatch(r"[A-Za-z0-9_]{5,200}", ev_id):
        handler._json(400, {"error": "need an event id and a mark (noshow, cancelled, closed or clear)"})
        return
    # remember the colour it had before a mark, so Restore puts that back (e.g. a "Closed won" basil) rather than no colour at all
    marks_path = os.path.join(config.LIVE_DOCS_DIR, "session-marks.json")
    try:
        with open(marks_path) as f:
            saved = __import__("json").load(f)
    except (OSError, ValueError):
        saved = {}
    target = MARKS[mark] if mark != "clear" else saved.get(ev_id, {}).get("before", "")
    ans = day._run(["color", "--id", ev_id, "--color", target])
    if "error" in ans:
        handler._json(502, ans)
        return
    if mark == "clear":
        saved.pop(ev_id, None)
    elif ev_id not in saved:   # (marking twice keeps the ORIGINAL colour)
        saved[ev_id] = {"before": ans.get("before", ""), "mark": mark}
    else:
        saved[ev_id]["mark"] = mark
    with open(marks_path + ".part", "w") as f:
        __import__("json").dump(saved, f, indent=1)
    os.replace(marks_path + ".part", marks_path)
    with _LOCK:
        _CACHE.clear()
    try:
        day._clear_day_cache()
    except Exception:
        pass
    handler._json(200, {"ok": True, "mark": mark})
