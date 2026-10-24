"""CalendarSync tab (frontend/src/pages/CalendarSyncPage.tsx) -> calendar-auto-buffer/calendar_sync.py, which does the syncing.
  GET  /api/calsync              -> {"config": calendar_sync.json, "lastRun": {...} | null}
  POST /api/calsync              body = the whole config -> checked and saved; the poller picks it up within a minute
  GET  /api/calsync-calendars    -> {"calendars": [{id, name, role, primary, via}]} every calendar the signed-in account(s) can see
  POST /api/calsync-run?dry=1    -> one sync now (dry = only the plan): {"planned", "done", "errors", "sample"}
  POST /api/calsync-cleanup?dry=1 -> deletes every synced copy everywhere (dry = only count them)
  POST /api/calsync-add          body {"email"} -> adds a calendar shared with the signed-in account to its list
  GET  /api/calsync-history      -> {"counts": {calendar: {active, deleted, missing}}, "log": [the last 150 changes, newest first]}
  GET  /api/calsync-ledger       -> the whole ledger (every synced copy + its source event's last-known details) as a download"""
import json
import os
import re
import subprocess
import time

import config
import util

SYNC_DIR = config.CALENDAR_BUFFER_DIR
CONFIG_PATH = os.path.join(SYNC_DIR, "calendar_sync.json")
STATE_PATH = os.path.join(SYNC_DIR, "calendar_sync_state.json")
LEDGER_PATH = os.path.join(SYNC_DIR, "calendar_sync_ledger.json")
LOG_PATH = os.path.join(SYNC_DIR, "calendar_sync_log.jsonl")
SCRIPT = os.path.join(SYNC_DIR, "calendar_sync.py")
MODES = ("busy", "title", "full")
_CAL_CACHE = {"at": 0, "data": None}


def _read(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _run(*args, timeout=180):
    try:
        r = subprocess.run([config.CALENDAR_VENV_PY, SCRIPT, *args], cwd=SYNC_DIR, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return {"error": "Google took too long to answer, try again"}
    for line in reversed((r.stdout or "").strip().splitlines()):
        try:
            return json.loads(line)
        except ValueError:
            continue
    return {"error": (r.stderr or r.stdout or "no answer").strip().splitlines()[-1][:300] if (r.stderr or r.stdout) else "no answer"}


def calsync_get(handler):
    state = _read(STATE_PATH, {})
    handler._json(200, {"config": _read(CONFIG_PATH, {}), "lastRun": state.get("lastRun")})


def calsync_save(handler):
    try:
        c = json.loads(handler._read_body().decode("utf-8") or "{}")
        old = _read(CONFIG_PATH, {})
        # a page opened before a setting existed doesn't send it: keep what's saved instead of resetting it
        for k, r in (c.get("rules") or {}).items():
            if isinstance(r, dict):
                for f, v in ((old.get("rules") or {}).get(k) or {}).items():
                    r.setdefault(f, v)
        c["options"] = {**(old.get("options") or {}), **(c.get("options") or {})}
        cals = []
        for i, x in enumerate((c.get("calendars") or [])[:4]):
            if not str(x.get("id") or "").strip():
                continue
            cals.append({"key": "ABCD"[len(cals)], "id": str(x["id"]).strip(), "label": str(x.get("label") or "").strip()[:30]})
        if len({x["id"] for x in cals}) != len(cals):
            raise ValueError("the same calendar is picked twice")
        keys = {x["key"] for x in cals}
        rules = {}
        for k, r in (c.get("rules") or {}).items():
            a, _, b = str(k).partition(">")
            if a in keys and b in keys and a != b and isinstance(r, dict):
                rules[f"{a}>{b}"] = {"on": bool(r.get("on")), "mode": r.get("mode") if r.get("mode") in MODES else "busy", "demo": bool(r.get("demo")),
                                     "busyTitle": str(r.get("busyTitle") or "Busy").strip()[:60] or "Busy",
                                     "color": str(r.get("color") or "") if re.fullmatch(r"(1[01]?|[2-9])?", str(r.get("color") or "")) else ""}
        o = c.get("options") or {}
        opts = {"days": min(max(int(o.get("days") or 30), 1), 90), "allDay": bool(o.get("allDay")), "free": bool(o.get("free")),
                "buffers": bool(o.get("buffers")), "prefix": o.get("prefix", True) is not False, "reminders": bool(o.get("reminders")),
                "lookalikes": o.get("lookalikes", True) is not False, "skipCounters": o.get("skipCounters", True) is not False,
                "skipWords": [str(w).strip()[:60] for w in (o.get("skipWords") or []) if str(w).strip()][:40],
                "skipColors": sorted({str(x) for x in (o.get("skipColors") or []) if str(x) in {str(i) for i in range(1, 12)}}, key=int)}
        out = {"enabled": bool(c.get("enabled")), "everySeconds": min(max(int(c.get("everySeconds") or 120), 60), 3600),
               "calendars": cals, "rules": rules, "options": opts}
    except (ValueError, TypeError) as e:
        handler._json(400, {"error": str(e) or "that setup doesn't look right"})
        return
    util.write_json(CONFIG_PATH, out, indent=1, ensure_ascii=False)
    handler._json(200, {"config": out, "lastRun": _read(STATE_PATH, {}).get("lastRun")})


def calsync_calendars(handler):
    fresh = util.query(handler).get("fresh", ["0"])[0] == "1"
    if fresh or not _CAL_CACHE["data"] or time.time() - _CAL_CACHE["at"] > 300:
        d = _run("calendars", timeout=60)
        if d.get("error"):
            handler._json(502, d)
            return
        _CAL_CACHE.update(at=time.time(), data=d)
    handler._json(200, _CAL_CACHE["data"])


def calsync_run(handler):
    dry = util.query(handler).get("dry", ["0"])[0] == "1"
    handler._json(200, _run("run", *(["--dry"] if dry else [])))


def calsync_cleanup(handler):
    dry = util.query(handler).get("dry", ["0"])[0] == "1"
    handler._json(200, _run("cleanup", *(["--dry"] if dry else []), timeout=600))


def calsync_add(handler):
    try:
        email = str(json.loads(handler._read_body().decode("utf-8") or "{}").get("email", "")).strip()
    except ValueError:
        email = ""
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        handler._json(400, {"error": "type the calendar's email address"})
        return
    d = _run("add", email, timeout=60)
    _CAL_CACHE["data"] = None
    handler._json(200 if not d.get("error") else 400, d)


def calsync_history(handler):
    ledger = _read(LEDGER_PATH, {}).get("copies", {})
    labels = {c["id"]: c.get("label") or c["id"] for c in _read(CONFIG_PATH, {}).get("calendars", [])}
    counts = {}
    for e in ledger.values():
        c = counts.setdefault(labels.get(e.get("dst"), e.get("dst", "?")), {"active": 0, "deleted": 0, "missing": 0})
        c[e.get("status", "active")] = c.get(e.get("status", "active"), 0) + 1
    lines = []
    try:
        with open(LOG_PATH, encoding="utf-8") as f:
            lines = f.readlines()[-150:]
    except OSError:
        pass
    log = []
    for line in reversed(lines):
        try:
            log.append(json.loads(line))
        except ValueError:
            continue
    handler._json(200, {"counts": counts, "log": log})


def calsync_ledger(handler):
    body = json.dumps(_read(LEDGER_PATH, {"copies": {}}), indent=1, ensure_ascii=False).encode("utf-8")
    handler.send_response(200)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Disposition", 'attachment; filename="calendar-sync-ledger.json"')
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
