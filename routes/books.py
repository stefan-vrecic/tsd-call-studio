"""Resources tab -> 📖 Books and 🎬 Videos (static/js/shelf.js): titles, each with bullet-point notes (optional page # / time).
One JSON file per shelf in live_docs/: books.json {"books": [...]} and videos.json {"videos": [...]}, items
{"id", "title", "url" (videos), "category" (general / sales), "open", "read" (read / watched), "cover" (a tiny data: image, or ""), "notes": [{"id", "text", "page"}],
 "typedPages": [{"id", "date", "text"}]}.
The page saves the whole list at once."""
import json
import os
import uuid

import config
import util

_id = lambda: uuid.uuid4().hex[:10]
SHELVES = {
    "books": {"path": os.path.join(config.LIVE_DOCS_DIR, "books.json"),
              "first": [{"id": _id(), "title": "John Kehoe – Mind Power", "open": True, "notes": []}]},
    "videos": {"path": os.path.join(config.LIVE_DOCS_DIR, "videos.json"),
               "first": [{"id": _id(), "title": "21 Words That Control the Mind: NLP Language Patterns for Influence",
                          "url": "https://www.youtube.com/watch?v=s5SYkYq-xM0&t=2524s", "open": False, "notes": []}]},
}


def _get(handler, key):
    shelf = SHELVES[key]
    data = {key: shelf["first"]}
    if os.path.isfile(shelf["path"]):
        try:
            with open(shelf["path"], encoding="utf-8") as f:
                data = json.load(f)
        except ValueError:
            pass
    handler._json(200, data)


def _save(handler, key):
    """POST the whole {key: [...]}: replaces the file (kept tidy: only the known fields)."""
    body = handler._read_body()
    if len(body) > 2_000_000:
        handler._json(413, {"error": "too much (2 MB max)"})
        return
    try:
        items = json.loads(body.decode("utf-8")).get(key)
        assert isinstance(items, list)
        clean = []
        for b in items:
            url = str(b.get("url") or "")[:1000]
            category = str(b.get("category") or "")
            if category not in ("general", "sales"):
                category = "sales" if "fathom.video" in url.lower() else "general"
            item = {"id": str(b.get("id") or _id())[:20], "title": str(b.get("title") or "Untitled")[:200],
                    "url": url if url.startswith(("http://", "https://")) else "",
                    "open": bool(b.get("open")), "read": bool(b.get("read")), "takeaways": str(b.get("takeaways") or "")[:20000],
                    "cover": b["cover"] if str(b.get("cover") or "").startswith("data:image/") and len(b["cover"]) < 300_000 else "",
                    "typedPages": [{"id": str(p.get("id") or _id())[:20],
                                    "date": str(p.get("date") or "")[:10],
                                    "text": str(p.get("text") or "")[:50000],
                                    "group": str(p.get("group") or "")[:20],      # pages split from one note share a group
                                    "source": str(p.get("source") or "")[:100000]}   # ... and its first page keeps the note's whole text
                                   for p in (b.get("typedPages") or [])[:100]
                                   if isinstance(p, dict) and str(p.get("text") or "").strip()],
                    "notes": [{"id": str(n.get("id") or _id())[:20], "text": str(n.get("text") or "")[:5000],
                               "page": str(n.get("page") or "")[:12]} for n in (b.get("notes") or [])]}
            if key == "videos":
                item["category"] = category
            clean.append(item)
    except (ValueError, AttributeError, AssertionError, TypeError):
        handler._json(400, {"error": "expected {\"%s\": [...]}" % key})
        return
    path = SHELVES[key]["path"]
    util.write_json(path, {key: clean}, ensure_ascii=False, indent=1)
    handler._json(200, {"ok": True})


def books_get(handler):
    _get(handler, "books")


def books_save(handler):
    _save(handler, "books")


def videos_get(handler):
    _get(handler, "videos")


def videos_save(handler):
    _save(handler, "videos")
