"""GET /api/ai-usage -- how much of the Claude and ChatGPT (Codex) plan limits is used, for the Home header.

Claude: ~/.claude/usage-snapshot.json, written by ~/.claude/usage-statusline.py every time Claude Code refreshes its status line
        ({"five_hour": {"used": %, "resets_at": epoch}, "weekly": {...}, "saved_at": epoch}).
ChatGPT: the newest rate_limits block Codex logged in ~/.codex/sessions (only as fresh as the last Codex message).
"""
import glob
import json
import os
import time

CLAUDE_SNAPSHOT = os.path.expanduser("~/.claude/usage-snapshot.json")
CODEX_SESSIONS = os.path.expanduser("~/.codex/sessions")


def _claude():
    try:
        with open(CLAUDE_SNAPSHOT, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _codex():
    files = sorted(glob.glob(os.path.join(CODEX_SESSIONS, "*", "*", "*", "*.jsonl")), key=os.path.getmtime, reverse=True)[:6]
    for path in files:
        try:
            with open(path, "rb") as f:
                f.seek(0, os.SEEK_END)
                f.seek(max(0, f.tell() - 600_000))
                lines = f.read().decode("utf-8", "replace").splitlines()
        except OSError:
            continue
        for line in reversed(lines):
            if '"rate_limits"' not in line:
                continue
            try:
                d = json.loads(line)
                rl = d["payload"]["rate_limits"]
                five, week = rl.get("primary") or {}, rl.get("secondary") or {}
                if not week:
                    continue
                return {"five_hour": {"used": five.get("used_percent"), "resets_at": five.get("resets_at")},
                        "weekly": {"used": week.get("used_percent"), "resets_at": week.get("resets_at")},
                        "saved_at": os.path.getmtime(path), "plan": rl.get("plan_type")}
            except (ValueError, KeyError, TypeError):
                continue
    return None


def ai_usage_get(handler):
    handler._json(200, {"claude": _claude(), "codex": _codex(), "now": time.time()})
