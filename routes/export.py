"""Exports: sections, audiobooks, combined transcripts, batches, and the clip basket.

Each function is one endpoint: it gets the request handler (handler.path, handler.rfile, handler._json(...)) and
answers it. Which URL goes to which function is the table in routes/__init__.py."""
import json
import os
import shutil
import subprocess
import threading
import time
import urllib.parse
import uuid

import audiobook
import clip_text
import clips
import config
import phone_bundle
import util


def get_clips(handler):
    handler._json(200, clips.load_clips())
    return


def audiobook_progress(handler):
    parsed = urllib.parse.urlparse(handler.path)
    qs = urllib.parse.parse_qs(parsed.query)
    info = audiobook.AUDIOBOOK_JOBS.get(qs.get("id", [""])[0])
    if info is None:
        handler._json(404, {"error": "unknown job"})
    else:
        handler._json(200, info)
    return


def save_clips(handler):
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
        items = payload["clips"]
        if not isinstance(items, list):
            raise ValueError
    except (ValueError, KeyError):
        handler._json(400, {"error": "body must be JSON like {\"clips\": [...]}"})
        return
    handler._json(200, clips.save_clips(items))
    return


def export_clips(handler):
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
        solo, book = bool(payload.get("solo")), bool(payload.get("audiobook"))
        if not (solo or book):
            raise ValueError("pick at least one of: solo files, audiobook")
        resolved = clips.resolve_clips(payload.get("clips") or [])
    except ValueError as e:
        handler._json(400, {"error": str(e) or "bad request"})
        return
    title = util.safe_clip_name(payload.get("title"), "Clips " + time.strftime("%Y-%m-%d %H%M"))
    job_id = uuid.uuid4().hex[:12]
    audiobook.AUDIOBOOK_JOBS[job_id] = {"person": title, "stage": "encoding", "percent": 0, "eta_seconds": None,
                              "message": "Starting…", "path": None, "drivePath": None}
    threading.Thread(target=clips.run_export_job,
                     args=(audiobook.AUDIOBOOK_JOBS[job_id], resolved, solo, book, title, bool(payload.get("drive")),
                           bool(payload.get("zip"))),
                     daemon=True).start()
    handler._json(200, {"ok": True, "jobId": job_id, "count": len(resolved)})
    return


def export_section(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    try:
        start = float(qs.get("start", [""])[0])
        end = float(qs.get("end", [""])[0])
    except ValueError:
        handler._json(400, {"error": "start and end must be numbers of seconds"})
        return
    if start < 0 or end <= start:
        handler._json(400, {"error": "end has to be after start"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    src_path = os.path.join(config.AUDIO_DIR, manifest.get("mp3", ""))
    if not os.path.exists(src_path):
        handler._json(404, {"error": "audio file missing"})
        return
    try:
        total = float(subprocess.check_output(
            [config.FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src_path],
            text=True, timeout=30).strip())
    except Exception:
        total = None
    if total is not None:
        if start >= total:
            handler._json(400, {"error": f"start is past the end of the recording ({total:.0f}s)"})
            return
        end = min(end, total)  # a B marker dragged slightly past the end just clips to the end

    first_row = (manifest.get("rows") or [{}])[0].get("section") or "Section"
    clip_name = util.safe_clip_name(qs.get("name", [""])[0], f"{first_row}–{name}")
    out_dir = os.path.join(config.EXPORTS_ROOT, "Sections")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, clip_name + ".mp3")
    n = 2
    while os.path.exists(out_path):  # never overwrite an earlier export
        out_path = os.path.join(out_dir, f"{clip_name} ({n}).mp3")
        n += 1

    try:
        clips.cut_mp3(src_path, start, end, out_path)
    except RuntimeError as e:
        handler._json(500, {"error": str(e)})
        return
    try:
        subprocess.Popen(["open", "-R", out_path])
    except Exception:
        pass
    handler._json(200, {"ok": True, "path": out_path, "seconds": round(end - start, 1)})
    return


def export_audiobook(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    rows = manifest.get("rows") or []
    if not rows:
        handler._json(400, {"error": "no chapters/timeline available for this call yet"})
        return
    audio_path = os.path.join(config.AUDIO_DIR, manifest.get("mp3", ""))
    if not os.path.exists(audio_path):
        handler._json(404, {"error": "audio file missing"})
        return
    output_path = os.path.join(config.AUDIOBOOKS_DIR, f"{name}.m4b")
    upload = qs.get("drive", ["1"])[0] != "0"  # drive=0: only build/keep it on this Mac (right-click "Download audiobook locally")

    local_exists = os.path.exists(output_path)

    # Local only and already built -- just reveal it.
    if not upload and local_exists:
        try:
            subprocess.Popen(["open", "-R", output_path])
        except Exception:
            pass
        handler._json(200, {"ok": True, "path": output_path, "alreadyExisted": True, "localOnly": True})
        return

    # Already generated AND already on Drive -- nothing to redo, just reveal it.
    if upload and local_exists and manifest.get("audiobookDrivePath"):
        try:
            subprocess.Popen(["open", "-R", output_path])
        except Exception:
            pass
        handler._json(200, {"ok": True, "path": output_path, "drivePath": manifest["audiobookDrivePath"],
                         "alreadyExisted": True})
        return

    # Already being worked on (double-click / second tab) -- join that job
    # instead of starting a second one writing/uploading the same file.
    for jid, info in audiobook.AUDIOBOOK_JOBS.items():
        if info.get("person") == name and info.get("stage") in ("queued", "encoding", "uploading"):
            handler._json(200, {"ok": True, "jobId": jid, "alreadyExisted": False})
            return

    job_id = uuid.uuid4().hex[:12]
    audiobook.AUDIOBOOK_JOBS[job_id] = {"person": name, "stage": "uploading" if (local_exists and upload) else "encoding",
                              "percent": 0, "eta_seconds": None, "message": "Starting…",
                              "path": None, "drivePath": None}
    threading.Thread(target=audiobook.run_audiobook_job,
                     args=(job_id, name, audio_path, rows, output_path, not local_exists, False, upload),
                     daemon=True).start()
    handler._json(200, {"ok": True, "jobId": job_id, "alreadyExisted": False})
    return


def export_combined_transcripts(handler):
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except json.JSONDecodeError:
        handler._json(400, {"error": "invalid JSON body"})
        return
    names = payload.get("people") or []
    if not isinstance(names, list) or not names:
        handler._json(400, {"error": "need a non-empty 'people' list"})
        return

    dest_dir = os.path.join(config.EXPORTS_ROOT, f"Call Studio Export {time.strftime('%Y-%m-%d %H%M%S')}")
    included, skipped = [], []
    chunks = []
    for name in names:
        manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
        if not os.path.exists(manifest_path):
            skipped.append(f"{name}: no manifest")
            continue
        with open(manifest_path) as f:
            manifest = json.load(f)
        srt_name = manifest.get("srt") or f"{name}.srt"
        srt_path = os.path.join(config.TRANSCRIPTS_DIR, srt_name)
        if not os.path.exists(srt_path):
            skipped.append(f"{name}: no transcript")
            continue
        with open(srt_path, "r", encoding="utf-8", errors="replace") as f:
            srt_text = f.read().strip()
        chunks.append(f"{name}\n\n{srt_text}")
        included.append(name)

    if not chunks:
        handler._json(200, {"ok": True, "file": None, "included": [], "skipped": skipped})
        return

    os.makedirs(dest_dir, exist_ok=True)
    combined_path = os.path.join(dest_dir, "combined-transcripts.txt")
    with open(combined_path, "w", encoding="utf-8") as f:
        f.write("\n\n\n".join(chunks) + "\n")
    subprocess.Popen(["open", combined_path])
    handler._json(200, {"ok": True, "file": combined_path, "included": included, "skipped": skipped})
    return


def export_batch(handler):
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except json.JSONDecodeError:
        handler._json(400, {"error": "invalid JSON body"})
        return
    names = payload.get("people") or []
    if not isinstance(names, list) or not names:
        handler._json(400, {"error": "need a non-empty 'people' list"})
        return
    kinds = payload.get("kinds") or ["docx", "csv", "srt"]
    if not isinstance(kinds, list) or not set(kinds) <= {"docx", "csv", "srt"}:
        handler._json(400, {"error": "kinds must be a list from docx, csv, srt"})
        return

    dest = os.path.join(config.EXPORTS_ROOT, f"Call Studio Export {time.strftime('%Y-%m-%d %H%M%S')}")
    os.makedirs(dest, exist_ok=True)

    exported, skipped = [], []
    for name in names:
        manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
        if not os.path.exists(manifest_path):
            skipped.append(f"{name}: no manifest")
            continue
        with open(manifest_path) as f:
            manifest = json.load(f)

        got_any = False
        if "docx" in kinds:
            docx_name = manifest.get("docx") or f"{name}-Script-Followalong.docx"
            docx_path = os.path.join(config.REVIEWS_DIR, docx_name)
            if os.path.exists(docx_path):
                shutil.copy2(docx_path, os.path.join(dest, docx_name))
                got_any = True

        if "csv" in kinds:
            csv_name = f"{name}.csv"
            csv_path = os.path.join(config.TIMESTAMPS_DIR, csv_name)
            if os.path.exists(csv_path):
                shutil.copy2(csv_path, os.path.join(dest, csv_name))
                got_any = True

        if "srt" in kinds:
            srt_name = manifest.get("srt") or f"{name}.srt"
            srt_path = os.path.join(config.TRANSCRIPTS_DIR, srt_name)
            if os.path.exists(srt_path):
                shutil.copy2(srt_path, os.path.join(dest, srt_name))
                got_any = True

        if got_any:
            exported.append(name)
        else:
            skipped.append(f"{name}: no {'/'.join(kinds)} found")

    if exported:
        subprocess.Popen(["open", dest])
    else:
        try:
            os.rmdir(dest)  # don't leave a bare empty folder behind
        except OSError:
            pass

    handler._json(200, {"ok": True, "folder": dest if exported else None, "exported": exported, "skipped": skipped})
    return


def phone_info(handler):
    """How big a full phone bundle would be, for the Export for phone dialog."""
    names = sorted(f[:-5] for f in os.listdir(config.MANIFESTS_DIR) if f.endswith(".json"))
    total = 0
    for n in names:
        with open(os.path.join(config.MANIFESTS_DIR, f"{n}.json")) as f:
            mp3 = json.load(f).get("mp3", "")
        path = os.path.join(config.AUDIO_DIR, mp3)
        if mp3 and os.path.exists(path):
            total += os.path.getsize(path)
    handler._json(200, {"calls": len(names), "audioBytes": total})
    return


def export_phone(handler):
    """Starts the background job that packs a library bundle for the phone app (see phone_bundle.py)."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    names = payload.get("people")  # list of call names, or null/absent for every call
    if names is not None and (not isinstance(names, list) or not names):
        handler._json(400, {"error": "pick at least one call, or leave people out for all calls"})
        return
    job_id = uuid.uuid4().hex[:12]
    audiobook.AUDIOBOOK_JOBS[job_id] = {"person": "Phone bundle", "stage": "encoding", "percent": 0, "eta_seconds": None,
                                        "message": "Starting…", "path": None, "drivePath": None}
    threading.Thread(target=phone_bundle.run_export_job,
                     args=(audiobook.AUDIOBOOK_JOBS[job_id], names, bool(payload.get("audio", True))),
                     daemon=True).start()
    handler._json(200, {"ok": True, "jobId": job_id})
    return


def parse_clips(handler):
    """Reads pasted text ("Minute 16:30-18:00 - Finance objection") into suggested clips (see clip_text.py). Adds nothing."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
        text = str(payload.get("text") or "")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    if not text.strip():
        handler._json(400, {"error": "paste some text first"})
        return
    try:
        handler._json(200, clip_text.parse(text, payload.get("call") or None, bool(payload.get("ai"))))
    except RuntimeError as e:
        handler._json(502, {"error": str(e)})
    return
