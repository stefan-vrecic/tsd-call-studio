"""GET /api/link-title?url=... -> {"title", "author", "image"}: the real title (and preview picture, og:image) of a link, for the Resources ->
Videos shelf (static/js/shelf.js) and the Travel tab's rentals, so a pasted
YouTube link names itself. YouTube / youtu.be use YouTube's public oEmbed lookup (no account); any other page falls back to its <title> /
og:title. Only http(s) links, a 6-second limit, and nothing is stored."""
import html
import json
import re
import urllib.parse
import urllib.request
import util

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Call Studio"}


def _get(url, limit=400_000):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=6) as r:
        return r.read(limit).decode("utf-8", errors="replace")


def link_title(handler):
    url = util.query(handler).get("url", [""])[0].strip()
    if not re.match(r"^https?://", url):
        handler._json(400, {"error": "need an http(s) link"})
        return
    host = urllib.parse.urlparse(url).hostname or ""
    try:
        if re.search(r"(^|\.)(youtube\.com|youtu\.be)$", host):
            d = json.loads(_get("https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(url, safe="")))
            handler._json(200, {"title": d.get("title", ""), "author": d.get("author_name", ""), "image": d.get("thumbnail_url", "")})
            return
        page = _get(url)
        m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', page, re.I) or re.search(r"<title[^>]*>(.*?)</title>", page, re.I | re.S)
        img = re.search(r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)', page, re.I) \
            or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', page, re.I)
        image = html.unescape(img.group(1)).strip() if img else ""
        handler._json(200, {"title": html.unescape(re.sub(r"\s+", " ", m.group(1))).strip() if m else "", "author": "",
                            "image": urllib.parse.urljoin(url, image) if image else ""})
    except Exception as exc:   # offline, a private video, a page that refuses: just no title
        handler._json(200, {"title": "", "author": "", "error": str(exc)[:200]})
