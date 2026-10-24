"""Buffers tab -> is the calendar auto-buffer running, and how many calls in a row does it allow? (the poller lives in ~/Desktop/calendar-auto-buffer)
  GET  /api/buffers                    -> {"on", "mode": "off"|"2"|"3"|"4", "max_in_a_row": 2-4, "paused_since", "poller_loaded", ...}
  GET  /api/buffer-diagrams?n=2|3|4    -> worked examples for that limit: {"sections": [{"title", "blurb", "cases": [{"title", "calls": [hours], "blocked": [hours], "open": [hours], "notes": [...]}]}]}
                                          computed by running the REAL rules in buffer_logic.py on made-up days, so the picture can't drift from the code.
  POST /api/buffers-set?mode=off|2|3|4 -> off = create buffers_paused.flag; 2/3/4 = remove it and write buffer_mode.json {"max_in_a_row": n}.
                                          The poller (buffer_logic.py) reads both live, so it takes effect within a minute.
  GET  /api/day-limits                -> {"days": [{"date", "max": n|null, "title"}] for today + the next 6 days}
  POST /api/day-limits {"date", "max": n|null, "title"} -> sets (max 1-30) or clears (null = Off) that day's call limit in
                                          day_call_limits.json; the poller (buffer_logic.sync_day_limit_events) keeps a 9am-9pm banner with
                                          that title on the day, free until the max is reached, then busy.
Buffers are OFF while buffers_paused.flag exists (buffer_logic.is_buffers_paused reads it every cycle) or the launchd poller isn't loaded."""
import datetime
import json
import os
import subprocess
import sys
import urllib.parse
import util

BUFFER_DIR = os.path.expanduser("~/Desktop/calendar-auto-buffer")
PAUSE_FLAG = os.path.join(BUFFER_DIR, "buffers_paused.flag")
MODE_FILE = os.path.join(BUFFER_DIR, "buffer_mode.json")
LIMITS_FILE = os.path.join(BUFFER_DIR, "day_call_limits.json")
POLLER_LABEL = "com.user.calendar-auto-buffer"


def _poller_loaded():
    try:
        out = subprocess.run(["launchctl", "list"], capture_output=True, text=True, timeout=5).stdout
    except Exception:
        return None
    return POLLER_LABEL in out


def _max_in_a_row():
    try:
        with open(MODE_FILE) as f:
            return min(max(int(json.load(f)["max_in_a_row"]), 2), 4)
    except (OSError, ValueError, KeyError, TypeError):
        return 2   # same default as buffer_logic.get_max_in_a_row


def _state():
    paused = os.path.isfile(PAUSE_FLAG)
    since = datetime.datetime.fromtimestamp(os.path.getmtime(PAUSE_FLAG)).isoformat(timespec="minutes") if paused else None
    poller = _poller_loaded()
    n = _max_in_a_row()
    return {"on": (not paused) and poller is not False, "paused": paused, "paused_since": since, "poller_loaded": poller,
            "max_in_a_row": n, "mode": "off" if paused else str(n)}


def buffers_get(handler):
    handler._json(200, _state())


def buffers_set(handler):
    mode = util.query(handler).get("mode", [""])[0]
    if mode not in ("off", "2", "3", "4"):
        handler._json(400, {"error": "mode must be off, 2, 3 or 4"})
        return
    if mode == "off":
        if not os.path.isfile(PAUSE_FLAG):
            with open(PAUSE_FLAG, "w") as f:
                f.write("paused from Call Studio\n")
    else:
        util.write_json(MODE_FILE, {"max_in_a_row": int(mode)})
        if os.path.isfile(PAUSE_FLAG):
            os.remove(PAUSE_FLAG)
    handler._json(200, _state())


def _limits():
    try:
        with open(LIMITS_FILE) as f:
            d = json.load(f)
        return d if isinstance(d, dict) else {}
    except (OSError, ValueError):
        return {}


def _week():
    today = datetime.date.today()
    return [(today + datetime.timedelta(days=i)).isoformat() for i in range(7)]


def day_limits_get(handler):
    lim = _limits()
    handler._json(200, {"days": [{"date": d, "max": (lim.get(d) or {}).get("max"), "title": (lim.get(d) or {}).get("title", "")} for d in _week()]})


def day_limits_set(handler):
    try:
        body = json.loads(handler._read_body().decode("utf-8") or "{}")
        date, mx, title = str(body.get("date", "")), body.get("max"), str(body.get("title") or "").strip()[:120]
        if date not in _week():
            raise ValueError("pick a day in the next 7 days")
        if mx is not None and not (isinstance(mx, int) and 1 <= mx <= 30):
            raise ValueError("max calls must be 1-30")
    except ValueError as e:
        handler._json(400, {"error": str(e)})
        return
    lim = {d: v for d, v in _limits().items() if d >= _week()[0]}   # drop past days while we're here
    if mx is None:
        lim.pop(date, None)
    else:
        lim[date] = {"max": mx, "title": title or f"{mx} Call Limit"}
    util.write_json(LIMITS_FILE, lim, indent=1, ensure_ascii=False)
    day_limits_get(handler)


# ---- worked examples for the Buffers tab: made-up days (one-hour calls, 11am-6pm) run through buffer_logic's own run/gap rules ----
DAY_FIRST, DAY_LAST = 11, 21   # hour slots shown: 11am ... 9pm (each slot = the hour starting then)
SECTIONS = [   # (title, what it shows, [(case title, call start hours), ...]) -- shown in this order, each section's cases left to right then down
    ("1 · Calls back to back", "What happens as calls stack up with no gap. A buffer only goes up once you've reached your limit.", [
        ("One call", [13]),
        ("Two calls in a row", [12, 13]),
        ("Three calls in a row", [12, 13, 14]),
        ("Four calls in a row", [12, 13, 14, 15]),
    ]),
    ("2 · One free hour between calls", "The hour in between is blocked only when booking it would push you over your limit.", [
        ("Two calls with a free hour between", [12, 14]),
        ("Two calls far apart (nothing to join)", [11, 15]),
        ("12, 1 and 3 (the 2pm gap)", [12, 13, 15]),
        ("12, 1 and 3, 4 (two pairs)", [12, 13, 15, 16]),
    ]),
    ("3 · Your real days", "Examples from your calendar: what would be blocked as it is, and what a new call would trigger.", [
        ("Friday: 12, 1, 5 and 6 (2pm lavender isn't counted)", [12, 13, 17, 18]),
        ("...plus a new call at 3pm", [12, 13, 15, 17, 18]),
        ("...or a new call at 4pm instead", [12, 13, 16, 17, 18]),
        ("5pm and 6pm", [17, 18]),
        ("5pm, 6pm and an 8pm call", [17, 18, 20]),
        ("3pm, 5pm and 6pm", [15, 17, 18]),
    ]),
]


def _hour_event(i, hour):
    start = datetime.datetime(2026, 1, 5, hour, 0, tzinfo=datetime.timezone.utc)
    return {"id": f"c{i}", "start": {"dateTime": start.isoformat()}, "end": {"dateTime": (start + datetime.timedelta(hours=1)).isoformat()}}


def _hours_between(start_iso, end_iso):
    a, b = datetime.datetime.fromisoformat(start_iso), datetime.datetime.fromisoformat(end_iso)
    return [h for h in range(a.hour, b.hour + (1 if b.minute else 0))] if b > a else []


def _fmt(hour):
    return f"{(hour - 1) % 12 + 1}{'am' if hour < 12 else 'pm'}"


def diagrams(n):
    sys.path.insert(0, BUFFER_DIR)
    import buffer_logic as bl   # stdlib-only module: the same file the poller runs
    sections = []
    for sec_title, blurb, cases_in in SECTIONS:
      cases = []
      for title, hours in cases_in:
          events = [_hour_event(i, h) for i, h in enumerate(hours)]
          runs = bl.group_runs(events, n)
          fills = bl.find_gap_fills(events, n)
          walled, notes = set(), []
          for run in runs:
              first = datetime.datetime.fromisoformat(run[0]["start"]["dateTime"]).hour
              last = datetime.datetime.fromisoformat(run[-1]["end"]["dateTime"]).hour
              walled.update((first - 1, last))
              over = f" (already over the limit of {n})" if len(run) > n else ""
              notes.append(f"{len(run)} in a row{over}: {_fmt(first - 1)} and {_fmt(last)} are blocked so no more can be added next to them.")
          for s_iso, e_iso in fills:
              hs = _hours_between(s_iso, e_iso)
              prev_len = next((len(r) for r in bl.split_runs(events) if r[-1]["end"]["dateTime"] == s_iso), 0)
              next_len = next((len(r) for r in bl.split_runs(events) if r[0]["start"]["dateTime"] == e_iso), 0)
              walled.update(hs)
              notes.append(f"{_fmt(hs[0])} is blocked: a call there would join {prev_len} + {next_len} into {prev_len + 1 + next_len} in a row (limit {n}).")
          walled -= set(hours)   # a buffer never goes on top of a call: the poller skips those
          free = [h for h in range(DAY_FIRST, DAY_LAST + 1) if h not in hours and h not in walled]
          if not notes:
              notes.append(f"Nothing blocked: every call that can still be booked keeps you within {n} in a row.")
          cases.append({"title": title, "calls": hours, "blocked": sorted(h for h in walled if DAY_FIRST <= h <= DAY_LAST), "open": free, "notes": notes})
      sections.append({"title": sec_title, "blurb": blurb, "cases": cases})
    return {"n": n, "first": DAY_FIRST, "last": DAY_LAST, "sections": sections}


def buffer_diagrams(handler):
    n = util.query(handler).get("n", ["3"])[0]
    if n not in ("2", "3", "4"):
        handler._json(400, {"error": "n must be 2, 3 or 4"})
        return
    handler._json(200, diagrams(int(n)))
