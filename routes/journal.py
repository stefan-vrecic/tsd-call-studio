"""Journal tab: pictures of journal pages, grouped by day. Stored only on this Mac: live_docs/journal/<YYYY-MM-DD>/<id>.<ext>
(the folder name is the day, so the filesystem is the whole database and the pictures can be opened in Finder too).
  GET  /api/journal                              -> {"days": [{"date", "images": [{"id", "url"}]}]}, newest day first, pages in the day's saved order (default: the order added)
  POST /api/journal-order?date=..&id=..&pos=N    puts a picture at page N of its day (1 = first); the day's order is kept in <day>/_order.json
  GET  /journal-img/<date>/<file>                -> one picture
  POST /api/journal-add?date=YYYY-MM-DD          raw image bytes (Content-Type: image/...)
  POST /api/journal-move?date=..&id=..&to=..     moves a picture to another day
  POST /api/journal-delete?date=..&id=..         deletes a picture
  POST /api/journal-typed?date=..[&id=..]        a TYPED page: {"text", "image": "data:image/png;base64,..."} -- the page is drawn in the browser as
                                                 a notebook-page picture (journal-typed.js) and stored like a photo, with its text beside it in
                                                 <id>.txt so it can be edited and redrawn (id given = replace that page's picture + text)"""
import json
import os
import re
import shutil
import time
import urllib.parse
import uuid

import config
import util

IMG_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/heic": ".heic"}
MAX_IMAGE = 40 * 1024 * 1024
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
FILE_RE = re.compile(r"[0-9a-f]{20}\.\w{3,4}")


def _root():
    d = os.path.join(config.LIVE_DOCS_DIR, "journal")
    os.makedirs(d, exist_ok=True)
    return d


def _args(handler):
    return {k: v[0] for k, v in util.query(handler).items()}


def _not_found(handler):
    handler.send_response(404)
    handler.send_header("Content-Length", "0")
    handler.end_headers()


def _day_names(folder):
    """The day's picture files in page order: the saved order first, anything not in it (newly added) after, by name = by time added."""
    names = sorted(f for f in os.listdir(folder) if FILE_RE.fullmatch(f))
    try:
        with open(os.path.join(folder, "_order.json")) as f:
            saved = [n for n in json.load(f) if n in names]
    except (OSError, ValueError, TypeError):
        saved = []
    return saved + [n for n in names if n not in saved]


def _entry(root, date, name):
    """one page for the list; a typed page carries its text (from the <id>.txt beside it) so it can be edited"""
    out = {"id": name, "url": f"/journal-img/{date}/{name}?v={int(os.path.getmtime(os.path.join(root, date, name)))}"}
    side = os.path.join(root, date, name + ".txt")
    if os.path.isfile(side):
        with open(side, encoding="utf-8") as f:
            out["text"] = f.read()
        out["typed"] = True
    return out


def journal_typed(handler):
    import base64
    a = _args(handler)
    date, page_id = a.get("date", ""), a.get("id", "")
    try:
        body = json.loads(handler._read_body().decode("utf-8") or "{}")
    except ValueError:
        body = {}
    text, image = str(body.get("text") or ""), str(body.get("image") or "")
    if not DATE_RE.fullmatch(date) or not image.startswith("data:image/png;base64,"):
        handler._json(400, {"error": "need date=YYYY-MM-DD and the page picture"})
        return
    png = base64.b64decode(image.split(",", 1)[1])
    if len(png) > MAX_IMAGE or len(text) > 50000:
        handler._json(413, {"error": "that page is too big"})
        return
    folder = os.path.join(_root(), date)
    os.makedirs(folder, exist_ok=True)
    if page_id:   # editing: same file name, so it keeps its place in the day
        if not FILE_RE.fullmatch(page_id) or not os.path.isfile(os.path.join(folder, page_id)) or not page_id.endswith(".png"):
            handler._json(404, {"error": "that typed page isn't there any more"})
            return
        name = page_id
    else:
        name = f"{int(time.time() * 1000):012x}{uuid.uuid4().hex[:8]}.png"
    with open(os.path.join(folder, name), "wb") as f:
        f.write(png)
    with open(os.path.join(folder, name + ".txt"), "w", encoding="utf-8") as f:
        f.write(text)
    handler._json(200, {"id": name, "date": date})


def journal_list(handler):
    root = _root()
    days = []
    for date in sorted((d for d in os.listdir(root) if DATE_RE.fullmatch(d)), reverse=True):
        names = _day_names(os.path.join(root, date))
        if names:
            days.append({"date": date, "images": [_entry(root, date, n) for n in names]})
    handler._json(200, {"days": days})


def journal_image(handler):
    parts = urllib.parse.unquote(urllib.parse.urlparse(handler.path).path[len("/journal-img/"):]).split("/")
    if len(parts) != 2 or not DATE_RE.fullmatch(parts[0]) or not FILE_RE.fullmatch(parts[1]) or not os.path.isfile(os.path.join(_root(), *parts)):
        _not_found(handler)
        return
    ctype = next((t for t, e in IMG_TYPES.items() if parts[1].endswith(e)), "application/octet-stream")
    with open(os.path.join(_root(), *parts), "rb") as f:
        body = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", ctype)
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "max-age=86400")
    handler.end_headers()
    handler.wfile.write(body)


def journal_add(handler):
    date = _args(handler).get("date", "")
    body = handler._read_body()
    if not DATE_RE.fullmatch(date):
        handler._json(400, {"error": "date must be YYYY-MM-DD"})
        return
    if not body or len(body) > MAX_IMAGE:
        handler._json(413 if body else 400, {"error": "image missing or bigger than 40 MB"})
        return
    ext = IMG_TYPES.get(handler.headers.get("Content-Type", "").split(";")[0].strip().lower())
    if not ext:
        handler._json(415, {"error": "not a picture type I can store"})
        return
    folder = os.path.join(_root(), date)
    os.makedirs(folder, exist_ok=True)
    name = f"{int(time.time() * 1000):012x}{uuid.uuid4().hex[:8]}{ext}"   # starts with the time added, so pages sort in the order they were added
    with open(os.path.join(folder, name), "wb") as f:
        f.write(body)
    handler._json(200, {"id": name, "date": date})


def _target(handler):
    a = _args(handler)
    if not DATE_RE.fullmatch(a.get("date", "")) or not FILE_RE.fullmatch(a.get("id", "")):
        return None, a
    path = os.path.join(_root(), a["date"], a["id"])
    return (path if os.path.isfile(path) else None), a


def journal_move(handler):
    path, a = _target(handler)
    if not path or not DATE_RE.fullmatch(a.get("to", "")):
        handler._json(400, {"error": "need a picture and a to=YYYY-MM-DD day"})
        return
    folder = os.path.join(_root(), a["to"])
    os.makedirs(folder, exist_ok=True)
    shutil.move(path, os.path.join(folder, a["id"]))
    if os.path.isfile(path + ".txt"):   # a typed page's text goes with it
        shutil.move(path + ".txt", os.path.join(folder, a["id"] + ".txt"))
    handler._json(200, {"ok": True})


def journal_delete(handler):
    path, _ = _target(handler)
    if not path:
        handler._json(404, {"error": "not found"})
        return
    os.remove(path)
    if os.path.isfile(path + ".txt"):
        os.remove(path + ".txt")
    handler._json(200, {"ok": True})


def journal_order(handler):
    path, a = _target(handler)
    if not path or not a.get("pos", "").isdigit():
        handler._json(400, {"error": "need date, id and pos=N (page number, 1 = first)"})
        return
    folder = os.path.join(_root(), a["date"])
    names = [n for n in _day_names(folder) if n != a["id"]]
    names.insert(min(max(int(a["pos"]), 1) - 1, len(names)), a["id"])
    with open(os.path.join(folder, "_order.json"), "w") as f:
        json.dump(names, f)
    handler._json(200, {"ok": True, "order": names})
