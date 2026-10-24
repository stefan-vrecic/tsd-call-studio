"""One uniform tool layer so an LLM (the voice dock, or any Claude/ChatGPT session) can read, create and update Call Studio's data.

  GET  /api/agent/tools                       -> every tool: name, kind (read/write), what it does, its arguments
  POST /api/agent/call {"tool": n, "args": {}} -> run one tool, returns {"ok": true, "result": ...} or {"ok": false, "error": ...}

Tools are thin wrappers over the app's existing route functions and stores, so the data stays in one place (live_docs/) and the
buttons on screen and the LLM always see the same thing. Nothing here deletes data or sends anything to an outside person.
"""
import datetime as dt
import json
import os
import re
import time
import urllib.parse
import uuid

import config
import tracker_store as store
from . import buffers, day, records


class _Call:
    """Stands in for the HTTP handler so existing route functions can be called in-process."""
    def __init__(self, path, body=b"", ctype="application/json"):
        self.path, self._body, self.headers = path, body, {"Content-Type": ctype, "Content-Length": str(len(body))}
        self.code, self.out = 200, None

    def _read_body(self):
        return self._body

    def _json(self, code, obj):
        self.code, self.out = code, obj


def _run(fn, path, body=None):
    h = _Call(path, json.dumps(body).encode() if body is not None else b"")
    fn(h)
    if h.code >= 400:
        raise ValueError((h.out or {}).get("error") or f"failed ({h.code})")
    return h.out


def _q(**kw):
    return urllib.parse.urlencode({k: v for k, v in kw.items() if v not in (None, "")})


def _today():
    return store.tracker_today()


def _date(value, default=None, calendar=False):
    v = str(value or "").strip().lower()
    t = dt.datetime.now().date() if calendar else dt.date.fromisoformat(_today())   # calendar days roll over at midnight, the tracker day at 4am
    if not v:
        return default or t.isoformat()
    if v == "today":
        return t.isoformat()
    if v == "yesterday":
        return (t - dt.timedelta(days=1)).isoformat()
    if v == "tomorrow":
        return (t + dt.timedelta(days=1)).isoformat()
    return dt.date.fromisoformat(v).isoformat()


def _needle_match(item, needle, *keys):
    n = needle.lower().strip()
    return n and any(n in str(item.get(k, "")).lower() for k in keys)


# ---------------------------------------------------------------- tools
def navigate(a):
    from . import voice
    name = re.sub(r"\s+", " ", str(a.get("page", "")).lower()).strip()
    target = voice.VOICE_ROUTES.get(name)
    if not target:
        raise ValueError(f"unknown page {name!r}; pages: " + ", ".join(sorted(voice.VOICE_ROUTES)))
    ui = {"action": "navigate", "route": target[0]}
    if voice.VOICE_VIEWS.get(name):
        ui["view"] = voice.VOICE_VIEWS[name]   # e.g. workouts = Tracker -> Workouts
    return {"ui": ui, "opened": target[1]}


def transcripts_search(a):
    from . import transcript_search
    r = _run(transcript_search.transcript_search, "/api/transcript-search?" + _q(q=a.get("query"), section=a.get("section"), closer=a.get("closer")))
    link = lambda person, start: "/?" + urllib.parse.urlencode({"person": person, "t": int(start or 0)})   # opens that call at that moment
    return {"total": r["total"], "calls": [{"person": c["person"], "link": link(c["person"], 0),
                                            "matches": [{**m, "link": link(c["person"], m.get("start"))} for m in c["matches"][:3]]} for c in r["calls"][:8]]}


def books_search(a):
    from . import booksearch
    r = _run(booksearch.book_search, "/api/book-search?" + _q(q=a.get("query"), book=a.get("book") or "all"))
    return {"matched": r["matched"], "books": r["books"][:8], "hits": r["hits"][:8]}


def swipe_list(a):
    from . import swipe
    return [{"id": i["id"], "title": i.get("title", ""), "link": i.get("link", ""), "waiting": bool(i.get("waiting"))} for i in swipe.load()[:int(a.get("limit") or 30)]]


def swipe_add(a):
    from . import swipe
    link = str(a.get("link") or "").strip()
    if not link:
        raise ValueError("link is required")
    if swipe._downloadable_url(link) and not a.get("placeholder_only"):
        r = _run(swipe.swipe_download, "/api/swipe-download", {"link": link})
        if a.get("title"):
            _run(swipe.swipe_update, "/api/swipe-update", {"id": r["item"]["id"], "title": a["title"]})
        return {"id": r["item"]["id"], "note": "downloading the video now"}
    body = {"link": link, "title": a.get("title", ""), "waiting": bool(a.get("placeholder_only"))}
    return {"id": _run(swipe.swipe_add, "/api/swipe-add", body)["item"]["id"]}


# a Follow up row's recording in Call Studio, matched by name the way the Follow up tab does it (static/js/followup-match.js):
# "Louise Thompson" -> 09-03-LouiseThompson; date prefixes, camelCase and "-mobile" suffixes are ignored, a small typo is allowed
def _fu_tokens(call):
    bare = re.sub(r"^\d{1,2}-\d{1,2}-", "", call)
    bare = re.sub(r"([a-z])([A-Z])", r"\1 \2", bare)
    return [t.lower() for t in re.split(r"[^a-zA-Z]+", re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", bare)) if t]


def _fu_close(a, b):
    if a == b:
        return True
    if len(a) < 4 or len(b) < 4 or abs(len(a) - len(b)) > 2:
        return False
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i]
        for j in range(1, len(b) + 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] != b[j - 1])))
        prev = cur
    return prev[-1] <= (2 if len(a) >= 6 else 1)


def _fu_score(person, call):
    words = [re.sub(r"[^a-z]", "", w.lower()) for w in re.split(r"[\s-]+", person)]
    words = [w for w in words if w]
    if not words:
        return 0
    tokens = _fu_tokens(call)
    key, first, lasts = "".join(tokens), words[0], words[1:]
    first_only = "".join(t for t in tokens if t not in ("mobile", "full")) == first
    if lasts:
        if "".join(words) in key:
            return 3
        has_last = any(l in tokens or (len(l) >= 5 and l in key) for l in lasts)
        if has_last and first in tokens:
            return 3
        if (has_last and any(_fu_close(t, first) for t in tokens)) or (any(_fu_close(t, l) for l in lasts for t in tokens) and first in tokens):
            return 2
        return 1 if first_only else 0
    if first not in tokens and not key.startswith(first):
        return 0
    return 1.5 if first_only else 1


def followups_list(a):
    """The Follow up tab, newest session first (like the tab), each with its recording in Call Studio and its Aloware contact."""
    items = _run(__import__("routes.files", fromlist=["x"]).followups_get, "/api/followups")["items"]
    done = sum(1 for i in items if i.get("done"))
    if a.get("open_only", True):
        items = [i for i in items if not i.get("done")]
    items = sorted(items, key=lambda i: i.get("start", ""), reverse=True)
    calls = [f[:-5] for f in os.listdir(config.MANIFESTS_DIR) if f.endswith(".json")]
    def call_for(name):
        scored = sorted(((_fu_score(name, c), c) for c in calls), reverse=True)
        return scored[0][1] if scored and scored[0][0] >= 1.5 else ""
    out = []
    for i in items[:60]:
        call = call_for(i["name"])
        out.append({"id": i["id"], "name": i["name"], "session": i["start"][:16].replace("T", " "), "tag": i["tag"], "done": i["done"], "note": i["note"],
                    "call": ("/?" + urllib.parse.urlencode({"person": call})) if call else "", "aloware": i.get("aloware", "")})
    return {"page": "#followup", "open": sum(1 for i in items if not i.get("done")), "done": done, "items": out}


def followup_update(a):
    from . import files
    data = _run(files.followups_get, "/api/followups")
    hit = next((i for i in data["items"] if i["id"] == a.get("id") or _needle_match(i, str(a.get("name", "")), "name")), None)
    if not hit:
        raise ValueError("no follow-up matches that id/name")
    for k in ("done", "note"):
        if k in a:
            hit[k] = a[k]
    _run(files.followups_save, "/api/followups", data)
    return {"updated": hit["name"], "done": hit["done"], "note": hit["note"]}


def networking_list(a):
    """Content -> Collab & networking: people to reach out to / talk ideas through, with what was discussed and a status
    (todo = to reach out, sent = messaged, talked). Dates Stefan writes in the topic (e.g. "16/10") say when they talked."""
    names = {"todo": "to reach out", "sent": "messaged", "talked": "talked"}
    people = (records.load_record("networking") or {}).get("people", [])
    return {"page": "#content", "people": [{"name": p.get("name", ""), "where": p.get("where", ""), "topic": p.get("topic", ""),
                                            "status": names.get(p.get("status"), p.get("status", "")), "added": p.get("added", "")} for p in people[:100]]}


def workouts_list(a):
    """The Tracker's Workouts log (what was lifted / done): one row per exercise per day, newest first."""
    since = _date(a.get("since"), (dt.date.fromisoformat(_today()) - dt.timedelta(days=int(a.get("days") or 7))).isoformat())
    rows = [e for e in (records.load_record("workouts") or {}).get("entries", []) if str(e.get("date", "")) >= since]
    rows.sort(key=lambda e: (e.get("date", ""), e.get("added", 0)), reverse=True)
    return {"page": "#tracker", "since": since, "entries": [{k: e.get(k, "") for k in ("date", "exercise", "sets", "reps", "weight", "minutes", "note")} for e in rows[:80]]}


def tracker_read(a):
    metrics = store.load_metrics()
    m = store.find_metric(metrics, str(a["metric"])) if a.get("metric") else None
    if a.get("metric") and not m:
        raise ValueError("no such tracker; trackers: " + ", ".join(x["name"] for x in metrics if not x.get("archived")))
    since = _date(a.get("since"), (dt.date.fromisoformat(_today()) - dt.timedelta(days=int(a.get("days") or 7))).isoformat())
    days = {}
    for e in store.load_entries():
        if e["date"] >= since and (not m or e["metric"] == m["id"]):
            days.setdefault(e["metric"], {}).setdefault(e["date"], []).append(e["value"])
    by_id = {x["id"]: x for x in metrics}
    out = {}
    for mid, per in days.items():
        agg = by_id.get(mid, {}).get("agg", "sum")
        f = (lambda v: sum(v) / len(v)) if agg == "avg" else (lambda v: v[-1]) if agg == "last" else (lambda v: 1 if any(v) else 0) if agg == "any" else sum
        out[by_id.get(mid, {}).get("name", mid)] = {d: round(f(v), 2) for d, v in sorted(per.items())}
    return {"page": "#tracker", "today": _today(), "since": since, "values": out, "trackers": [x["name"] for x in metrics if not x.get("archived")] if not m else None}


def tracker_log(a):
    m = store.find_metric(store.load_metrics(), str(a.get("metric", "")))
    if not m:
        raise ValueError("no such tracker")
    value, date = float(a["value"]), _date(a.get("date"))
    if m.get("type") == "rating" and not 1 <= value <= 10:
        raise ValueError(f"{m['name']} must be 1-10")
    if str(a.get("mode", "add")) == "set":
        store.set_day(m["id"], date, value, note="Voice command")
    else:
        store.add_entry(m["id"], value, date, "Voice command", source="voice")
    return {"tracker": m["name"], "date": date, "mode": a.get("mode", "add"), "value": value}


_COLOR_NAMES = {"1": "lavender", "2": "sage", "3": "grape", "4": "flamingo", "5": "banana", "6": "tangerine", "7": "peacock", "8": "graphite", "9": "blueberry", "10": "basil", "11": "tomato"}
_FOLLOW_RE = re.compile(r"follow[\s-]?ups?|\bFU\b|\bF/U\b", re.I)


def calendar_day(a):
    """Stefan's Google Calendar for a day. followUp=true: a follow-up booked or marked there (flamingo = his "follow up" call colour,
    or "follow up" / "FU" in the title) -- so "follow ups today" means the Follow up tab AND these."""
    r = _run(day.day_events, "/api/day-events?" + _q(date=_date(a.get("date"), calendar=True)))
    fu = lambda title, color: color == "4" or bool(_FOLLOW_RE.search(title or ""))
    whole = day._run(["followups", "--date", r["date"]])   # the whole day: his "FU: Name" reminders sit at ~3:30am, before the 8am window
    return {"date": r["date"], "followUps": whole.get("items", []) if "error" not in whole else [], "followUpsError": whole.get("error"),
            "page": "#today", "events": [{"id": e["id"], "title": e["title"], "start": e["start"], "end": e["end"], "done": e["checked"], "url": e.get("url", ""),
                        "color": _COLOR_NAMES.get(str(e.get("colorId") or ""), "default"), "followUp": fu(e["title"], str(e.get("colorId") or ""))} for e in r["events"]],
            "calls": [{"name": c["name"], "time": c["time"], "url": c.get("url", ""), "aloware": c.get("aloware", ""), "color": _COLOR_NAMES.get(str(c.get("colorId") or ""), "default"),
                       "followUp": fu(c.get("title", ""), str(c.get("colorId") or ""))} for c in r.get("calls", [])]}


def calendar_create(a):
    r = day.create_calendar_event(str(a["title"])[:120], _date(a.get("date"), calendar=True), str(a["start"]), int(a.get("minutes") or 30), str(a.get("color") or "9"))
    if r.get("error"):
        raise ValueError(r["error"])
    return {"title": r.get("title"), "start": r.get("start"), "end": r.get("end"), "link": r.get("link", "")}


def todo_add(a):
    doc = records.load_record("todos")
    doc.setdefault("items", []).insert(0, {"id": uuid.uuid4().hex[:10], "text": str(a["text"]).strip(), "done": False, "created": int(time.time())})
    records.save_record("todos", doc)
    return {"added": a["text"]}


def todos_list(a):
    return [{"id": i["id"], "text": i["text"], "done": i.get("done", False)} for i in records.load_record("todos").get("items", [])[:60]]


def leadgen_list(a):
    return records.load_record("leadgen")["leads"]


def leadgen_add(a):
    doc = records.load_record("leadgen")
    lead = {"id": "lead-" + uuid.uuid4().hex[:8], "source": a.get("source", ""), "name": str(a["name"]), "link": a.get("link", ""), "lastContact": a.get("lastContact", ""), "followUp": a.get("followUp", "")}
    doc["leads"].append(lead)
    records.save_record("leadgen", doc)
    return lead


def leadgen_update(a):
    doc = records.load_record("leadgen")
    hit = next((l for l in doc["leads"] if l["id"] == a.get("id") or _needle_match(l, str(a.get("name", "")), "name")), None)
    if not hit:
        raise ValueError("no lead matches that id/name")
    for k in ("source", "link", "lastContact", "followUp", "name_new"):
        if k in a:
            hit["name" if k == "name_new" else k] = a[k]
    records.save_record("leadgen", doc)
    return hit


def buffers_get(a):
    return _run(buffers.buffers_get, "/api/buffers")


def buffers_set(a):
    return _run(buffers.buffers_set, "/api/buffers-set?" + _q(mode=str(a.get("mode", "")).lower()))


def purchases_list(a):
    from . import files
    d = _run(files.purchase_list_get, "/api/purchase-list")
    return {"title": d["title"], "custom_items": d["items"], "stars": d["stars"], "note": "stars 1-4; ids starting p are built-in items"}


def purchase_add(a):
    from . import files
    d = _run(files.purchase_list_get, "/api/purchase-list")
    pid = uuid.uuid4().hex[:13]
    d["items"].append({"id": pid, "text": str(a["text"])})
    d["order"].append(pid)
    if a.get("stars"):
        d["stars"][pid] = int(a["stars"])
    _run(files.purchase_list_save, "/api/purchase-list", d)
    return {"added": a["text"], "stars": a.get("stars")}


def agreement_prepare(a):
    """Matches a calendar event to a prospect and an agreement link, and drafts the message. Sending stays manual (nothing is sent)."""
    events = calendar_day({"date": a.get("date")})
    q = str(a.get("event", "")).lower()
    ev = next((e for e in events["events"] if q and q in e["title"].lower()), None) or next((c for c in events["calls"] if q and q in c["name"].lower()), None)
    products = records.load_record("agreements")["products"]
    pq = str(a.get("product", "")).lower()
    prod = next((p for p in products if pq and pq in p["name"].lower()), None)
    if not ev:
        raise ValueError("no calendar event/call that day matches " + repr(a.get("event")))
    if not prod or not prod.get("url"):
        raise ValueError("no agreement product with a link matches; products: " + ", ".join(f"{p['name']} ({'link set' if p['url'] else 'no link yet'})" for p in products))
    who = ev.get("name") or ev.get("title")
    return {"prospect": who, "event": ev, "agreement": prod["name"], "link": prod["url"], "notes": prod["notes"],
            "draft": f"Hi {who.split()[0]}, here's your agreement: {prod['url']}", "sent": False,
            "note": "Draft only: nothing has been sent. Stefan sends it himself."}


def agreements_list(a):
    return [{"name": p["name"], "has_link": bool(p["url"]), "notes": p["notes"]} for p in records.load_record("agreements")["products"]]


# ---- added Oct 23 2026: move-forward markers, Travel, Travel Contacts, Identity Lab, CalendarSync ----
def _day(v):
    """'today' / 'tomorrow' / 'YYYY-MM-DD' -> YYYY-MM-DD (default today)."""
    v = str(v or "today").strip().lower()
    base = dt.date.today()
    if v in ("", "today"):
        return base.isoformat()
    if v == "tomorrow":
        return (base + dt.timedelta(days=1)).isoformat()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        return v
    raise ValueError("date must be today, tomorrow or YYYY-MM-DD")


MOVEUP_WORDS = {"pending": "pending", "??": "pending", "not texted": "pending", "texted": "texted", "sent": "texted",
                "yes": "accepted", "accepted": "accepted", "accept": "accepted", "no": "declined", "declined": "declined", "decline": "declined",
                "na": "na", "n/a": "na", "not applicable": "na", "doesn't apply": "na", "does not apply": "na", "remove": "none", "none": "none"}


def moveup_list(a):
    import aloware_today
    out = []
    for d in ([_day(a["date"])] if a.get("date") else [_day("today"), _day("tomorrow")]):
        for c in aloware_today.plan(d)["calls"]:
            out.append({"date": d, "time": c["time"], "name": c["name"], "moveUp": c.get("moveUp") or "no marker", "id": c["id"]})
    return out


def moveup_set(a):
    import aloware_today
    status = MOVEUP_WORDS.get(str(a.get("status", "")).strip().lower())
    if not status:
        raise ValueError("status must be one of: ??/pending, texted, yes/accepted, no/declined, na (doesn't apply), remove")
    needle = " ".join(str(a.get("name", "")).lower().split())
    hits = [c for c in moveup_list({"date": a["date"]} if a.get("date") else {}) if needle and needle in c["name"].lower()]
    if not hits:
        raise ValueError(f"no call today or tomorrow matches '{a.get('name')}'")
    if len({h["id"] for h in hits}) > 1:
        raise ValueError("more than one call matches: " + ", ".join(f"{h['name']} {h['date']} {h['time']}" for h in hits) + " (give the full name or the date)")
    aloware_today._calendar(None, "moveup-set", ["--call", hits[0]["id"], "--status", status])
    import mvfwd_stats
    mvfwd_stats.record(hits[0]["id"], status, hits[0]["name"], hits[0]["date"])
    return {"name": hits[0]["name"], "date": hits[0]["date"], "time": hits[0]["time"],
            "now": {"pending": "?? MVFWD", "texted": "texted MVFWD", "accepted": "yes MVFWD", "declined": "no MVFWD", "na": "NA MVFWD", "none": "marker removed"}[status]}


def moveup_closed(a):
    import mvfwd_stats
    r = mvfwd_stats.mark_closed(name=str(a.get("name", "")))
    return {"name": r.get("name"), "closed": r.get("closed"), **({"note": r["note"]} if r.get("note") else {}), "totals": {k: v for k, v in mvfwd_stats.summary().items() if k != "calls"}}


def moveup_stats(a):
    import mvfwd_stats
    return mvfwd_stats.summary()


def travel_list(a):
    city = str(a.get("city", "")).lower()
    return [{k: p.get(k, "") for k in ("title", "city", "price", "currency", "per", "sqm", "notes", "url", "fav")}
            for p in (records.load_record("travel") or {}).get("places", []) if not city or city in str(p.get("city", "")).lower()]


def travel_add(a):
    url = str(a.get("link", "")).strip()
    if not re.match(r"^https?://", url):
        raise ValueError("need the rental's link (https://...)")
    title, image = "", ""
    try:
        from . import link_title
        page = link_title._get(url)
        m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', page, re.I) or re.search(r"<title[^>]*>(.*?)</title>", page, re.I | re.S)
        title = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        im = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', page, re.I)
        image = im.group(1) if im else ""
    except Exception:
        pass
    doc = records.load_record("travel")
    place = {"id": uuid.uuid4().hex[:10], "url": url, "title": title or urllib.parse.urlparse(url).hostname or url, "image": image, "city": a.get("city", ""),
             "price": str(a.get("price", "")), "per": a.get("per", "month"), "currency": a.get("currency", "€"), "sqm": str(a.get("sqm", "")),
             "notes": a.get("notes", ""), "fav": False, "added": dt.datetime.now().isoformat(timespec="seconds")}
    doc.setdefault("places", []).insert(0, place)
    records.save_record("travel", doc)
    return place


def travel_contacts_list(a):
    cat, city = str(a.get("category", "")).lower(), str(a.get("city", "")).lower()
    return [{k: c.get(k, "") for k in ("name", "category", "other", "city", "phone", "fb", "ig", "price", "currency", "notes")}
            for c in (records.load_record("travelcontacts") or {}).get("contacts", [])
            if (not cat or cat in (str(c.get("category", "")) + " " + str(c.get("other", ""))).lower()) and (not city or city in str(c.get("city", "")).lower())]


def travel_contact_add(a):
    if not str(a.get("name", "")).strip():
        raise ValueError("need a name")
    cat = str(a.get("category", "other")).lower()
    known = ("cleaner", "chef", "assistant", "driver", "networking")
    doc = records.load_record("travelcontacts")
    c = {"id": uuid.uuid4().hex[:10], "name": str(a["name"]).strip(), "category": cat if cat in known else "other", "other": "" if cat in known else cat,
         "city": a.get("city", ""), "phone": a.get("phone", ""), "fb": a.get("fb", ""), "ig": a.get("ig", ""), "price": str(a.get("price", "")),
         "currency": a.get("currency", "€"), "notes": a.get("notes", ""), "added": dt.datetime.now().isoformat(timespec="seconds")}
    doc.setdefault("contacts", []).insert(0, c)
    records.save_record("travelcontacts", doc)
    return c


def identity_lab_status(a):
    doc = records.load_record("identitylab") or {}
    sessions = [s for s in doc.get("sessions", []) if s.get("done")]
    last = sessions[0] if sessions else None
    return {"target": doc.get("target"), "sessionsDone": len(sessions),
            "lastSession": last and {"date": last["date"], "commitment": last.get("commitment"), "practised": last.get("practised") or "not answered yet",
                                     "endings": sum(len([e for e in s.get("endings", []) if e]) for s in last.get("stems", []))},
            "doneToday": any(s["date"] == dt.date.today().isoformat() for s in sessions)}


def calsync_status(a):
    from . import calendar_sync as cs
    cfg, state = cs._read(cs.CONFIG_PATH, {}), cs._read(cs.STATE_PATH, {})
    labels = {c["key"]: c.get("label") or c["id"] for c in cfg.get("calendars", [])}
    rules = [f"{labels.get(k.split('>')[0])} -> {labels.get(k.split('>')[1])}: {r.get('mode')}{' (demo)' if r.get('demo') else ''}"
             for k, r in (cfg.get("rules") or {}).items() if r.get("on")]
    last = state.get("lastRun") or {}
    return {"on": bool(cfg.get("enabled")), "calendars": list(labels.values()), "directions": rules,
            "lastSync": last.get("at"), "lastResult": last.get("done") or last.get("planned"), "errors": last.get("errors", [])[:3]}


def _t(name, kind, doc, args, fn):
    return {"name": name, "kind": kind, "description": doc, "args": args, "fn": fn}


TOOLS = {t["name"]: t for t in [
    _t("navigate", "read", "Open a page/tab in Call Studio.", {"page": "tab name, e.g. 'tracker', 'lead gen', 'swipe gallery', 'buffers'"}, navigate),
    _t("transcripts_search", "read", "Search every call transcript for words.", {"query": "words/phrase", "section": "optional call section name", "closer": "optional closer name"}, transcripts_search),
    _t("books_search", "read", "Search the uploaded books.", {"query": "words", "book": "optional book id (default all)"}, books_search),
    _t("swipe_list", "read", "List swipe gallery items.", {"limit": "optional"}, swipe_list),
    _t("swipe_add", "write", "Add a link to the Swipe Gallery. Instagram/TikTok/YouTube/Facebook links download the video; other links (or placeholder_only) save a placeholder.", {"link": "url", "title": "optional", "placeholder_only": "optional bool"}, swipe_add),
    _t("followups_list", "read", "People in the Follow up tab (open ones by default; open_only=false for all). For follow-ups on a given day ALSO call calendar_day for that day.", {"open_only": "optional bool"}, followups_list),
    _t("followup_update", "write", "Tick or annotate a follow-up.", {"name": "partial name (or id)", "id": "optional", "done": "bool", "note": "text"}, followup_update),
    _t("networking_list", "read", "Collab & networking list: people he talks ideas through / reaches out to, what was discussed, status (to reach out / messaged / talked). Check it for 'who did I talk with'.", {}, networking_list),
    _t("workouts_list", "read", "Workouts log (Tracker -> Workouts): exercise, sets, reps, weight kg, minutes per day. 'workout'/'train'/'gym' means this.", {"days": "how many days back (default 7)", "since": "optional YYYY-MM-DD"}, workouts_list),
    _t("tracker_read", "read", "Tracker values per day (steps, calories, approaches, calls...). Omit metric to list all.", {"metric": "optional name", "days": "how many days back (default 7)", "since": "optional YYYY-MM-DD"}, tracker_read),
    _t("tracker_log", "write", "Add to (mode add) or set the day's total (mode set) for a tracker.", {"metric": "name", "value": "number", "date": "today|yesterday|YYYY-MM-DD", "mode": "add|set"}, tracker_log),
    _t("calendar_day", "read", "Google Calendar events and booked calls for a day, with colour. followUps = that whole day's calendar follow-ups ('FU: Name' events, flamingo calls).", {"date": "today|tomorrow|YYYY-MM-DD"}, calendar_day),
    _t("calendar_create", "write", "Create a calendar event on Stefan's own calendar.", {"title": "", "date": "today|tomorrow|YYYY-MM-DD", "start": "HH:MM 24h", "minutes": "default 30"}, calendar_create),
    _t("todo_add", "write", "Add a task to the Home to-do list.", {"text": ""}, todo_add),
    _t("todos_list", "read", "The Home to-do list.", {}, todos_list),
    _t("leadgen_list", "read", "Lead Gen tab: every lead.", {}, leadgen_list),
    _t("leadgen_add", "write", "Add a lead.", {"name": "", "source": "Facebook|Instagram|WhatsApp|...", "link": "", "lastContact": "YYYY-MM-DD", "followUp": "YYYY-MM-DD"}, leadgen_add),
    _t("leadgen_update", "write", "Update a lead found by id or partial name.", {"name": "partial name to find", "id": "", "link": "", "source": "", "lastContact": "", "followUp": "", "name_new": "rename"}, leadgen_update),
    _t("buffers_get", "read", "Whether auto-buffering is on and the calls-in-a-row limit.", {}, buffers_get),
    _t("buffers_set", "write", "Change buffering: off, or the max calls in a row (2, 3 or 4).", {"mode": "off|2|3|4"}, buffers_set),
    _t("purchases_list", "read", "Purchases list (custom items and star priorities).", {}, purchases_list),
    _t("purchase_add", "write", "Add an item to the Purchases list.", {"text": "e.g. 'Monitor – $320'", "stars": "optional 1-4"}, purchase_add),
    _t("moveup_list", "read", "Today's and tomorrow's calls with their 'move it forward' (MVFWD) text status: pending (??), texted, accepted (yes), declined (no) or no marker.", {"date": "optional: today, tomorrow or YYYY-MM-DD (default both)"}, moveup_list),
    _t("moveup_set", "write", "Set a call's move-forward (MVFWD) status after he texts a prospect to bring the call forward. 'texted X' -> texted, 'X accepted / said yes' -> yes, 'X declined / said no' -> no, 'X NA / doesn't apply' -> na. Makes the calendar marker if there isn't one.", {"name": "the prospect's name (part is fine)", "status": "??, texted, yes, no, na or remove", "date": "optional: today, tomorrow or YYYY-MM-DD"}, moveup_set),
    _t("moveup_closed", "write", "A call he moved forward has closed: count it in the Tracker's 'MVFWD closes'. Only when he says so.", {"name": "the prospect's name (part is fine)"}, moveup_closed),
    _t("moveup_stats", "read", "Move-forward totals: how many asked, accepted (moved forward), declined and closed, with the calls.", {}, moveup_stats),
    _t("travel_list", "read", "Travel tab: the shortlist of rentals (title, city, price per night/week/month, m², notes, link).", {"city": "optional"}, travel_list),
    _t("travel_add", "write", "Add a rental link (Airbnb, Booking, any site) to the Travel tab; it fetches the title and photo.", {"link": "url", "city": "optional", "price": "optional number", "per": "optional: night/week/month/total", "sqm": "optional", "notes": "optional"}, travel_add),
    _t("travel_contacts_list", "read", "Travel Contacts tab: cleaners, chefs, assistants, drivers, networking contacts (phone, Facebook, Instagram, price per hour, notes).", {"category": "optional", "city": "optional"}, travel_contacts_list),
    _t("travel_contact_add", "write", "Add someone to Travel Contacts.", {"name": "their name", "category": "cleaner/chef/assistant/driver/networking or another word", "city": "optional", "phone": "optional", "ig": "optional @handle", "fb": "optional", "price": "optional per hour", "notes": "optional"}, travel_contact_add),
    _t("identity_lab_status", "read", "Identity Lab (daily sentence completion): his identity target, sessions done, whether today's is done, and the last action commitment and whether he practised it.", {}, identity_lab_status),
    _t("calsync_status", "read", "CalendarSync: on/off, which calendars, which directions with which privacy level, and the last sync's result.", {}, calsync_status),
    _t("agreements_list", "read", "Agreement products and whether each has a link.", {}, agreements_list),
    _t("agreement_prepare", "write", "Match a calendar event/call to a prospect + agreement product and DRAFT the message. Never sends.", {"event": "part of the event/prospect name", "product": "part of the agreement product name", "date": "optional, default today"}, agreement_prepare),
]}


def describe():
    return [{k: t[k] for k in ("name", "kind", "description", "args")} for t in TOOLS.values()]


def call(name, args):
    t = TOOLS.get(name)
    if not t:
        return {"ok": False, "error": f"unknown tool {name!r}"}
    try:
        return {"ok": True, "result": t["fn"](args if isinstance(args, dict) else {})}
    except (ValueError, KeyError, TypeError) as exc:
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}


def agent_tools(handler):
    handler._json(200, {"tools": describe()})


def agent_call(handler):
    try:
        body = json.loads(handler._read_body() or b"{}")
    except ValueError:
        handler._json(400, {"error": "invalid JSON"})
        return
    handler._json(200, call(str(body.get("tool", "")), body.get("args") or {}))
