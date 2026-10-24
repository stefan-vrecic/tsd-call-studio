"""The Content tab's swipe gallery: screenshots of other people's posts/stories (and links) you want to respond to, each with
your own response written next to it. Items live in live_docs/swipe.json, images in live_docs/swipe/.
An item can also hold a VIDEO (an uploaded file: POST /api/swipe-add with Content-Type video/..., or POST /api/swipe-video?id=... to attach/replace one), or be a
placeholder for a video you haven't got yet: a link item with "waiting": true (e.g. an Instagram reel link). Attaching the video clears "waiting".
An item can hold SEVERAL pictures (a story with 5 slides): "image" is the cover, "images" lists them all (cover first); POST /api/swipe-attach adds one."""
import json
import os
import re
import shutil
import subprocess
import threading
import time
import urllib.parse
import uuid

import config
import util

IMG_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/heic": ".heic"}
MAX_IMAGE = 25 * 1024 * 1024
VIDEO_TYPES = {"video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm", "video/x-m4v": ".m4v"}
MAX_VIDEO = 700 * 1024 * 1024
FIELDS = ("title", "source", "link", "response")
YTDLP = shutil.which("yt-dlp") or "/opt/homebrew/bin/yt-dlp"
# picture posts (an Instagram carousel, a photo) have no video for yt-dlp: gallery-dl fetches their images instead, signed in with
# Firefox's Instagram cookies (read-only; Instagram only shows carousel images to a signed-in browser). Added Oct 21 2026.
GALLERYDL = shutil.which("gallery-dl") or "/opt/homebrew/bin/gallery-dl"
IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".heic")
_PCT = re.compile(r"\[download\]\s+([\d.]+)%")
_LOCK = threading.RLock()
_DOWNLOADS = set()
_DOWNLOAD_HOSTS = ("instagram.com", "tiktok.com", "youtube.com", "youtu.be", "facebook.com", "fb.watch")


def _dir():
    d = os.path.join(config.LIVE_DOCS_DIR, "swipe")
    os.makedirs(d, exist_ok=True)
    return d


def _path():
    return os.path.join(config.LIVE_DOCS_DIR, "swipe.json")


def load():
    with _LOCK:
        try:
            with open(_path(), encoding="utf-8") as f:
                items = json.load(f).get("items", [])
            return [i for i in items if isinstance(i, dict) and i.get("id")]
        except (OSError, ValueError, AttributeError):
            return []


def save(items):
    with _LOCK:
        tmp = _path() + ".part"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"items": items}, f, ensure_ascii=False, indent=1)
        os.replace(tmp, _path())


def new_item(image=None, **fields):
    item = {"id": uuid.uuid4().hex[:12], "image": image, "added": int(time.time())}
    for k in FIELDS:
        item[k] = str(fields.get(k) or "")[:20000]
    return item


def _downloadable_url(url):
    try:
        host = (urllib.parse.urlsplit(url).hostname or "").lower()
    except ValueError:
        return False
    return any(host == h or host.endswith("." + h) for h in _DOWNLOAD_HOSTS)


def _change(item_id, fn):
    """Atomically change one item while a background download and browser edits may overlap."""
    with _LOCK:
        items = load()
        item = next((i for i in items if i.get("id") == item_id), None)
        if not item:
            return None
        fn(item)
        save(items)
        return item


def _download_state(item_id, stage, percent, message, **extra):
    def change(item):
        item["download"] = {"stage": stage, "percent": round(float(percent), 1), "message": message, **extra}
        item["waiting"] = stage != "done"
    return _change(item_id, change)


def _run_download(item_id, url):
    """Download a social post into the item's local media slot, updating swipe.json as yt-dlp reports progress."""
    template = os.path.join(_dir(), item_id + ".%(ext)s")
    args = [YTDLP, "-f", "bv*+ba/b", "--merge-output-format", "mp4", "--no-playlist", "--force-overwrites",
            "--ffmpeg-location", os.path.dirname(config.FFMPEG) or "/opt/homebrew/bin",
            "--progress", "--newline", "--no-simulate",
            "--print", "before_dl:CS_TITLE:%(title)s", "--print", "before_dl:CS_SOURCE:%(uploader)s",
            "--print", "after_move:CS_FILE:%(filepath)s", "-o", template, url]
    saved = title = source = ""
    last = ""
    try:
        _download_state(item_id, "reading", 0, "Reading link…")
        if not os.path.exists(YTDLP):
            raise RuntimeError("yt-dlp isn't installed on this Mac")
        proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                                bufsize=1, start_new_session=True)
        for raw in proc.stdout:
            line = raw.strip()
            if not line:
                continue
            if line.startswith("CS_TITLE:"):
                title = line[9:].strip()
            elif line.startswith("CS_SOURCE:"):
                source = line[10:].strip()
            elif line.startswith("CS_FILE:"):
                saved = line[8:].strip()
            else:
                m = _PCT.search(line)
                if m:
                    pct = min(95.0, float(m.group(1)) * .95)
                    _download_state(item_id, "downloading", pct, f"Downloading… {m.group(1)}%")
                elif line.startswith("[Merger]") or line.startswith("[VideoConvertor]"):
                    _download_state(item_id, "processing", 97, "Processing media…")
                last = line
        rc = proc.wait()
        if (rc != 0 or not saved) and re.search(r"no video formats|no video in|there is no video|unsupported url", last, re.I) and os.path.exists(GALLERYDL):
            _download_pictures(item_id, url)   # a picture post: get its images instead
            return
        if rc != 0 or not saved or not os.path.isfile(saved):
            raise RuntimeError(re.sub(r"^ERROR:\s*", "", last)[:400] or "The downloader didn't produce a media file")
        if os.path.getsize(saved) > MAX_VIDEO:
            os.remove(saved)
            raise RuntimeError("The downloaded video is bigger than 700 MB")

        def finish(item):
            old = item.get("video")
            if old and old != os.path.basename(saved):
                _drop_files(item, old)
            item["video"] = os.path.basename(saved)
            item.pop("waiting", None)
            if not item.get("title") and title:
                item["title"] = title[:20000]
            if not item.get("source") and source:
                item["source"] = source[:20000]
            item["download"] = {"stage": "done", "percent": 100, "message": "Saved locally ✓"}
        if not _change(item_id, finish):   # deleted from the gallery while it was downloading: do not leave an orphan file
            try:
                os.remove(saved)
            except OSError:
                pass
    except Exception as e:
        _download_state(item_id, "error", 0, str(e)[:500])
    finally:
        _DOWNLOADS.discard(item_id)


def _download_pictures(item_id, url):
    """A post with pictures instead of a video: every image (a carousel's slides, in order) becomes the item's pictures --
    "image" = the first, "images" = all of them -- and its caption / account fill in an empty title and source."""
    import json as _json
    import tempfile
    _download_state(item_id, "downloading", 30, "Getting the pictures…")
    with tempfile.TemporaryDirectory(prefix="cs-swipe-") as tmp:
        proc = subprocess.run([GALLERYDL, "--cookies-from-browser", "firefox", "--write-metadata", "-D", tmp, "-f", "{num:>03}.{extension}", url],
                              capture_output=True, text=True, timeout=300)
        files = sorted(f for f in os.listdir(tmp) if f.lower().endswith(IMG_EXTS))
        if not files:
            err = (proc.stderr or proc.stdout or "").strip().splitlines()
            raise RuntimeError("No pictures found in that post" + (": " + err[-1][:300] if err else ""))
        meta = {}
        for f in sorted(os.listdir(tmp)):
            if f.endswith(".json"):
                try:
                    with open(os.path.join(tmp, f), encoding="utf-8") as fh:
                        meta = _json.load(fh)
                    break
                except (OSError, ValueError):
                    pass
        names = []
        for k, f in enumerate(files, 1):
            name = f"{item_id}-{k:02d}{os.path.splitext(f)[1].lower()}"
            shutil.move(os.path.join(tmp, f), os.path.join(_dir(), name))
            names.append(name)
    who = str(meta.get("username") or meta.get("fullname") or "")
    caption = " ".join(str(meta.get("description") or "").split())

    def finish(item):
        for old in ([item.get("image")] if item.get("image") else []) + list(item.get("images") or []):
            if old not in names:
                _drop_files(item, old)
        item["image"], item["images"] = names[0], names
        item.pop("waiting", None)
        if not item.get("title"):
            item["title"] = (f"{'Carousel' if len(names) > 1 else 'Post'} by {who}" if who else "Instagram post")[:20000]
        if not item.get("source") and caption:
            item["source"] = caption[:20000]
        item["download"] = {"stage": "done", "percent": 100, "message": f"Saved locally ✓ ({len(names)} picture{'s' if len(names) != 1 else ''})"}
    if not _change(item_id, finish):   # deleted meanwhile: don't leave the files behind
        for n in names:
            try:
                os.remove(os.path.join(_dir(), n))
            except OSError:
                pass


def _start_download(item_id, url):
    if item_id in _DOWNLOADS:
        return
    _DOWNLOADS.add(item_id)
    threading.Thread(target=_run_download, args=(item_id, url), daemon=True).start()


def swipe_download(handler):
    """POST {link} to create and download a social-media item, or {id} to retry an existing item.
    {"via": "phone"} = it was shared from the phone (Track Sync · Gallery, through calendar-auto-buffer/steps_relay.py): the item
    remembers that ("via": "phone", "viaAt": when) and the gallery shows a 📱 From phone note on it."""
    try:
        data = json.loads(handler._read_body().decode("utf-8") or "{}")
    except ValueError:
        handler._json(400, {"error": "expected JSON"})
        return
    item_id = str(data.get("id") or "")
    via = "phone" if data.get("via") == "phone" else ""
    items = load()
    item = next((i for i in items if i.get("id") == item_id), None) if item_id else None
    url = str((item or {}).get("link") or data.get("link") or "").strip()
    if not _downloadable_url(url):
        handler._json(400, {"error": "Use an Instagram, TikTok, YouTube or Facebook link"})
        return
    if not item:
        existing = next((i for i in items if i.get("link") == url), None)
        if existing:
            item = existing
            item_id = item["id"]
            if via and not item.get("via"):   # shared again from the phone: note it on the one already saved
                _change(item_id, lambda i: i.update(via=via, viaAt=int(time.time())))
                item = next((i for i in load() if i["id"] == item_id), item)
            saved_media = item.get("video") or ((item.get("images") or [None])[0] if (item.get("download") or {}).get("stage") == "done" else None)
            if saved_media and os.path.isfile(os.path.join(_dir(), saved_media)):   # already downloaded (a video, or a carousel's pictures)
                handler._json(200, {"item": item, "duplicate": True})
                return
        else:
            item = new_item(link=url)
            item_id = item["id"]
            item["waiting"] = True
            if via:
                item["via"], item["viaAt"] = via, int(time.time())
            item["download"] = {"stage": "queued", "percent": 0, "message": "Queued…"}
            save([item] + items)
    _download_state(item_id, "queued", 0, "Queued…")
    _start_download(item_id, url)
    handler._json(200, {"item": next((i for i in load() if i["id"] == item_id), item)})


def add_image_file(data, ctype, **fields):
    """Stores the image bytes and puts a new item at the front. Returns the item."""
    ext = IMG_TYPES.get(ctype.split(";")[0].strip().lower(), ".jpg")
    item = new_item(**fields)
    name = item["id"] + ext
    with open(os.path.join(_dir(), name), "wb") as f:
        f.write(data)
    item["image"] = name
    save([item] + load())
    return item


def swipe_list(handler):
    """GET /api/swipe -> {"items": [...]}, newest first."""
    handler._json(200, {"items": load()})


def _local_path(item):
    name = item.get("video") or item.get("image") or ((item.get("images") or [None])[0])
    path = os.path.join(_dir(), name) if name else ""
    return path if path and os.path.isfile(path) else ""


def swipe_path(handler):
    item_id = util.query(handler).get("id", [""])[0]
    item = next((i for i in load() if i.get("id") == item_id), None)
    path = _local_path(item or {})
    if not path:
        handler._json(404, {"error": "this swipe item does not have a local file"}); return
    handler._json(200, {"path": path, "name": os.path.basename(path)})


def swipe_reveal(handler):
    item_id = util.query(handler).get("id", [""])[0]
    item = next((i for i in load() if i.get("id") == item_id), None)
    path = _local_path(item or {})
    if not path:
        handler._json(404, {"error": "this swipe item does not have a local file"}); return
    try:
        subprocess.Popen(["open", "-R", path])
        handler._json(200, {"ok": True, "path": path})
    except OSError as exc:
        handler._json(500, {"error": str(exc)})


def swipe_image(handler):
    """GET /swipe-img/<file> -- one gallery image."""
    name = urllib.parse.unquote(urllib.parse.urlparse(handler.path).path[len("/swipe-img/"):])
    path = os.path.join(_dir(), name)
    if not re.fullmatch(r"[0-9a-f]{12}\.\w{3,4}", name) or not os.path.isfile(path):
        handler.send_response(404)
        handler.send_header("Content-Length", "0")
        handler.end_headers()
        return
    ctype = next((t for t, e in IMG_TYPES.items() if name.endswith(e)), "application/octet-stream")
    with open(path, "rb") as f:
        body = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", ctype)
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "max-age=86400")
    handler.end_headers()
    handler.wfile.write(body)


def swipe_add(handler):
    """POST /api/swipe-add -- either the raw image bytes (Content-Type: image/..., optional X-Title header) or JSON
    {"link": ..., "title": ..., "source": ..., "response": ...} for a link without a picture."""
    ctype = handler.headers.get("Content-Type", "")
    body = handler._read_body()
    if ctype.split(";")[0].strip().lower() in VIDEO_TYPES:
        if not body or len(body) > MAX_VIDEO:
            handler._json(413 if body else 400, {"error": "video missing or bigger than 700 MB"})
            return
        item = new_item(title=urllib.parse.unquote(handler.headers.get("X-Title", "")))
        item["video"] = _save_video(body, ctype)
        save([item] + load())
        handler._json(200, {"item": item})
        return
    if ctype.startswith("image/"):
        if not body or len(body) > MAX_IMAGE:
            handler._json(413 if body else 400, {"error": "image missing or bigger than 25 MB"})
            return
        title = urllib.parse.unquote(handler.headers.get("X-Title", ""))
        handler._json(200, {"item": add_image_file(body, ctype, title=title)})
        return
    try:
        data = json.loads(body.decode("utf-8") or "{}")
    except ValueError:
        handler._json(400, {"error": "expected an image or JSON"})
        return
    if not (data.get("link") or "").strip():
        handler._json(400, {"error": "give it a link"})
        return
    item = new_item(**data)
    if data.get("waiting"):
        item["waiting"] = True            # a placeholder for a video that isn't saved yet
    save([item] + load())
    handler._json(200, {"item": item})


def _save_video(body, ctype):
    name = uuid.uuid4().hex[:12] + VIDEO_TYPES[ctype.split(";")[0].strip().lower()]
    with open(os.path.join(_dir(), name), "wb") as f:
        f.write(body)
    return name


def _drop_files(item, *names):
    for name in names:
        if name:
            try:
                os.remove(os.path.join(_dir(), name))
            except OSError:
                pass


def swipe_video(handler):
    """POST /api/swipe-video?id=... with the raw video bytes -- attaches (or replaces) the item's video; ?remove=1 takes it off again (a link item goes back to "waiting")."""
    q = {k: v[0] for k, v in util.query(handler).items()}
    ctype = handler.headers.get("Content-Type", "").split(";")[0].strip().lower()
    body = handler._read_body()
    items = load()
    it = next((i for i in items if i["id"] == q.get("id")), None)
    if not it:
        handler._json(404, {"error": "not found"})
        return
    if q.get("remove"):
        _drop_files(it, it.pop("video", None))
        if it.get("link") and not it.get("image"):
            it["waiting"] = True
    else:
        if ctype not in VIDEO_TYPES or not body or len(body) > MAX_VIDEO:
            handler._json(400, {"error": "need a video (mp4 / mov / webm) under 700 MB"})
            return
        _drop_files(it, it.get("video"))
        it["video"] = _save_video(body, ctype)
        it.pop("waiting", None)
    save(items)
    handler._json(200, {"item": it})


def swipe_video_file(handler):
    """GET /swipe-video/<file> -- the video, with Range support so it can be played and scrubbed."""
    name = urllib.parse.unquote(urllib.parse.urlparse(handler.path).path[len("/swipe-video/"):])
    path = os.path.join(_dir(), name)
    if not re.fullmatch(r"[0-9a-f]{12}\.\w{3,4}", name) or not os.path.isfile(path):
        handler.send_response(404)
        handler.send_header("Content-Length", "0")
        handler.end_headers()
        return
    handler._serve_media(path)


def swipe_update(handler):
    """POST /api/swipe-update with {"id": ..., and any of title/source/link/response}."""
    try:
        data = json.loads(handler._read_body().decode("utf-8") or "{}")
    except ValueError:
        handler._json(400, {"error": "expected JSON"})
        return
    items = load()
    for it in items:
        if it["id"] == data.get("id"):
            for k in FIELDS:
                if k in data:
                    it[k] = str(data[k] or "")[:20000]
            if "waiting" in data:
                it["waiting"] = bool(data["waiting"])
            save(items)
            handler._json(200, {"ok": True})
            return
    handler._json(404, {"error": "not found"})


def swipe_attach(handler):
    """POST /api/swipe-attach?id=... with the raw image bytes (Content-Type: image/...) -- adds another picture to that item (it then shows all of them together)."""
    item_id = util.query(handler).get("id", [""])[0]
    ctype = handler.headers.get("Content-Type", "")
    body = handler._read_body()
    if not ctype.startswith("image/") or not body or len(body) > MAX_IMAGE:
        handler._json(400, {"error": "need an image under 25 MB"})
        return
    items = load()
    it = next((i for i in items if i["id"] == item_id), None)
    if not it or not it.get("image"):
        handler._json(404, {"error": "that item has no picture to add to"})
        return
    ext = IMG_TYPES.get(ctype.split(";")[0].strip().lower(), ".jpg")
    name = uuid.uuid4().hex[:12] + ext
    with open(os.path.join(_dir(), name), "wb") as f:
        f.write(body)
    it["images"] = (it.get("images") or [it["image"]]) + [name]
    save(items)
    handler._json(200, {"item": it})


def swipe_delete(handler):
    """POST /api/swipe-delete?id=... -- removes the item and all its pictures."""
    item_id = util.query(handler).get("id", [""])[0]
    items = load()
    keep = [i for i in items if i["id"] != item_id]
    for i in items:
        if i["id"] == item_id:
            for name in set(([i["image"]] if i.get("image") else []) + list(i.get("images") or []) + ([i["video"]] if i.get("video") else [])):
                try:
                    os.remove(os.path.join(_dir(), name))
                except OSError:
                    pass
    save(keep)
    handler._json(200, {"ok": True, "removed": len(items) - len(keep)})
