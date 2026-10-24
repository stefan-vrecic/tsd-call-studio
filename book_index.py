"""Searchable text of the books uploaded in Resources -> Books (static/js/book-search.js, routes/booksearch.py).
A book file (PDF, EPUB or TXT) is saved to live_docs/book_files/<book id>.<ext> and its text is read out ONCE into
<book id>.index.json: {"ext", "name", "needs_ocr", "units": [{"label": "Ch 3 · p 41", "page": 41 or None, "text": "..."}]}.
Units are PDF pages, EPUB sections or ~3500-character text parts, so a search hit can be shown (and opened) on its own.
A PDF with no text layer (a scan) is read with Tesseract in a background thread; progress shows in book_progress()."""
import html
import json
import os
import re
import shutil
import subprocess
import threading
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser

import config
import util

DIR = os.path.join(config.LIVE_DOCS_DIR, "book_files")
os.makedirs(DIR, exist_ok=True)
PDFTOTEXT = shutil.which("pdftotext") or "/opt/homebrew/bin/pdftotext"
PDFTOPPM = shutil.which("pdftoppm") or "/opt/homebrew/bin/pdftoppm"
TESSERACT = shutil.which("tesseract") or "/opt/homebrew/bin/tesseract"
MAX_BYTES = 400 * 1024 * 1024
_progress = {}     # book id -> {"stage": str, "done": int, "total": int}
_WORDS = {w: i + 1 for i, w in enumerate("one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split())}


def safe_id(book_id):
    return re.sub(r"[^A-Za-z0-9_-]", "", str(book_id))[:40]


def file_path(book_id, ext):
    return os.path.join(DIR, f"{safe_id(book_id)}.{ext}")


def index_path(book_id):
    return os.path.join(DIR, f"{safe_id(book_id)}.index.json")


def kind_of(data, name=""):
    if data.startswith(b"%PDF"):
        return "pdf"
    if data[:2] == b"PK":
        return "epub"
    return "txt"


def load_index(book_id):
    try:
        with open(index_path(book_id), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _save_index(book_id, idx):
    p = index_path(book_id)
    util.write_json(p, idx, ensure_ascii=False)


def book_progress(book_id):
    return _progress.get(safe_id(book_id))


def _chapter_label(text, current):
    m = re.match(r"\s*(?:CHAPTER|Chapter)\s+([A-Za-z0-9]+)", text[:200])
    if m:
        w = m.group(1).lower()
        return f"Ch {_WORDS.get(w, m.group(1))}"
    return current


def _pdf_units(path):
    out = subprocess.run([PDFTOTEXT, "-enc", "UTF-8", path, "-"], capture_output=True, text=True, errors="replace").stdout
    pages = out.split("\f")
    if pages and not pages[-1].strip():
        pages.pop()
    units, chapter = [], ""
    for i, t in enumerate(pages, 1):
        chapter = _chapter_label(t, chapter)
        units.append({"label": f"{chapter} · p {i}" if chapter else f"p {i}", "page": i, "text": re.sub(r"[ \t]+", " ", t).strip()})
    return units


class _Text(HTMLParser):
    BLOCK = {"p", "div", "br", "h1", "h2", "h3", "h4", "li", "tr", "section", "blockquote"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip, self.heading, self._in_h = [], 0, "", None

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag in self.BLOCK:
            self.parts.append("\n")
        if tag in ("h1", "h2") and not self.heading:
            self._in_h = tag

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        if tag == self._in_h:
            self._in_h = None
        if tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if self.skip:
            return
        self.parts.append(data)
        if self._in_h and not self.heading and data.strip():
            self.heading = data.strip()


def _epub_units(path):
    z = zipfile.ZipFile(path)
    container = z.read("META-INF/container.xml").decode("utf-8", "replace")
    opf_path = re.search(r'full-path="([^"]+)"', container).group(1)
    base = os.path.dirname(opf_path)
    opf = z.read(opf_path).decode("utf-8", "replace")
    manifest = {m.group(1): m.group(2) for m in re.finditer(r'<item\b[^>]*?\bid="([^"]+)"[^>]*?\bhref="([^"]+)"', opf)}
    for m in re.finditer(r'<item\b[^>]*\bhref="([^"]+)"[^>]*\bid="([^"]+)"', opf):
        manifest.setdefault(m.group(2), m.group(1))
    units, n = [], 0
    for ref in re.findall(r'<itemref\b[^>]*\bidref="([^"]+)"', opf):
        href = manifest.get(ref)
        if not href:
            continue
        name = os.path.normpath(os.path.join(base, href.split("#")[0])).replace("\\", "/")
        try:
            raw = z.read(name).decode("utf-8", "replace")
        except KeyError:
            continue
        p = _Text()
        p.feed(raw)
        text = re.sub(r"[ \t]+", " ", "".join(p.parts))
        text = re.sub(r"\n\s*\n+", "\n\n", text).strip()
        if len(text) < 40:
            continue
        n += 1
        title = (p.heading or "").strip()
        units.append({"label": (f"{n}. {title}" if title else f"Section {n}")[:60], "page": None, "text": text})
    return units


def _txt_units(path):
    text = open(path, "rb").read().decode("utf-8", "replace")
    paras = re.split(r"\n\s*\n", text)
    units, cur, chapter, part = [], "", "", 0
    for p in paras:
        m = re.match(r"\s*(?:CHAPTER|Chapter|PART|Part)\s+([A-Za-z0-9]+)", p)
        if m and cur.strip():
            part += 1
            units.append({"label": f"{chapter} · part {part}" if chapter else f"Part {part}", "page": None, "text": cur.strip()})
            cur = ""
        if m:
            w = m.group(1).lower()
            chapter = f"Ch {_WORDS.get(w, m.group(1))}"
        cur += p + "\n\n"
        if len(cur) > 3500:
            part += 1
            units.append({"label": f"{chapter} · part {part}" if chapter else f"Part {part}", "page": None, "text": cur.strip()})
            cur = ""
    if cur.strip():
        part += 1
        units.append({"label": f"{chapter} · part {part}" if chapter else f"Part {part}", "page": None, "text": cur.strip()})
    return units


def _ocr_pdf(book_id, path, idx):
    """Background: OCR every page of a scanned PDF, then rewrite the index (search works as soon as it's done)."""
    n = len(idx["units"])
    _progress[safe_id(book_id)] = {"stage": "OCR", "done": 0, "total": n}
    work = os.path.join(DIR, safe_id(book_id) + "_ocr")
    os.makedirs(work, exist_ok=True)

    def one(page):
        png = os.path.join(work, f"p{page}")
        subprocess.run([PDFTOPPM, "-f", str(page), "-l", str(page), "-r", "250", "-gray", "-png", "-singlefile", path, png], check=True, capture_output=True)
        t = subprocess.run([TESSERACT, png + ".png", "stdout", "-l", "eng", "--psm", "3"], capture_output=True, text=True).stdout
        os.remove(png + ".png")
        _progress[safe_id(book_id)]["done"] += 1
        return page, t

    try:
        with ThreadPoolExecutor(max_workers=max(1, (os.cpu_count() or 4) - 1)) as ex:
            texts = dict(ex.map(one, range(1, n + 1)))
        chapter = ""
        for i, u in enumerate(idx["units"], 1):
            t = texts.get(i, "")
            chapter = _chapter_label(t, chapter)
            u["text"] = re.sub(r"[ \t]+", " ", t).strip()
            u["label"] = f"{chapter} · p {i}" if chapter else f"p {i}"
        idx["needs_ocr"] = False
        idx["ocr_done"] = True
        _save_index(book_id, idx)
    finally:
        _progress.pop(safe_id(book_id), None)
        shutil.rmtree(work, ignore_errors=True)


def add_book_file(book_id, data, name):
    """Saves the upload and indexes it. Returns the index summary. Raises ValueError for an unusable file."""
    if len(data) > MAX_BYTES:
        raise ValueError("that file is too big (400 MB max)")
    ext = kind_of(data, name)
    for old in ("pdf", "epub", "txt"):
        if old != ext and os.path.isfile(file_path(book_id, old)):
            os.remove(file_path(book_id, old))
    path = file_path(book_id, ext)
    with open(path, "wb") as f:
        f.write(data)
    try:
        units = {"pdf": _pdf_units, "epub": _epub_units, "txt": _txt_units}[ext](path)
    except Exception as e:
        raise ValueError(f"couldn't read that {ext.upper()}: {e}")
    chars = sum(len(u["text"]) for u in units)
    if not units or (ext != "pdf" and chars < 200):
        raise ValueError("no readable text found in that file")
    needs_ocr = ext == "pdf" and chars < 40 * len(units)
    idx = {"ext": ext, "name": os.path.basename(name or f"book.{ext}")[:200], "needs_ocr": needs_ocr, "updated": int(time.time()), "units": units}
    _save_index(book_id, idx)
    if needs_ocr and os.path.isfile(TESSERACT):
        threading.Thread(target=_ocr_pdf, args=(book_id, path, idx), daemon=True).start()
    return summary(book_id, idx)


def delete_book_file(book_id):
    for ext in ("pdf", "epub", "txt", "index.json"):
        p = os.path.join(DIR, f"{safe_id(book_id)}.{ext}")
        if os.path.isfile(p):
            os.remove(p)


def summary(book_id, idx=None):
    idx = idx or load_index(book_id)
    if not idx:
        return None
    return {"ext": idx["ext"], "name": idx.get("name", ""), "units": len(idx["units"]), "chars": sum(len(u["text"]) for u in idx["units"]),
            "needs_ocr": bool(idx.get("needs_ocr")), "progress": book_progress(book_id), "updated": idx.get("updated", 0)}


def all_summaries():
    out = {}
    for fn in os.listdir(DIR):
        if fn.endswith(".index.json"):
            bid = fn[:-len(".index.json")]
            s = summary(bid)
            if s:
                out[bid] = s
    return out


def _terms(query):
    q = query.strip()
    phrases = [p.strip() for p in re.findall(r'"([^"]+)"', q) if p.strip()]
    rest = re.sub(r'"[^"]*"', " ", q)
    return phrases + [w for w in re.split(r"\s+", rest) if w]


def _pattern(term):
    """A search term as a regex: case-insensitive, and a space also matches a hyphen or nothing ("self image" finds "self-image" / "selfimage")."""
    return re.compile(r"[\s\-\u2010-\u2014]*".join(re.escape(w) for w in re.split(r"\s+", term.strip()) if w), re.IGNORECASE)


def search(book_id, query, per_unit=3, limit=120, width=110):
    """Hits in one book: every term (a word, or a "quoted phrase") must be in the unit. Returns (hits, total_units_matched)."""
    idx = load_index(book_id)
    terms = _terms(query)
    if not idx or not terms:
        return [], 0
    pats = [_pattern(t) for t in terms]
    hits, matched = [], 0
    for ui, u in enumerate(idx["units"]):
        t = u["text"]
        if not all(p.search(t) for p in pats):
            continue
        matched += 1
        spans = sorted({m.start() for p in pats[:1] for m in p.finditer(t)})[:per_unit]
        used_end = -1
        for s in spans:
            if s < used_end:
                continue
            a, b = max(0, s - width), min(len(t), s + width + len(terms[0]))
            a = t.rfind(" ", 0, a + 12) + 1 if a > 0 and t.rfind(" ", 0, a + 12) >= 0 else a
            snippet = ("…" if a > 0 else "") + re.sub(r"\s+", " ", t[a:b]).strip() + ("…" if b < len(t) else "")
            hits.append({"book": book_id, "unit": ui, "label": u["label"], "page": u["page"], "snippet": snippet})
            used_end = b
        if len(hits) >= limit:
            break
    return hits, matched


def unit(book_id, ui):
    idx = load_index(book_id)
    if not idx or not (0 <= ui < len(idx["units"])):
        return None
    u = idx["units"][ui]
    return {"label": u["label"], "page": u["page"], "text": u["text"], "ext": idx["ext"], "name": idx.get("name", ""), "index": ui, "count": len(idx["units"])}


def highlight_html(text, query):
    """Escaped text with every search term wrapped in <mark>."""
    esc = html.escape(text)
    terms = sorted({t for t in _terms(query)}, key=len, reverse=True)
    if terms:
        esc = re.sub("(" + "|".join(_pattern(html.escape(t)).pattern for t in terms) + ")", r"<mark>\1</mark>", esc, flags=re.IGNORECASE)
    return esc
