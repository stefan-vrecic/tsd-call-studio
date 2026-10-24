"""Generic JSON documents for the business tabs (Accounting, Clients, Delegation): one file per name in live_docs/records/<name>.json.
  GET  /api/records?name=accounting    -> the saved document (or that tab's empty starter)
  POST /api/records?name=accounting    body = the whole document as JSON: replaces it (written atomically)
New tabs only need their name added to RECORDS below; each tab's own script decides what is inside the document."""
import json
import os
import urllib.parse

import config
import util

DIR = os.path.join(config.LIVE_DOCS_DIR, "records")
os.makedirs(DIR, exist_ok=True)
RECORDS = {   # name -> empty starter
    "accounting": {"entries": []},
    "clients": {"clients": []},
    "coaching": {"reps": []},
    "delegation": {"tasks": [], "sops": [], "people": []},
    "networking": {"people": []},
    "todos": {"items": []},
    "travel": {"places": []},   # Travel tab (TravelPage.tsx): a short list of rentals
    "travelcontacts": {"contacts": []},
    "identitylab": {"target": "$20K/month closer", "sessions": [], "suggestions": []},   # Identity Lab (IdentityLabPage.tsx); call analysis can add to "suggestions"   # Travel Contacts tab (TravelContactsPage.tsx): cleaners, chefs, drivers ...
    "transcript-flags": {"calls": {}},   # call name -> [{start, text, at}]: lines flagged with right-click in the transcript (transcript.js)
    "kanban": {"boards": []},
    "planner": {"sections": []},
    "roadmap": {"mode": "general", "plans": {"7": "", "14": "", "30": "", "60": "", "90": "", "180": "", "365": ""}, "sections": {}},
    "workouts": {"entries": []},
    "contentideas": {"items": [], "migrated": False},
    "sheetmusic": {"items": []},
    "resources": {"items": []},
    "statement-content": {"sections": []},   # local-only sales objection scripts
    "company-links": {"links": []},   # local-only script, onboarding, sheet, and Drive links
    "leadgen": {"leads": [
        {"id": "lead-balkan-sales-group", "source": "Facebook", "name": "Balkan Sales Group", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-tomy-talent", "source": "Facebook", "name": "Tomy Talent", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-jovan-bjelica", "source": "Facebook", "name": "Jovan Bjelica", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-james-hayes", "source": "Facebook", "name": "James Hayes", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-hamza-malik", "source": "Facebook", "name": "Hamza Malik", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-dusan-bogdanovic", "source": "Facebook", "name": "Dusan Bogdanovic", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-jake-watson", "source": "Facebook", "name": "Jake Watson", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-marty-kausylas", "source": "Facebook", "name": "Marty Kausylas", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-ljiljana-ostojic", "source": "Facebook", "name": "Ljiljana Ostojic", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-nicolas-zapata", "source": "Facebook", "name": "Nicolas Zapata", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-jd-daley", "source": "Facebook", "name": "JD Daley", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-jason-cashman", "source": "Instagram", "name": "Jason Cashman", "link": "https://www.instagram.com/direct/t/17842659257531325/", "lastContact": "", "followUp": ""},
        {"id": "lead-charlie-coad", "source": "Instagram", "name": "Charlie Coad", "link": "", "lastContact": "", "followUp": ""},
        {"id": "lead-shae-matthews", "source": "WhatsApp", "name": "Shae Matthews", "link": "", "lastContact": "", "followUp": ""}
    ]},
    "agreements": {"clientRegions": [], "products": [
        {"id": "product-1", "name": "Product Agreement 1", "url": "", "notes": ""},
        {"id": "product-2", "name": "Product Agreement 2", "url": "", "notes": ""},
        {"id": "product-3", "name": "Product Agreement 3", "url": "", "notes": ""},
    ]},
}
MAX_BYTES = 8_000_000


def load_record(name):
    if name not in RECORDS:
        return None
    path = os.path.join(DIR, name + ".json")
    if os.path.isfile(path):
        try:
            with open(path, encoding="utf-8") as f:
                value = json.load(f)
            if isinstance(value, dict):
                return value
        except (OSError, ValueError):
            pass
    return json.loads(json.dumps(RECORDS[name]))


def _merge_identitylab(old, new):
    """Identity Lab can be open in two tabs at once: merge instead of letting the last save win. Sessions are matched by id and
    the one edited most recently (updatedAt) is kept; ids in `deleted` stay deleted; the target with the newer targetAt wins."""
    deleted = set(old.get("deleted") or []) | set(new.get("deleted") or [])
    by_id = {}
    for s in (old.get("sessions") or []) + (new.get("sessions") or []):
        if not isinstance(s, dict) or s.get("id") in deleted:
            continue
        cur = by_id.get(s.get("id"))
        if cur is None or (s.get("updatedAt") or "") >= (cur.get("updatedAt") or ""):
            by_id[s.get("id")] = s
    sessions = sorted(by_id.values(), key=lambda s: (s.get("date") or "", s.get("createdAt") or ""), reverse=True)
    newer = new if (new.get("targetAt") or "") >= (old.get("targetAt") or "") else old
    sugg = {x.get("id"): x for x in (old.get("suggestions") or []) + (new.get("suggestions") or []) if isinstance(x, dict)}
    for x in (new.get("suggestions") or []):   # "used" only ever goes from false to true
        if isinstance(x, dict) and (sugg.get(x.get("id")) or {}).get("used") is False and x.get("used"):
            sugg[x["id"]]["used"] = True
    return {**old, **new, "target": newer.get("target"), "targetAt": newer.get("targetAt", ""), "sessions": sessions,
            "suggestions": list(sugg.values()), "deleted": sorted(deleted)[-500:]}


MERGE = {"identitylab": _merge_identitylab}


def save_record(name, doc):
    if name not in RECORDS or not isinstance(doc, dict):
        return False
    path = os.path.join(DIR, name + ".json")
    util.write_json(path, doc, ensure_ascii=False, indent=1)
    return True


def _name(handler):
    n = util.query(handler).get("name", [""])[0]
    return n if n in RECORDS else None


def records_get(handler):
    n = _name(handler)
    if not n:
        handler._json(400, {"error": "unknown document"})
        return
    handler._json(200, load_record(n))


def records_save(handler):
    n = _name(handler)
    if not n:
        handler._json(400, {"error": "unknown document"})
        return
    body = handler._read_body()
    if len(body) > MAX_BYTES:
        handler._json(413, {"error": "too much data"})
        return
    try:
        doc = json.loads(body.decode("utf-8"))
        assert isinstance(doc, dict)
    except (ValueError, AssertionError):
        handler._json(400, {"error": "expected a JSON object"})
        return
    if n in MERGE:
        doc = MERGE[n](load_record(n), doc)
    save_record(n, doc)
    handler._json(200, {"ok": True})
