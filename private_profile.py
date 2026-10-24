"""Optional, ignored local defaults for personal trackers and closer names.

The checked-in app works without this file. Each user's private_profile.local.json
stays on their machine and can supply their own metric defaults and quick labels.
"""
import json
import os

import config


PATH = os.path.join(config.STUDIO_DIR, "private_profile.local.json")


def load():
    try:
        with open(PATH, encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def metric_defaults():
    return [m for m in load().get("metrics", []) if isinstance(m, dict) and m.get("id") and m.get("name")]


def questions():
    return [q for q in load().get("questions", []) if isinstance(q, list) and len(q) == 2 and isinstance(q[1], list)]


def quick_aliases():
    aliases = load().get("quickAliases", {})
    return {str(k): str(v) for k, v in aliases.items()} if isinstance(aliases, dict) else {}


def closers():
    names = load().get("closers", [])
    return list(dict.fromkeys(str(name).strip() for name in names if str(name).strip())) if isinstance(names, list) else []
