#!/usr/bin/env python3
"""
Call Studio — local server.

- Serves the player page + media files (with Range support for scrubbing).
- /api/people lists everyone we have a manifest for.
- Drop a new mp3/mp4/mkv on the page -> /api/upload -> background pipeline (see pipeline.py):
    extract audio (ffmpeg) -> transcribe (whisper-cli, Metal) ->
    headless `claude -p` writes the follow-along doc + manifest via
    build_followalong.js -> new person shows up automatically.
- /seek?person=&t= is kept for backward compatibility with the timestamp
  links already baked into the older *-Script-Followalong.docx files —
  it now just redirects into the player instead of driving VLC over
  AppleScript (which is what didn't survive a second click).

The work itself lives in the other modules next to this file; this one is the HTTP side.
Everything only listens on 127.0.0.1. Nothing leaves this machine.
"""
import http.server
import json
import os
import re
import shutil
import socketserver
import urllib.parse

import config
import drive_inbox
import mail_watch
import routes
import transcript_sync


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _html(self, code, html):
        body = html.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    _STATIC_TYPES = {".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".mjs": "application/javascript; charset=utf-8"}

    def _static(self, rel):
        """Serves the page's stylesheet / scripts from static/. Never cached: this is a local tool, and a stale
        script in an already-open tab has caused enough confusion. Only .css/.js inside static/ are served."""
        root = os.path.realpath(config.STATIC_DIR)
        full = os.path.realpath(os.path.join(root, urllib.parse.unquote(rel)))
        ext = os.path.splitext(full)[1].lower()
        if not full.startswith(root + os.sep) or ext not in self._STATIC_TYPES or not os.path.isfile(full):
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", self._STATIC_TYPES[ext])
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        fn = routes.find(routes.GET, urllib.parse.urlparse(self.path).path)
        if fn:
            fn(self)
            return
        self.send_response(404)
        self.send_header('Content-Length', '0')
        self.end_headers()


    def _serve_media(self, path):
        if not os.path.exists(path):
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        size = os.path.getsize(path)
        ctype = "video/webm" if path.lower().endswith(".webm") else "video/mp4" if path.lower().endswith((".mp4", ".mov", ".m4v")) else "audio/mpeg"
        range_header = self.headers.get("Range")
        if range_header:
            m = re.match(r"bytes=(\d+)-(\d*)", range_header)
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else size - 1
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(length))
            self.send_header("Content-Type", ctype)
            self.end_headers()
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
        else:
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(size))
            self.end_headers()
            with open(path, "rb") as f:
                shutil.copyfileobj(f, self.wfile)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        data = b""
        remaining = length
        while remaining > 0:
            chunk = self.rfile.read(min(1 << 20, remaining))
            if not chunk:
                break
            data += chunk
            remaining -= len(chunk)
        return data

    def do_POST(self):
        fn = routes.find(routes.POST, self.path)
        if fn:
            fn(self)
            return
        self.send_response(404)
        self.send_header('Content-Length', '0')
        self.end_headers()


    def log_message(self, format, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    mail_watch.start()  # email notification box (does nothing until Gmail is connected in Settings)
    drive_inbox.start()  # recordings dropped into My Drive/Aloware Calls get processed (drive_inbox.py)
    transcript_sync.start()  # backfill / catch up: every call's transcript into the Drive folder
    with Server(("127.0.0.1", config.PORT), Handler) as httpd:
        print(f"Call Studio running at http://127.0.0.1:{config.PORT} — leave this window open.")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
