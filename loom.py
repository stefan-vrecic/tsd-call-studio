"""Download Loom: downloads a Loom (or any video) link with yt-dlp and saves it as LOOM_<title>.mp3 (audio mode, the default) or
LOOM_<title>.mp4 (video mode, the smallest/lowest-quality version; chosen in Settings), then hands
a copy to the normal upload pipeline so it appears in the call list (transcript + review) like any dropped recording.

Runs the equivalent of  yt-dlp -x --audio-format mp3 LINK  (plus a fixed output name with the LOOM_ prefix, the folder to
save in, and progress output). The job is an ordinary entry in pipeline.JOBS, so it shows in the ⏳ queue and can be cancelled.
"""
import os
import re
import shutil
import subprocess
import threading
import time
import uuid

import cancel
import config
import pipeline
import settings

YTDLP = shutil.which("yt-dlp") or "/opt/homebrew/bin/yt-dlp"
OUT_DIR = os.path.join(config.EXPORTS_ROOT, "Loom")
_PCT = re.compile(r"\[download\]\s+([\d.]+)%")


def valid_url(url):
    return bool(re.match(r"^https?://\S+$", url or "")) and not url.startswith("-")


def start(url, base_script=None):
    """Starts a download in the background. Returns the job id."""
    job_id = uuid.uuid4().hex[:12]
    pipeline.JOBS[job_id] = {"stage": "downloading", "name": "Loom download", "message": "Starting…", "percent": 0, "url": url}
    threading.Thread(target=_run, args=(pipeline.JOBS[job_id], url, base_script), daemon=True).start()
    return job_id


def _add_to_call_list(job, mp3_path, base_script):
    """Same as dropping the file on the page: a copy goes to _incoming and is queued for transcription + review.
    The original stays in the Loom folder."""
    incoming = os.path.join(config.STUDIO_DIR, "_incoming")
    os.makedirs(incoming, exist_ok=True)
    dest = os.path.join(incoming, os.path.basename(mp3_path))
    shutil.copy2(mp3_path, dest)
    jid = uuid.uuid4().hex[:12]
    ahead = pipeline.TRANSCRIBE_QUEUE.qsize()
    pipeline.JOBS[jid] = {"stage": "queued", "name": os.path.splitext(os.path.basename(mp3_path))[0],
                          "message": f"Queued ({ahead} ahead)…" if ahead else "Queued…", "percent": 0}
    pipeline.TRANSCRIBE_QUEUE.put((pipeline.run_pipeline, (jid, dest, base_script, None)))


def _run(job, url, base_script=None):
    os.makedirs(OUT_DIR, exist_ok=True)
    video = settings.load_settings().get("loomMode") == "video"
    # audio: yt-dlp -x --audio-format mp3 LINK      video: yt-dlp -f "worst" LINK  (the smallest version: fast to download and plenty to watch)
    mode_args = (["-f", "worst", "--merge-output-format", "mp4"] if video
                 else ["-x", "--audio-format", "mp3"])
    args = [YTDLP, *mode_args, "--no-playlist", "--ffmpeg-location", os.path.dirname(config.FFMPEG) or "/opt/homebrew/bin",
            "--progress", "--newline", "--no-simulate", "--print", "after_move:filepath",
            "-o", os.path.join(OUT_DIR, "LOOM_%(title).150B.%(ext)s"), url]
    saved, last, streams = None, "", 0
    try:
        if not os.path.exists(YTDLP):
            raise RuntimeError("yt-dlp isn't installed on this Mac (brew install yt-dlp)")
        proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, start_new_session=True)
        cancel.register(job, proc)
        started = time.time()
        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            if line.startswith("[download] Destination:"):
                streams += 1   # video mode downloads the picture and the sound as two streams, then joins them
            m = _PCT.search(line)
            if m:
                if video:   # picture = 0-85% of the bar, sound = 85-95%
                    base, share = (0.85, 0.10) if streams >= 2 else (0.0, 0.85)
                    pct = (base + float(m.group(1)) / 100 * share) * 100
                else:       # (the last few % are the mp3 conversion)
                    pct = float(m.group(1)) * 0.95
                pct = min(95.0, pct)
                job.update(percent=round(pct, 1), message=f"Downloading… {m.group(1)}%")
            elif line.startswith("[ExtractAudio]") or line.startswith("[Merger]"):
                job.update(percent=96, message="Converting to mp3…" if not video else "Joining picture and sound…")
            elif os.path.isabs(line) and line.lower().endswith((".mp3", ".mp4", ".mkv", ".webm", ".m4a")):
                saved = line
            else:
                last = line
            if time.time() - started > 1800:
                cancel.cancel(job)
        rc = proc.wait()
        cancel.unregister(job, proc)
        cancel.check(job)
        if rc != 0 or not saved or not os.path.exists(saved):
            raise RuntimeError(re.sub(r"^ERROR:\s*", "", last)[:300] or "yt-dlp didn't produce a file")
        _add_to_call_list(job, saved, base_script)
        job.update(stage="done", percent=100, message="Saved " + os.path.basename(saved) + " — added to your call list", path=saved)
        try:
            subprocess.Popen(["open", "-R", saved])
        except Exception:
            pass
    except cancel.Cancelled:
        job.update(stage="error", message="Cancelled")
    except Exception as e:
        job.update(stage="error", message=str(e))
