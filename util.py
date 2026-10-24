"""Small helpers with no state: notifications, name/clock/file-name cleanup, ffprobe durations, ETA maths."""
import json
import os
import re
import threading
import shutil
import subprocess
import time

import config


def extract_text(raw_path):
    ext = os.path.splitext(raw_path)[1].lower()
    if ext == ".txt":
        with open(raw_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    if ext == ".pdf":
        r = subprocess.run([config.PDFTOTEXT, "-layout", raw_path, "-"], capture_output=True, text=True, timeout=60)
        return r.stdout
    if ext == ".docx":
        import zipfile
        with zipfile.ZipFile(raw_path) as z:
            xml = z.read("word/document.xml").decode("utf-8", errors="replace")
        xml = re.sub(r"</w:p>", "\n", xml)
        xml = re.sub(r"<[^>]+>", "", xml)
        return xml
    # last resort: try as plain text
    with open(raw_path, "rb") as f:
        return f.read().decode("utf-8", errors="replace")


def sanitize_script_name(name):
    stem = os.path.splitext(name)[0]
    stem = re.sub(r"[^A-Za-z0-9 _-]+", "", stem).strip()
    return stem or "Script"


def sanitize_stem(name):
    stem = os.path.splitext(name)[0]
    stem = re.sub(r"[^A-Za-z0-9_-]+", "", stem.replace(" ", ""))
    return stem or "Unnamed"


def mac_notify(message, title="Call Studio", person=None):
    """See notifications.py: a clickable browser notification when Call Studio is open (opens `person`'s call),
    otherwise a plain macOS one."""
    import notifications
    notifications.send(message, title=title, person=person)


def move_stem_file(old_path, new_path):
    """shutil.move, but safe for a case-only rename on a case-insensitive
    filesystem (macOS default) where old_path and new_path are otherwise
    the same file on disk and a direct move would silently no-op."""
    if old_path == new_path:
        return
    if os.path.normcase(old_path) == os.path.normcase(new_path):
        tmp_path = old_path + ".__rename_tmp__"
        shutil.move(old_path, tmp_path)
        shutil.move(tmp_path, new_path)
    else:
        shutil.move(old_path, new_path)


def ffprobe_duration(path):
    try:
        r = subprocess.run(
            [config.FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, timeout=30,
        )
        return float(r.stdout.strip())
    except Exception:
        return None


def hms_to_seconds(hms):
    parts = [float(p) for p in hms.split(":")]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return parts[0]


def seconds_to_label(s):
    s = int(s)
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def clock_to_seconds(t):
    """'18:18' / '1:11:00' / '18:18.5' -> seconds, or None if it isn't a clock time."""
    m = re.fullmatch(r"\s*(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)\s*", str(t or ""))
    if not m:
        return None
    return int(m.group(1) or 0) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def range_end_seconds(ts):
    """End of a timeline range like '18:18–20:44' (en/em dash or hyphen); None for a lone timestamp."""
    parts = re.split(r"\s*[–—-]\s*", str(ts or "").strip())
    return clock_to_seconds(parts[1]) if len(parts) >= 2 else None


def safe_clip_name(raw, fallback):
    """File name for an exported clip. Keeps spaces and dashes (incl. the en dash
    in 'SECTION–CALLNAME'); strips only what a filesystem can't take."""
    name = re.sub(r'[\\/:*?"<>|\x00-\x1f]+', "", str(raw or "")).strip().strip(".")
    name = re.sub(r"\s+", " ", name)[:150].strip()
    if name.lower().endswith(".mp3"):
        name = name[:-4].strip()
    return name or fallback


def readable_title(stem):
    """'09-14-CatherinePalmer' -> 'Catherine Palmer' (same idea as the skill's
    'DFPetrinaNoyes' -> 'DF Petrina Noyes' batch note)."""
    s = re.sub(r"^\d{1,2}-\d{1,2}-", "", stem)
    s = re.sub(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ", s)
    return s.strip() or stem


def eta(started, pct):
    elapsed = time.time() - started
    return int(elapsed * (100 - pct) / pct) if pct >= 3 else None


# ---- audio length, cached: the sidebar shows every call's length and /api/people is called often, so a file is only
# probed again when its size or modified time changes. Kept in _durations.json so a restart doesn't re-probe 90+ files.
_DURATIONS_PATH = os.path.join(config.STUDIO_DIR, "_durations.json")
_dur_cache = None
_dur_lock = threading.Lock()


def cached_duration(path):
    """Length of an audio file in seconds (None if unreadable), from the cache when the file hasn't changed."""
    global _dur_cache
    try:
        st = os.stat(path)
    except OSError:
        return None
    with _dur_lock:
        if _dur_cache is None:
            try:
                with open(_DURATIONS_PATH) as f:
                    _dur_cache = json.load(f)
            except (OSError, ValueError):
                _dur_cache = {}
        hit = _dur_cache.get(path)
        if hit and hit[0] == st.st_mtime and hit[1] == st.st_size:
            return hit[2]
    seconds = ffprobe_duration(path)
    if seconds is None:
        return None
    with _dur_lock:
        _dur_cache[path] = [st.st_mtime, st.st_size, seconds]
        try:
            tmp = _DURATIONS_PATH + ".tmp"
            with open(tmp, "w") as f:
                json.dump(_dur_cache, f)
            os.replace(tmp, _DURATIONS_PATH)
        except OSError:
            pass
    return seconds


# ---- small shared helpers for the routes (Oct 21 2026: each route file used to repeat these lines)
def write_json(path, data, **dump_kwargs):
    """Saves data as JSON without ever leaving a half-written file: writes <path>.part, then swaps it in.
    dump_kwargs go to json.dump (indent=1, ensure_ascii=False ...)."""
    with open(path + ".part", "w", encoding="utf-8") as f:
        json.dump(data, f, **dump_kwargs)
    os.replace(path + ".part", path)


def write_bytes(path, data):
    """Same as write_json for raw bytes (an uploaded PDF, a notes .txt)."""
    with open(path + ".part", "wb") as f:
        f.write(data)
    os.replace(path + ".part", path)


def read_json(path, default=None):
    """The JSON in a file, or default when it's missing or unreadable."""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def query(handler):
    """The request's ?a=1&b=2 as {"a": ["1"], "b": ["2"]} (urllib's parse_qs shape)."""
    import urllib.parse
    return urllib.parse.parse_qs(urllib.parse.urlparse(handler.path).query)
