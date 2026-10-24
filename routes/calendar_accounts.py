"""Settings -> Calendar account: which Google account's calendar Call Studio (and the auto-buffer poller, tracker, follow-ups) uses.
The accounts and their sign-ins live in the calendar-auto-buffer folder (accounts.py there):
  GET  /api/calendar-accounts            -> {"active", "accounts": [...], "adding": bool}
  POST /api/calendar-accounts?use=EMAIL  -> switch (clears the day / sessions caches and restarts the poller so it follows)
  POST /api/calendar-accounts?add=1      -> opens Google's sign-in in the browser to add another account (you sign in there yourself)"""
import json
import os
import subprocess

import config
import util
from . import day, sessions

ACCOUNTS = os.path.join(config.CALENDAR_BUFFER_DIR, "accounts.py")
_ADDING = {"proc": None}


def _run(*args, timeout=30):
    r = subprocess.run([config.CALENDAR_VENV_PY, ACCOUNTS, *args], cwd=config.CALENDAR_BUFFER_DIR, capture_output=True, text=True, timeout=timeout)
    try:
        return json.loads((r.stdout or "").strip().splitlines()[-1])
    except (ValueError, IndexError):
        return {"error": (r.stderr or r.stdout or "accounts.py gave no answer").strip()[-300:]}


def accounts_get(handler):
    d = _run("list")
    p = _ADDING["proc"]
    d["adding"] = bool(p and p.poll() is None)
    handler._json(200 if "error" not in d else 502, d)


def accounts_post(handler):
    qs = util.query(handler)
    if qs.get("add"):
        p = _ADDING["proc"]
        if not (p and p.poll() is None):   # one sign-in window at a time; it closes by itself once you've signed in
            _ADDING["proc"] = subprocess.Popen([config.CALENDAR_VENV_PY, ACCOUNTS, "add"], cwd=config.CALENDAR_BUFFER_DIR,
                                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        handler._json(200, {"ok": True, "adding": True})
        return
    email = (qs.get("use") or [""])[0].strip()
    if not email:
        handler._json(400, {"error": "say which account (?use=email)"})
        return
    d = _run("use", email)
    if "error" in d:
        handler._json(400, d)
        return
    try:
        day._clear_day_cache()
    except Exception:
        pass
    with sessions._LOCK:
        sessions._CACHE.clear()
    subprocess.run(["launchctl", "kickstart", "-k", f"gui/{os.getuid()}/com.user.calendar-auto-buffer"], capture_output=True, timeout=15)   # the poller follows the new account
    handler._json(200, d)


# ---- Demo mode's calendar: copy the real calendar (2 weeks back -> 2 weeks ahead) into the demo account with every person anonymised
# (demo_calendar.py). Runs in the background (a few hundred events take a minute); GET shows how it went.
_BUILD = {"proc": None, "out": ""}
DEMO_SCRIPT = os.path.join(config.STUDIO_DIR if hasattr(config, "STUDIO_DIR") else os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "demo_calendar.py")


def demo_build_get(handler):
    p = _BUILD["proc"]
    if p and p.poll() is not None and not _BUILD["out"]:
        out = (p.stdout.read() or "").strip().splitlines() if p.stdout else []
        _BUILD["out"] = out[-1] if out else ""
    handler._json(200, {"running": bool(p and p.poll() is None), "result": _BUILD["out"]})


def demo_build_post(handler):
    import settings
    email = settings.load_settings().get("demoCalendar") or ""
    if not email:
        handler._json(400, {"error": "pick the demo calendar's account first"})
        return
    if email == _run("list").get("active"):
        handler._json(400, {"error": "the demo calendar can't be the account you're using for real"})
        return
    p = _BUILD["proc"]
    if not (p and p.poll() is None):
        _BUILD["out"] = ""
        _BUILD["proc"] = subprocess.Popen([config.CALENDAR_VENV_PY, DEMO_SCRIPT, "--to", email], cwd=config.CALENDAR_BUFFER_DIR,
                                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, start_new_session=True)
    handler._json(200, {"ok": True, "running": True})
