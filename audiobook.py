"""Chaptered .m4b audiobooks for a whole call, the copy into the Google Drive folder, and the
"auto audiobook" queue."""
import json
import os
import queue
import subprocess
import threading
import time
import uuid

import cancel
import config
import settings
import util


AUDIOBOOK_JOBS = {}  # job_id -> dict(person, stage, percent, eta_seconds, message, path, drivePath)


def _encode_audiobook(job, name, audio_path, rows, output_path):
    """Builds the chaptered .m4b by reusing the audio-chapters skill's own
    parsing + ffmpeg settings (so output is identical to running the skill),
    but runs ffmpeg with -progress so the UI can show a live percentage and
    time estimate. Writes to <out>.part and renames on success so a killed
    or failed run can never leave something that looks like a finished file."""
    import importlib.util, tempfile
    part_path = output_path + ".part"
    meta_path = chapters_path = None
    try:
        spec = importlib.util.spec_from_file_location("make_chapters", config.AUDIO_CHAPTERS_SCRIPT)
        mc = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mc)

        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("\n".join(f'"{r.get("ts")}","{r.get("section")}"' for r in rows) + "\n")
            chapters_path = f.name
        chapters = mc.parse(chapters_path)
        if not chapters:
            raise RuntimeError("no usable chapter timestamps in this call's timeline")
        total_ms = mc.duration_ms(audio_path)
        title = util.readable_title(name)

        lines = [";FFMETADATA1", f"title={mc.esc(title)}", f"album={mc.esc(title)}"]
        for i, (start, ch_name) in enumerate(chapters):
            end = chapters[i + 1][0] if i + 1 < len(chapters) else total_ms
            if start >= total_ms:
                continue
            lines += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={start}", f"END={end}",
                      f"title={mc.esc(f'{i+1:02d}. {ch_name}')}"]
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
            meta_path = f.name

        job.update(stage="encoding", percent=0, eta_seconds=None, message="Starting…")
        started = time.time()
        proc = subprocess.Popen(
            [config.FFMPEG, "-v", "error", "-nostats", "-progress", "pipe:1", "-y",
             "-i", audio_path, "-i", meta_path,
             "-map", "0:a", "-map_metadata", "1", "-map_chapters", "1",
             "-c:a", "aac", "-b:a", "64k", "-f", "ipod", part_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True,
        )
        cancel.register(job, proc)
        for line in proc.stdout:
            if line.startswith("out_time_us="):
                try:
                    done_ms = int(line.split("=", 1)[1]) / 1000
                except ValueError:
                    continue  # ffmpeg prints out_time_us=N/A before the first frame
                pct = max(0.0, min(99.0, done_ms / total_ms * 100))
                job.update(percent=round(pct, 1), eta_seconds=util.eta(started, pct))
        err = proc.stderr.read()
        rc = proc.wait()
        cancel.unregister(job, proc)
        cancel.check(job)   # stopped from the queue (the half-made .part file is removed just below)
        if rc != 0:
            raise RuntimeError(f"ffmpeg failed: {err[-500:]}")
        os.replace(part_path, output_path)
    except Exception:
        if os.path.exists(part_path):
            os.remove(part_path)
        raise
    finally:
        for p in (meta_path, chapters_path):
            if p and os.path.exists(p):
                os.unlink(p)


def find_drive_folder():
    """Local path of the synced 'TSD Calls – Chapters' folder, verified by its
    Drive item id (a folder that merely has the same name doesn't count)."""
    p = os.path.join(config.DRIVE_APP_ROOT, config.DRIVE_AUDIOBOOK_FOLDER_NAME)
    if not os.path.isdir(p):
        return None
    r = subprocess.run(["xattr", "-p", "com.google.drivefs.item-id#S", p], capture_output=True, text=True)
    return p if r.stdout.strip() == config.DRIVE_AUDIOBOOK_FOLDER_ID else None


def copy_to_drive(job, name, output_path):
    """Copies the finished .m4b into the Google Drive desktop app's synced
    folder -- the app then uploads it to Drive in the background. No API
    credentials involved; it uses whatever account the Drive app is signed
    into. Starts the Drive app if the folder isn't reachable yet."""
    folder = find_drive_folder()
    if folder is None:
        job.update(stage="uploading", percent=0, eta_seconds=None, message="Starting Google Drive…")
        subprocess.run(["open", "-a", "Google Drive"], check=False)
        deadline = time.time() + 90
        while folder is None and time.time() < deadline:
            time.sleep(3)
            folder = find_drive_folder()
    if folder is None:
        raise RuntimeError("Couldn't reach the 'TSD Calls – Chapters' folder through the Google Drive app "
                           "(is it signed in as vstefan9@gmail.com?). The audiobook is saved locally.")

    dest = os.path.join(folder, f"{name}.m4b")
    total = os.path.getsize(output_path)
    job.update(stage="uploading", percent=0, eta_seconds=None, message="Copying to Drive folder…")
    started = time.time()
    copied = 0
    try:
        with open(output_path, "rb") as src_f, open(dest, "wb") as dst_f:
            while True:
                chunk = src_f.read(4 * 1024 * 1024)
                if not chunk:
                    break
                cancel.check(job)
                dst_f.write(chunk)
                copied += len(chunk)
                pct = min(99.0, copied / total * 100)
                job.update(percent=round(pct, 1), eta_seconds=util.eta(started, pct))
        if os.path.getsize(dest) != total:
            raise RuntimeError("copy to the Drive folder came out the wrong size")
    except Exception:
        if os.path.exists(dest):
            os.remove(dest)
        raise
    return dest


def run_audiobook_job(job_id, name, audio_path, rows, output_path, need_encode=True, auto=False, upload=True):
    """Encode (if the local .m4b doesn't exist yet) -> upload to Drive -> reveal
    in Finder. The local file is kept either way, so a Drive hiccup never
    costs you the audiobook. auto=True (the "auto audiobook" checkbox) runs it silently in the
    background: a notification instead of a Finder window popping up for every call.
    upload=False (right-click "Download audiobook locally") builds/keeps the .m4b on this Mac only and skips Drive."""
    job = AUDIOBOOK_JOBS[job_id]
    try:
        if need_encode:
            _encode_audiobook(job, name, audio_path, rows, output_path)
        if not upload:
            job.update(stage="done", percent=100, eta_seconds=0, path=output_path, drivePath=None, message="Saved on this Mac")
            return
        drive_path = copy_to_drive(job, name, output_path)
        manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
        if os.path.exists(manifest_path):
            with open(manifest_path) as f:
                manifest = json.load(f)
            manifest["audiobookDrivePath"] = drive_path
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)
        job.update(stage="done", percent=100, eta_seconds=0, path=output_path,
                   drivePath=drive_path, message="Done")
        if auto:
            util.mac_notify(f"{name}: audiobook is in your Drive folder", person=name)
    except Exception as e:
        job.update(stage="error", message=str(e), path=output_path if os.path.exists(output_path) else None)
        if auto:
            util.mac_notify(f"{name}: audiobook failed — {str(e)[:120]}", person=name)
    finally:
        if not auto and os.path.exists(output_path):
            try:
                subprocess.Popen(["open", "-R", output_path])
            except Exception:
                pass


# One audiobook at a time for the automatic ones: a batch of new calls finishing together would
# otherwise start an ffmpeg encode + Drive copy for each, all at once.
AUDIOBOOK_QUEUE = queue.Queue()


def _audiobook_worker():
    while True:
        fn, args = AUDIOBOOK_QUEUE.get()
        try:
            waiting = AUDIOBOOK_JOBS.get(args[0])
            if waiting is not None and cancel.is_cancelled(waiting):   # cancelled while it was waiting its turn
                waiting.update(stage="error", message="Cancelled")
                continue
            fn(*args)
        except Exception as e:  # run_audiobook_job already handles its own errors; this is a backstop
            print(f"audiobook worker error: {e}", flush=True)


threading.Thread(target=_audiobook_worker, daemon=True).start()


def queue_auto_audiobook(stem):
    """Called when a call has finished processing. If the 'auto audiobook' checkbox is on (or the call came from the
    Drive inbox), queue the
    chaptered audiobook + Drive upload for it. Quietly does nothing when it's off, when the call has
    no timeline or audio, or when this call already has its audiobook in Drive / one in flight."""
    import drive_inbox   # calls that came in through the Drive inbox always get their audiobook
    if not settings.load_settings().get("autoAudiobook") and not drive_inbox.wants_audiobook(stem):
        return
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
    if not os.path.exists(manifest_path):
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    rows = manifest.get("rows") or []
    audio_path = os.path.join(config.AUDIO_DIR, manifest.get("mp3", ""))
    output_path = os.path.join(config.AUDIOBOOKS_DIR, f"{stem}.m4b")
    if not rows or not os.path.exists(audio_path):
        return
    local_exists = os.path.exists(output_path)
    if local_exists and manifest.get("audiobookDrivePath"):
        return
    if any(i.get("person") == stem and i.get("stage") in ("queued", "encoding", "uploading")
           for i in AUDIOBOOK_JOBS.values()):
        return
    job_id = uuid.uuid4().hex[:12]
    AUDIOBOOK_JOBS[job_id] = {"person": stem, "stage": "queued", "percent": 0, "eta_seconds": None,
                              "message": "Queued…", "path": None, "drivePath": None}
    AUDIOBOOK_QUEUE.put((run_audiobook_job, (job_id, stem, audio_path, rows, output_path, not local_exists, True)))
