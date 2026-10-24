"""Local PDF storage for the Personal > Music gallery."""
import os
import urllib.parse
import uuid

import config
import util


DIR = os.path.join(config.LIVE_DOCS_DIR, "sheet_music")
os.makedirs(DIR, exist_ok=True)
MAX_BYTES = 80_000_000


def sheet_music_file(handler):
    """GET /sheet-music-file/<id>.pdf -- open an uploaded score inline."""
    name = os.path.basename(urllib.parse.unquote(urllib.parse.urlparse(handler.path).path[len("/sheet-music-file/"):]))
    if not name.endswith(".pdf") or not name[:-4].isalnum():
        handler.send_error(404)
        return
    path = os.path.join(DIR, name)
    if not os.path.isfile(path):
        handler.send_error(404)
        return
    with open(path, "rb") as f:
        body = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", "application/pdf")
    handler.send_header("Content-Disposition", "inline")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "private, max-age=3600")
    handler.end_headers()
    handler.wfile.write(body)


def sheet_music_upload(handler):
    """POST /api/sheet-music-upload with one PDF as the request body."""
    body = handler._read_body()
    if len(body) > MAX_BYTES:
        handler._json(413, {"error": "PDF is larger than 80 MB"})
        return
    if not body.startswith(b"%PDF"):
        handler._json(400, {"error": "That file does not look like a PDF"})
        return
    original = os.path.basename(urllib.parse.unquote(handler.headers.get("X-Filename", "Sheet music.pdf")))
    file_id = uuid.uuid4().hex
    path = os.path.join(DIR, file_id + ".pdf")
    util.write_bytes(path, body)
    handler._json(200, {"ok": True, "name": original, "url": "/sheet-music-file/" + file_id + ".pdf"})

