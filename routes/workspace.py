"""Small workspace assets shared by networking, brainstorm and the voice dock."""
import html
import json
import mimetypes
import os
import re
import subprocess
import time
import urllib.parse
import uuid

import config
from . import records

MAX_FILE = 700 * 1024 * 1024
SAFE_EXTS = {".pdf", ".epub", ".txt", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp3", ".m4a", ".wav", ".mp4", ".mov", ".webm"}


def _folder(kind):
    path = os.path.join(config.LIVE_DOCS_DIR, kind)
    os.makedirs(path, exist_ok=True)
    return path


def _clean_name(value):
    name = os.path.basename(urllib.parse.unquote(value or "file"))
    stem, ext = os.path.splitext(name)
    ext = ext.lower()
    if ext not in SAFE_EXTS:
        raise ValueError("unsupported file type")
    stem = re.sub(r"[^A-Za-z0-9 _.-]+", "", stem).strip()[:90] or "file"
    return stem, ext


def _upload(handler, kind):
    body = handler._read_body()
    if not body or len(body) > MAX_FILE:
        handler._json(413 if body else 400, {"error": "file missing or too large"})
        return
    try:
        stem, ext = _clean_name(handler.headers.get("X-Filename", "file"))
    except ValueError as exc:
        handler._json(400, {"error": str(exc)})
        return
    saved = f"{int(time.time())}-{uuid.uuid4().hex[:8]}-{stem}{ext}"
    with open(os.path.join(_folder(kind), saved), "wb") as f:
        f.write(body)
    handler._json(200, {"name": stem + ext, "file": saved, "path": os.path.join(_folder(kind), saved), "url": f"/workspace-file/{kind}/{urllib.parse.quote(saved)}", "added": int(time.time())})


def voice_attachment(handler):
    _upload(handler, "voice-attachments")


def networking_recording_add(handler):
    _upload(handler, "networking-recordings")


def brainstorm_image_add(handler):
    ctype = (handler.headers.get("Content-Type") or "").split(";")[0]
    if not ctype.startswith("image/"):
        handler._json(400, {"error": "drop or paste an image"})
        return
    _upload(handler, "brainstorm-images")


def _list(kind):
    folder = _folder(kind)
    items = []
    for name in os.listdir(folder):
        path = os.path.join(folder, name)
        if os.path.isfile(path):
            items.append({"file": name, "name": re.sub(r"^\d+-[0-9a-f]{8}-", "", name), "url": f"/workspace-file/{kind}/{urllib.parse.quote(name)}", "path": path, "added": int(os.path.getmtime(path))})
    return sorted(items, key=lambda x: x["added"], reverse=True)


def networking_recordings(handler):
    handler._json(200, {"items": _list("networking-recordings")})


def brainstorm_images(handler):
    handler._json(200, {"items": _list("brainstorm-images")})


def workspace_file(handler):
    parts = urllib.parse.unquote(urllib.parse.urlparse(handler.path).path).split("/")
    if len(parts) != 4 or parts[2] not in {"voice-attachments", "networking-recordings", "brainstorm-images"}:
        handler.send_error(404); return
    name = os.path.basename(parts[3]); path = os.path.join(_folder(parts[2]), name)
    if not os.path.isfile(path): handler.send_error(404); return
    handler._serve_media(path)


def roadmap_diagram(handler):
    """Download the user's saved roadmap as one or more horizontal draw.io timelines."""
    horizons = [(7, "7 days"), (14, "14 days"), (30, "30 days"), (60, "60 days"),
                (90, "90 days"), (180, "180 days"), (365, "1 year")]
    document = records.load_record("roadmap") or {}
    if isinstance(document.get("diagram"), dict) and document["diagram"].get("shapes"):
        return _send_drawio(handler, _diagram_xml(document))   # the 🧩 Diagram as you arranged it
    saved_sections = document.get("sections", {})
    timelines = [   # one row each: General, then every life area (Oct 19 2026: the General / By life area switch is gone)
        ("General", document.get("plans", {}), "#eef4ff", "#2563eb"),
        ("Fitness", saved_sections.get("fitness", {}), "#dcfce7", "#16a34a"),
        ("Relationships", saved_sections.get("relationships", {}), "#ffe4e6", "#e11d48"),
        ("Travel", saved_sections.get("travel", {}), "#e0f2fe", "#0284c7"),
        ("Career", saved_sections.get("career", {}), "#ede9fe", "#7c3aed"),
        ("Other", saved_sections.get("other", {}), "#fef3c7", "#d97706"),
    ]

    cells = ['<mxCell id="0"/><mxCell id="1" parent="0"/>']
    cells.append('<mxCell id="title" value="Personal Timeline Roadmap" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#172033;fontColor=#ffffff;fontStyle=1;fontSize=20" vertex="1" parent="1"><mxGeometry x="690" y="25" width="400" height="65" as="geometry"/></mxCell>')
    for row, (section, plans, fill, stroke) in enumerate(timelines):
        y = 140 + row * 150
        cells.append(f'<mxCell id="section{row}" value="{html.escape(section, quote=True)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor={stroke};fontColor=#ffffff;fontStyle=1;fontSize=15" vertex="1" parent="1"><mxGeometry x="20" y="{y}" width="130" height="100" as="geometry"/></mxCell>')
        for column, (day, label) in enumerate(horizons):
            plan = str(plans.get(str(day), plans.get(day, "")) or "").strip()
            plan_html = html.escape(html.escape(plan, quote=False), quote=True).replace("\n", "&lt;br&gt;") if plan else "—"   # HTML, then XML
            value = f"&lt;b&gt;{label}&lt;/b&gt;&lt;br&gt;{plan_html}"
            node_id = f"r{row}n{column}"
            x = 180 + column * 235
            cells.append(f'<mxCell id="{node_id}" value="{value}" style="rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=12;fillColor={fill};strokeColor={stroke};fontSize=13" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="210" height="100" as="geometry"/></mxCell>')
            source = f"section{row}" if column == 0 else f"r{row}n{column - 1}"
            cells.append(f'<mxCell id="r{row}e{column}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor={stroke};strokeWidth=2" edge="1" parent="1" source="{source}" target="{node_id}"><mxGeometry relative="1" as="geometry"/></mxCell>')

    height = max(450, 190 + len(timelines) * 150)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><mxfile host="Call Studio"><diagram name="Roadmap"><mxGraphModel grid="1" gridSize="10" page="1" pageScale="1" pageWidth="1900" pageHeight="{height}"><root>' + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>'
    _send_drawio(handler, xml)


def _send_drawio(handler, xml):
    body = xml.encode()
    handler.send_response(200); handler.send_header("Content-Type", "application/xml"); handler.send_header("Content-Disposition", 'attachment; filename="personal-roadmap.drawio"'); handler.send_header("Content-Length", str(len(body))); handler.end_headers(); handler.wfile.write(body)


def _diagram_xml(document):
    """The 🧩 Diagram (static/js/roadmap-diagram.js: shapes + edges) as a draw.io file. A day box linked to the boxes shows
    "<b>7 days</b><br>plan text" from the saved plans, like the page does."""
    diagram = document["diagram"]
    sections = document.get("sections", {})
    def plan_for(bind):
        plans = document.get("plans", {}) if bind.get("area") == "general" else sections.get(bind.get("area"), {})
        return str(plans.get(str(bind.get("day")), plans.get(bind.get("day"), "")) or "")
    esc = lambda t: html.escape(str(t), quote=True)                    # XML attribute
    label = lambda t: esc(html.escape(str(t), quote=False))             # plain text inside an html=1 label: escaped for HTML, then for XML
    cells = ['<mxCell id="0"/><mxCell id="1" parent="0"/>']
    shapes = diagram.get("shapes", [])
    for s in sorted(shapes, key=lambda s: s.get("kind") != "section"):   # sections behind
        if s.get("bind"):
            body = plan_for(s["bind"]).strip()
            value = "&lt;b&gt;" + label(s.get("title", "")) + "&lt;/b&gt;&lt;br&gt;" + (label(body).replace("\n", "&lt;br&gt;") if body else "—")
        else:
            value = label(s.get("text", "")).replace("\n", "&lt;br&gt;")
        kind = s.get("kind", "box")
        style = ("text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;" if kind == "text" else
                 f"rounded=1;whiteSpace=wrap;html=1;fillColor={s.get('fill', '#ffffff')};strokeColor={s.get('stroke', '#475569')};"
                 + ("dashed=1;opacity=70;" if kind == "section" else ""))
        style += (f"align={s.get('align', 'left')};verticalAlign={'middle' if s.get('align') == 'center' else 'top'};spacing=12;"
                  f"fontSize={int(s.get('size', 13))};fontColor={s.get('font', '#1f2937')};" + ("fontStyle=1;" if s.get("bold") else ""))
        cells.append(f'<mxCell id="{esc(s["id"])}" value="{value}" style="{style}" vertex="1" parent="1"><mxGeometry x="{int(s.get("x", 0))}" y="{int(s.get("y", 0))}" width="{int(s.get("w", 100))}" height="{int(s.get("h", 60))}" as="geometry"/></mxCell>')
    ids = {s["id"] for s in shapes}
    for e in diagram.get("edges", []):
        if e.get("from") in ids and e.get("to") in ids:
            cells.append(f'<mxCell id="{esc(e["id"])}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;html=1;strokeColor={e.get("color", "#475569")};strokeWidth=2" edge="1" parent="1" source="{esc(e["from"])}" target="{esc(e["to"])}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    width = max([1000] + [int(s.get("x", 0)) + int(s.get("w", 0)) for s in shapes]) + 40
    height = max([450] + [int(s.get("y", 0)) + int(s.get("h", 0)) for s in shapes]) + 40
    return (f'<?xml version="1.0" encoding="UTF-8"?><mxfile host="Call Studio"><diagram name="Roadmap"><mxGraphModel grid="1" gridSize="10" page="1" pageScale="1" pageWidth="{width}" pageHeight="{height}"><root>'
            + "".join(cells) + "</root></mxGraphModel></diagram></mxfile>")


# Keep the original URL working for existing bookmarks while returning the corrected roadmap.
dashboard_diagram = roadmap_diagram

