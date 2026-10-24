"""Calls: the player page, the call list, transcripts, section search, and edits to one call (notes, marks, rename).

Each function is one endpoint: it gets the request handler (handler.path, handler.rfile, handler._json(...)) and
answers it. Which URL goes to which function is the table in routes/__init__.py."""
import json
import os
import re
import subprocess
import time
import urllib.parse

import clips
import config
import pipeline
import settings
import private_profile
import followup
import srt
import transcript_sync
import util


def index_page(handler):
    with open(os.path.join(config.STUDIO_DIR, "player.html"), "r", encoding="utf-8") as f:
        handler._html(200, f.read())
    return


# Direct link to one call, e.g. /09-03-LouiseThompson -- same page, the client-side init() reads the name back
# out of the path and auto-selects it. Only a single bare path segment (so it can't collide with /api/..., /media/...),
# and only when a manifest for that name exists -- otherwise the request falls through to the next route (/seek) or 404.
def is_call_page(path):
    return re.match(r"^/[A-Za-z0-9_-]+$", path) is not None and os.path.exists(
        os.path.join(config.MANIFESTS_DIR, f"{path[1:]}.json"))


def call_page(handler):
    with open(os.path.join(config.STUDIO_DIR, "player.html"), "r", encoding="utf-8") as f:
        handler._html(200, f.read())


def people(handler):
    import drive_inbox
    auto_on = bool(settings.load_settings().get("autoAudiobook"))
    people = []
    for fn in sorted(os.listdir(config.MANIFESTS_DIR)):
        if fn.endswith(".json"):
            with open(os.path.join(config.MANIFESTS_DIR, fn)) as f:
                p = json.load(f)
            audio_path = os.path.join(config.AUDIO_DIR, p.get("mp3", ""))
            p["has_audio"] = os.path.exists(audio_path)
            p["addedDate"] = os.path.getmtime(audio_path) if p["has_audio"] else None
            p["audioPath"] = audio_path if p["has_audio"] else None
            p["duration"] = util.cached_duration(audio_path) if p["has_audio"] else None
            audiobook_path = os.path.join(config.AUDIOBOOKS_DIR, f"{p['name']}.m4b")
            p["has_audiobook"] = os.path.exists(audiobook_path)
            p["audiobookPath"] = audiobook_path if p["has_audiobook"] else None
            # whether an audiobook gets made by itself once this call's review is done (the page says so while it's processing)
            p["audiobookAuto"] = auto_on or drive_inbox.wants_audiobook(p["name"])
            srt_name = p.get("srt") or f"{p['name']}.srt"
            p["has_transcript"] = os.path.exists(os.path.join(config.TRANSCRIPTS_DIR, srt_name))
            docx_name = p.get("docx") or f"{p['name']}-Script-Followalong.docx"
            p["has_docx"] = os.path.exists(os.path.join(config.REVIEWS_DIR, docx_name))
            p["has_csv"] = os.path.exists(os.path.join(config.TIMESTAMPS_DIR, f"{p['name']}.csv"))
            markers_path = os.path.join(config.MARKERS_DIR, f"{p['name']}.json")   # ranges for the player (A-B, C-D ...) with titles
            if os.path.exists(markers_path):
                try:
                    with open(markers_path) as mf:
                        p["markers"] = json.load(mf).get("markers", [])
                except ValueError:
                    pass
            people.append(p)
    handler._json(200, people)
    return


def closers(handler):
    handler._json(200, {"closers": private_profile.closers()})


def transcript(handler):
    parsed = urllib.parse.urlparse(handler.path)
    qs = urllib.parse.parse_qs(parsed.query)
    name = qs.get("person", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    srt_path = os.path.join(config.TRANSCRIPTS_DIR, manifest.get("srt") or f"{name}.srt")
    if not os.path.exists(srt_path):
        handler._json(404, {"error": f"no transcript for {name}"})
        return
    has_speakers, blocks = srt.parse_srt(srt_path)
    # optional ?from=&to= (seconds): only the lines that overlap that stretch. Lets a search
    # result show just its own section's transcript without pulling down the whole call.
    try:
        t_from = float(qs["from"][0]) if "from" in qs else None
        t_to = float(qs["to"][0]) if "to" in qs else None
    except ValueError:
        handler._json(400, {"error": "from and to must be numbers of seconds"})
        return
    if t_from is not None or t_to is not None:
        lo = t_from if t_from is not None else float("-inf")
        hi = t_to if t_to is not None else float("inf")
        blocks = [b for b in blocks if b["end"] > lo and b["start"] < hi]
    handler._json(200, {"has_speakers": has_speakers, "blocks": blocks})
    return


def transcript_live(handler):
    """GET /api/transcript-live?person=NAME&since=N -- the transcript lines whisper has produced so far for a call that is still being
    transcribed (only those after the first N, so the page can just ask for what's new). live=false once there is nothing in progress."""
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    try:
        since = max(0, int(qs.get("since", ["0"])[0]))
    except ValueError:
        since = 0
    lines = pipeline.LIVE_LINES.get(name)
    if lines is None:
        handler._json(200, {"live": False, "total": 0, "blocks": []})
        return
    new = lines[since:]
    handler._json(200, {"live": True, "total": len(lines),
                        "blocks": [{"start": a, "end": b, "text": t, "speaker": None} for a, b, t in new]})
    return


def transcript_raw(handler):
    parsed = urllib.parse.urlparse(handler.path)
    qs = urllib.parse.parse_qs(parsed.query)
    name = qs.get("person", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    srt_path = os.path.join(config.TRANSCRIPTS_DIR, manifest.get("srt") or f"{name}.srt")
    if not os.path.exists(srt_path):
        handler._json(404, {"error": f"no transcript for {name}"})
        return
    with open(srt_path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()
    body = raw.encode("utf-8")
    handler.send_response(200)
    handler.send_header("Content-Type", "text/plain; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
    return


def search_section(handler):
    parsed = urllib.parse.urlparse(handler.path)
    qs = urllib.parse.parse_qs(parsed.query)
    query = (qs.get("q", [""])[0] or "").strip().lower()
    results = []
    if query:
        for fn in sorted(os.listdir(config.MANIFESTS_DIR)):
            if not fn.endswith(".json"):
                continue
            with open(os.path.join(config.MANIFESTS_DIR, fn)) as f:
                manifest = json.load(f)
            # same notion of "date" as the sidebar's Date sort: when the audio file landed
            audio_file = os.path.join(config.AUDIO_DIR, manifest.get("mp3", ""))
            added = os.path.getmtime(audio_file) if os.path.exists(audio_file) else 0
            for row in manifest.get("rows", []):
                section = (row.get("section") or "").lower()
                if query in section or section in query:
                    results.append({
                        "person": manifest["name"],
                        "mp3": manifest["mp3"],
                        "ts": row.get("ts"),
                        "seconds": row.get("seconds"),
                        "end_seconds": util.range_end_seconds(row.get("ts")),
                        "section": row.get("section"),
                        "desc": row.get("desc"),
                        "addedDate": added,
                    })
    # newest call first; within a call, sections in the order they happen.
    # (two stable sorts: timeline order first, then call recency -- reverse=True
    # keeps equal calls' sections in their original order)
    results.sort(key=lambda r: r["seconds"] if r["seconds"] is not None else 0)
    results.sort(key=lambda r: (r["addedDate"], r["person"]), reverse=True)
    handler._json(200, results)
    return


def open_file(handler):
    parsed = urllib.parse.urlparse(handler.path)
    qs = urllib.parse.parse_qs(parsed.query)
    name = qs.get("person", [""])[0]
    kind = qs.get("type", [""])[0]  # "docx" or "csv"
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    if kind == "docx":
        target = os.path.join(config.REVIEWS_DIR, manifest.get("docx", ""))
    elif kind == "csv":
        target = os.path.join(config.TIMESTAMPS_DIR, f"{name}.csv")
    elif kind == "srt":
        target = os.path.join(config.TRANSCRIPTS_DIR, manifest.get("srt") or f"{name}.srt")
    else:
        handler._json(400, {"error": "type must be docx, csv, or srt"})
        return
    if not os.path.exists(target):
        handler._json(404, {"error": f"{kind} not found for {name} (expected {target})"})
        return
    if kind == "srt":
        # .srt usually has no default app on macOS, so "open" silently does
        # nothing useful — reveal it selected in Finder instead.
        subprocess.Popen(["open", "-R", target])
    else:
        subprocess.Popen(["open", target])
    handler._json(200, {"opened": target})
    return


def seek(handler):
    parsed = urllib.parse.urlparse(handler.path)
    qs = urllib.parse.parse_qs(parsed.query)
    person = qs.get("person", [""])[0]
    t = qs.get("t", [""])[0]
    handler.send_response(302)
    handler.send_header("Location", f"/?person={urllib.parse.quote(person)}&t={urllib.parse.quote(t)}")
    handler.send_header("Content-Length", "0")
    handler.end_headers()
    return


def set_notes(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    text = handler._read_body().decode("utf-8", errors="replace")
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest["spinNotes"] = text
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True})
    return


def ask(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    question = handler._read_body().decode("utf-8", errors="replace").strip()
    if not name or not question:
        handler._json(400, {"error": "need person and a question (in the POST body)"})
        return
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    srt_path = os.path.join(config.TRANSCRIPTS_DIR, manifest.get("srt") or f"{name}.srt")
    if not os.path.exists(srt_path):
        handler._json(404, {"error": f"no transcript found for {name}"})
        return
    with open(srt_path, "r", encoding="utf-8", errors="replace") as f:
        transcript_text = f.read()

    prompt = (
        f"You are answering a reviewer's question about one sales call transcript. Answer directly, "
        f"concisely, and only from what's actually in the transcript below — if it genuinely isn't "
        f"answerable from the transcript, say so plainly rather than guessing. Don't pad with caveats "
        f"or repeat the question back.\n\n"
        f"---BEGIN TRANSCRIPT ({name})---\n{transcript_text}\n---END TRANSCRIPT---\n\n"
        f"Question: {question}"
    )
    try:
        result = subprocess.run(
            [config.CLAUDE, "-p", prompt],
            capture_output=True, text=True, timeout=180,
        )
        answer = (result.stdout or "").strip() or f"(no answer produced)\n{result.stderr[-500:]}"
    except subprocess.TimeoutExpired:
        handler._json(504, {"error": "timed out waiting for an answer"})
        return

    manifest.setdefault("qa", []).append({
        "question": question, "answer": answer, "at": time.strftime("%Y-%m-%d %H:%M"),
    })
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"answer": answer})
    return


def set_link(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    kind = qs.get("type", [""])[0]  # "recording", "crm", or "notes"
    url = qs.get("url", [""])[0]
    if kind not in ("recording", "crm", "notes"):
        handler._json(400, {"error": "type must be recording, crm, or notes"})
        return
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest[f"{kind}Link"] = followup.unwrap_google_redirect_url(url)
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True})
    return


def set_mine(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    mine = qs.get("mine", [""])[0] == "true"
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest["mine"] = mine
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True})
    return


def set_reviewed(handler):
    """POST /api/set-reviewed?person=X&reviewed=true|false: a Loom (or any call) marked as reviewed -- the call list shows a ✅."""
    _set_flag(handler, "reviewed")


def set_cpd(handler):
    """POST /api/set-cpd?person=X&cpd=true|false: a call marked as CPD (right-click) -- the call list shows a CPD badge."""
    _set_flag(handler, "cpd")


def _set_flag(handler, key):
    """A right-click on/off mark kept in the call's manifest as {key: <when it was set>} (removed when switched off)."""
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not name or "/" in name or not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    if qs.get(key, [""])[0] == "true":
        manifest[key] = __import__("time").time()
    else:
        manifest.pop(key, None)
    util.write_json(manifest_path, manifest, indent=2)
    handler._json(200, {"ok": True, key: bool(manifest.get(key))})


def set_favourite(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    favourite = qs.get("favourite", [""])[0] == "true"
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest["favourite"] = favourite
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True})
    return


def set_highlight(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    text = qs.get("text", [""])[0].strip()[:120]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    if text:
        manifest["highlight"] = text
    else:
        manifest.pop("highlight", None)  # empty text clears it
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True, "highlight": text})
    return


def set_closer(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    closer = qs.get("closer", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest["closer"] = closer
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True})
    return


def rename_person(handler):
    qs = util.query(handler)
    old_name = qs.get("person", [""])[0]
    new_raw = handler._read_body().decode("utf-8", errors="replace").strip()
    if not old_name or not new_raw:
        handler._json(400, {"error": "need person (query) and a new name (POST body)"})
        return
    old_manifest_path = os.path.join(config.MANIFESTS_DIR, f"{old_name}.json")
    if not os.path.exists(old_manifest_path):
        handler._json(404, {"error": f"no manifest for {old_name}"})
        return

    new_stem = util.sanitize_stem(new_raw)
    if new_stem == old_name:
        handler._json(200, {"ok": True, "name": old_name, "unchanged": True})
        return

    new_manifest_path = os.path.join(config.MANIFESTS_DIR, f"{new_stem}.json")
    # allow a pure case-change (same file on a case-insensitive fs);
    # block a real collision with a different, existing person.
    if os.path.exists(new_manifest_path) and os.path.normcase(new_manifest_path) != os.path.normcase(old_manifest_path):
        handler._json(409, {"error": f"'{new_stem}' already exists — pick a different name"})
        return

    with open(old_manifest_path) as f:
        manifest = json.load(f)

    moved = []  # (new_path, old_path) pairs, for best-effort rollback
    try:
        old_mp3 = manifest.get("mp3")
        if old_mp3:
            old_audio_path = os.path.join(config.AUDIO_DIR, old_mp3)
            if os.path.exists(old_audio_path):
                new_mp3 = f"{new_stem}{os.path.splitext(old_mp3)[1]}"
                new_audio_path = os.path.join(config.AUDIO_DIR, new_mp3)
                util.move_stem_file(old_audio_path, new_audio_path)
                moved.append((new_audio_path, old_audio_path))
                manifest["mp3"] = new_mp3

        old_srt = manifest.get("srt") or f"{old_name}.srt"
        old_srt_path = os.path.join(config.TRANSCRIPTS_DIR, old_srt)
        if os.path.exists(old_srt_path):
            new_srt = f"{new_stem}.srt"
            new_srt_path = os.path.join(config.TRANSCRIPTS_DIR, new_srt)
            util.move_stem_file(old_srt_path, new_srt_path)
            moved.append((new_srt_path, old_srt_path))
            manifest["srt"] = new_srt

        # plain-text transcript: not tracked in the manifest, always
        # keyed off the stem directly
        old_txt_path = os.path.join(config.TRANSCRIPTS_TXT_DIR, f"{old_name}.txt")
        if os.path.exists(old_txt_path):
            new_txt_path = os.path.join(config.TRANSCRIPTS_TXT_DIR, f"{new_stem}.txt")
            util.move_stem_file(old_txt_path, new_txt_path)
            moved.append((new_txt_path, old_txt_path))

        old_docx = manifest.get("docx") or f"{old_name}-Script-Followalong.docx"
        old_docx_path = os.path.join(config.REVIEWS_DIR, old_docx)
        if os.path.exists(old_docx_path):
            new_docx = f"{new_stem}-Script-Followalong.docx"
            new_docx_path = os.path.join(config.REVIEWS_DIR, new_docx)
            util.move_stem_file(old_docx_path, new_docx_path)
            moved.append((new_docx_path, old_docx_path))
            manifest["docx"] = new_docx

        # timestamp csv: not tracked in the manifest either
        old_csv_path = os.path.join(config.TIMESTAMPS_DIR, f"{old_name}.csv")
        if os.path.exists(old_csv_path):
            new_csv_path = os.path.join(config.TIMESTAMPS_DIR, f"{new_stem}.csv")
            util.move_stem_file(old_csv_path, new_csv_path)
            moved.append((new_csv_path, old_csv_path))

        # player markers: not in the manifest either
        old_markers_path = os.path.join(config.MARKERS_DIR, f"{old_name}.json")
        if os.path.exists(old_markers_path):
            new_markers_path = os.path.join(config.MARKERS_DIR, f"{new_stem}.json")
            util.move_stem_file(old_markers_path, new_markers_path)
            moved.append((new_markers_path, old_markers_path))

        manifest["name"] = new_stem
        with open(old_manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
        util.move_stem_file(old_manifest_path, new_manifest_path)
    except Exception as e:
        for new_p, old_p in reversed(moved):
            try:
                if os.path.exists(new_p) and not os.path.exists(old_p):
                    util.move_stem_file(new_p, old_p)
            except Exception:
                pass
        handler._json(500, {"error": f"rename failed partway through and was rolled back where possible: {e}"})
        return

    clips.rename_person_in_clips(old_name, new_stem)
    transcript_sync.queue_rename(old_name, new_stem)
    handler._json(200, {"ok": True, "name": new_stem})
    return
