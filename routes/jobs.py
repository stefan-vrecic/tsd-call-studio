"""Uploads, background jobs and their progress, base scripts, server settings.

Each function is one endpoint: it gets the request handler (handler.path, handler.rfile, handler._json(...)) and
answers it. Which URL goes to which function is the table in routes/__init__.py."""
import json
import os
import re
import urllib.parse
import uuid

import audiobook
import cancel
import combine
import config
import loom
import notifications
import pipeline
import settings
import transcript_sync
import util


def base_scripts(handler):
    scripts = []
    for fn in sorted(os.listdir(config.BASE_SCRIPTS_DIR)):
        if fn.endswith(".txt"):
            scripts.append({"name": fn[:-4]})
    handler._json(200, scripts)
    return


def jobs_list(handler):
    # every job currently tracked server-side, including ones kicked
    # off outside the browser (e.g. the Aloware watcher) -- lets any
    # open Call Studio tab discover and show progress for a job it
    # didn't itself start.
    handler._json(200, [dict(info, job_id=jid) for jid, info in pipeline.JOBS.items()])
    return


def queue_list(handler):
    """GET /api/queue -- everything still waiting or running, in the order it was added: calls being transcribed and
    reviewed, gap scans, and audiobooks. Finished and failed jobs are left out."""
    items = []
    for jid, info in list(pipeline.JOBS.items()):
        if info.get("stage") in ("done", "error"):
            continue
        items.append({"id": jid, "kind": "call", "name": info.get("person") or info.get("name") or "New recording",
                      "stage": info.get("stage"), "message": info.get("message") or "", "percent": info.get("percent") or 0})
    for jid, info in list(audiobook.AUDIOBOOK_JOBS.items()):
        if info.get("stage") in ("done", "error"):
            continue
        items.append({"id": jid, "kind": "audiobook", "name": info.get("person") or "Audiobook",
                      "stage": info.get("stage"), "message": info.get("message") or "", "percent": info.get("percent") or 0})
    for it in items:
        it["state"] = "waiting" if it["stage"] == "queued" else ("uploading" if it["stage"] == "uploading" else "running")
    syncing, more = transcript_sync.status()   # the Drive copy of the transcripts: shown so you can see it is going up, never blocks anything
    if syncing:
        items.append({"id": "transcript-sync", "kind": "sync", "name": "Transcripts → Drive", "stage": "uploading",
                      "message": syncing + (f" ({more} more waiting)" if more else ""), "percent": 0, "state": "uploading"})
    handler._json(200, {"items": items})
    return


def notifications_feed(handler):
    """GET /api/notifications?after=ID -- notifications newer than ID, for the open page to show (see notifications.py)."""
    qs = util.query(handler)
    try:
        after = int(qs.get("after", ["0"])[0])
    except ValueError:
        after = 0
    items, latest = notifications.since(after)
    handler._json(200, {"items": items, "latest": latest})
    return


def cancel_job(handler):
    """POST /api/cancel-job?id=JOB -- stop a job that is running or still waiting (calls, scans, audiobooks)."""
    qs = util.query(handler)
    jid = qs.get("id", [""])[0]
    job = pipeline.JOBS.get(jid) or audiobook.AUDIOBOOK_JOBS.get(jid)
    if job is None:
        handler._json(404, {"error": "unknown job"})
        return
    if job.get("stage") in ("done", "error"):
        handler._json(409, {"error": "that job has already finished"})
        return
    was_running = cancel.cancel(job)
    if job.get("stage") == "queued":
        job.update(stage="error", message="Cancelled")   # waiting: gone from the queue straight away (the worker skips it)
    else:
        job.update(message="Cancelling…")
    handler._json(200, {"ok": True, "wasRunning": was_running})
    return


def get_settings(handler):
    handler._json(200, settings.load_settings())
    return


def job_status(handler):
    parsed = urllib.parse.urlparse(handler.path)
    path = parsed.path
    job_id = path.split("/")[-1]
    job = pipeline.JOBS.get(job_id)
    if not job:
        handler._json(404, {"error": "unknown job"})
    else:
        handler._json(200, job)
    return


def post_settings(handler):
    qs = util.query(handler)
    current = settings.load_settings()
    if "autoAudiobook" in qs:
        current["autoAudiobook"] = qs["autoAudiobook"][0] == "true"
    if "closerName" in qs:
        name = " ".join(qs["closerName"][0].split())[:60]
        if not name:
            handler._json(400, {"error": "the closer name can't be empty"})
            return
        current["closerName"] = name
    if "mailEnabled" in qs:
        current["mailEnabled"] = qs["mailEnabled"][0] == "true"
    if "mailIgnore" in qs:  # comma-separated words; an email whose sender contains one of them is not announced
        current["mailIgnore"] = [w.strip().lower() for w in qs["mailIgnore"][0].split(",") if w.strip()][:30]
    if "liveScriptUrl" in qs:   # Live Call: where the 📜 Live script button goes (http/https only)
        url = qs["liveScriptUrl"][0].strip()
        if url and not url.startswith(("http://", "https://")):
            handler._json(400, {"error": "the live script link needs to start with https://"})
            return
        current["liveScriptUrl"] = url[:1000]
    blank_ok = urllib.parse.parse_qs(urllib.parse.urlparse(handler.path).query, keep_blank_values=True)   # (so demoCalendar= clears it)
    if "demoCalendar" in blank_ok:   # Demo mode's calendar: an account signed in under Settings -> Calendar account, or "" for none
        v = blank_ok["demoCalendar"][0].strip()
        if v and not re.fullmatch(r"[^@\s]+@[^@\s]+", v):
            handler._json(400, {"error": "that isn't an email address"})
            return
        current["demoCalendar"] = v[:200]
    if "demoActive" in qs:   # the page says Demo mode was switched on / off
        current["demoActive"] = qs["demoActive"][0] == "1"
    if "demoCalendar" in blank_ok or "demoActive" in qs:   # the calendar shown changes: forget what was read from the other one
        from . import day as _day, sessions as _sessions
        _day._clear_day_cache()
        with _sessions._LOCK:
            _sessions._CACHE.clear()
    if re.fullmatch(r"#[0-9a-fA-F]{6}", qs.get("pendingCallColor", [""])[0]):   # colour of the not-yet-transcribed calendar calls
        current["pendingCallColor"] = qs["pendingCallColor"][0]
    if re.fullmatch(r"#[0-9a-fA-F]{6}", qs.get("processingCallColor", [""])[0]):   # colour of calls being transcribed / reviewed
        current["processingCallColor"] = qs["processingCallColor"][0]
    if "pendingCallDays" in qs:   # how many days back those calendar calls go (0 = today only)
        try:
            current["pendingCallDays"] = max(0, min(60, int(qs["pendingCallDays"][0])))
        except ValueError:
            pass
    if qs.get("voiceDockPosition", [""])[0] in ("left", "center"):   # where the voice bar and its answer note sit
        current["voiceDockPosition"] = qs["voiceDockPosition"][0]
    if "voiceAutoSend" in qs:   # voice dock: send by itself 1 s after you let go of Fn (Wispr Flow has typed)
        current["voiceAutoSend"] = qs["voiceAutoSend"][0] == "true"
    if "voiceToastSeconds" in qs:   # how long the little answer note stays after a command (0 = don't show it)
        try:
            current["voiceToastSeconds"] = max(0, min(60, int(float(qs["voiceToastSeconds"][0]))))
        except ValueError:
            pass
    if qs.get("loomMode", [""])[0] in ("audio", "video"):   # Download Loom: the mp3 of the audio, or the video at up to 360p
        current["loomMode"] = qs["loomMode"][0]
    settings.save_settings(current)
    handler._json(200, current)
    return


def scan_gaps(handler):
    qs = util.query(handler)
    base_script = qs.get("base_script", [None])[0]
    force = qs.get("force", ["0"])[0] == "1"
    only_raw = qs.get("only", [None])[0]
    only = set(only_raw.split(",")) if only_raw else None
    job_id = uuid.uuid4().hex[:12]
    pipeline.JOBS[job_id] = {"stage": "queued", "name": "Scan for gaps" + (" (re-run all)" if force else ""), "message": f"Queued ({pipeline.TRANSCRIBE_QUEUE.qsize()} ahead)…" if pipeline.TRANSCRIBE_QUEUE.qsize() else "Queued…", "percent": 0}
    pipeline.TRANSCRIBE_QUEUE.put((pipeline.run_gap_scan, (job_id, base_script, force, only)))
    handler._json(200, {"job_id": job_id})
    return


def regenerate_review(handler):
    """POST /api/regenerate-review?person=NAME[&base_script=X] -- write the call review again from the existing transcript."""
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    base_script = qs.get("base_script", [None])[0]
    if not name or not os.path.exists(os.path.join(config.TRANSCRIPTS_DIR, name + ".srt")):
        handler._json(404, {"error": f"no transcript for {name or 'that call'}"})
        return
    if any(i.get("person") == name and i.get("stage") not in ("done", "error") for i in pipeline.JOBS.values()):
        handler._json(409, {"error": f"{name} is already being worked on"})
        return
    job_id = uuid.uuid4().hex[:12]
    ahead = pipeline.TRANSCRIBE_QUEUE.qsize()
    pipeline.JOBS[job_id] = {"stage": "queued", "name": name, "person": name, "percent": 0,
                             "message": f"Queued ({ahead} ahead)…" if ahead else "Queued…"}
    pipeline.TRANSCRIBE_QUEUE.put((pipeline.run_regenerate, (job_id, name, base_script)))
    handler._json(200, {"job_id": job_id})
    return


def loom_download(handler):
    """POST /api/loom-download with {"url": "..."} -- pull the audio out of a Loom link as LOOM_<title>.mp3."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        payload = {}
    url = str(payload.get("url") or "").strip()
    if not loom.valid_url(url):
        handler._json(400, {"error": "that doesn't look like a link (it should start with https://)"})
        return
    base_script = payload.get("base_script") or None
    handler._json(200, {"job_id": loom.start(url, base_script), "folder": loom.OUT_DIR})
    return


def upload(handler):
    filename = urllib.parse.unquote(handler.headers.get("X-Filename", "upload.bin"))
    filename = os.path.basename(filename)
    base_script = handler.headers.get("X-Base-Script")
    base_script = urllib.parse.unquote(base_script) if base_script else None
    mine_header = handler.headers.get("X-Mine")  # "true" / "false" / absent (unset)
    mine = (mine_header == "true") if mine_header in ("true", "false") else None
    group = handler.headers.get("X-Combine-Group")
    if group:   # one of several files to be joined into a single call (see combine.py)
        try:
            index, total = int(handler.headers.get("X-Combine-Index", "0")), int(handler.headers.get("X-Combine-Total", "0"))
        except ValueError:
            index, total = 0, 0
        if total < 2 or not 0 <= index < total:
            handler._json(400, {"error": "bad combine headers"})
            return
        handler._json(200, combine.receive(group, index, total, filename, handler._read_body(), base_script, mine))
        return
    os.makedirs(os.path.join(config.STUDIO_DIR, "_incoming"), exist_ok=True)
    upload_path = os.path.join(config.STUDIO_DIR, "_incoming", filename)
    with open(upload_path, "wb") as f:
        f.write(handler._read_body())

    job_id = uuid.uuid4().hex[:12]
    pipeline.JOBS[job_id] = {"stage": "queued", "name": os.path.splitext(filename)[0], "message": f"Queued ({pipeline.TRANSCRIBE_QUEUE.qsize()} ahead)…" if pipeline.TRANSCRIBE_QUEUE.qsize() else "Queued…", "percent": 0}
    pipeline.TRANSCRIBE_QUEUE.put((pipeline.run_pipeline, (job_id, upload_path, base_script, mine)))
    handler._json(200, {"job_id": job_id})
    return


def upload_base_script(handler):
    filename = urllib.parse.unquote(handler.headers.get("X-Filename", "script.txt"))
    filename = os.path.basename(filename)
    name = util.sanitize_script_name(filename)
    raw_path = os.path.join(config.BASE_SCRIPTS_RAW_DIR, filename)
    with open(raw_path, "wb") as f:
        f.write(handler._read_body())
    try:
        text = util.extract_text(raw_path)
    except Exception as e:
        handler._json(500, {"error": f"couldn't extract text: {e}"})
        return
    if not text or not text.strip():
        handler._json(500, {"error": "no extractable text found in that file"})
        return
    with open(os.path.join(config.BASE_SCRIPTS_DIR, f"{name}.txt"), "w", encoding="utf-8") as f:
        f.write(text)
    handler._json(200, {"name": name})
    return
