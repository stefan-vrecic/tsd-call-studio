"""Search every call's transcript for a word or phrase (full text, not just names).
  GET /api/transcript-search?q=...  -> {"query", "calls": [{"person", "count", "matches": [{"start": seconds, "text": snippet}]}], "total", "capped"}
Reads transcripts/<call>.srt (falls back to transcripts/txt/<call>.txt, which has no times). Phrase match, case-insensitive; a phrase
split across two caption lines still matches. Parsed transcripts are cached until the file changes."""
import os
import re
import urllib.parse
import json

import config
import srt
import util

MAX_PER_CALL = 25
MAX_TOTAL = 400
_cache = {}   # path -> (mtime, [(start_seconds_or_None, text)])


def _blocks(path):
    mtime = os.path.getmtime(path)
    hit = _cache.get(path)
    if hit and hit[0] == mtime:
        return hit[1]
    if path.endswith(".srt"):
        _, parsed = srt.parse_srt(path)
        blocks = [(b["start"], b["text"]) for b in parsed]
    else:
        with open(path, encoding="utf-8", errors="replace") as f:
            blocks = [(None, ln.strip()) for ln in f.read().splitlines() if ln.strip()]
    _cache[path] = (mtime, blocks)
    return blocks


def _calls():
    """{call name: transcript path}, the .srt winning over the .txt."""
    found = {}
    for folder, ext in ((config.TRANSCRIPTS_TXT_DIR, ".txt"), (config.TRANSCRIPTS_DIR, ".srt")):
        if os.path.isdir(folder):
            for fn in os.listdir(folder):
                if fn.endswith(ext):
                    found[fn[:-len(ext)]] = os.path.join(folder, fn)
    return found


def _manifest(name):
    path = os.path.join(config.MANIFESTS_DIR, name + ".json")
    try:
        with open(path, encoding="utf-8") as f: return json.load(f)
    except (OSError, ValueError): return {}


def _section_ranges(manifest, requested):
    rows = manifest.get("rows") or []
    ranges = []
    for i, row in enumerate(rows):
        if requested.lower() in str(row.get("section") or "").lower():
            start = float(row.get("seconds") or 0)
            end = float((rows[i + 1].get("seconds") if i + 1 < len(rows) else 10**9) or 10**9)
            ranges.append((start, end))
    return ranges


def transcript_search(handler):
    params = util.query(handler)
    q = (params.get("q", [""])[0] or "").strip()
    closer = (params.get("closer", [""])[0] or "").strip()
    section = (params.get("section", [""])[0] or "").strip()
    if len(q) < 2 and not section:
        handler._json(200, {"query": q, "calls": [], "total": 0, "capped": False})
        return
    needle = re.sub(r"\s+", " ", q.lower())
    calls, total, capped = [], 0, False
    for name, path in sorted(_calls().items(), key=lambda kv: os.path.getmtime(kv[1]), reverse=True):   # most recently transcribed first
        manifest = _manifest(name)
        manifest_closer = str(manifest.get("closer") or manifest.get("closerName") or "")
        if closer and closer.lower() not in manifest_closer.lower():
            continue
        ranges = _section_ranges(manifest, section) if section else []
        if section and not ranges:
            continue
        try:
            blocks = _blocks(path)
        except OSError:
            continue
        matches, last = [], -2
        for i, (start, text) in enumerate(blocks):
            if ranges and (start is None or not any(lo <= start < hi for lo, hi in ranges)):
                continue
            pair = text.lower() + " " + (blocks[i + 1][1].lower() if i + 1 < len(blocks) else "")
            if (not needle or needle in re.sub(r"\s+", " ", pair)) and i != last + 1:   # a phrase spanning two lines is reported once
                around = " ".join(t for _, t in blocks[max(0, i - 1):i + 2])
                matches.append({"start": start, "text": around.strip()[:320]})
                last = i
        if matches:
            count = len(matches)
            calls.append({"person": name, "count": count, "matches": matches[:MAX_PER_CALL]})
            total += count
            if total >= MAX_TOTAL:
                capped = True
                break
    handler._json(200, {"query": q, "closer": closer, "section": section, "calls": calls, "total": total, "capped": capped})
