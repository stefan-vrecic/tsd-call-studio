"""Keeps a copy of every call's transcript in Google Drive: <Drive folder>/transcripts/<call>.txt, plus <call>.srt
(the same transcript with timestamps, which the Call Transcripts phone app reads), and _calls.json (each call's date,
the same "when the audio landed" date the sidebar sorts by, so the phone shows real call dates)

Uses the same synced folder as the audiobooks (see audiobook.find_drive_folder); the Google Drive desktop app uploads
whatever lands there. It only ever writes inside the `transcripts` subfolder it creates. Everything is idempotent
(a file that is already identical is left alone), so it's safe to run again at any time:
  * a call finishing processing queues its transcript (pipeline._finish_pipeline)
  * renaming a call renames its Drive copy (routes/calls.rename_person)
  * server start syncs everything, which backfills older calls and catches up after Drive was offline
"""
import os
import queue
import subprocess
import threading
import time

import datetime
import json

import audiobook
import config
import srt
import util

SUBFOLDER = "transcripts"
_QUEUE = queue.Queue()
_started = False
_lock = threading.Lock()
_active = None   # what the worker is doing right now (for the queue panel), e.g. "Copying transcripts to Drive…"


def _drive_transcripts_dir(wait_seconds=90):
    """<Drive folder>/transcripts (created if needed), or None if the Drive folder can't be reached.
    Starts the Drive app and waits a while if the folder isn't there yet."""
    folder = audiobook.find_drive_folder()
    if folder is None and wait_seconds:
        subprocess.run(["open", "-a", "Google Drive"], check=False)
        deadline = time.time() + wait_seconds
        while folder is None and time.time() < deadline:
            time.sleep(3)
            folder = audiobook.find_drive_folder()
    if folder is None:
        return None
    path = os.path.join(folder, SUBFOLDER)
    os.makedirs(path, exist_ok=True)
    return path


def _transcript_text(stem):
    """The readable transcript: transcripts/txt/<call>.txt, or built from the .srt when only that exists."""
    txt = os.path.join(config.TRANSCRIPTS_TXT_DIR, stem + ".txt")
    if os.path.isfile(txt):
        with open(txt, encoding="utf-8", errors="replace") as f:
            return f.read()
    srt_path = os.path.join(config.TRANSCRIPTS_DIR, stem + ".srt")
    if os.path.isfile(srt_path):
        _, blocks = srt.parse_srt(srt_path)
        return "\n".join(b["text"] for b in blocks) + "\n"
    return None


def _write_if_changed(dest, text):
    """Returns 'copied' or 'same'."""
    if os.path.isfile(dest):
        with open(dest, encoding="utf-8", errors="replace") as f:
            if f.read() == text:
                return "same"
    with open(dest, "w", encoding="utf-8") as f:
        f.write(text)
    return "copied"


def sync_one(stem, dest_dir):
    """Copies one call's transcript (.txt, and the .srt when there is one) into dest_dir.
    Returns 'copied', 'same' or 'missing' (judged by the .txt)."""
    text = _transcript_text(stem)
    if text is None:
        return "missing"
    result = _write_if_changed(os.path.join(dest_dir, stem + ".txt"), text)
    srt_path = os.path.join(config.TRANSCRIPTS_DIR, stem + ".srt")
    if os.path.isfile(srt_path):
        with open(srt_path, encoding="utf-8", errors="replace") as f:
            if _write_if_changed(os.path.join(dest_dir, stem + ".srt"), f.read()) == "copied":
                result = "copied"
    return result


def write_meta(dest_dir):
    """_calls.json: {call: {"date": "YYYY-MM-DD"}} for every call whose audio is on this Mac."""
    meta = {}
    for fn in sorted(os.listdir(config.MANIFESTS_DIR)):
        if not fn.endswith(".json"):
            continue
        try:
            with open(os.path.join(config.MANIFESTS_DIR, fn)) as f:
                mp3 = json.load(f).get("mp3", "")
        except (OSError, ValueError):
            continue
        audio = os.path.join(config.AUDIO_DIR, mp3)
        if mp3 and os.path.isfile(audio):
            meta[fn[:-5]] = {"date": datetime.date.fromtimestamp(os.path.getmtime(audio)).isoformat()}
    _write_if_changed(os.path.join(dest_dir, "_calls.json"), json.dumps(meta, indent=1, sort_keys=True) + "\n")


def sync_all(wait_seconds=90):
    """Every call that has a transcript. Returns (copied, same, missing) or None if Drive wasn't reachable."""
    dest_dir = _drive_transcripts_dir(wait_seconds)
    if dest_dir is None:
        return None
    counts = {"copied": 0, "same": 0, "missing": 0}
    for fn in sorted(os.listdir(config.MANIFESTS_DIR)):
        if fn.endswith(".json"):
            counts[sync_one(fn[:-5], dest_dir)] += 1
    write_meta(dest_dir)
    return counts["copied"], counts["same"], counts["missing"]


def status():
    """For the queue panel: (what the worker is doing now or None, how many more jobs are waiting)."""
    return _active, _QUEUE.qsize()


def _worker():
    global _active
    while True:
        job = _QUEUE.get()
        _active = {"all": "Syncing all transcripts to Drive…", "one": f"Copying the {job[1] if len(job) > 1 else ''} transcript to Drive…",
                   "rename": "Renaming a transcript in Drive…"}.get(job[0], "Syncing transcripts to Drive…")
        try:
            if job[0] == "all":
                result = sync_all()
                if result is None:
                    print("transcript sync: Google Drive folder not reachable; will retry at the next start", flush=True)
                elif result[0]:
                    print(f"transcript sync: {result[0]} transcripts copied to Drive ({result[1]} already there)", flush=True)
            elif job[0] == "one":
                dest_dir = _drive_transcripts_dir()
                if dest_dir is None:
                    util.mac_notify(person=job[1], message=f"{job[1]}: couldn't reach the Drive folder, transcript not uploaded yet (it will go up next time Call Studio starts)")
                else:
                    sync_one(job[1], dest_dir)
                    write_meta(dest_dir)
            elif job[0] == "rename":
                dest_dir = _drive_transcripts_dir()
                if dest_dir is not None:
                    for ext in (".txt", ".srt"):
                        old, new = os.path.join(dest_dir, job[1] + ext), os.path.join(dest_dir, job[2] + ext)
                        if os.path.isfile(old) and not os.path.exists(new):
                            os.rename(old, new)
                    sync_one(job[2], dest_dir)
                    write_meta(dest_dir)
        except Exception as e:  # never let a Drive problem take the worker (or a call's processing) down
            print(f"transcript sync error: {e}", flush=True)
        finally:
            _active = None


def _ensure_worker():
    global _started
    with _lock:
        if not _started:
            threading.Thread(target=_worker, daemon=True).start()
            _started = True


def start():
    """Starts the worker once and queues a full sync (backfill + catch-up)."""
    _ensure_worker()
    _QUEUE.put(("all",))


def queue_sync(stem):
    """A call finished processing: put its transcript in Drive."""
    _ensure_worker()
    _QUEUE.put(("one", stem))


def queue_rename(old, new):
    """A call was renamed: rename its Drive copy too."""
    _ensure_worker()
    _QUEUE.put(("rename", old, new))
