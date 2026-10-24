"""Follow-up date and the Google Calendar event for it.

Each function is one endpoint: it gets the request handler (handler.path, handler.rfile, handler._json(...)) and
answers it. Which URL goes to which function is the table in routes/__init__.py."""
import json
import os
import re
import urllib.parse

import config
import followup
import util


def set_followup_date(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    date_str = qs.get("date", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest["followUpEventDate"] = date_str
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True})
    return


def add_followup_gcal(handler):
    qs = util.query(handler)
    name = qs.get("person", [""])[0]
    date_str = qs.get("date", [""])[0]
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{name}.json")
    if not os.path.exists(manifest_path):
        handler._json(404, {"error": f"no manifest for {name}"})
        return
    if not date_str:
        handler._json(400, {"error": "need a date"})
        return
    display_name = re.sub(r"^\d{2}-\d{2}-", "", name)
    with open(manifest_path) as f:
        manifest = json.load(f)
    try:
        event_id, link = followup.create_followup_gcal_event(display_name, date_str, followup.build_followup_description(manifest))
    except Exception as e:
        handler._json(500, {"error": str(e)})
        return
    manifest["followUpEventDate"] = date_str  # last date picked, just for the input's prefill
    manifest.setdefault("followUpEvents", []).append({"date": date_str, "id": event_id, "link": link})
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    handler._json(200, {"ok": True, "link": link, "events": manifest["followUpEvents"]})
    return
