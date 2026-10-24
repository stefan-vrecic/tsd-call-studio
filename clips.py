"""The "clip basket": clips collected from different calls, exported as solo mp3 files and/or as ONE
chaptered audiobook (.m4b) whose chapter titles are the clip titles.

Paths and tools are read as config.NAME at call time, so a test can point them at a sandbox.
"""
import json
import os
import re
import subprocess
import tempfile
import time
import zipfile

import audiobook
import config
import srt
import util

CLIPS_FILE = "clips.json"
MAX_CLIPS = 500


def _clips_path():
    return os.path.join(config.STUDIO_DIR, CLIPS_FILE)


# ---------------------------------------------------------------- the saved basket
def load_clips():
    try:
        with open(_clips_path()) as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (OSError, ValueError):
        return []


def save_clips(clips):
    """Replaces the whole basket. Only keeps the fields we know about, so junk from a client can't pile up."""
    clean = []
    for c in clips[:MAX_CLIPS]:
        try:
            clean.append({
                "id": str(c["id"])[:40],
                "person": str(c["person"]),
                "a": float(c["a"]),
                "b": float(c["b"]),
                "title": str(c.get("title") or "")[:150],
                "section": str(c.get("section") or "")[:100],
            })
        except (KeyError, TypeError, ValueError):
            continue
    path = _clips_path()
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(clean, f, indent=2)
    os.replace(tmp, path)
    return clean


def rename_person_in_clips(old, new):
    """A renamed call keeps its clips."""
    clips = load_clips()
    if any(c.get("person") == old for c in clips):
        for c in clips:
            if c.get("person") == old:
                c["person"] = new
        save_clips(clips)


# ---------------------------------------------------------------- cutting
def _probe_seconds(path):
    try:
        return float(subprocess.check_output(
            [config.FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
            text=True, timeout=30).strip())
    except Exception:
        return None


def resolve_clips(clips):
    """Checks every clip against its call and returns [{title, person, src, a, b}]. Raises ValueError
    naming the first clip that can't be exported, so nothing half-runs."""
    if not clips:
        raise ValueError("there are no clips to export")
    if len(clips) > MAX_CLIPS:
        raise ValueError(f"too many clips (max {MAX_CLIPS})")
    out, durations = [], {}
    for i, c in enumerate(clips, 1):
        label = f"clip {i}" + (f" ({c.get('title')})" if c.get("title") else "")
        person = str(c.get("person", ""))
        manifest_path = os.path.join(config.MANIFESTS_DIR, f"{person}.json")
        if not person or not os.path.exists(manifest_path):
            raise ValueError(f"{label}: the call '{person}' no longer exists")
        with open(manifest_path) as f:
            manifest = json.load(f)
        src = os.path.join(config.AUDIO_DIR, manifest.get("mp3", ""))
        if not os.path.exists(src):
            raise ValueError(f"{label}: audio file for '{person}' is missing")
        try:
            a, b = float(c["a"]), float(c["b"])
        except (KeyError, TypeError, ValueError):
            raise ValueError(f"{label}: start/end aren't numbers")
        if a < 0 or b <= a:
            raise ValueError(f"{label}: end has to be after start")
        if src not in durations:
            durations[src] = _probe_seconds(src)
        total = durations[src]
        if total is not None:
            if a >= total:
                raise ValueError(f"{label}: starts past the end of the recording ({total:.0f}s)")
            b = min(b, total)  # a B marker dragged slightly past the end just clips to the end
        first_row = (manifest.get("rows") or [{}])[0].get("section") or "Section"
        title = util.safe_clip_name(c.get("title"), f"{first_row}–{person}")
        srt_path = os.path.join(config.TRANSCRIPTS_DIR, manifest.get("srt") or f"{person}.srt")
        out.append({"title": title, "person": person, "src": src, "a": a, "b": b,
                    "srt": srt_path if os.path.exists(srt_path) else None})
    return out


def cut_mp3(src, a, b, out_path):
    """One clip as an mp3. mp3 sources: lossless stream copy (instant); anything else is re-encoded.
    Raises RuntimeError on failure (and leaves no half-written file behind)."""
    codec = ["-c", "copy"] if src.lower().endswith(".mp3") else ["-vn", "-c:a", "libmp3lame", "-q:a", "4"]
    cmd = [config.FFMPEG, "-v", "error", "-y", "-ss", f"{a:.3f}", "-i", src, "-t", f"{b - a:.3f}", *codec, out_path]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    except subprocess.TimeoutExpired:
        raise RuntimeError("ffmpeg timed out cutting the clip")
    if r.returncode != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        if os.path.exists(out_path):
            os.remove(out_path)
        raise RuntimeError("ffmpeg couldn't cut the clip: " + (r.stderr.strip()[-400:] or "no output produced"))


def _encode_segment(src, a, b, out_path, pad=0.8):
    """One clip as AAC in an .m4a container, always the same format (mono, 44.1 kHz, 64k) so the pieces
    can be joined without re-encoding. A little silence is added at the end so chapters don't run together."""
    cmd = [config.FFMPEG, "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", src,
           "-vn", "-af", f"apad=pad_dur={pad}", "-ac", "1", "-ar", "44100", "-c:a", "aac", "-b:a", "64k", out_path]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if r.returncode != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        raise RuntimeError("ffmpeg couldn't encode a clip: " + (r.stderr.strip()[-400:] or "no output produced"))


def _concat_escape(path):
    return path.replace("'", "'\\''")


def build_audiobook(job, clips, book_title, out_path, p0=0.0, p1=100.0, started=None):
    """Encodes every clip, joins them into one .m4b with a chapter per clip (chapter title = clip title).
    Chapter times come from the measured length of each encoded piece, not from the requested times, so
    they stay accurate. Progress is mapped onto p0..p1 of the job's percentage."""
    started = started or time.time()
    part_path = out_path + ".part"
    tmp = tempfile.mkdtemp(prefix="clips-")
    try:
        segs, n = [], len(clips)
        for i, c in enumerate(clips):
            seg = os.path.join(tmp, f"{i:04d}.m4a")
            job.update(stage="encoding", message=f"Encoding clip {i + 1} of {n}: {c['title']}")
            _encode_segment(c["src"], c["a"], c["b"], seg)
            dur = _probe_seconds(seg)
            if not dur:
                raise RuntimeError(f"couldn't measure encoded clip {i + 1}")
            segs.append((seg, dur))
            pct = p0 + (p1 - p0) * 0.9 * (i + 1) / n
            job.update(percent=round(pct, 1), eta_seconds=util.eta(started, max(3, pct)) if pct >= 3 else None)

        job.update(message="Joining clips into chapters…")
        list_path = os.path.join(tmp, "list.txt")
        with open(list_path, "w", encoding="utf-8") as f:
            f.write("".join(f"file '{_concat_escape(s)}'\n" for s, _ in segs))

        esc = lambda s: re.sub(r"([=;#\\\n])", r"\\\1", s)
        lines = [";FFMETADATA1", f"title={esc(book_title)}", f"album={esc(book_title)}"]
        t = 0.0
        for (_, dur), c in zip(segs, clips):
            start, end = int(round(t * 1000)), int(round((t + dur) * 1000))
            lines += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={start}", f"END={end}", f"title={esc(c['title'])}"]
            t += dur
        meta_path = os.path.join(tmp, "meta.txt")
        with open(meta_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

        r = subprocess.run(
            [config.FFMPEG, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list_path, "-i", meta_path,
             "-map", "0:a", "-map_metadata", "1", "-map_chapters", "1", "-c", "copy", "-f", "ipod", part_path],
            capture_output=True, text=True, timeout=900)
        if r.returncode != 0 or not os.path.exists(part_path):
            raise RuntimeError("ffmpeg failed joining the clips: " + r.stderr.strip()[-400:])
        os.replace(part_path, out_path)
    finally:
        if os.path.exists(part_path):
            os.remove(part_path)
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)


def _clock(sec):
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def clip_transcript(c):
    """The transcript lines that fall inside this clip, as plain text with [m:ss] call times.
    None if the call has no transcript."""
    if not c.get("srt"):
        return None
    _, blocks = srt.parse_srt(c["srt"])
    lines = []
    for b in blocks:
        if b["end"] > c["a"] and b["start"] < c["b"]:
            who = f"{b['speaker']}: " if b.get("speaker") else ""
            lines.append(f"[{_clock(b['start'])}] {who}{b['text']}")
    return "\n".join(lines) if lines else "(no transcript lines in this stretch)"


def _write_zip(zip_path, batch, files, clips):
    """Stored (not compressed -- mp3/m4b already are) zip of the export, plus the clips' transcripts:
    Transcripts/NN title.txt per clip and one Transcripts.txt with all of them in order."""
    width = max(2, len(str(len(clips))))
    combined = []
    with zipfile.ZipFile(zip_path + ".part", "w", zipfile.ZIP_STORED) as z:
        for f in files:
            z.write(f, os.path.join(batch, os.path.basename(f)))
        for i, c in enumerate(clips, 1):
            text = clip_transcript(c)
            head = f"{i}. {c['title']}\n{c['person']} · {_clock(c['a'])}–{_clock(c['b'])}"
            body = text if text is not None else "(no transcript for this call)"
            z.writestr(os.path.join(batch, "Transcripts", f"{str(i).zfill(width)} {c['title']}.txt"), f"{head}\n\n{body}\n")
            combined.append(f"{head}\n\n{body}\n")
        z.writestr(os.path.join(batch, "Transcripts.txt"), "\n\n".join(combined))
    os.replace(zip_path + ".part", zip_path)


# ---------------------------------------------------------------- the export job
def _unique_dir(base_dir, name):
    path = os.path.join(base_dir, name)
    n = 2
    while os.path.exists(path):
        path = os.path.join(base_dir, f"{name} ({n})")
        n += 1
    return path


def run_export_job(job, clips, solo, make_book, book_title, drive, make_zip=False):
    """Background job: solo mp3s and/or one chaptered audiobook (+ optional copy into the Drive folder).
    `clips` must already be resolved (see resolve_clips). Reports through `job` (a dict polled by
    /api/audiobook-progress). Leaves everything in Call Studio Exports/Clips/<batch>/."""
    started = time.time()
    book_path = None
    try:
        root = os.path.join(config.EXPORTS_ROOT, "Clips")
        os.makedirs(root, exist_ok=True)
        batch_dir = _unique_dir(root, util.safe_clip_name(book_title, "Clips"))
        batch = os.path.basename(batch_dir)
        os.makedirs(batch_dir)
        files = []

        if solo:
            job.update(stage="encoding", percent=0, message="Cutting clips…")
            width = max(2, len(str(len(clips))))
            for i, c in enumerate(clips, 1):
                out = os.path.join(batch_dir, f"{str(i).zfill(width)} {c['title']}.mp3")
                cut_mp3(c["src"], c["a"], c["b"], out)
                files.append(out)
                pct = (i / len(clips)) * (30 if make_book else 99)
                job.update(percent=round(pct, 1), message=f"Cut clip {i} of {len(clips)}")

        drive_path = None
        if make_book:
            book_path = os.path.join(batch_dir, f"{batch}.m4b")
            p0 = 30 if solo else 0
            build_audiobook(job, clips, batch, book_path, p0=p0, p1=100, started=started)
            files.append(book_path)
            if drive:
                drive_path = audiobook.copy_to_drive(job, batch, book_path)

        zip_path = None
        if make_zip:
            job.update(stage="encoding", message="Zipping…")
            zip_path = batch_dir + ".zip"
            _write_zip(zip_path, batch, files, clips)

        job.update(stage="done", percent=100, eta_seconds=0, message="Done", path=book_path or batch_dir,
                   drivePath=drive_path, folder=batch_dir, files=files, zipPath=zip_path)
        try:
            subprocess.Popen(["open", "-R", zip_path or book_path or (files[0] if files else batch_dir)])
        except Exception:
            pass
    except Exception as e:
        job.update(stage="error", message=str(e),
                   path=book_path if book_path and os.path.exists(book_path) else None)
