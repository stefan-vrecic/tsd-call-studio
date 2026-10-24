"""Follow-up helpers: the Google Calendar event for a follow-up and the text that goes in it."""
import json
import os
import subprocess
import urllib.parse

import config


# Runs in calendar-auto-buffer's own venv (not Call Studio's environment)
# so we don't need google-api-python-client as a dependency here too --
# reuses the OAuth token/credentials already set up for that project.
# `summary`/`date_str` are passed as argv, not interpolated into the
# source, so no quoting/injection concerns from a person's name.
#
# Always creates a NEW event -- multiple follow-up events per person are
# allowed on purpose (e.g. a text reminder AND a separate call-back
# reminder on different dates), so this does not try to find/update a
# previous one. The only de-duplication is client-side: the "+ Add event
# to gCal" button disables itself while a request is in flight, so a
# double-click doesn't fire two inserts for the one click.
#
# Timed, not all-day (changed Sep 23 2026, at Stefan's request -- all-day
# FU events were stacking up as banners across the top of the day view,
# cluttering it). Each one gets a 15-minute slot inside a fixed
# 3:30am-4:30am window, colored Tangerine to match the other "top of
# mind" follow-up reminders (see calendar-color-system). Same-day FU:
# events stack progressively: this counts how many timed events already
# start with "FU:" on that date within the window and takes the next
# free 15-min slot after them (3:30, 3:45, 4:00, 4:15, ...) -- a 5th+ one
# on the same day just keeps counting past 4:30 rather than erroring, so
# the window is a target, not a hard cap.
_GCAL_FOLLOWUP_SCRIPT = """
import sys, json, datetime as dt
sys.path.insert(0, %r)
from main import get_service
service = get_service()
summary, date_str, description = sys.argv[1], sys.argv[2], sys.argv[3]

day = dt.date.fromisoformat(date_str)
window_start = dt.datetime.combine(day, dt.time(3, 30)).astimezone()
window_end = dt.datetime.combine(day, dt.time(4, 30)).astimezone()

existing = service.events().list(
    calendarId="primary", timeMin=window_start.isoformat(), timeMax=window_end.isoformat(),
    singleEvents=True,
).execute().get("items", [])
stacked = sum(1 for ev in existing if (ev.get("summary") or "").startswith("FU:"))

start = window_start + dt.timedelta(minutes=15 * stacked)
end = start + dt.timedelta(minutes=15)

body = {
    "summary": "FU: " + summary,
    "start": {"dateTime": start.isoformat()},
    "end": {"dateTime": end.isoformat()},
    "description": description,
    "colorId": "6",
}
result = service.events().insert(calendarId="primary", body=body).execute()
print(json.dumps({"id": result.get("id", ""), "link": result.get("htmlLink", "")}))
""" % config.CALENDAR_BUFFER_DIR


def unwrap_google_redirect_url(url):
    """Google Calendar/Docs auto-wraps links pasted into an event's own
    description/notes as https://www.google.com/url?q=<real>&sa=...&ust=...
    -- if a link was ever copied FROM a calendar event (e.g. a CRM link
    grabbed off an old event) and pasted back into Call Studio, it comes
    in pre-wrapped and ugly. Unwrap it back to the real destination so
    it doesn't propagate the tracking wrapper further (e.g. into a new
    follow-up event's own description)."""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.netloc in ("www.google.com", "google.com") and parsed.path == "/url":
            real = urllib.parse.parse_qs(parsed.query).get("q", [None])[0]
            if real:
                return real
    except Exception:
        pass
    return url


def build_followup_description(manifest):
    """Builds the Google Calendar event body text for a follow-up
    reminder -- CRM link, both objections, height/weight (usually stated
    in the first few minutes of the call), and a few summary bullets --
    so the full context is visible right from the calendar event, no
    need to reopen Call Studio before the call/text."""
    lines = []
    if manifest.get("crmLink"):
        manifest = {**manifest, "crmLink": unwrap_google_redirect_url(manifest["crmLink"])}
        lines.append(f"CRM: {manifest['crmLink']}")
        lines.append("")
    if manifest.get("primaryObjection"):
        lines.append(f"Primary objection: {manifest['primaryObjection']}")
    if manifest.get("primaryObjection") and manifest.get("secondaryObjection"):
        lines.append("")
    if manifest.get("secondaryObjection"):
        lines.append(f"Secondary objection: {manifest['secondaryObjection']}")
    if manifest.get("height") or manifest.get("weight"):
        lines.append("")
        if manifest.get("height"):
            lines.append(f"Height: {manifest['height']}")
        if manifest.get("weight"):
            lines.append(f"Weight: {manifest['weight']}")
    findings = manifest.get("findings") or []
    if findings:
        lines.append("")
        lines.append("Notes:")
        for f in findings[:4]:
            lines.append(f"- {f}")
    return "\n".join(lines)


def create_followup_gcal_event(display_name, date_str, description=""):
    """Creates a new timed Google Calendar event "FU: <name>" on
    date_str (YYYY-MM-DD), stacked into a 15-min slot within 3:30-4:30am
    (see _GCAL_FOLLOWUP_SCRIPT), with `description` as the event body
    text. Always inserts a fresh event -- multiple per person are
    allowed by design (see note above _GCAL_FOLLOWUP_SCRIPT). Returns
    (event_id, html_link). Raises RuntimeError with the subprocess's
    stderr on failure (bad/missing auth, invalid date, etc.)."""
    if not os.path.exists(config.CALENDAR_VENV_PY):
        raise RuntimeError(f"calendar-auto-buffer venv not found at {config.CALENDAR_VENV_PY}")
    result = subprocess.run(
        [config.CALENDAR_VENV_PY, "-c", _GCAL_FOLLOWUP_SCRIPT, display_name, date_str, description or ""],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "calendar event creation failed")
    data = json.loads(result.stdout.strip())
    return data["id"], data["link"]
