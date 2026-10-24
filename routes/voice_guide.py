"""Settings -> Voice command -> 📖 Voice guide: live_docs/voice-guide.md, a Markdown note of what Stefan's words mean ("workout" = the
Workouts log, "sales training" = Sales training hours ...). Editable on the Settings page; the voice assistant reads it before every
command (routes/voice.py _agent_loop)."""
import os

import config
import util

PATH = os.path.join(config.LIVE_DOCS_DIR, "voice-guide.md")
MAX_BYTES = 200_000


def read_guide():
    try:
        with open(PATH, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def voice_guide_get(handler):
    handler._json(200, {"text": read_guide()})


def voice_guide_save(handler):
    """POST the whole text (plain body): replaces the guide."""
    body = handler._read_body()
    if len(body) > MAX_BYTES:
        handler._json(413, {"error": "the guide is too long (200 KB max)"})
        return
    util.write_bytes(PATH, body)
    handler._json(200, {"ok": True})
