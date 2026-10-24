"""Today tab -> Aloware calls card (aloware_today.py).
  GET  /api/aloware-today[?date=YYYY-MM-DD] -> {date, calls: [{id, name, time, aloware, stem, status, call (its Call Studio name when in_library)}], request: "text to paste to Claude" }
  POST /api/aloware-mark?id=..&status=downloaded|no_recording&name=..&stem=.."""
import re
import urllib.parse

import aloware_today
import util


def aloware_today_get(handler):
    day = util.query(handler).get("date", [""])[0]   # another day, when the Today tab's arrows are on one
    day = day if re.fullmatch(r"\d{4}-\d{2}-\d{2}", day) else None
    try:
        p = aloware_today.plan(day)
    except Exception as e:
        handler._json(502, {"error": str(e)})
        return
    p["request"] = aloware_today.request_text(p["calls"], "today's" if not day else f"the {day}")
    handler._json(200, p)


def move_up_set(handler):
    """POST /api/move-up?id=<call event id>&status=pending|texted|accepted|declined|na|none: the call's "text to move it forward" marker."""
    qs = util.query(handler)
    call, status = qs.get("id", [""])[0], qs.get("status", [""])[0]
    if not re.fullmatch(r"[A-Za-z0-9_]{5,200}", call) or status not in ("pending", "texted", "accepted", "declined", "na", "none"):
        handler._json(400, {"error": "need a call id and a status"})
        return
    try:
        out = aloware_today._calendar(None, "moveup-set", ["--call", call, "--status", status])
    except Exception as e:
        handler._json(502, {"error": str(e)[:200]})
        return
    import mvfwd_stats
    try:   # the Tracker's MVFWD asked / accepted / declined counts
        mvfwd_stats.record(call, status, qs.get("name", [""])[0], qs.get("date", [""])[0])
    except Exception as e:
        out["statsError"] = str(e)[:200]
    handler._json(200, out)


def aloware_mark(handler):
    qs = util.query(handler)
    try:
        aloware_today.mark(qs.get("id", [""])[0], qs.get("status", [""])[0], qs.get("name", [""])[0], qs.get("stem", [""])[0])
    except ValueError as e:
        handler._json(400, {"error": str(e)})
        return
    handler._json(200, {"ok": True})
