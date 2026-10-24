"""Combine: drop several recordings on Call Studio with the "Combine into one call" box ticked and they are joined, in order, into
ONE recording that then goes through the normal pipeline (transcript -> call review ...).

How it travels: the page sends each file to /api/upload with X-Combine-Group / -Index / -Total headers. receive() keeps the parts in
_incoming/_combine_<group>/ and, when the last one has arrived, queues run_combined(), which joins them with ffmpeg and hands the
result to pipeline.run_pipeline() as if it had been dropped as a single file. (A call that was split by a dropped line is the usual case.)
"""
import os
import re
import shutil
import threading
import time
import uuid

import cancel
import config
import pipeline
import util

_lock = threading.Lock()
INCOMING = os.path.join(config.STUDIO_DIR, "_incoming")


def _group_dir(group):
    return os.path.join(INCOMING, "_combine_" + re.sub(r"[^A-Za-z0-9]", "", group)[:40])


def _forget_stale():
    """Parts of a combine that never finished arriving (a failed upload) are tidied away after a day."""
    try:
        for name in os.listdir(INCOMING):
            p = os.path.join(INCOMING, name)
            if name.startswith("_combine_") and os.path.isdir(p) and time.time() - os.path.getmtime(p) > 86400:
                shutil.rmtree(p, ignore_errors=True)
    except OSError:
        pass


def combined_stem(names):
    """A name for the joined call from its parts' file names: what they share at the start, without a trailing 'part 1' / '1'.
    ('Mary part 1.mp3' + 'Mary part 2.mp3' -> 'Mary'; unrelated names -> the first one's name.)"""
    stems = [util.sanitize_stem(os.path.splitext(n)[0]) for n in names]
    common = os.path.commonprefix(stems)
    common = re.sub(r"[-_ .]*(?:part|pt|p)?[-_ .]*\d*$", "", common, flags=re.I).strip("-_ .")
    return common if len(common) >= 3 else stems[0]


def _unique(stem):
    """Never reuse a name Call Studio already has (that would overwrite a real call)."""
    def taken(s):
        return os.path.exists(os.path.join(config.MANIFESTS_DIR, s + ".json")) or os.path.exists(os.path.join(INCOMING, s + ".mp3"))
    cand, n = stem, 1
    while taken(cand):
        n += 1
        cand = f"{stem}-combined" if n == 2 else f"{stem}-combined-{n - 1}"
    return cand


def receive(group, index, total, filename, body, base_script, mine):
    """Stores one part. Returns {"job_id": ...} when this was the last part (the combine is now queued), else {"part": index}."""
    d = _group_dir(group)
    os.makedirs(d, exist_ok=True)
    _forget_stale()
    dest = os.path.join(d, f"{index:03d}__{os.path.basename(filename)}")
    util.write_bytes(dest, body)
    with _lock:
        have = [f for f in os.listdir(d) if not f.endswith(".part")]
        if len(have) < total or os.path.exists(os.path.join(d, ".queued")):
            return {"part": index}
        open(os.path.join(d, ".queued"), "w").close()
    job_id = uuid.uuid4().hex[:12]
    ahead = pipeline.TRANSCRIBE_QUEUE.qsize()
    pipeline.JOBS[job_id] = {"stage": "queued", "name": f"Joining {len(have)} files", "percent": 0,
                             "message": f"Queued ({ahead} ahead)…" if ahead else "Queued…"}
    pipeline.TRANSCRIBE_QUEUE.put((run_combined, (job_id, d, base_script, mine)))
    return {"job_id": job_id}


def run_combined(job_id, d, base_script=None, mine=None):
    job = pipeline.JOBS[job_id]
    out = None
    try:
        files = sorted(f for f in os.listdir(d) if "__" in f and not f.endswith(".part"))
        paths = [os.path.join(d, f) for f in files]
        names = [f.split("__", 1)[1] for f in files]
        stem = _unique(combined_stem(names))
        out = os.path.join(INCOMING, stem + ".mp3")
        job.update(stage="combining", name=stem, percent=2, person=stem,
                   message=f"{stem}: joining {len(paths)} files in this order: " + ", ".join(names))
        cmd = [config.FFMPEG, "-v", "error", "-y"]
        for p in paths:
            cmd += ["-i", p]
        norm = ";".join(f"[{i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a{i}]" for i in range(len(paths)))
        cmd += ["-filter_complex", norm + ";" + "".join(f"[a{i}]" for i in range(len(paths))) + f"concat=n={len(paths)}:v=0:a=1[a]",
                "-map", "[a]", "-c:a", "libmp3lame", "-q:a", "4", out]
        r = cancel.run(job, cmd, timeout=3600)
        cancel.check(job)
        if r.returncode != 0 or not os.path.exists(out):
            raise RuntimeError("ffmpeg couldn't join the files: " + (r.stderr or "")[-300:])
        shutil.rmtree(d, ignore_errors=True)
        job.update(stage="probing", message=f"{stem}: joined, starting…", percent=3)
        pipeline.run_pipeline(job_id, out, base_script, mine)      # from here on it is an ordinary upload
    except Exception as e:
        job.update(stage="error", message="Cancelled" if isinstance(e, cancel.Cancelled) else str(e))
        shutil.rmtree(d, ignore_errors=True)
        if out and os.path.exists(out) and job.get("stage") == "error":
            try:
                os.remove(out)
            except OSError:
                pass
