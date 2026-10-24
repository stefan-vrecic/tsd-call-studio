"""Drive inbox: a Google Drive folder ("My Drive/Aloware Calls") that Call Studio watches for call recordings.

Upload an Aloware recording into that folder from anywhere (e.g. the Drive app on the phone). The Google Drive
desktop app brings it onto this Mac, and this module then:
  1. copies it into _incoming/ and queues it like a dropped file (transcript -> call review -> follow-up),
  2. moves the original into the folder's `processed` sub-folder (so the inbox shows what's still waiting),
  3. marks the call for an audiobook, so it goes to the Drive audiobook folder when processing finishes, even if
     the "auto audiobook" setting is off.

Naming: "Jo Daubeney.mp3" becomes MM-DD-JoDaubeney; Aloware's own random names (a UUID) become MM-DD-Aloware-HHMM.
Rename the file before uploading to get a proper name (or rename the call in Call Studio afterwards).
"""
import datetime
import json
import os
import re
import shutil
import subprocess
import threading
import time
import uuid

import config
import util

POLL_SECONDS = 30
MEDIA_EXT = {".mp3", ".m4a", ".wav", ".aac", ".ogg", ".opus", ".flac", ".mp4", ".mov", ".m4v", ".webm", ".mkv"}
PROCESSED = "processed"
_UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}([-_ ]?\d+)?$", re.I)
_DATED = re.compile(r"^\d{1,2}-\d{1,2}-")

_lock = threading.Lock()
_started = False
_last_kick = 0.0  # when we last started the Google Drive app
_last_seen = {}   # name -> (size, mtime) at the previous poll; a file is only taken once it stopped changing


def inbox_dir():
    return os.path.join(config.DRIVE_APP_ROOT, config.DRIVE_INBOX_FOLDER_NAME)


def _state_path():
    return os.path.join(config.STUDIO_DIR, "_drive_inbox.json")


def _load_state():
    try:
        with open(_state_path()) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"audiobook": [], "taken": []}


def _save_state(state):
    tmp = _state_path() + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=1)
    os.replace(tmp, _state_path())


def wants_audiobook(stem):
    """audiobook.queue_auto_audiobook asks this: calls that came in through the Drive inbox always get one."""
    with _lock:
        return stem in _load_state().get("audiobook", [])


def stem_for(filename, when):
    """'Jo Daubeney.mp3' -> '10-11-JoDaubeney'; a UUID name -> '10-11-Aloware-1432'; an already dated name is kept."""
    base = os.path.splitext(filename)[0].strip()
    if _UUID.match(base) or not re.sub(r"[^A-Za-z0-9]", "", base):
        return when.strftime("%m-%d-Aloware-%H%M")
    clean = re.sub(r"[^A-Za-z0-9_-]+", "", base.replace(" ", ""))
    return clean if _DATED.match(clean) else when.strftime("%m-%d-") + clean


def _unique_stem(stem):
    """Never reuse a name Call Studio already has (that would overwrite a real call)."""
    def taken(s):
        return (os.path.exists(os.path.join(config.MANIFESTS_DIR, s + ".json"))
                or any(fn.startswith(s + ".") for fn in os.listdir(os.path.join(config.STUDIO_DIR, "_incoming"))))
    n, candidate = 2, stem
    while taken(candidate):
        candidate, n = f"{stem}-{n}", n + 1
    return candidate


def _move_to_processed(src):
    dest_dir = os.path.join(os.path.dirname(src), PROCESSED)
    os.makedirs(dest_dir, exist_ok=True)
    name, ext = os.path.splitext(os.path.basename(src))
    dest, n = os.path.join(dest_dir, name + ext), 2
    while os.path.exists(dest):
        dest, n = os.path.join(dest_dir, f"{name} ({n}){ext}"), n + 1
    shutil.move(src, dest)


def _queue(upload_path, stem):
    import pipeline   # here, not at the top: pipeline imports audiobook, which asks this module about audiobooks
    job_id = uuid.uuid4().hex[:12]
    ahead = pipeline.TRANSCRIBE_QUEUE.qsize()
    pipeline.JOBS[job_id] = {"stage": "queued", "name": stem, "percent": 0,
                             "message": f"From Drive · queued ({ahead} ahead)…" if ahead else "From Drive · queued…"}
    pipeline.TRANSCRIBE_QUEUE.put((pipeline.run_pipeline, (job_id, upload_path, None, True)))


def take(path, now=None):
    """Copies one recording from the inbox into Call Studio, queues it and moves the original to processed/.
    Returns the call's name."""
    filename = os.path.basename(path)
    size = os.path.getsize(path)
    key = f"{filename}|{size}"
    with _lock:
        state = _load_state()
        if key in state.get("taken", []):
            # already copied (the move to processed/ didn't happen last time, e.g. the server stopped): just move it
            _move_to_processed(path)
            return None
    incoming = os.path.join(config.STUDIO_DIR, "_incoming")
    os.makedirs(incoming, exist_ok=True)
    stem = _unique_stem(stem_for(filename, now or datetime.datetime.now()))
    dest = os.path.join(incoming, stem + os.path.splitext(filename)[1].lower())
    part = dest + ".part"
    shutil.copyfile(path, part)   # with Drive in streaming mode this is what downloads it
    if os.path.getsize(part) != size:
        os.remove(part)
        raise OSError(f"copy of {filename} came out the wrong size")
    os.replace(part, dest)
    with _lock:
        state = _load_state()
        state.setdefault("taken", []).append(key)
        state["taken"] = state["taken"][-500:]
        state.setdefault("audiobook", []).append(stem)
        state["audiobook"] = state["audiobook"][-500:]
        _save_state(state)
    _move_to_processed(path)
    _queue(dest, stem)
    return stem


def candidates(folder):
    """Recordings sitting directly in the inbox (not in processed/, not hidden or half-written temp files)."""
    out = []
    for fn in sorted(os.listdir(folder)):
        p = os.path.join(folder, fn)
        if fn.startswith((".", "~")) or not os.path.isfile(p):
            continue
        if os.path.splitext(fn)[1].lower() in MEDIA_EXT:
            out.append(p)
    return out


def _keep_drive_running():
    """Uploads from the phone only reach this Mac while the Google Drive app runs: start it if it quit
    (at most every 10 minutes, so a broken install doesn't get relaunched in a loop)."""
    global _last_kick
    if time.time() - _last_kick < 600:
        return
    if subprocess.run(["pgrep", "-x", "Google Drive"], capture_output=True).returncode != 0:
        _last_kick = time.time()
        print("drive inbox: Google Drive app wasn't running, starting it", flush=True)
        subprocess.run(["open", "-a", "Google Drive"], check=False)


def poll_once():
    _keep_drive_running()
    folder = inbox_dir()
    if not os.path.isdir(folder):
        return
    os.makedirs(os.path.join(folder, PROCESSED), exist_ok=True)
    present = set()
    for p in candidates(folder):
        name = os.path.basename(p)
        present.add(name)
        try:
            st = os.stat(p)
        except OSError:
            continue
        sig = (st.st_size, st.st_mtime)
        if st.st_size == 0 or _last_seen.get(name) != sig:   # new or still arriving: look again next poll
            _last_seen[name] = sig
            continue
        _last_seen.pop(name, None)
        try:
            stem = take(p)
            if stem:
                print(f"drive inbox: {name} -> {stem}", flush=True)
                util.mac_notify(f"{stem}: picked up from Drive, processing…")
        except Exception as e:
            print(f"drive inbox: couldn't take {name}: {e}", flush=True)
    for gone in set(_last_seen) - present:
        _last_seen.pop(gone, None)


def _loop():
    while True:
        try:
            poll_once()
        except Exception as e:   # never let a Drive hiccup stop the watcher
            print(f"drive inbox error: {e}", flush=True)
        time.sleep(POLL_SECONDS)


def start():
    global _started
    with _lock:
        if _started:
            return
        _started = True
    threading.Thread(target=_loop, daemon=True).start()
