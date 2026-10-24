"""Server-side switches kept on disk (settings.json)."""
import json
import os
import re

import config


def load_settings():
    """Server-side switches (kept on disk so they apply to calls that arrive while no browser
    tab is open, e.g. from the Aloware watcher). Anything missing falls back to its default."""
    defaults = {"autoAudiobook": False, "closerName": "Stefan", "mailEnabled": True, "mailIgnore": ["hubspot", "oncehub"], "loomMode": "audio",
                "voiceAutoSend": True, "voiceToastSeconds": 5, "voiceDockPosition": "left",
                "pendingCallColor": "#7f1d1d", "pendingCallDays": 7, "processingCallColor": "#b45309",   # Call Studio list: calendar calls not transcribed yet (colour, how many days back)   # voice bar: "left" (beside the side bar) or "center"
                "liveScriptUrl": "",
                "demoCalendar": "", "demoActive": False}   # Demo mode: the Google account whose calendar is shown instead (Settings -> Calendar account); demoActive = Demo mode is on in the page   # Live Call: the 📜 Live script button   # voice dock: send 1 s after Fn is let go; how long the answer note stays
    try:
        with open(config.SETTINGS_PATH) as f:
            return {**defaults, **json.load(f)}
    except (OSError, ValueError):
        return defaults


def save_settings(settings):
    tmp = config.SETTINGS_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(settings, f, indent=2)
    os.replace(tmp, config.SETTINGS_PATH)


_CLOSER_PLACEHOLDER = re.compile(r"\[\s*closer(?:\s*name)?\s*\]", re.I)


def closer_name():
    return (load_settings().get("closerName") or "").strip() or "Stefan"


def fill_closer(text):
    """Fills the [closer] placeholder that follow-up messages are drafted with with the closer's name (Settings)."""
    return _CLOSER_PLACEHOLDER.sub(lambda _m: closer_name(), text) if text else text
