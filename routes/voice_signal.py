"""Hold-Fn -> open the voice dock. Karabiner can't press a key while Fn is held without upsetting Wispr Flow (which dictates on a held
Fn), so on Fn-down it runs `curl -X POST /api/voice-signal` instead; the open page waits on GET /api/voice-wait (a long poll) and opens
the dock with the cursor in its text box, ready for Wispr Flow to type into. See frontend/src/components/VoiceCommand.tsx."""
import threading
import time
import urllib.parse
import util

_cond = threading.Condition()
_state = {"seq": 0, "kind": "", "at": 0.0}
WAIT_SECONDS = 25


def voice_signal(handler):
    """POST ?kind=open (Fn went down; the default) or ?kind=release (Fn let go: the page sends once Wispr Flow has typed)."""
    kind = util.query(handler).get("kind", ["open"])[0]
    kind = kind if kind in ("open", "release") else "open"
    try:
        handler._read_body()
    except Exception:
        pass
    with _cond:
        _state.update(seq=_state["seq"] + 1, kind=kind, at=time.time())
        _cond.notify_all()
        seq = _state["seq"]
    handler._json(200, {"seq": seq})


def voice_wait(handler):
    """GET ?after=N -> as soon as there's a signal newer than N (or after ~25 s with nothing): {"seq", "kind", "at"}.
    after=-1 answers straight away with the current number, so a freshly opened page doesn't act on an old press."""
    qs = util.query(handler)
    try:
        after = int(qs.get("after", ["-1"])[0])
    except ValueError:
        after = -1
    with _cond:
        if after >= 0:
            _cond.wait_for(lambda: _state["seq"] > after, timeout=WAIT_SECONDS)
        out = dict(_state)
    handler._json(200, out)
