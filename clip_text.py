"""Turns pasted text ("Minute 16:30-18:00 - Finance objection") into clips for the clip basket.

Two ways to read it:
  * quick (default): a plain pattern reader. Instant, free, works offline, understands lines like
        Minute 16:30-18:00 - Finance objection      16:30 to 18:00 finance objection      1:02:10-1:05:00 Close
  * AI: asks Claude to read messy text, including a message that names several different calls.
Either way the result is only a *suggestion*: the page shows it for checking before anything is added.
Times are minutes:seconds ("16:30" = 16 min 30 s); three parts are hours:minutes:seconds.
"""
import json
import os
import re
import subprocess

import config
import util

DEFAULT_LEN = 60.0  # a line with only a start time gets a minute, flagged "assumed"
_TIME = r"\d{1,3}(?::\d{2}){1,2}"
_RANGE = re.compile(rf"(?P<a>{_TIME}|\d{{1,3}})\s*(?:[–—−-]+|to|until|till|through|->|→)\s*(?P<b>{_TIME}|\d{{1,3}})", re.I)
_SINGLE = re.compile(rf"(?<![\d:]){_TIME}(?![\d:])")
_MINUTE_ONLY = re.compile(r"\bmin(?:ute)?s?\.?\s*(\d{1,3})(?!\d|:\d)", re.I)
_LEAD_WORDS = re.compile(r"^\W*(?:at\s+)?(?:minutes?|mins?|min\.|m)?\W*$", re.I)


def to_seconds(text):
    """'16:30' -> 990, '1:02:10' -> 3730, '16' -> 960 (a bare number is minutes). None if it isn't a time."""
    parts = text.strip().split(":")
    try:
        nums = [int(p) for p in parts]
    except ValueError:
        return None
    if len(nums) == 1:
        return nums[0] * 60.0
    if len(nums) == 2:
        return nums[0] * 60.0 + nums[1] if nums[1] < 60 else None
    if len(nums) == 3:
        return nums[0] * 3600.0 + nums[1] * 60 + nums[2] if nums[1] < 60 and nums[2] < 60 else None
    return None


def _clean_title(text):
    t = re.sub(r"^[\s\-–—:|,.)\]\[•*>#]+|[\s\-–—:|,.\[•*]+$", "", text)
    if t.endswith(")") and "(" not in t:  # a stray closing bracket is separator noise; "(great example)" is part of the title
        t = t[:-1].rstrip()
    t = re.sub(r"^(?:minutes?|mins?\.?)\s*[:\-–—]?\s*", "", t, flags=re.I)
    return re.sub(r"\s+", " ", t).strip()


def parse_quick(text):
    """Returns (entries, skipped_lines). entries: [{start, end, title, assumed}] for the current call."""
    entries, skipped = [], []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = _RANGE.search(line)
        has_min_word = bool(re.search(r"\bmin(ute)?s?\b", line, re.I))
        if m:
            a_txt, b_txt = m["a"], m["b"]
            # bare numbers on both sides ("3-5 tips") are only a time range when the line says "minute"
            if ":" not in a_txt and ":" not in b_txt and not has_min_word:
                m = None
        if m:
            a, b = to_seconds(m["a"]), to_seconds(m["b"])
            if a is None or b is None or b <= a:
                skipped.append(raw)
                continue
            before, after = line[:m.start()], line[m.end():]
            title = _clean_title(after) or ("" if _LEAD_WORDS.match(before) else _clean_title(before))
            entries.append({"start": a, "end": b, "title": title, "assumed": False})
            continue
        s = _SINGLE.search(line) or _MINUTE_ONLY.search(line)
        if s:
            a = to_seconds(s.group(1) if s.re is _MINUTE_ONLY else s.group(0))
            if a is None:
                skipped.append(raw)
                continue
            before, after = line[:s.start()], line[s.end():]
            title = _clean_title(after) or ("" if _LEAD_WORDS.match(before) else _clean_title(before))
            entries.append({"start": a, "end": a + DEFAULT_LEN, "title": title, "assumed": True})
            continue
        skipped.append(raw)
    return entries, skipped


def _call_names():
    return sorted(f[:-5] for f in os.listdir(config.MANIFESTS_DIR) if f.endswith(".json"))


def _prompt(text, current, names):
    return (
        "You turn a message from a sales coach into a list of audio clips to cut from recorded sales calls. "
        "The message says which parts of which calls to watch or listen to.\n\n"
        f"Calls in the library (use these exact names; match spoken or partial names to the closest one): {', '.join(names)}\n"
        f"The call currently open (use it when the message does not name a call): {current or '(none)'}\n\n"
        "Rules:\n"
        '- "16:30" means 16 minutes 30 seconds; "1:02:10" means 1 hour 2 minutes 10 seconds; a bare number after the word '
        '"minute" means that minute.\n'
        '- In a range, a bare number next to another timestamp is minutes too: "58 -- 60:48" means 58:00 to 60:48 (58 minutes, not 58 seconds).\n'
        "- If a line gives only a start time, set end = start + 60 seconds and \"assumed\": true; otherwise \"assumed\": false.\n"
        "- title = the coach's short description of what to watch (no timestamps in it). Keep their wording.\n"
        '- Phrases like "this one", "this call", "this video" or "here" mean the call that is currently open, not the call named just before.\n'
        "- Ignore lines that are not clips (greetings, headings, chatter).\n"
        "- Output ONLY a JSON array, nothing else: "
        '[{"call": "<exact call name or null>", "start": <seconds>, "end": <seconds>, "title": "<text>", "assumed": <true|false>}]\n\n'
        f"Message:\n<<<\n{text}\n>>>"
    )


def parse_ai(text, current):
    """Asks Claude. Returns (entries, skipped_lines). Raises RuntimeError with a readable message on failure."""
    names = _call_names()
    try:
        r = subprocess.run([config.CLAUDE, "-p", _prompt(text, current, names)], capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        raise RuntimeError("The AI took too long. Try again, or untick “Use AI”.")
    except FileNotFoundError:
        raise RuntimeError("Claude isn't installed on this Mac, so AI reading isn't available.")
    out = (r.stdout or "").strip()
    i, j = out.find("["), out.rfind("]")
    if r.returncode != 0 or i < 0 or j < i:
        raise RuntimeError("The AI didn't give a usable answer" + (f": {out[:160]}" if out else "") + ". Try again, or untick “Use AI”.")
    try:
        items = json.loads(out[i:j + 1])
    except ValueError:
        raise RuntimeError("The AI's answer wasn't readable. Try again, or untick “Use AI”.")
    entries = []
    for it in items:
        try:
            a, b = float(it["start"]), float(it["end"])
        except (KeyError, TypeError, ValueError):
            continue
        if b <= a:
            continue
        call = it.get("call")
        entries.append({"call": call if call in names else None, "start": a, "end": b,
                        "title": str(it.get("title") or "").strip(), "assumed": bool(it.get("assumed"))})
    return entries, []


def _mentions_call(text, names):
    """True if a word in the text looks like (part of) a call name, e.g. 'Katie' for KatieDent: then only the AI can pick the call."""
    lowered = [n.lower() for n in names]
    return any(len(w) >= 4 and any(w in n for n in lowered) for w in re.findall(r"[a-z]+", text.lower()))


def parse(text, current, use_ai):
    """The route's whole job: read the text, then attach a call to every clip and check its times against that call."""
    text = (text or "")[:20000]
    names = set(_call_names())
    entries, skipped = parse_quick(text)
    if use_ai and not (entries and not skipped and not _mentions_call(text, names)):
        # The AI takes ~8s (starting Claude is the slow part), so it only runs when the plain reader can't do the job on its own:
        # every line understood and no call named. That plain case comes back instantly.
        entries, skipped = parse_ai(text, current)
        use_ai = True
    else:
        use_ai = False
    durations = {}
    for e in entries:
        call = e.get("call") or current
        e["call"] = call if call in names else None
        e["warn"] = None
        if e["call"] is None:
            e["warn"] = "Pick which call this is for"
            continue
        if e["call"] not in durations:
            durations[e["call"]] = _duration(e["call"])
        d = durations[e["call"]]
        if d is not None:
            if e["start"] >= d:
                e["warn"] = f"Starts after the end of the recording ({util.seconds_to_label(d)})"
            elif e["end"] > d:
                e["warn"] = f"Ends after the recording ({util.seconds_to_label(d)}); it will stop at the end"
                e["end"] = d
    return {"clips": entries, "skipped": skipped, "source": "ai" if use_ai else "quick"}


def _duration(call):
    try:
        with open(os.path.join(config.MANIFESTS_DIR, f"{call}.json")) as f:
            mp3 = json.load(f).get("mp3", "")
    except (OSError, ValueError):
        return None
    path = os.path.join(config.AUDIO_DIR, mp3)
    return util.ffprobe_duration(path) if mp3 and os.path.exists(path) else None
