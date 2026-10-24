"""Resources -> Books: upload a PDF / EPUB / TXT per book and search inside it (book_index.py does the reading; static/js/book-search.js is the UI).
  GET  /api/book-files                  -> {book id: {ext, name, units, chars, needs_ocr, progress}}
  POST /api/book-upload?book=ID&name=F  body = the file                      -> that book's summary
  POST /api/book-file-delete?book=ID
  GET  /api/book-search?q=..&book=ID|all -> {hits: [{book, title?, unit, label, page, snippet}], matched, books}
  GET  /api/book-unit?book=ID&unit=N     -> one page / section with its text
  GET  /book-file/<ID>.<ext>             -> the original file (a PDF opens at #page=N in the browser's own viewer)
  GET  /book-read?book=ID&unit=N&q=..    -> a stand-alone page with that unit's text, matches highlighted (opens in a new tab)"""
import html
import json
import os
import urllib.parse

import book_index
import config
from . import books as books_routes
import util


def _qs(handler):
    return util.query(handler)


def _titles():
    try:
        with open(books_routes.SHELVES["books"]["path"], encoding="utf-8") as f:
            return {b["id"]: b.get("title", "") for b in json.load(f).get("books", [])}
    except (OSError, ValueError):
        return {}


def book_files_get(handler):
    handler._json(200, book_index.all_summaries())


def book_upload(handler):
    qs = _qs(handler)
    bid = book_index.safe_id(qs.get("book", [""])[0])
    if not bid:
        handler._json(400, {"error": "which book?"})
        return
    name = urllib.parse.unquote(qs.get("name", ["book"])[0])
    data = handler._read_body()
    try:
        info = book_index.add_book_file(bid, data, name)
    except ValueError as e:
        handler._json(400, {"error": str(e)})
        return
    handler._json(200, info)


def book_file_delete(handler):
    bid = book_index.safe_id(_qs(handler).get("book", [""])[0])
    book_index.delete_book_file(bid)
    handler._json(200, {"ok": True})


def book_search(handler):
    qs = _qs(handler)
    q = qs.get("q", [""])[0]
    which = qs.get("book", ["all"])[0]
    titles = _titles()
    ids = list(book_index.all_summaries()) if which == "all" else [book_index.safe_id(which)]
    hits, matched, books = [], 0, []
    for bid in ids:
        h, m = book_index.search(bid, q)
        if h:
            for x in h:
                x["title"] = titles.get(bid, "")
            hits += h
            matched += m
            books.append({"book": bid, "title": titles.get(bid, ""), "matches": m})
    handler._json(200, {"hits": hits, "matched": matched, "books": books})


def book_unit(handler):
    qs = _qs(handler)
    try:
        u = book_index.unit(book_index.safe_id(qs.get("book", [""])[0]), int(qs.get("unit", ["0"])[0]))
    except ValueError:
        u = None
    if not u:
        handler._json(404, {"error": "not found"})
        return
    handler._json(200, u)


def book_file(handler):
    name = urllib.parse.unquote(urllib.parse.urlparse(handler.path).path[len("/book-file/"):])
    bid, _, ext = name.rpartition(".")
    path = book_index.file_path(bid, ext) if ext in ("pdf", "epub", "txt") else ""
    if not path or not os.path.isfile(path):
        handler.send_response(404)
        handler.send_header("Content-Length", "0")
        handler.end_headers()
        return
    with open(path, "rb") as f:
        body = f.read()
    handler.send_response(200)
    handler.send_header("Content-Type", {"pdf": "application/pdf", "epub": "application/epub+zip", "txt": "text/plain; charset=utf-8"}[ext])
    handler.send_header("Content-Disposition", "inline")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-cache")
    handler.end_headers()
    handler.wfile.write(body)


def book_read(handler):
    qs = _qs(handler)
    bid = book_index.safe_id(qs.get("book", [""])[0])
    q = qs.get("q", [""])[0]
    try:
        n = int(qs.get("unit", ["0"])[0])
    except ValueError:
        n = 0
    u = book_index.unit(bid, n)
    if not u:
        handler.send_response(404)
        handler.send_header("Content-Length", "0")
        handler.end_headers()
        return
    title = _titles().get(bid, u["name"])
    nav = lambda i, t: f'<a href="/book-read?book={bid}&unit={i}&q={urllib.parse.quote(q)}">{t}</a>' if 0 <= i < u["count"] else f"<span>{t}</span>"
    pdf = f' &middot; <a href="/book-file/{bid}.pdf#page={u["page"]}">Open the original PDF page</a>' if u["ext"] == "pdf" and u["page"] else ""
    paras = "".join(f"<p>{book_index.highlight_html(p, q)}</p>" for p in u["text"].split("\n\n") if p.strip())
    page = (f'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} - {html.escape(u["label"])}</title>'
            "<style>body{font:18px/1.7 Georgia,serif;max-width:720px;margin:0 auto;padding:24px 18px 80px;color:#1f2937;background:#faf8f3}"
            "h1{font:600 20px system-ui;margin:0}.sub{font:14px system-ui;color:#6b7280;margin:4px 0 22px}.nav{font:14px system-ui;display:flex;gap:16px;margin:0 0 20px}"
            "mark{background:#fde68a;border-radius:3px;padding:0 2px}p{margin:0 0 1em}a{color:#2563eb}</style>"
            f'<h1>{html.escape(title)}</h1><div class="sub">{html.escape(u["label"])}{pdf}</div>'
            f'<div class="nav">{nav(n - 1, "&larr; Previous")}{nav(n + 1, "Next &rarr;")}</div>{paras}'
            '<script>var m=document.querySelector("mark");if(m)m.scrollIntoView({block:"center"})</script>')
    body = page.encode("utf-8")
    handler.send_response(200)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)
