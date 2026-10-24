"""Processing a new recording: transcribe (whisper) -> review (claude) -> manifest, plus the job table,
the serial work queues and the gap-fill scan."""
import json
import os
import queue
import re
import shutil
import subprocess
import threading
import time

import audiobook
import cancel
import config
import followup
import manifests
import prompts
import redact
import transcript_sync
import util


JOBS = {}  # job_id -> dict(stage, percent, message, person, error)

# Two single-worker lanes instead of one: transcription (whisper-cli, local/
# GPU) and doc-writing (claude -p, network/API) are separate resource pools
# that don't compete with each other, so they run in their own lanes -- at
# most one whisper-cli at a time (GPU), at most one claude -p at a time
# (usage limits), but a transcription and a doc-write CAN run at once. This
# means dropping several files queues transcription for #2 to start the
# instant #1's transcript is ready, instead of waiting on #1's whole (slow)
# claude analysis to finish first.
# What whisper has said so far for each call being transcribed: stem -> [[start, end, text], ...]. Read by /api/transcript-live so the
# page can show the transcript growing while it is still being made. An entry is dropped when the transcript is finished (or fails).
LIVE_LINES = {}
_WHISPER_LINE = re.compile(r"\[(\d+):(\d\d):(\d\d)[.,](\d+)\s*-->\s*(\d+):(\d\d):(\d\d)[.,](\d+)\]\s*(.*)")


def _whisper_line(line):
    m = _WHISPER_LINE.search(line)
    if not m:
        return None
    g = m.groups()
    t = lambda h, mi, se, fr: int(h) * 3600 + int(mi) * 60 + int(se) + float("0." + fr)
    return [round(t(*g[0:4]), 2), round(t(*g[4:8]), 2), g[8].strip()]


TRANSCRIBE_QUEUE = queue.Queue()
DOC_QUEUE = queue.Queue()


def _transcribe_worker():
    while True:
        fn, args = TRANSCRIBE_QUEUE.get()
        try:
            waiting = JOBS.get(args[0])
            if waiting is not None and cancel.is_cancelled(waiting):   # cancelled while it was waiting its turn
                waiting.update(stage="error", message="Cancelled")
                continue
            fn(*args)
        except Exception as e:
            job_id = args[0]
            if job_id in JOBS:
                JOBS[job_id].update(stage="error", message=f"Unexpected error: {e}")
        finally:
            TRANSCRIBE_QUEUE.task_done()


def _doc_worker():
    while True:
        fn, args = DOC_QUEUE.get()
        try:
            if cancel.is_cancelled(args[0]):
                args[0].update(stage="error", message="Cancelled")
                if args[-1] and len(args) > 1:   # (placeholder_created) the "writing the review" placeholder goes too
                    try:
                        os.remove(os.path.join(config.MANIFESTS_DIR, f"{args[1]}.json"))
                    except OSError:
                        pass
                continue
            fn(*args)
        except Exception as e:
            job = args[0]
            job.update(stage="error", message=f"Unexpected error: {e}")
        finally:
            DOC_QUEUE.task_done()


threading.Thread(target=_transcribe_worker, daemon=True).start()
threading.Thread(target=_doc_worker, daemon=True).start()


def find_existing_media(stem):
    for ext in config.MEDIA_EXT_PREFERENCE:
        p = os.path.join(config.AUDIO_DIR, stem + ext)
        if os.path.exists(p):
            return p
    return None


def run_pipeline(job_id, upload_path, base_script_name=None, mine=None):
    ext = os.path.splitext(upload_path)[1].lower()
    if ext in config.TRANSCRIPT_EXT:
        run_pipeline_from_transcript(job_id, upload_path, base_script_name, mine)
    else:
        run_pipeline_from_media(job_id, upload_path, base_script_name, mine)


def run_pipeline_from_transcript(job_id, upload_path, base_script_name=None, mine=None):
    job = JOBS[job_id]
    stem = None
    placeholder_created = False
    try:
        ext = os.path.splitext(upload_path)[1].lower()
        stem = util.sanitize_stem(os.path.basename(upload_path))
        job.update(stage="probing", message="Already-transcribed file — skipping transcription…", percent=20, person=stem)

        media_path = find_existing_media(stem)
        if not media_path:
            raise RuntimeError(
                f"No audio/video file found for '{stem}' in this folder (looked for "
                f"{', '.join(stem + e for e in config.MEDIA_EXT_PREFERENCE)}). "
                f"The doc needs a matching audio/video file to be playable — add it to the folder "
                f"(named to match) and drop the transcript again."
            )
        media_filename = os.path.basename(media_path)
        duration = util.ffprobe_duration(media_path) or 1

        final_srt = os.path.join(config.TRANSCRIPTS_DIR, stem + ".srt")
        final_txt = os.path.join(config.TRANSCRIPTS_TXT_DIR, stem + ".txt")

        if ext == ".srt":
            shutil.copy(upload_path, final_srt)
        else:  # .txt uploaded
            shutil.copy(upload_path, final_txt)
            if not os.path.exists(final_srt):
                raise RuntimeError(
                    f"Got a .txt but no timestamped .srt exists for '{stem}' yet — a plain .txt has no "
                    f"timing info to build a timeline from. Upload the matching .srt instead (or upload "
                    f"the original audio/video and I'll transcribe it fresh)."
                )
        os.remove(upload_path)
        redact.redact_files(final_srt, final_txt if os.path.exists(final_txt) else None)

        placeholder_created = manifests.write_placeholder_manifest(stem, media_filename, "writing_doc")

        transcription_note = (
            f"existing {os.path.basename(final_srt)} — supplied directly (not transcribed by this "
            f"pipeline in this run). Method/accuracy of the original transcription is unknown."
        )

        DOC_QUEUE.put((_run_doc_stage, (job, stem, final_srt, final_txt, media_filename, duration,
                                         base_script_name, transcription_note, mine, placeholder_created)))
    except Exception as e:
        job.update(stage="error", message=str(e), percent=job.get("percent", 0))
        if placeholder_created:
            # A placeholder is only created after the supplied transcript
            # has been safely copied. Keep that useful library entry if the
            # hand-off to the optional AI-review queue fails.
            manifests.update_manifest_status(stem, "review_error", str(e))


def _transcribe_existing(job, stem, playable_path, duration_hint=0):
    try:
        return _transcribe_existing_impl(job, stem, playable_path, duration_hint)
    finally:
        LIVE_LINES.pop(stem, None)   # finished (the real transcript file exists now), cancelled or failed


def _transcribe_existing_impl(job, stem, playable_path, duration_hint=0):
    """Run whisper-cli on a media file that's already sitting in AUDIO_DIR,
    writing the result into TRANSCRIPTS_DIR / TRANSCRIPTS_TXT_DIR. Shared by
    the upload pipeline and the gap-scan pipeline."""
    ext = os.path.splitext(playable_path)[1].lower()
    duration = duration_hint or util.ffprobe_duration(playable_path) or 1

    if ext in config.WHISPER_NATIVE_AUDIO:
        whisper_input = playable_path
    else:
        whisper_input = os.path.join(config.STUDIO_DIR, f"_tmp_{stem}.wav")
        job.update(stage="extracting", message=f"{stem}: extracting audio for transcription…", percent=10)
        cancel.run(job, [config.FFMPEG, "-y", "-i", playable_path, "-ar", "16000", "-ac", "1", whisper_input], timeout=600)
        cancel.check(job)

    job.update(stage="transcribing", message=f"{stem}: transcribing 0%…", percent=15)
    srt_base = os.path.join(config.STUDIO_DIR, f"_tmp_{stem}")
    proc = subprocess.Popen(
        [config.WHISPER_CLI, "-m", config.WHISPER_MODEL, "-of", srt_base, "-osrt", "-otxt", whisper_input],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, start_new_session=True,
    )
    cancel.register(job, proc)
    ts_re = re.compile(r"-->\s*(\d{2}:\d{2}:\d{2})\.\d+\]")
    LIVE_LINES[stem] = []
    for line in proc.stdout:
        seg = _whisper_line(line)
        if seg and seg[2] and len(LIVE_LINES[stem]) < 50000:
            LIVE_LINES[stem].append(seg)   # shown on the page straight away, before the transcript is finished
        m = ts_re.search(line)
        if m and duration:
            cur = util.hms_to_seconds(m.group(1))
            pct = 15 + min(80, int(cur / duration * 80))
            job.update(stage="transcribing", message=f"{stem}: transcribing… {pct}%", percent=pct)
    proc.wait(timeout=1200)
    cancel.unregister(job, proc)
    if cancel.is_cancelled(job):   # stopped from the queue: drop the half-made files
        for leftover in (srt_base + ".srt", srt_base + ".txt", whisper_input if whisper_input != playable_path else None):
            if leftover and os.path.exists(leftover):
                os.remove(leftover)
        cancel.check(job)

    srt_path = srt_base + ".srt"
    txt_path = srt_base + ".txt"
    if not os.path.exists(srt_path):
        raise RuntimeError(f"whisper-cli did not produce a transcript for {stem}")

    final_srt = os.path.join(config.TRANSCRIPTS_DIR, stem + ".srt")
    final_txt = os.path.join(config.TRANSCRIPTS_TXT_DIR, stem + ".txt")
    shutil.move(srt_path, final_srt)
    has_txt = os.path.exists(txt_path)
    if has_txt:
        shutil.move(txt_path, final_txt)
    if os.path.exists(whisper_input) and whisper_input != playable_path:
        os.remove(whisper_input)
    redact.redact_files(final_srt, final_txt if has_txt else None)   # spoken card numbers become BEEP BEEP BEEP (redact.py)

    transcription_note = (
        f"existing {os.path.basename(final_srt)} (same offline whisper.cpp/Metal pipeline used for "
        f"the other call transcripts in this folder). Minor word-level errors are possible — overall "
        f"content and structure are reliable."
    )
    return final_srt, (final_txt if has_txt else None), duration, transcription_note


def run_pipeline_from_media(job_id, upload_path, base_script_name=None, mine=None):
    job = JOBS[job_id]
    stem = None
    placeholder_created = False
    try:
        ext = os.path.splitext(upload_path)[1].lower()
        stem = util.sanitize_stem(os.path.basename(upload_path))
        job.update(stage="probing", message="Reading file…", percent=2, person=stem)

        duration_hint = util.ffprobe_duration(upload_path) or 0

        # figure out the browser-playable media file
        if ext in config.VIDEO_EXT:
            playable_path = os.path.join(config.AUDIO_DIR, stem + ".mp4")
            if ext != ".mp4":
                job.update(stage="remuxing", message="Preparing video for playback…", percent=5)
                subprocess.run(
                    [config.FFMPEG, "-y", "-i", upload_path, "-c", "copy", playable_path],
                    capture_output=True, timeout=600,
                )
            else:
                shutil.move(upload_path, playable_path)
        else:
            playable_path = os.path.join(config.AUDIO_DIR, stem + ext)
            shutil.move(upload_path, playable_path)
        media_filename = os.path.basename(playable_path)

        # show up in the sidebar right away -- don't make the reviewer wait
        # for the (slow, expensive) Claude analysis step just to see the
        # entry exist at all.
        placeholder_created = manifests.write_placeholder_manifest(stem, media_filename, "transcribing")

        final_srt, final_txt, duration, transcription_note = _transcribe_existing(job, stem, playable_path, duration_hint)
        if placeholder_created:
            manifests.update_manifest_status(stem, "writing_doc")  # transcript's ready, reveal-transcript can light up now
        # hand off to the separate doc-writing lane so the NEXT queued
        # upload's transcription can start right away on this (now free)
        # transcription lane, instead of waiting on this call's claude step.
        DOC_QUEUE.put((_run_doc_stage, (job, stem, final_srt, final_txt, media_filename, duration,
                                         base_script_name, transcription_note, mine, placeholder_created)))

    except Exception as e:
        job.update(stage="error", message=str(e), percent=job.get("percent", 0))
        if placeholder_created:
            try:
                os.remove(os.path.join(config.MANIFESTS_DIR, f"{stem}.json"))
            except OSError:
                pass


def run_gap_scan(job_id, base_script_name=None, force=False, only=None):
    """Go through everything already sitting in audio-recordings/ and fill
    in whatever's missing: transcript if there's none, follow-along doc if
    there's a transcript but no doc yet. Skips anything already complete
    unless force=True, in which case the doc (not the transcript) is always
    regenerated — used to re-normalize section names against a base script.
    `only`, if given, is a set of stems to limit processing to (for
    re-running just the ones a previous pass silently failed on)."""
    job = JOBS[job_id]
    try:
        job.update(stage="scanning", message="Scanning audio-recordings…", percent=1)
        media_ext = config.WHISPER_NATIVE_AUDIO | config.VIDEO_EXT | {".m4a"}
        files = sorted(f for f in os.listdir(config.AUDIO_DIR) if os.path.splitext(f)[1].lower() in media_ext)
        if only:
            files = [f for f in files if util.sanitize_stem(f) in only]
        total = len(files) or 1
        processed, skipped, failed = [], [], []

        for i, fname in enumerate(files, start=1):
            cancel.check(job)
            stem = util.sanitize_stem(fname)
            src_path = os.path.join(config.AUDIO_DIR, fname)
            ext = os.path.splitext(fname)[1].lower()
            canonical_path = os.path.join(config.AUDIO_DIR, stem + ext)
            if src_path != canonical_path:
                if os.path.exists(canonical_path):
                    src_path = canonical_path  # a correctly-named copy already exists
                else:
                    shutil.move(src_path, canonical_path)
                    src_path = canonical_path
            media_filename = os.path.basename(src_path)

            final_srt = os.path.join(config.TRANSCRIPTS_DIR, stem + ".srt")
            manifest_path = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
            pct_base = int((i - 1) / total * 100)

            try:
                if not force and os.path.exists(final_srt) and os.path.exists(manifest_path):
                    skipped.append(stem)
                    job.update(stage="scanning", message=f"[{i}/{total}] {stem}: already complete, skipping", percent=pct_base)
                    continue

                if force and not os.path.exists(final_srt):
                    # normalize/force mode never transcribes fresh audio — only regenerates
                    # docs for calls that already have a transcript.
                    skipped.append(stem)
                    job.update(stage="scanning", message=f"[{i}/{total}] {stem}: no transcript yet, not transcribing in force mode, skipping", percent=pct_base)
                    continue

                job.update(stage="scanning", message=f"[{i}/{total}] {stem}: working…", percent=pct_base)

                if os.path.exists(final_srt):
                    final_txt = os.path.join(config.TRANSCRIPTS_TXT_DIR, stem + ".txt")
                    final_txt = final_txt if os.path.exists(final_txt) else None
                    duration = util.ffprobe_duration(src_path) or 1
                    transcription_note = (
                        f"existing {stem}.srt (same offline whisper.cpp/Metal pipeline used for the other "
                        f"call transcripts in this folder; not re-transcribed on this pass, doc regenerated "
                        f"from the existing transcript)."
                    )
                    _finish_pipeline(job, stem, final_srt, final_txt, media_filename, duration, base_script_name,
                                      transcription_note, notify_stages=False)
                else:
                    f_srt, f_txt, duration, note = _transcribe_existing(job, stem, src_path)
                    _finish_pipeline(job, stem, f_srt, f_txt, media_filename, duration, base_script_name, note,
                                      notify_stages=False)

                processed.append(stem)
            except Exception as e:
                failed.append(f"{stem}: {e}")

        msg = f"Done — filled {len(processed)}, already complete {len(skipped)}"
        if failed:
            msg += f", failed {len(failed)}"
        job.update(stage="done", message=msg, percent=100, processed=processed, skipped=skipped, failed=failed)

    except Exception as e:
        job.update(stage="error", message=str(e), percent=job.get("percent", 0))


# fields people set by hand (right-click menu, notes, links, Q&A, follow-up events): a regenerate puts these back
_HAND_SET = ("mine", "favourite", "reviewed", "cpd", "highlight", "closer", "spinNotes", "qa", "followUpEvents", "followUpEventDate")


def run_regenerate(job_id, stem, base_script_name=None):
    """Writes the call review again from the call's existing transcript (nothing is re-transcribed), keeping everything
    set by hand and not booking another follow-up calendar event."""
    job = JOBS[job_id]
    try:
        final_srt = os.path.join(config.TRANSCRIPTS_DIR, stem + ".srt")
        if not os.path.exists(final_srt):
            raise RuntimeError(f"{stem} has no transcript to write a review from")
        manifest_path = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
        old = {}
        if os.path.exists(manifest_path):
            with open(manifest_path) as f:
                old = json.load(f)
        keep = {k: v for k, v in old.items() if k in _HAND_SET or k.endswith("Link")}
        media_filename = old.get("mp3") or next((f for f in os.listdir(config.AUDIO_DIR) if util.sanitize_stem(f) == stem), None)
        if not media_filename:
            raise RuntimeError(f"can't find the recording for {stem}")
        final_txt = os.path.join(config.TRANSCRIPTS_TXT_DIR, stem + ".txt")
        final_txt = final_txt if os.path.exists(final_txt) else None
        duration = util.ffprobe_duration(os.path.join(config.AUDIO_DIR, media_filename)) or 1
        note = f"existing {stem}.srt (not re-transcribed; the review is being written again from it)."
        job.update(person=stem)
        _finish_pipeline(job, stem, final_srt, final_txt, media_filename, duration, base_script_name, note, keep=keep)
    except Exception as e:
        job.update(stage="error", message=str(e), percent=job.get("percent", 0))


def _run_doc_stage(job, stem, final_srt, final_txt, media_filename, duration, base_script_name,
                    transcription_note, mine, placeholder_created):
    """Runs on DOC_QUEUE, decoupled from the transcription lane. Owns the
    same failure/placeholder-cleanup responsibility run_pipeline_from_media/
    _from_transcript used to have when this ran inline with transcription."""
    try:
        _finish_pipeline(job, stem, final_srt, final_txt, media_filename, duration, base_script_name,
                          transcription_note, mine)
    except Exception as e:
        job.update(stage="error", message=str(e), percent=job.get("percent", 0))
        if placeholder_created:
            # The transcript is complete before this worker starts. Preserve
            # the library entry when only the optional AI review fails.
            manifests.update_manifest_status(stem, "review_error", str(e))


_LOOM_STEM = re.compile(r"^(?:\d{2}-\d{2}-)?LOOM_", re.I)


def _finish_loom(job, stem, media_filename, mine=None):
    """A Loom is already somebody's review of a call, so no call review is written for it: it just gets its transcript and
    shows in the list (no 'writing the review' status, no follow-up, no audiobook)."""
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path) as f:
            manifest = json.load(f)
    manifest.update({"name": stem, "mp3": manifest.get("mp3") or media_filename})
    manifest.pop("status", None)   # anything with a status counts as "still processing" in the list
    if mine is not None:
        manifest["mine"] = mine
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    job.update(stage="done", message="Done: transcript ready", percent=100, person=stem)
    try:
        transcript_sync.queue_sync(stem)
    except Exception as e:
        print(f"transcript sync not queued for {stem}: {e}", flush=True)


def _finish_pipeline(job, stem, final_srt, final_txt, media_filename, duration, base_script_name, transcription_note, mine=None, notify_stages=True, keep=None):
    if _LOOM_STEM.match(stem) and keep is None:   # (a right-click "Regenerate call review" still works on one: keep is set then)
        return _finish_loom(job, stem, media_filename, mine)
    # keep = fields from the previous manifest to put back after Claude rewrites it (a regenerate): see run_regenerate
    # --- hand off to headless Claude to write the follow-along doc ---
    job.update(stage="writing_doc", message="Claude is writing the follow-along doc…", percent=96)
    if notify_stages:
        util.mac_notify(f"{stem}: transcript ready, writing the call review…", person=stem)
    spec_path = os.path.join(config.STUDIO_DIR, f"_tmp_{stem}.spec.json")
    docx_out = os.path.join(config.REVIEWS_DIR, f"{stem}-Script-Followalong.docx")
    manifest_out = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
    csv_out = os.path.join(config.TIMESTAMPS_DIR, f"{stem}.csv")

    base_script_text = None
    if base_script_name:
        bs_path = os.path.join(config.BASE_SCRIPTS_DIR, f"{base_script_name}.txt")
        if os.path.exists(bs_path):
            with open(bs_path, "r", encoding="utf-8", errors="replace") as f:
                base_script_text = f.read()[:config.BASE_SCRIPT_MAX_CHARS]

    # capture mtimes BEFORE the call so we can tell "already existed" apart
    # from "genuinely freshly written" — a pre-existing file passing an
    # exists() check is exactly what silently masked Helen/Victoria not
    # actually being regenerated on an earlier pass.
    mtime_before = os.path.getmtime(manifest_out) if os.path.exists(manifest_out) else None
    call_started = time.time()

    prompt = prompts.build_prompt(stem, final_srt, final_txt, media_filename, duration, spec_path, docx_out, manifest_out,
                           base_script_name, base_script_text, transcription_note, csv_out)
    cancel.check(job)
    result = cancel.run(
        job, [config.CLAUDE, "-p", prompt, "--allowedTools", "Read Write Bash",
              "--add-dir", config.FOLDER, "--add-dir", config.STUDIO_DIR],
        cwd=config.FOLDER, timeout=1200,
    )
    cancel.check(job)   # stopped from the queue while Claude was writing

    manifest_exists = os.path.exists(manifest_out)
    docx_exists = os.path.exists(docx_out)
    freshly_written = manifest_exists and os.path.getmtime(manifest_out) >= call_started

    if not manifest_exists or not docx_exists or not freshly_written:
        combined = (result.stdout or "") + (result.stderr or "")
        if "authenticate" in combined.lower() or "oauth" in combined.lower():
            raise RuntimeError(
                "Claude Code isn't logged in on this machine (the transcript is safely saved, "
                "just no doc yet). Run `claude auth login` in Terminal, then drop the file again "
                "— or just re-run: node build_followalong.js won't help here, the doc-writing step needs Claude itself."
            )
        if manifest_exists and not freshly_written:
            raise RuntimeError(
                f"Claude finished without error but never actually overwrote {os.path.basename(manifest_out)} "
                f"(mtime unchanged since before the call) — the old file was there and silently passed as "
                f"'exists' without being regenerated.\n--- stdout (last 1500) ---\n{result.stdout[-1500:]}"
            )
        raise RuntimeError(
            "Claude didn't produce the expected files.\n--- stdout ---\n"
            + result.stdout[-2000:] + "\n--- stderr ---\n" + result.stderr[-2000:]
        )

    with open(manifest_out) as f:
        manifest = json.load(f)
    if manifest.get("saleClosed"):
        # a closed call has had its payment taken: the card details read out near the end get the deeper clean-up (redact.py)
        redact.redact_files(final_srt, final_txt, deep=True)
    manifest_changed = False
    if mine is not None:
        manifest["mine"] = mine
        manifest_changed = True
    if keep:
        manifest.update(keep)   # everything you set by hand survives; only the generated review is new
        manifest_changed = True

    # Auto-book the follow-up the moment the review is done, but only
    # when Claude resolved a single unambiguous date (followUpEventDate,
    # strict YYYY-MM-DD) for a prospect worth following up on — a range
    # or vague timeframe is left for the user to pick by hand in the UI.
    auto_date = manifest.get("followUpEventDate")
    priority = manifest.get("followUpPriority")
    is_loom = bool(re.match(r"^(?:\d{2}-\d{2}-)?LOOM_", stem, re.I))   # Loom reviews aren't prospects: never book a follow-up for them
    if keep is None and not is_loom and (auto_date and re.match(r"^\d{4}-\d{2}-\d{2}$", auto_date)
            and not manifest.get("saleClosed") and isinstance(priority, (int, float)) and priority >= 3):
        try:
            display_name = re.sub(r"^\d{2}-\d{2}-", "", stem)
            event_id, link = followup.create_followup_gcal_event(display_name, auto_date, followup.build_followup_description(manifest))
            manifest.setdefault("followUpEvents", []).append({"date": auto_date, "id": event_id, "link": link})
            manifest_changed = True
            if notify_stages:
                util.mac_notify(f"{stem}: follow-up added to calendar for {auto_date}", person=stem)
        except Exception as e:
            print(f"auto follow-up gcal event failed for {stem}: {e}")

    if manifest_changed:
        with open(manifest_out, "w") as f:
            json.dump(manifest, f, indent=2)

    job.update(stage="done", message="Done", percent=100, person=stem)
    try:
        transcript_sync.queue_sync(stem)  # copy of the transcript into the Drive folder's transcripts/ subfolder
    except Exception as e:
        print(f"transcript sync not queued for {stem}: {e}", flush=True)
    if notify_stages:
        util.mac_notify(f"{stem}: call review finished", person=stem)
        # "Auto audiobook" checkbox. Skipped for batch re-runs (gap scan etc.) the same way their
        # notifications are, so re-running old calls doesn't suddenly spawn a pile of audiobooks.
        try:
            audiobook.queue_auto_audiobook(stem)
        except Exception as e:
            print(f"auto audiobook not queued for {stem}: {e}", flush=True)
