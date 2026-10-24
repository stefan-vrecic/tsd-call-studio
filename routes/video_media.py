"""Resources -> 🎬 Videos: ⬇ MP3 and 📝 Transcribe for a saved video (static/js/shelf.js).
  POST /api/video-mp3?id=<video id>          -> fetches the audio with yt-dlp into live_docs/video_audio/<id>.mp3 (in the background)
  GET  /api/video-mp3-file?id=<video id>     -> that MP3 as a download named after the video
  POST /api/video-transcribe?id=<video id>   -> the MP3 (fetched first if needed), then whisper -> live_docs/video_transcripts/<id>.txt.
                                                Transcribing waits its turn in the same one-at-a-time queue as call transcriptions.
  GET  /api/video-media?id=<video id>        -> {"mp3": "none|working|ready|error", "transcript": "...", "message", "percent"}
  GET  /api/video-transcript?id=<video id>   -> {"text"}
All local: nothing leaves this Mac except yt-dlp fetching the video's audio."""
import json
import os
import re
import shutil
import subprocess
import threading
import urllib.parse
import uuid

import config
import pipeline
import util

AUDIO_DIR = os.path.join(config.LIVE_DOCS_DIR, "video_audio")
TEXT_DIR = os.path.join(config.LIVE_DOCS_DIR, "video_transcripts")
YTDLP = shutil.which("yt-dlp") or "/opt/homebrew/bin/yt-dlp"
STATE = {}   # video id -> {"mp3": ..., "transcript": ..., "message": ..., "percent": ...} while this server runs
_LOCK = threading.Lock()


def _video(vid):
    if not re.fullmatch(r"[A-Za-z0-9_-]{3,40}", vid or ""):
        return None
    try:
        with open(os.path.join(config.LIVE_DOCS_DIR, "videos.json"), encoding="utf-8") as f:
            return next((v for v in json.load(f).get("videos", []) if v.get("id") == vid), None)
    except (OSError, ValueError):
        return None


def _mp3(vid):
    return os.path.join(AUDIO_DIR, vid + ".mp3")


def _txt(vid):
    return os.path.join(TEXT_DIR, vid + ".txt")


def _status(vid):
    st = dict(STATE.get(vid) or {})
    st.setdefault("mp3", "ready" if os.path.exists(_mp3(vid)) else "none")
    st.setdefault("transcript", "ready" if os.path.exists(_txt(vid)) else "none")
    return st


def _set(vid, **kw):
    with _LOCK:
        STATE.setdefault(vid, {}).update(kw)


def _fetch(vid, url):
    """yt-dlp -> <id>.mp3. Raises with yt-dlp's own last words if it can't (private video, a site it doesn't know ...)."""
    os.makedirs(AUDIO_DIR, exist_ok=True)
    if not os.path.exists(YTDLP):
        raise RuntimeError("yt-dlp isn't installed on this Mac")
    _set(vid, mp3="working", message="Fetching the audio…", percent=0)
    p = subprocess.Popen([YTDLP, "-x", "--audio-format", "mp3", "--audio-quality", "5", "--no-playlist", "--newline", "--force-overwrites",
                          "-o", os.path.join(AUDIO_DIR, vid + ".%(ext)s"), url], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    last = ""
    for line in p.stdout:
        last = line.strip() or last
        m = re.search(r"(\d+(?:\.\d+)?)%", line)
        if m and "[download]" in line:
            _set(vid, percent=int(float(m.group(1))), message=f"Fetching the audio… {int(float(m.group(1)))}%")
    p.wait(timeout=3600)
    if p.returncode != 0 or not os.path.exists(_mp3(vid)):
        raise RuntimeError("couldn't fetch the audio: " + last[-200:])
    _set(vid, mp3="ready", message="MP3 ready", percent=100)


def _transcribe(job_id, vid, url):
    """Runs in pipeline's transcription lane (one whisper at a time, with the calls)."""
    try:
        if not os.path.exists(_mp3(vid)):
            _fetch(vid, url)
        _set(vid, transcript="working", message="Transcribing…", percent=0)
        os.makedirs(TEXT_DIR, exist_ok=True)
        wav = os.path.join(config.STUDIO_DIR, f"_tmp_video_{vid}.wav")
        subprocess.run([config.FFMPEG, "-y", "-v", "error", "-i", _mp3(vid), "-ar", "16000", "-ac", "1", wav], check=True, timeout=1800)
        base = os.path.join(TEXT_DIR, vid)
        p = subprocess.Popen([config.WHISPER_CLI, "-m", config.WHISPER_MODEL, "-of", base, "-otxt", "-pp", wav], stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, text=True)
        for line in p.stdout:
            m = re.search(r"progress\s*=\s*(\d+)%", line)
            if m:
                _set(vid, percent=int(m.group(1)), message=f"Transcribing… {m.group(1)}%")
        p.wait()
        if os.path.exists(wav):
            os.remove(wav)
        if p.returncode != 0 or not os.path.exists(_txt(vid)):
            raise RuntimeError("whisper didn't produce a transcript")
        _set(vid, transcript="ready", message="Transcript ready", percent=100)
    except Exception as e:
        _set(vid, transcript="error", mp3="ready" if os.path.exists(_mp3(vid)) else "error", message=str(e)[:240])


def _vid(handler):
    return util.query(handler).get("id", [""])[0]


def video_media(handler):
    vid = _vid(handler)
    if not _video(vid):
        handler._json(404, {"error": "no such video"})
        return
    handler._json(200, _status(vid))


def video_mp3(handler):
    vid = _vid(handler)
    v = _video(vid)
    if not v or not re.match(r"^https?://", v.get("url") or ""):
        handler._json(400, {"error": "this video has no link to fetch"})
        return
    st = _status(vid)
    if st["mp3"] in ("ready", "working"):
        handler._json(200, st)
        return

    def go():
        try:
            _fetch(vid, v["url"])
        except Exception as e:
            _set(vid, mp3="error", message=str(e)[:240])
    threading.Thread(target=go, daemon=True).start()
    _set(vid, mp3="working", message="Fetching the audio…", percent=0)
    handler._json(200, _status(vid))


def video_mp3_file(handler):
    vid = _vid(handler)
    v = _video(vid)
    if not v or not os.path.exists(_mp3(vid)):
        handler._json(404, {"error": "no MP3 for this video yet"})
        return
    name = re.sub(r'[\\/:*?"<>|]+', "", v.get("title") or vid).strip()[:120] or vid
    with open(_mp3(vid), "rb") as f:
        body = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", "audio/mpeg")
    handler.send_header("Content-Disposition", "attachment; filename*=UTF-8''" + urllib.parse.quote(name + ".mp3"))
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def video_transcribe(handler):
    vid = _vid(handler)
    v = _video(vid)
    if not v or not re.match(r"^https?://", v.get("url") or ""):
        handler._json(400, {"error": "this video has no link to fetch"})
        return
    st = _status(vid)
    if st["transcript"] == "working" or st.get("queued"):
        handler._json(200, st)
        return
    _set(vid, transcript="working", queued=True, message="Waiting its turn to transcribe…", percent=0)

    def run(job_id, vid_, url):
        _set(vid_, queued=False)
        _transcribe(job_id, vid_, url)
    pipeline.TRANSCRIBE_QUEUE.put((run, ("video-" + uuid.uuid4().hex[:8], vid, v["url"])))
    handler._json(200, _status(vid))


def video_transcript(handler):
    vid = _vid(handler)
    if not _video(vid) or not os.path.exists(_txt(vid)):
        handler._json(404, {"error": "no transcript yet"})
        return
    with open(_txt(vid), encoding="utf-8", errors="replace") as f:
        handler._json(200, {"text": f.read().strip()})
