"""The page's own files: stylesheet/scripts and the audio/video (with Range support).

Each function is one endpoint: it gets the request handler (handler.path, handler.rfile, handler._json(...)) and
answers it. Which URL goes to which function is the table in routes/__init__.py."""
import datetime as dt
import json
import os
import urllib.parse

import config
import util


def static_file(handler):
    parsed = urllib.parse.urlparse(handler.path)
    path = parsed.path
    handler._static(path[len("/static/"):])
    return


def media(handler):
    parsed = urllib.parse.urlparse(handler.path)
    path = parsed.path
    name = urllib.parse.unquote(path[len("/media/"):])
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler.send_response(404)
        handler.send_header("Content-Length", "0")
        handler.end_headers()
        return
    with open(manifest_path) as f:
        mp3name = json.load(f)["mp3"]
    handler._serve_media(os.path.join(config.AUDIO_DIR, mp3name))
    return


# ---- Live Call tab (script + sales-objections cheat sheet side by side) and SCP Onboarding tab (one PDF): PDFs in live_docs/
LIVE_SLOTS = ("script", "objections", "onboarding")


def _live_names():
    try:
        with open(os.path.join(config.LIVE_DOCS_DIR, "names.json")) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _demo_path(slot, qs):
    """Demo mode (?demo=1) shows made-up documents instead of the real script / objections: live_docs/demo-<slot>.pdf, when there is one."""
    if qs.get("demo", ["0"])[0] == "1":
        demo = os.path.join(config.LIVE_DOCS_DIR, "demo-" + slot + ".pdf")
        if os.path.isfile(demo):
            return demo
    return None


def live_docs_info(handler):
    """What is in each slot (file name as uploaded, last change) so the page can label and refresh the panes."""
    names = _live_names()
    qs = util.query(handler)
    info = {}
    for slot in LIVE_SLOTS:
        demo = _demo_path(slot, qs)
        if demo:
            info[slot] = {"exists": True, "name": "Demo " + slot + ".pdf", "version": int(os.path.getmtime(demo)), "demo": True}
            continue
        path = os.path.join(config.LIVE_DOCS_DIR, slot + ".pdf")
        info[slot] = {"exists": os.path.isfile(path), "name": names.get(slot) or slot + ".pdf",
                      "version": int(os.path.getmtime(path)) if os.path.isfile(path) else 0}
    handler._json(200, info)
    return


def live_doc(handler):
    """GET /live-docs/<slot>.pdf -- shown inline in the page's PDF viewer."""
    slot = urllib.parse.urlparse(handler.path).path[len("/live-docs/"):]
    slot = slot[:-4] if slot.endswith(".pdf") else slot
    path = _demo_path(slot, util.query(handler)) if slot in LIVE_SLOTS else None
    path = path or os.path.join(config.LIVE_DOCS_DIR, slot + ".pdf")
    if slot not in LIVE_SLOTS or not os.path.isfile(path):
        handler.send_response(404)
        handler.send_header("Content-Length", "0")
        handler.end_headers()
        return
    with open(path, "rb") as f:
        body = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", "application/pdf")
    handler.send_header("Content-Disposition", "inline")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-cache")
    handler.end_headers()
    handler.wfile.write(body)


def live_doc_upload(handler):
    """POST /api/live-doc-upload?slot=script|objections with the PDF as the body (X-Filename = its name): replaces that slot."""
    qs = util.query(handler)
    slot = qs.get("slot", [""])[0]
    if slot not in LIVE_SLOTS:
        handler._json(400, {"error": "slot must be script, objections or onboarding"})
        return
    body = handler._read_body()
    if not body.startswith(b"%PDF"):
        handler._json(400, {"error": "that doesn't look like a PDF"})
        return
    path = os.path.join(config.LIVE_DOCS_DIR, slot + ".pdf")
    util.write_bytes(path, body)
    names = _live_names()
    names[slot] = os.path.basename(urllib.parse.unquote(handler.headers.get("X-Filename", slot + ".pdf")))
    with open(os.path.join(config.LIVE_DOCS_DIR, "names.json"), "w") as f:
        json.dump(names, f)
    handler._json(200, {"ok": True, "name": names[slot]})


def live_notes_get(handler):
    """GET /api/live-notes -- the notes pad of the Live Call tab (one plain text file)."""
    path = os.path.join(config.LIVE_DOCS_DIR, "notes.txt")
    text, updated = "", 0
    if os.path.isfile(path):
        with open(path, encoding="utf-8", errors="replace") as f:
            text = f.read()
        updated = int(os.path.getmtime(path))
    handler._json(200, {"text": text, "updated": updated})
    return


def live_notes_save(handler):
    """POST /api/live-notes with the whole text as the body: replaces the notes."""
    body = handler._read_body()
    if len(body) > 500_000:
        handler._json(413, {"error": "notes are too long (500 KB max)"})
        return
    path = os.path.join(config.LIVE_DOCS_DIR, "notes.txt")
    util.write_bytes(path, body)
    handler._json(200, {"ok": True, "updated": int(os.path.getmtime(path))})
    return


def _notes_path(name):
    return os.path.join(config.LIVE_DOCS_DIR, name)


def purchase_notes_get(handler):
    """GET /api/purchase-notes -- the scratch pad beside the Purchases list (one plain text file)."""
    path = _notes_path("purchase-notes.txt")
    text = ""
    if os.path.isfile(path):
        with open(path, encoding="utf-8", errors="replace") as f:
            text = f.read()
    handler._json(200, {"text": text})
    return


def purchase_notes_save(handler):
    """POST /api/purchase-notes with the whole text as the body: replaces the notes."""
    body = handler._read_body()
    if len(body) > 500_000:
        handler._json(413, {"error": "notes are too long (500 KB max)"})
        return
    path = _notes_path("purchase-notes.txt")
    util.write_bytes(path, body)
    handler._json(200, {"ok": True})
    return


CONTENT_NOTES_SEED = {"ideas": "Respond to Bill Walsh's video about giving up if you haven't made it after a certain amount of time.", "brainstorm": ""}


def content_notes_get(handler):
    """GET /api/content-notes -- the two pads of the Content tab, {"ideas": text, "brainstorm": text}. Until something is saved it holds the starter idea."""
    path = _notes_path("content-notes.json")
    data = dict(CONTENT_NOTES_SEED)
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                saved = json.load(f)
            data = {"ideas": str(saved.get("ideas", "")), "brainstorm": str(saved.get("brainstorm", ""))}
        except (ValueError, OSError):
            pass
    handler._json(200, data)
    return


def content_notes_save(handler):
    """POST /api/content-notes with {"ideas": text, "brainstorm": text}: replaces both pads."""
    body = handler._read_body()
    if len(body) > 1_000_000:
        handler._json(413, {"error": "notes are too long (1 MB max)"})
        return
    try:
        data = json.loads(body.decode("utf-8"))
        clean = {"ideas": str(data.get("ideas", "")), "brainstorm": str(data.get("brainstorm", ""))}
    except (ValueError, AttributeError):
        handler._json(400, {"error": "expected JSON with ideas and brainstorm"})
        return
    path = _notes_path("content-notes.json")
    util.write_json(path, clean, ensure_ascii=False, indent=1)
    handler._json(200, {"ok": True})
    return


def checklists_get(handler):
    """GET /api/checklists -- the bullet lists of the Checklist tab, {"precall": [...], "review": [...], "nlp": [...]} (a card that was never edited is absent)."""
    path = _notes_path("checklists.json")
    data = {}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            data = {}
    handler._json(200, data)
    return


def checklists_save(handler):
    """POST /api/checklists with {"precall": [...], "review": [...]}: replaces the saved lists (plain text bullets only)."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    path = _notes_path("checklists.json")
    clean = {}
    if os.path.isfile(path):   # a save names only the card that changed; the other card's saved list stays
        try:
            with open(path, encoding="utf-8") as f:
                clean = json.load(f)
        except ValueError:
            clean = {}
    for key, items in payload.items():
        if key in ("precall", "review", "nlp") and isinstance(items, list):
            clean[key] = [" ".join(str(i).split())[:500] for i in items if str(i).strip()][:100]
    util.write_json(path, clean, ensure_ascii=False, indent=1)
    handler._json(200, {"ok": True})
    return


def statement_box_get(handler):
    """GET /api/statement-box -- which statements are ticked "Drilled 20 times?" ({"ticked": ["<id>", ...]})."""
    path = _notes_path("statement-box.json")
    data = {"ticked": []}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    handler._json(200, data)
    return


def statement_box_save(handler):
    """POST /api/statement-box with {"ticked": [...]}: replaces the ticked list."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    ticked = [str(i)[:80] for i in (payload.get("ticked") or [])][:500]
    path = _notes_path("statement-box.json")
    util.write_json(path, {"ticked": ticked})
    handler._json(200, {"ok": True})
    return


def _study_notes_path(handler):
    qs = util.query(handler)
    name = os.path.basename(qs.get("person", [""])[0])
    if not name or name.startswith("."):
        return None
    folder = os.path.join(config.LIVE_DOCS_DIR, "study_notes")
    os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, name + ".txt")


def study_notes_get(handler):
    """GET /api/study-notes?person=CALL -- the notes you wrote while studying that call (one plain text file per call)."""
    path = _study_notes_path(handler)
    if path is None:
        handler._json(400, {"error": "which call?"})
        return
    text = ""
    if os.path.isfile(path):
        with open(path, encoding="utf-8", errors="replace") as f:
            text = f.read()
    handler._json(200, {"text": text})
    return


def study_notes_save(handler):
    """POST /api/study-notes?person=CALL with the whole text as the body: replaces that call's study notes."""
    path = _study_notes_path(handler)
    if path is None:
        handler._json(400, {"error": "which call?"})
        return
    body = handler._read_body()
    if len(body) > 500_000:
        handler._json(413, {"error": "notes are too long (500 KB max)"})
        return
    util.write_bytes(path, body)
    handler._json(200, {"ok": True})
    return


def purchase_list_get(handler):
    """GET /api/purchase-list -- the editable title, order and priorities for the Purchases list."""
    path = _notes_path("purchase-list.json")
    data = {"title": "Purchase List", "items": [], "order": [], "stars": {}, "texts": {}, "tags": {}}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = {**data, **json.load(f)}
        except ValueError:
            pass
    handler._json(200, data)
    return


def purchase_list_save(handler):
    """POST /api/purchase-list: replaces its title, order, priorities, re-worded items and associations."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    title = " ".join(str(payload.get("title") or "Purchase List").split())[:120] or "Purchase List"
    items, seen_items = [], set()
    for item in payload.get("items") or []:
        if not isinstance(item, dict):
            continue
        item_id = "".join(c for c in str(item.get("id") or "")[:40] if c.isalnum() or c in "_-")
        text = " ".join(str(item.get("text") or "").split())[:300]
        if item_id and text and item_id not in seen_items:
            items.append({"id": item_id, "text": text})
            seen_items.add(item_id)
        if len(items) >= 500:
            break
    order = [str(i)[:40] for i in (payload.get("order") or [])][:500]
    stars = {str(k)[:40]: int(v) for k, v in (payload.get("stars") or {}).items() if str(v).isdigit() and 1 <= int(v) <= 4}
    texts = {str(k)[:40]: " ".join(str(v).split())[:300] for k, v in (payload.get("texts") or {}).items() if str(v).strip()}   # items you re-worded
    tags = {str(k)[:40]: [" ".join(str(t).split())[:30] for t in v if str(t).strip()][:8] for k, v in (payload.get("tags") or {}).items() if isinstance(v, list)}   # right-click associations, e.g. ["Joy", "Status"]
    path = _notes_path("purchase-list.json")
    util.write_json(path, {"title": title, "items": items, "order": order, "stars": stars, "texts": texts, "tags": tags})
    handler._json(200, {"ok": True})
    return


def commissions_get(handler):
    """GET /api/commissions -- {"values": {"2026-10": 3200, ...}}: the commissions bar on the Today tab, one amount (USD) per month."""
    path = _notes_path("commissions.json")
    data = {"values": {}}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    handler._json(200, data)
    return


def commissions_save(handler):
    """POST /api/commissions with {"month": "2026-10", "value": 3200}: sets that month's amount (the other months are kept)."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
        month, value = str(payload["month"]), float(payload["value"])
    except (ValueError, KeyError, TypeError):
        handler._json(400, {"error": "need a month and a value"})
        return
    if not (len(month) == 7 and month[4] == "-") or not (0 <= value <= 10_000_000):
        handler._json(400, {"error": "month must look like 2026-10 and the value be 0 or more"})
        return
    path = _notes_path("commissions.json")
    data = {"values": {}}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    data.setdefault("values", {})[month] = round(value, 2)
    util.write_json(path, data)
    handler._json(200, {"ok": True})
    return


FOLLOWUPS_SINCE = "2026-08-23"


def _read_followups():
    path = _notes_path("followups.json")
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f).get("items") or []
    except (OSError, ValueError):
        return []


def followups_get(handler):
    """GET /api/followups[?mode=saved] -- the Follow up tab's list: {"items": [{id, name, start, tag, aloware, done, note}, ...]}.
    mode=saved: the list you built (the August pre-load + people added by hand), exactly as saved, the calendar not consulted.
    Driven by the calendar (Oct 23 2026): every sales call coloured flamingo (Stefan's "follow up" colour) from FOLLOWUPS_SINCE to
    today, read through the Sessions tab's calendar lookup (routes/sessions.py, cached 2 min). Ticks and notes are kept per event;
    a call recoloured away from flamingo leaves the list (kept in the file as "gone", so its note comes back if it's flamingo again);
    people added by hand ("manual-...") always stay. If the calendar can't be read, the saved list is shown as it was."""
    from . import sessions
    saved = _read_followups()
    if util.query(handler).get("mode", [""])[0] == "saved":
        handler._json(200, {"items": [{k: v for k, v in i.items() if k != "gone"} for i in saved if not i.get("auto")], "source": "saved list"})
        return
    by_id = {i.get("id"): i for i in saved}
    today = dt.date.today().isoformat()
    try:
        raw = sessions.calendar_sessions(FOLLOWUPS_SINCE, today)
    except Exception as e:   # offline / signed out: the last saved list
        handler._json(200, {"items": [i for i in saved if not i.get("gone")], "error": f"Couldn't read the calendar: {str(e)[:160]}"})
        return
    live = [s for s in raw if s.get("outcome") == "Follow up" and not s.get("cancelled") and s.get("date", "") <= today]
    live_ids = {s["id"] for s in live}
    merged = []
    for s in live:
        old = by_id.get(s["id"], {})
        merged.append({"id": s["id"], "name": s.get("name") or old.get("name", ""), "start": f"{s['date']}T{s['time']}:00",
                       "tag": s.get("tag", ""), "aloware": s.get("aloware") or old.get("aloware", ""),
                       "done": bool(old.get("done")), "note": old.get("note", ""), **({"auto": True} if old.get("auto", not old) else {})})
    for i in saved:
        if i.get("id") in live_ids:
            continue
        if str(i.get("id", "")).startswith("manual-"):
            merged.append(i)
        else:
            merged.append({**i, "gone": True})   # not flamingo any more: off this list (still on the saved list unless the calendar added it)
    util.write_json(_notes_path("followups.json"), {"items": merged}, ensure_ascii=False, indent=1)
    handler._json(200, {"items": [i for i in merged if not i.get("gone")], "source": "flamingo calls on the calendar"})
    return


def followups_save(handler):
    """POST /api/followups with {"items": [...]}: replaces the list (text trimmed, links must be http(s))."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    items = []
    for it in (payload.get("items") or [])[:2000]:
        if not isinstance(it, dict):
            continue
        link = str(it.get("aloware") or "").strip()
        items.append({"id": str(it.get("id") or "")[:200], "name": " ".join(str(it.get("name") or "").split())[:120],
                      "start": str(it.get("start") or "")[:40], "tag": str(it.get("tag") or "")[:20],
                      "aloware": link[:500] if link.startswith(("http://", "https://")) else "",
                      "done": bool(it.get("done")), "note": str(it.get("note") or "")[:2000]})
    saved_mode = util.query(handler).get("mode", [""])[0] == "saved"
    old = {i.get("id"): i for i in _read_followups()}
    for i in items:   # keep the bookkeeping flags the page doesn't send
        for flag in ("auto", "gone"):
            if old.get(i["id"], {}).get(flag):
                i[flag] = True
    sent = {i["id"] for i in items}
    # the page only has the rows its view shows: keep the rest (calendar-added calls in saved mode, recoloured ones in flamingo mode)
    items += [i for i in old.values() if i.get("id") not in sent and (i.get("gone") or (saved_mode and i.get("auto")))]
    path = _notes_path("followups.json")
    util.write_json(path, {"items": items}, ensure_ascii=False, indent=1)
    handler._json(200, {"ok": True})
    return


def bodyweight_get(handler):
    """GET /api/bodyweight -- {"entries": {"2026-10-11": 81.6, ...}}: the weigh-ins behind the body weight goal on the Today tab."""
    path = _notes_path("bodyweight.json")
    data = {"entries": {}}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    handler._json(200, data)
    return


def bodyweight_save(handler):
    """POST /api/bodyweight with {"date": "2026-10-11", "kg": 81.6}: logs that day's weight (kg: 0 or missing removes it)."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
        date, kg = str(payload["date"]), float(payload.get("kg") or 0)
    except (ValueError, KeyError, TypeError):
        handler._json(400, {"error": "need a date and a weight in kg"})
        return
    if len(date) != 10 or date[4] != "-" or date[7] != "-" or not (0 <= kg <= 500):
        handler._json(400, {"error": "date must look like 2026-10-11 and the weight be between 0 and 500 kg"})
        return
    path = _notes_path("bodyweight.json")
    data = {"entries": {}}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    if kg > 0:
        data.setdefault("entries", {})[date] = round(kg, 1)
    else:
        data.setdefault("entries", {}).pop(date, None)
    util.write_json(path, data)
    handler._json(200, {"ok": True})
    return


def sales_checklist_get(handler):
    """GET /api/sales-checklist -- the Sales Checklist card on the Checklist tab: {"items": [{id, name, done, note, added, date, amount}, ...]} (date = YYYY-MM-DD of the sale, amount = £ collected)."""
    path = _notes_path("sales-checklist.json")
    data = {"items": []}
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    handler._json(200, data)
    return


def sales_checklist_save(handler):
    """POST /api/sales-checklist with {"items": [...]}: replaces the list."""
    try:
        payload = json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        handler._json(400, {"error": "body must be JSON"})
        return
    path = _notes_path("sales-checklist.json")
    before = {}                                   # a page opened before date / amount existed sends items without them: keep the saved ones
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                before = {i.get("id"): i for i in json.load(f).get("items", [])}
        except ValueError:
            pass
    items = []
    for it in (payload.get("items") or [])[:1000]:
        if isinstance(it, dict) and str(it.get("name") or "").strip():
            for k in ("date", "amount"):
                if k not in it:
                    it[k] = before.get(it.get("id"), {}).get(k, "")
            items.append({"id": str(it.get("id") or "")[:60], "name": " ".join(str(it["name"]).split())[:120],
                          "done": bool(it.get("done")), "note": str(it.get("note") or "")[:500], "added": str(it.get("added") or "")[:40],
                          "date": str(it.get("date") or "")[:10], "amount": str(it.get("amount") or "")[:20]})
    util.write_json(path, {"items": items}, ensure_ascii=False, indent=1)
    handler._json(200, {"ok": True})
    return
