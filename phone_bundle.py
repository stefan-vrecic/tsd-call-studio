"""The "library bundle" for the Call Studio phone app: one .zip with everything the app needs to browse, search and play
calls offline.

    library.json                  {"version": 1, "generated": ..., "calls": [ ...one object per call... ]}
    audio/<call name>.<ext>       the recording, copied as it is (left out when "audio" is off: info-only refresh)
    transcripts/<call name>.json  {"lines": [[start, end, speaker|null, text], ...]}

Only read-only study data goes in: no CRM links, notes, Q&A, height/weight. The phone matches audio to a call by the
file name, so an info-only bundle can refresh marks and closers without touching audio already on the phone.
"""
import datetime
import json
import os
import subprocess
import time
import zipfile

import config
import settings
import srt
import util

BUNDLE_VERSION = 1


def _audio_path(manifest):
    path = os.path.join(config.AUDIO_DIR, manifest.get("mp3", ""))
    return path if manifest.get("mp3") and os.path.exists(path) else None


def _call_entry(manifest, audio, has_transcript):
    """The library.json object for one call (see mobile/PLAN.md for how the app uses each field)."""
    name = manifest["name"]
    ext = os.path.splitext(manifest.get("mp3", ""))[1] or ".mp3"
    rows = []
    for r in manifest.get("rows") or []:
        rows.append({
            "ts": r.get("ts"),
            "seconds": r.get("seconds"),
            "end": util.range_end_seconds(r.get("ts")),
            "section": r.get("section"),
            "desc": r.get("desc"),
        })
    findings = manifest.get("findings")
    return {
        "name": name,
        "title": util.readable_title(name),
        "audio": f"audio/{name}{ext}" if audio else None,
        "durationSeconds": util.ffprobe_duration(audio) if audio else None,
        "addedDate": os.path.getmtime(audio) if audio else None,  # same notion of "date" as the Mac sidebar
        "mine": manifest.get("mine"),
        "favourite": bool(manifest.get("favourite")),
        "closer": manifest.get("closer") or "",
        "highlight": manifest.get("highlight") or "",
        "priority": manifest.get("followUpPriority"),
        "saleClosed": manifest.get("saleClosed"),
        "primaryObjection": manifest.get("primaryObjection") or "",
        "secondaryObjection": manifest.get("secondaryObjection") or "",
        "followUpDate": manifest.get("followUpDate") or "",
        "followUpProcess": settings.fill_closer("\n\n".join(x for x in (manifest.get("followUpProcess"), manifest.get("followUpMessage")) if x)),
        "recommendations": manifest.get("recommendations") or [],
        "findings": findings if isinstance(findings, list) else ([findings] if findings else []),
        "skipped": [{"section": s.get("section"), "status": s.get("status")}
                    for s in (manifest.get("skippedSections") or []) if isinstance(s, dict)],
        "rows": rows,
        "transcript": f"transcripts/{name}.json" if has_transcript else None,
    }


def _transcript_json(manifest):
    path = os.path.join(config.TRANSCRIPTS_DIR, manifest.get("srt") or f"{manifest['name']}.srt")
    if not os.path.exists(path):
        return None
    _, blocks = srt.parse_srt(path)
    lines = [[round(b["start"], 2), round(b["end"], 2), b.get("speaker"), b["text"]] for b in blocks]
    return json.dumps({"lines": lines}, ensure_ascii=False, separators=(",", ":"))


def build_bundle(job, names, include_audio):
    """Writes the zip (to a .part file first) and returns its path. `names` = None for every call."""
    started = time.time()
    all_names = sorted(f[:-5] for f in os.listdir(config.MANIFESTS_DIR) if f.endswith(".json"))
    chosen = [n for n in all_names if names is None or n in set(names)]
    if not chosen:
        raise RuntimeError("no calls to export")
    out_dir = os.path.join(config.EXPORTS_ROOT, "Phone")
    os.makedirs(out_dir, exist_ok=True)
    stamp = time.strftime("%Y-%m-%d %H%M")
    suffix = "" if include_audio else " (info only)"
    out_path = os.path.join(out_dir, f"Call Studio Phone {stamp}{suffix}.zip")
    n = 2
    while os.path.exists(out_path):  # never overwrite an earlier export
        out_path = os.path.join(out_dir, f"Call Studio Phone {stamp}{suffix} ({n}).zip")
        n += 1
    part = out_path + ".part"

    calls = []
    try:
        with zipfile.ZipFile(part, "w", allowZip64=True) as z:
            for i, name in enumerate(chosen):
                job.update(stage="encoding", message=f"Packing {i + 1} of {len(chosen)}: {name}")
                with open(os.path.join(config.MANIFESTS_DIR, f"{name}.json")) as f:
                    manifest = json.load(f)
                audio = _audio_path(manifest)
                transcript = _transcript_json(manifest)
                calls.append(_call_entry(manifest, audio, transcript is not None))
                if transcript is not None:
                    z.writestr(f"transcripts/{name}.json", transcript, compress_type=zipfile.ZIP_DEFLATED)
                if include_audio and audio:
                    # mp3/m4a are already compressed, so store them: faster to write, no size lost
                    z.write(audio, calls[-1]["audio"], compress_type=zipfile.ZIP_STORED)
                pct = min(99.0, (i + 1) / len(chosen) * 100)
                job.update(percent=round(pct, 1), eta_seconds=util.eta(started, pct) if pct >= 3 else None)
            library = {"version": BUNDLE_VERSION, "generated": datetime.datetime.now().isoformat(timespec="seconds"),
                       "audioIncluded": bool(include_audio), "calls": calls}
            z.writestr("library.json", json.dumps(library, ensure_ascii=False, indent=1), compress_type=zipfile.ZIP_DEFLATED)
        os.replace(part, out_path)
    except Exception:
        if os.path.exists(part):
            os.remove(part)
        raise
    return out_path


def run_export_job(job, names, include_audio):
    """Background job wrapper (progress is polled through /api/audiobook-progress like the other exports)."""
    try:
        path = build_bundle(job, names, include_audio)
        job.update(stage="done", percent=100, eta_seconds=0, message="Done", path=path,
                   size=os.path.getsize(path), count=len(names) if names is not None else None)
        try:
            subprocess.Popen(["open", "-R", path])
        except Exception:
            pass
    except Exception as e:
        job.update(stage="error", message=str(e))
