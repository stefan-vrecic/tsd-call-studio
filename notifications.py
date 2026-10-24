"""Call Studio's notifications. Each one goes into a short in-memory feed that open Call Studio tabs poll
(GET /api/notifications) and show as browser notifications -- those are clickable, so a click opens that call's page.
If no tab has polled lately (nothing open to show it), it falls back to a plain macOS notification, which can't be clicked."""
import collections
import subprocess
import threading
import time

FEED = collections.deque(maxlen=50)
_lock = threading.Lock()
_next_id = 1
_last_poll = 0.0
POLL_FRESH_SECONDS = 20   # a tab polls every 5 s; older than this means no tab is open


def send(message, title="Call Studio", person=None):
    global _next_id
    with _lock:
        FEED.append({"id": _next_id, "title": title, "message": message, "person": person, "at": time.time()})
        _next_id += 1
    if time.time() - _last_poll > POLL_FRESH_SECONDS:
        escaped = message.replace("\\", "\\\\").replace('"', '\\"')
        t = title.replace("\\", "\\\\").replace('"', '\\"')
        try:
            subprocess.Popen(["osascript", "-e", f'display notification "{escaped}" with title "{t}"'])
        except Exception:
            pass


def since(after_id):
    """Notifications newer than after_id; also marks that a tab is open and showing them."""
    global _last_poll
    _last_poll = time.time()
    with _lock:
        return [n for n in FEED if n["id"] > after_id], _next_id - 1
