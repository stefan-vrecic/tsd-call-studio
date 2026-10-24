"""Email notifications: polls Gmail (read-only, through mail_poll.py) and keeps a feed of new inbox mail for the page's
notification box, skipping senders you've told it to ignore (HubSpot and OnceHub by default).

* Nothing is read until you press Connect Gmail in Settings and approve the read-only permission in your browser.
* The first check after connecting only sets a starting point, so your existing inbox doesn't flood the box.
* A message is announced once (its Gmail id is remembered), then lives in the feed until cleared.
"""
import json
import os
import subprocess
import threading
import time

import config
import settings
import util

POLL_SECONDS = float(os.environ.get("CALLSTUDIO_MAIL_POLL", 60))  # (the env var is for tests)
OVERLAP_SECONDS = 300   # ask Gmail for a little before the last check, in case a message was delayed; ids de-duplicate
FEED_MAX = 100
SEEN_MAX = 800
STATE_PATH = os.path.join(config.STUDIO_DIR, "mail_state.json")
TOKEN_PATH = os.path.join(config.STUDIO_DIR, "gmail_token.json")
POLL_SCRIPT = os.path.join(config.STUDIO_DIR, "mail_poll.py")

_lock = threading.Lock()
_wake = threading.Event()
_started = False
_state = {"since": None, "seen": [], "feed": [], "email": None, "error": None, "connecting": False, "lastCheck": None}


def _load():
    try:
        with open(STATE_PATH) as f:
            _state.update(json.load(f))
    except (OSError, ValueError):
        pass
    _state["connecting"] = False


def _save():
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(_state, f)
    os.replace(tmp, STATE_PATH)


def connected():
    return os.path.exists(TOKEN_PATH) or bool(os.environ.get("GMAIL_FAKE_FILE"))


def ignored(sender, terms):
    """True if the From header (name or address) contains any ignore term, e.g. 'hubspot', 'oncehub'."""
    s = (sender or "").lower()
    return any(t.strip().lower() in s for t in terms if t.strip())


def _run(args, timeout):
    """Runs mail_poll.py in the calendar venv (which has the Google libraries). Returns its JSON answer."""
    py = config.CALENDAR_VENV_PY if os.path.exists(config.CALENDAR_VENV_PY) else None
    if py is None and not os.environ.get("GMAIL_FAKE_FILE"):
        return {"error": "The calendar-auto-buffer folder with the Google libraries wasn't found."}
    r = subprocess.run([py or "python3", POLL_SCRIPT, *args], capture_output=True, text=True, timeout=timeout)
    for line in reversed((r.stdout or "").strip().splitlines()):
        try:
            return json.loads(line)
        except ValueError:
            continue
    return {"error": (r.stderr or "no answer from the Gmail helper").strip()[-300:]}


def poll_once():
    """One check. Returns the list of newly announced messages (also stored in the feed)."""
    cfg = settings.load_settings()
    if not cfg.get("mailEnabled", True) or not connected():
        return []
    started = time.time()
    with _lock:
        since = _state["since"]
        if since is None:           # first check after connecting: just set the starting point
            _state["since"] = started
            _save()
            return []
    answer = _run(["poll", "--since", str(since - OVERLAP_SECONDS)], timeout=90)
    new = []
    with _lock:
        _state["lastCheck"] = started
        if "error" in answer:
            _state["error"] = answer["error"]
            _save()
            return []
        _state["error"] = None
        _state["email"] = answer.get("email") or _state["email"]
        me = (_state["email"] or "").lower()
        terms = cfg.get("mailIgnore") or []
        seen = set(_state["seen"])
        for m in sorted(answer.get("messages", []), key=lambda x: x.get("internalDate", 0)):
            if m["id"] in seen or m.get("internalDate", 0) / 1000 < since - 1:
                continue
            _state["seen"].append(m["id"])
            if ignored(m.get("from"), terms) or (me and me in (m.get("from") or "").lower()):
                continue
            item = {"id": m["id"], "threadId": m.get("threadId"), "from": m.get("from", ""), "subject": m.get("subject", ""),
                    "snippet": m.get("snippet", ""), "time": m.get("internalDate", 0)}
            _state["feed"].insert(0, item)
            new.append(item)
        _state["feed"] = _state["feed"][:FEED_MAX]
        _state["seen"] = _state["seen"][-SEEN_MAX:]
        _state["since"] = started
        _save()
    if len(new) <= 3:
        for m in new:
            util.mac_notify(f"{_sender_name(m['from'])}: {m['subject']}"[:200], title="New email")
    elif new:
        util.mac_notify(f"{len(new)} new emails", title="New email")
    return new


def _sender_name(sender):
    return (sender.split("<")[0].strip().strip('"') or sender).strip()


def _loop():
    while True:
        try:
            poll_once()
        except Exception as e:  # a hiccup (offline, Gmail error) must never stop the watcher
            with _lock:
                _state["error"] = str(e)[:300]
        _wake.wait(POLL_SECONDS)
        _wake.clear()


def start():
    global _started
    with _lock:
        if _started:
            return
        _started = True
    _load()
    threading.Thread(target=_loop, daemon=True).start()


def _enable_url():
    """Where to switch the Gmail API on (one click) for the Google project of the client file Call Studio uses."""
    try:
        with open(os.path.expanduser("~/Desktop/calendar-auto-buffer/credentials.json")) as f:
            project = (json.load(f).get("installed") or {}).get("project_id")
    except (OSError, ValueError):
        project = None
    return "https://console.cloud.google.com/apis/library/gmail.googleapis.com" + (f"?project={project}" if project else "")


def status():
    cfg = settings.load_settings()
    with _lock:
        return {"connected": connected(), "connecting": _state["connecting"], "email": _state["email"], "error": _state["error"],
                "enabled": cfg.get("mailEnabled", True), "ignore": cfg.get("mailIgnore") or [],
                "lastCheck": _state["lastCheck"], "enableUrl": _enable_url(), "items": list(_state["feed"])}


def connect():
    """Opens Google's consent page in the browser (in the background). Returns False if already waiting."""
    with _lock:
        if _state["connecting"]:
            return False
        _state["connecting"] = True
        _state["error"] = None

    def work():
        try:
            answer = _run(["auth"], timeout=600)
        except Exception as e:
            answer = {"error": str(e)}
        with _lock:
            _state["connecting"] = False
            if answer.get("ok"):
                _state.update(email=answer.get("email"), since=time.time(), error=None, seen=[])
            else:
                _state["error"] = answer.get("error", "Couldn't connect Gmail")
            _save()
        _wake.set()

    threading.Thread(target=work, daemon=True).start()
    return True


def disconnect():
    with _lock:
        try:
            os.remove(TOKEN_PATH)
        except OSError:
            pass
        _state.update(email=None, since=None, error=None, feed=[], seen=[])
        _save()


def clear():
    with _lock:
        _state["feed"] = []
        _save()
