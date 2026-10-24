#!/usr/bin/env python3
"""Reads and ticks today's Google Calendar events for Call Studio's Today tab. Runs under the calendar-auto-buffer venv
(it has the Google libraries and the calendar login), as a short-lived process:

    cal_day.py list                          prints {"date": ..., "events": [...], "tracker": {...}} for today 8am-midnight, oldest first, sleep left out;
                                             "tracker" is the daily tracker event's counters (see parse_tracker), or null
    cal_day.py note --start ISO --text TEXT  adds a banana-coloured "n-TEXT" note event for one hour from that start time
    cal_day.py split --id ID --name1 A --name2 B   splits an event in two at its halfway point (to the nearest 5 minutes); both halves are named as given
    cal_day.py create --date YYYY-MM-DD --start HH:MM --title TEXT [--minutes 30] [--color 9]
                                             creates a timed event in the primary calendar
    cal_day.py tick --id ID --done 1|0 [--cross 1]   puts a status mark on that event's title (--done 0 takes it off; --cross 1 puts a red ❌ for cancelled / couldn't make it)

Marks follow the "tick" convention: green check = done, plain grey check = cancelled. Existing descriptions are never touched.
Set CAL_FAKE_FILE=<json file> to use pretend events instead of Google (used by the tests).
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
from zoneinfo import ZoneInfo

CAL_DIR = os.environ.get("CALENDAR_BUFFER_DIR", os.path.expanduser("~/Desktop/calendar-auto-buffer"))
DAY_START_HOUR = 8            # the window is 8am to midnight
MARK_RE = re.compile(r"^(?:\s*(?:✅|✓|✔️|✔|❌))+\s*")   # any status marks at the front of a title
DONE_RE = re.compile(r"^\s*(?:✅|✓|✔️|✔)")
CANCELLED_RE = re.compile(r"^\W*cancel", re.I)
SLEEP_RE = re.compile(r"\bsleep", re.I)
SS_RE = re.compile(r"^(?:\s*(?:✅|✓|✔️|✔|❌))*\s*SS\b")      # "SS WA <name> ..." call-background notes: not things to tick, so left out of the Today list
NOTE_RE = re.compile(r"^\s*n[-–]")                  # banana call notes ("n-did this and that") aren't things to tick
COMP_RE = re.compile(r"complimentary", re.I)
ALOWARE_RE = re.compile(r"https?://[^\s\"'<>]*aloware\.com[^\s\"'<>]*")
TRACKER_RE = re.compile(r"\|.*\|")   # the daily G/cals tracker (title like "a | b | c") has its own updater


# one counter in the tracker title: "mCalls 17/90", "dAffirms 2300/7k", "dSteps 8787", "G–0/120"
SEG_RE = re.compile(r"^\s*(?:([dwm])(?=[A-Z]))?([A-Za-z][A-Za-z.\s]*?)\s*[–:-]?\s*(\d[\d,.]*k?)\s*(?:/\s*~?(\d[\d,.]*k?))?\s*$")


def _num(text):
    """'2,300' -> 2300, '7k' -> 7000, '1.5k' -> 1500."""
    t = text.replace(",", "").lower()
    mult = 1000 if t.endswith("k") else 1
    try:
        return round(float(t.rstrip("k")) * mult)
    except ValueError:
        return None


def parse_tracker(title):
    """The tracker title's counters, in title order: [{"period": "d"|"w"|"m"|"", "label": "Calls", "value": 17, "goal": 90}, ...].
    Toggle segments ("mob ✅") come back as {"label": ..., "done": bool}; anything unreadable is skipped."""
    out = []
    for seg in MARK_RE.sub("", title).split("|"):
        seg = seg.strip()
        if not seg:
            continue
        if "✅" in seg or "❌" in seg:
            out.append({"period": "", "label": seg.replace("✅", "").replace("❌", "").strip(" :–-"), "done": "✅" in seg})
            continue
        m = SEG_RE.match(seg)
        if not m:
            continue
        value, goal = _num(m.group(3)), _num(m.group(4)) if m.group(4) else None
        if value is None:
            continue
        out.append({"period": m.group(1) or "", "label": m.group(2).strip(), "value": value, "goal": goal})
    return out


def week_totals(earlier, tracker, tz):
    """This week so far (Sunday to today) for each daily ("d") counter: {"Steps": 41200, ...}, summing the earlier days'
    tracker events and today's. One tracker per day (the first one found), so a stray duplicate can't double-count."""
    totals = {s["label"]: s["value"] for s in tracker["stats"] if s.get("period") == "d" and "value" in s}
    seen_days = set()
    for ev in earlier:
        title = ev.get("summary") or ""
        start = ev.get("start", {})
        when = start.get("dateTime") or start.get("date")
        if not when or ev.get("status") == "cancelled" or not TRACKER_RE.search(title):
            continue
        day = dt.datetime.fromisoformat(when).astimezone(tz).date() if "T" in when else dt.date.fromisoformat(when)
        if day in seen_days:
            continue
        seen_days.add(day)
        for s in parse_tracker(title):
            if s.get("period") == "d" and s["label"] in totals:
                totals[s["label"]] += s["value"]
    return totals


# Which calendar: "primary" of the signed-in account, unless Demo mode points at a calendar someone shared with that account
# (routes/day.py sets CAL_ID then, e.g. a personal calendar shared with the work account).
CAL_ID = os.environ.get("CAL_ID") or "primary"


def _service():
    os.chdir(CAL_DIR)
    sys.path.insert(0, CAL_DIR)
    from main import get_service
    return get_service()


def _shape(ev, tz):
    """One event in the shape the page wants, or None if it doesn't belong in the checklist."""
    title = ev.get("summary") or "(no title)"
    start, end = ev.get("start", {}), ev.get("end", {})
    if "dateTime" not in start or SLEEP_RE.search(title) or TRACKER_RE.search(title) or NOTE_RE.match(title) or SS_RE.match(title) or ev.get("status") == "cancelled":
        return None
    s = dt.datetime.fromisoformat(start["dateTime"]).astimezone(tz)
    e = dt.datetime.fromisoformat(end["dateTime"]).astimezone(tz)
    plain = MARK_RE.sub("", title)
    return {"id": ev["id"], "title": title, "label": ("❌ " if title.lstrip().startswith("❌") else "") + (plain or "(no title)"),
            "checked": bool(DONE_RE.match(title)), "start": s.strftime("%H:%M"), "end": e.strftime("%H:%M"), "startIso": s.isoformat(), "endIso": e.isoformat(), "_s": s,
            "colorId": ev.get("colorId", ""), "url": ev.get("htmlLink", "")}


def _call_info(ev, tz):
    """A live Complimentary call booked that day -> {name, aloware, start}; None for anything else or a cancelled one."""
    title = ev.get("summary") or ""
    plain = MARK_RE.sub("", title)
    if not COMP_RE.search(title) or CANCELLED_RE.match(plain) or title.lstrip().startswith("❌") or ev.get("colorId") == "1" \
            or ev.get("status") == "cancelled" or "dateTime" not in ev.get("start", {}) \
            or ((ev.get("extendedProperties") or {}).get("private") or {}).get("csSync") == "1":   # a CalendarSync copy, not a booking here
        return None
    # "... Support Session - Jane Doe sam": the name follows the last " - "; the last word is who booked it
    who = re.split(r"\s[-–]\s", plain)[-1].split()
    name = " ".join(who[:-1] if len(who) >= 3 else who)
    link = ALOWARE_RE.search(ev.get("description") or "")
    s = dt.datetime.fromisoformat(ev["start"]["dateTime"]).astimezone(tz)
    return {"id": ev["id"], "name": name, "aloware": link.group(0) if link else "", "start": s.isoformat(), "time": s.strftime("%H:%M"),
            "colorId": ev.get("colorId", ""), "title": title, "url": ev.get("htmlLink", "")}


def cmd_list(day=None):
    """day: 'YYYY-MM-DD' to show another day (the Today tab's ‹ › arrows); default today."""
    fake = os.environ.get("CAL_FAKE_FILE")
    if fake:
        with open(fake) as f:
            data = json.load(f)
        tz = ZoneInfo(data.get("timeZone", "UTC"))
        raw = data["events"]
        today = dt.date.fromisoformat(day) if day else dt.datetime.now(tz).date()
        week_raw = data.get("weekEvents", [])
    else:
        svc = _service()
        tzname = svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC")
        tz = ZoneInfo(tzname)
        today = dt.date.fromisoformat(day) if day else dt.datetime.now(tz).date()
        lo = dt.datetime.combine(today, dt.time(DAY_START_HOUR), tz)
        hi = dt.datetime.combine(today + dt.timedelta(days=1), dt.time(0), tz)
        raw = svc.events().list(calendarId=CAL_ID, timeMin=lo.isoformat(), timeMax=hi.isoformat(),
                                singleEvents=True, orderBy="startTime", maxResults=250).execute().get("items", [])
        monday = dt.datetime.combine(today - dt.timedelta(days=(today.weekday() + 1) % 7), dt.time(0), tz)   # the week's first day: Sunday
        week_raw = svc.events().list(calendarId=CAL_ID, timeMin=monday.isoformat(), timeMax=lo.isoformat(),
                                     singleEvents=True, orderBy="startTime", maxResults=500).execute().get("items", [])
    lo = dt.datetime.combine(today, dt.time(DAY_START_HOUR), tz)
    hi = dt.datetime.combine(today + dt.timedelta(days=1), dt.time(0), tz)
    out = []
    calls = []
    tracker = None
    for ev in raw:
        title = ev.get("summary") or ""
        call = _call_info(ev, tz)
        if call:
            calls.append(call)
        if TRACKER_RE.search(title) and ev.get("status") != "cancelled":
            # other "a | b | c" events exist too (e.g. "8k step | coffee | ✅ listening"), so the tracker is the one
            # with the most number counters (dC 780/2400 ...), not just the first one of the day
            stats = parse_tracker(title)
            counters = sum(1 for x in stats if "value" in x)
            if counters and (tracker is None or counters > tracker["_counters"]):
                tracker = {"id": ev["id"], "title": title, "stats": stats, "_counters": counters}
        shaped = _shape(ev, tz)
        if not shaped:
            continue
        s = shaped.pop("_s")
        end = dt.datetime.fromisoformat(ev["end"]["dateTime"]).astimezone(tz)
        if end <= lo or s >= hi:
            continue
        out.append((s, shaped))
    out.sort(key=lambda p: (p[0], p[1]["title"]))   # chronological
    if tracker is not None:
        tracker.pop("_counters")
        tracker["week"] = week_totals(week_raw, tracker, tz)
    calls.sort(key=lambda c: c["start"])
    print(json.dumps({"date": today.isoformat(), "events": [p[1] for p in out], "tracker": tracker, "calls": calls}))


def new_title(title, done, cross=False):
    base = MARK_RE.sub("", title)
    if cross:                  # cancelled / couldn't make it: a red cross at the start (replaces any other mark)
        return "❌ " + base
    if not done:
        return base
    return ("✓ " if CANCELLED_RE.match(base) else "✅ ") + base


def cmd_tick(event_id, done, cross=False):
    fake = os.environ.get("CAL_FAKE_FILE")
    if fake:
        with open(fake) as f:
            data = json.load(f)
        for ev in data["events"]:
            if ev["id"] == event_id:
                ev["summary"] = new_title(ev["summary"], done, cross)
                with open(fake, "w") as f:
                    json.dump(data, f)
                print(json.dumps({"ok": True, "title": ev["summary"]}))
                return
        raise RuntimeError("that event isn't there any more")
    svc = _service()
    ev = svc.events().get(calendarId=CAL_ID, eventId=event_id).execute()
    title = new_title(ev.get("summary") or "", done, cross)
    svc.events().patch(calendarId=CAL_ID, eventId=event_id, body={"summary": title}).execute()
    print(json.dumps({"ok": True, "title": title}))


def cmd_color(event_id, color):
    """Recolour one event (Call Studio's right-click No show / Cancelled on a calendar call): color = a Google colorId ("6" tangerine =
    no show, "1" lavender = cancelled, Stefan's call-outcome colours) or "" to clear it back to the calendar's default. Only complimentary
    calls are touched, so a wrong id can't recolour anything else."""
    svc = _service()
    ev = svc.events().get(calendarId=CAL_ID, eventId=event_id).execute()
    if not COMP_RE.search(ev.get("summary") or ""):
        raise RuntimeError("that event isn't a complimentary call")
    before = ev.get("colorId", "")
    svc.events().patch(calendarId=CAL_ID, eventId=event_id, body={"colorId": color or None}).execute()
    print(json.dumps({"ok": True, "colorId": color, "before": before}))


def cmd_desc_get(event_id):
    """An event's description (notes), for the Today tab's right-click -> Edit description. Google's own <br> line breaks come
    back as real ones so the text can be edited; any other markup (links) is left as it is."""
    ev = _service().events().get(calendarId=CAL_ID, eventId=event_id).execute()
    text = re.sub(r"<br\s*/?>", "\n", ev.get("description") or "", flags=re.I)
    print(json.dumps({"id": event_id, "title": ev.get("summary") or "", "description": text}))


def cmd_desc_set(event_id, text):
    _service().events().patch(calendarId=CAL_ID, eventId=event_id, body={"description": text}).execute()
    print(json.dumps({"ok": True}))


def cmd_note(start_iso, text):
    """The post-call reflection note: Banana (colorId 5), titled n-<text>, one hour from the call's start (the usual banana-note slot)."""
    s = dt.datetime.fromisoformat(start_iso)
    body = {"summary": "n-" + text.strip(), "colorId": "5",
            "start": {"dateTime": s.isoformat()}, "end": {"dateTime": (s + dt.timedelta(hours=1)).isoformat()}}
    fake = os.environ.get("CAL_FAKE_FILE")
    if fake:
        with open(fake) as f:
            data = json.load(f)
        data["events"].append({"id": "note%d" % len(data["events"]), "summary": body["summary"], "colorId": "5",
                               "start": body["start"], "end": body["end"]})
        with open(fake, "w") as f:
            json.dump(data, f)
    else:
        _service().events().insert(calendarId=CAL_ID, body=body).execute()
    print(json.dumps({"ok": True, "title": body["summary"]}))


def cmd_retime(event_id, day, start, end):
    """Moves an event to new start/end clock times on the given day (HH:MM, the calendar's own time zone).
    An end at or before the start runs into the next day (e.g. 23:30-00:15)."""
    fake = os.environ.get("CAL_FAKE_FILE")
    svc = None if fake else _service()
    tzname = "UTC"
    if fake:
        with open(fake) as f:
            data = json.load(f)
        tzname = data.get("timeZone", "UTC")
    else:
        tzname = svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC")
    tz = ZoneInfo(tzname)
    d = dt.date.fromisoformat(day)
    s = dt.datetime.combine(d, dt.time.fromisoformat(start), tz)
    e = dt.datetime.combine(d, dt.time.fromisoformat(end), tz)
    if e <= s:
        e += dt.timedelta(days=1)
    body = {"start": {"dateTime": s.isoformat(), "timeZone": tzname}, "end": {"dateTime": e.isoformat(), "timeZone": tzname}}
    if fake:
        for ev in data["events"]:
            if ev["id"] == event_id:
                ev.update(body)
                with open(fake, "w") as f:
                    json.dump(data, f)
                break
        else:
            raise RuntimeError("that event isn't there any more")
    else:
        svc.events().patch(calendarId=CAL_ID, eventId=event_id, body=body).execute()
    print(json.dumps({"ok": True, "start": s.strftime("%H:%M"), "end": e.strftime("%H:%M")}))


def cmd_create(title, day, start, minutes=30, color="9"):
    """Creates a timed event in the calendar's own timezone. General voice-created time blocks use Blueberry (colorId 9)."""
    fake = os.environ.get("CAL_FAKE_FILE")
    svc = None if fake else _service()
    if fake:
        with open(fake) as f:
            data = json.load(f)
        tzname = data.get("timeZone", "UTC")
    else:
        tzname = svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC")
    tz = ZoneInfo(tzname)
    begins = dt.datetime.combine(dt.date.fromisoformat(day), dt.time.fromisoformat(start), tz)
    ends = begins + dt.timedelta(minutes=max(5, min(int(minutes), 24 * 60)))
    body = {"summary": title.strip(), "colorId": str(color),
            "start": {"dateTime": begins.isoformat(), "timeZone": tzname},
            "end": {"dateTime": ends.isoformat(), "timeZone": tzname}}
    if fake:
        event_id = "voice%d" % len(data["events"])
        data["events"].append({"id": event_id, **body})
        with open(fake, "w") as f:
            json.dump(data, f)
        link = ""
    else:
        created = svc.events().insert(calendarId=CAL_ID, body=body).execute()
        event_id, link = created.get("id", ""), created.get("htmlLink", "")
    print(json.dumps({"ok": True, "id": event_id, "link": link, "title": body["summary"],
                      "date": day, "start": begins.strftime("%H:%M"), "end": ends.strftime("%H:%M")}))


def _halfway(start, end):
    """The midpoint between two datetimes, rounded to the nearest 5 minutes."""
    mid = start + (end - start) / 2
    minutes = round((mid.hour * 60 + mid.minute + mid.second / 60) / 5) * 5
    return mid.replace(hour=0, minute=0, second=0, microsecond=0) + dt.timedelta(minutes=minutes)


def cmd_split(event_id, name1, name2):
    """First half keeps the event (renamed, ends at the midpoint); the second half is a new event from the midpoint to the old end.
    Colour is copied to the new half; the description stays with the first half."""
    fake = os.environ.get("CAL_FAKE_FILE")
    if fake:
        with open(fake) as f:
            data = json.load(f)
        ev = next((e for e in data["events"] if e["id"] == event_id), None)
        if ev is None:
            raise RuntimeError("that event isn't there any more")
        start = dt.datetime.fromisoformat(ev["start"]["dateTime"]); end = dt.datetime.fromisoformat(ev["end"]["dateTime"])
        mid = _halfway(start, end)
        if not start < mid < end:
            raise RuntimeError("that event is too short to split")
        ev["summary"], ev["end"] = name1, {"dateTime": mid.isoformat()}
        data["events"].append({"id": ev["id"] + "b", "summary": name2, "start": {"dateTime": mid.isoformat()}, "end": {"dateTime": end.isoformat()}})
        with open(fake, "w") as f:
            json.dump(data, f)
        print(json.dumps({"ok": True, "mid": mid.isoformat()}))
        return
    svc = _service()
    ev = svc.events().get(calendarId=CAL_ID, eventId=event_id).execute()
    if "dateTime" not in ev.get("start", {}):
        raise RuntimeError("only events with a start time can be split")
    start = dt.datetime.fromisoformat(ev["start"]["dateTime"]); end = dt.datetime.fromisoformat(ev["end"]["dateTime"])
    mid = _halfway(start, end)
    if not start < mid < end:
        raise RuntimeError("that event is too short to split")
    tz = ev["start"].get("timeZone")
    def when(t):
        d = {"dateTime": t.isoformat()}
        if tz:
            d["timeZone"] = tz
        return d
    second = {"summary": name2, "start": when(mid), "end": when(end)}
    for key in ("colorId", "transparency", "visibility"):
        if ev.get(key):
            second[key] = ev[key]
    svc.events().insert(calendarId=CAL_ID, body=second).execute()          # the new half first: if this fails nothing has changed
    svc.events().patch(calendarId=CAL_ID, eventId=event_id, body={"summary": name1, "end": when(mid)}).execute()
    print(json.dumps({"ok": True, "mid": mid.isoformat()}))


FOOD_RE = re.compile(r"^\((\d{4})\)\s*[–-]\s*\+\s*(\d+(?:\.\d+)?)\s*calories?(?:\s*\((.*)\))?\s*$", re.I)


def cmd_food():
    """Today's food lines from the daily tracker event's description ("(1327) – +320 calories (Dark choc)"), for the tracker hover chart."""
    svc = _service()
    import update_tracker as ut
    ev = ut.find_today_tracker(svc)
    items = []
    if ev:
        text = re.sub(r"<br\s*/?>", "\n", ev.get("description") or "")
        for line in re.sub(r"<[^>]+>", "", text).splitlines():
            m = FOOD_RE.match(line.strip())
            if m:
                items.append({"time": m.group(1)[:2] + ":" + m.group(1)[2:], "cal": float(m.group(2)), "name": (m.group(3) or "").strip()})
    print(json.dumps({"items": items, "date": (ev["start"]["dateTime"][:10] if ev else None)}))


FU_RE = re.compile(r"follow[\s-]?ups?|\bFU\b|\bF/U\b", re.I)


def cmd_followups(day=None):
    """Follow-ups on the calendar for a WHOLE day (00:00-24:00, not the 8am window: Stefan's "FU: Name" reminders sit at ~3:30am):
    events titled FU / follow up (not banana notes), and client calls coloured flamingo (his "follow up" call colour)."""
    svc = _service()
    tz = ZoneInfo(svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC"))
    d = dt.date.fromisoformat(day) if day else dt.datetime.now(tz).date()
    lo, hi = dt.datetime.combine(d, dt.time(0), tz), dt.datetime.combine(d + dt.timedelta(days=1), dt.time(0), tz)
    raw = svc.events().list(calendarId=CAL_ID, timeMin=lo.isoformat(), timeMax=hi.isoformat(), singleEvents=True,
                            orderBy="startTime", maxResults=250).execute().get("items", [])
    items = []
    for ev in raw:
        title = ev.get("summary") or ""
        if ev.get("status") == "cancelled" or NOTE_RE.match(title):
            continue
        titled, flamingo = bool(FU_RE.search(title)), ev.get("colorId") == "4"
        if not (titled or flamingo):
            continue
        start = ev.get("start", {})
        when = dt.datetime.fromisoformat(start["dateTime"]).astimezone(tz).strftime("%H:%M") if "dateTime" in start else "all day"
        plain = MARK_RE.sub("", title).strip()
        m = re.match(r"^(?:FU|F/U|follow[\s-]?ups?)\s*[:\-–]\s*(.+)$", plain, re.I)
        name = m.group(1).strip() if m else (_call_info(ev, tz) or {}).get("name", "")
        items.append({"time": when, "title": title, "name": name, "done": bool(DONE_RE.match(title)), "url": ev.get("htmlLink", ""),
                      "why": "FU event" if titled else "call coloured flamingo (follow up)"})
    print(json.dumps({"date": d.isoformat(), "items": items}))


# "Text them to move the call forward" markers: a free 30-min event over the call's start, linked by a private moveUpFor=<call id>.
MOVEUP_TITLES = {"pending": "?? MVFWD", "texted": "texted MVFWD", "accepted": "yes MVFWD", "declined": "no MVFWD", "na": "NA MVFWD"}   # na = doesn't apply to this call


def _moveup_status(title):
    t = " ".join((title or "").lower().split())
    for status, name in MOVEUP_TITLES.items():   # the current names: "yes" = accepted, "no" = declined
        if t.startswith(name.lower()):
            return status
    # the older "TXT.MVFWD – YES" style, where YES meant texted
    t = t.upper()
    return "accepted" if "ACCEPTED" in t else "declined" if "DECLINED" in t else "texted" if "YES" in t else "pending"


def cmd_moveup_list(day=None):
    """{callId: {"id", "status"}} for the move-up markers on that day (today by default)."""
    svc = _service()
    tz = ZoneInfo(svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC"))
    d = dt.date.fromisoformat(day) if day else dt.datetime.now(tz).date()
    lo, hi = dt.datetime.combine(d, dt.time(0), tz), dt.datetime.combine(d + dt.timedelta(days=1), dt.time(0), tz)
    raw = svc.events().list(calendarId=CAL_ID, timeMin=lo.isoformat(), timeMax=hi.isoformat(), singleEvents=True, maxResults=250).execute().get("items", [])
    out = {}
    for ev in raw:
        call = ((ev.get("extendedProperties") or {}).get("private") or {}).get("moveUpFor")
        if call and ev.get("status") != "cancelled":
            out[call] = {"id": ev["id"], "status": _moveup_status(ev.get("summary"))}
    print(json.dumps({"date": d.isoformat(), "markers": out}))


def cmd_moveup_set(call_id, status):
    """Sets the move-up status of a call: pending (???) / texted / accepted / declined, making the marker if there isn't one;
    status "none" deletes the marker."""
    svc = _service()
    found = svc.events().list(calendarId=CAL_ID, privateExtendedProperty=f"moveUpFor={call_id}", singleEvents=True, maxResults=10).execute().get("items", [])
    found = [e for e in found if e.get("status") != "cancelled"]
    if status == "none":
        for e in found:
            svc.events().delete(calendarId=CAL_ID, eventId=e["id"]).execute()
        print(json.dumps({"ok": True, "status": ""}))
        return
    if found:
        svc.events().patch(calendarId=CAL_ID, eventId=found[0]["id"], body={"summary": MOVEUP_TITLES[status]}).execute()
    else:
        call = svc.events().get(calendarId=CAL_ID, eventId=call_id).execute()
        tzname = svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC")
        start = dt.datetime.fromisoformat(call["start"]["dateTime"])
        info = _call_info(call, ZoneInfo(tzname)) or {}
        svc.events().insert(calendarId=CAL_ID, body={
            "summary": MOVEUP_TITLES[status], "description": f"Text to move this call forward: {info.get('name', '')}",
            "start": {"dateTime": start.isoformat(), "timeZone": tzname}, "end": {"dateTime": (start + dt.timedelta(minutes=30)).isoformat(), "timeZone": tzname},
            "transparency": "transparent", "colorId": "3", "reminders": {"useDefault": False, "overrides": []},   # Grape
            "extendedProperties": {"private": {"moveUpFor": call_id, "moveUpName": info.get("name", "")}}}).execute()
    print(json.dumps({"ok": True, "status": status}))


OUTCOMES = {"10": "Closed won", "11": "Closed lost", "6": "No show", "9": "No offer / bad fit", "4": "Follow up", "1": "Cancelled", "8": "N/A", "5": "Notes"}
ALOWARE_ID_RE = re.compile(r"aloware\.com/contacts/(\d+)")


def cmd_sessions(since, until):
    """Every Complimentary session booked between two dates (the Calls -> Sessions tab), newest first: who, when, the outcome from
    the event colour (Stefan's call-outcome colours), any CONF/NR tag, and the prospect's Aloware contact (cleaned of Google's
    redirect wrapper)."""
    svc = _service()
    tz = ZoneInfo(svc.calendars().get(calendarId=CAL_ID).execute().get("timeZone", "UTC"))
    lo = dt.datetime.combine(dt.date.fromisoformat(since), dt.time(0), tz)
    hi = dt.datetime.combine(dt.date.fromisoformat(until) + dt.timedelta(days=1), dt.time(0), tz)
    raw, token = [], None
    while True:
        page = svc.events().list(calendarId=CAL_ID, timeMin=lo.isoformat(), timeMax=hi.isoformat(), singleEvents=True, orderBy="startTime",
                                 maxResults=2500, pageToken=token, q="Complimentary").execute()
        raw += page.get("items", [])
        token = page.get("nextPageToken")
        if not token:
            break
    out = []
    for ev in raw:
        title = ev.get("summary") or ""
        if not COMP_RE.search(title) or "dateTime" not in ev.get("start", {}) or NOTE_RE.match(title):
            continue
        plain = MARK_RE.sub("", title).strip()
        tag = (re.match(r"^\W*(CONF|NR|RS|CNC)\b", plain, re.I) or [None, ""])[1].upper()
        parts = re.split(r"\s[-–]\s", plain)
        if COMP_RE.search(parts[-1]):   # "Diane Wheatley - Complimentary ... Session": the name comes first (after any tags)
            before = [p for p in parts[:-1] if not COMP_RE.search(p)]
            name = re.sub(r"^(?:\s*(?:CANCELL?ED|CANC-?L|CONF|NR|RS|CNC|[EL])\b[\s:-]*)+", "", before[-1] if before else "", flags=re.I).strip()
        else:                           # "... Session - Heather Millar rudra": the name follows the last " - "; the last word is who booked it
            who = parts[-1].split()
            name = " ".join(who[:-1] if len(who) >= 3 else who)
        desc = ev.get("description") or ""
        aid = ALOWARE_ID_RE.search(desc)
        s = dt.datetime.fromisoformat(ev["start"]["dateTime"]).astimezone(tz)
        color = str(ev.get("colorId") or "")
        cancelled = ev.get("status") == "cancelled" or bool(CANCELLED_RE.match(plain)) or title.lstrip().startswith("❌") or color == "1"
        out.append({"id": ev["id"], "date": s.date().isoformat(), "time": s.strftime("%H:%M"), "name": name, "title": title, "tag": tag,
                    "outcome": "Cancelled" if cancelled else OUTCOMES.get(color, ""), "cancelled": cancelled, "done": bool(DONE_RE.match(title)),
                    "aloware": f"https://talk.aloware.com/contacts/{aid.group(1)}" if aid else "", "url": ev.get("htmlLink", "")})
    # the booking tool puts the setter's first name last ("Jane sam", "Mary jo"); a word that ends 3+ different bookings is a
    # setter, not a surname, so it comes off (a real surname like "Thompson" doesn't end that many)
    # -> typed in lower case, after 2+ different first names (a surname that recurs is the same person rebooking)
    firsts = {}
    for x in out:
        words = x["name"].split()
        if len(words) >= 2 and words[-1].islower():
            firsts.setdefault(words[-1], set()).add(words[0].lower())
    setters = {w for w, f in firsts.items() if len(f) >= 2}
    for x in out:
        words = x["name"].split()
        if len(words) >= 2 and words[-1] in setters:
            x["setter"] = words[-1]
            x["name"] = " ".join(words[:-1])
    out.sort(key=lambda x: (x["date"], x["time"]), reverse=True)
    print(json.dumps({"since": since, "until": until, "items": out, "setters": sorted(setters)}))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("food")
    ls = sub.add_parser("list")
    ls.add_argument("--date", default=None)
    mu = sub.add_parser("moveup-list")
    mu.add_argument("--date", default=None)
    ms = sub.add_parser("moveup-set")
    ms.add_argument("--call", required=True)
    ms.add_argument("--status", required=True, choices=["pending", "texted", "accepted", "declined", "na", "none"])
    fu = sub.add_parser("followups")
    fu.add_argument("--date", default=None)
    co = sub.add_parser("color")
    co.add_argument("--id", required=True)
    co.add_argument("--color", default="")
    se = sub.add_parser("sessions")
    se.add_argument("--since", required=True)
    se.add_argument("--until", required=True)
    sp = sub.add_parser("split")
    sp.add_argument("--id", required=True)
    sp.add_argument("--name1", required=True)
    sp.add_argument("--name2", required=True)
    n = sub.add_parser("note")
    n.add_argument("--start", required=True)
    n.add_argument("--text", required=True)
    dg = sub.add_parser("desc-get")
    dg.add_argument("--id", required=True)
    ds = sub.add_parser("desc-set")
    ds.add_argument("--id", required=True)
    ds.add_argument("--text", required=True)
    r = sub.add_parser("retime")
    r.add_argument("--id", required=True)
    r.add_argument("--date", required=True)
    r.add_argument("--start", required=True)
    r.add_argument("--end", required=True)
    c = sub.add_parser("create")
    c.add_argument("--date", required=True)
    c.add_argument("--start", required=True)
    c.add_argument("--title", required=True)
    c.add_argument("--minutes", type=int, default=30)
    c.add_argument("--color", default="9")
    t = sub.add_parser("tick")
    t.add_argument("--id", required=True)
    t.add_argument("--done", type=int, required=True)
    t.add_argument("--cross", type=int, default=0)
    a = ap.parse_args()
    try:
        if a.cmd == "food":
            cmd_food()
        elif a.cmd == "list":
            cmd_list(a.date)
        elif a.cmd == "moveup-list":
            cmd_moveup_list(a.date)
        elif a.cmd == "moveup-set":
            cmd_moveup_set(a.call, a.status)
        elif a.cmd == "followups":
            cmd_followups(a.date)
        elif a.cmd == "color":
            cmd_color(a.id, a.color)
        elif a.cmd == "sessions":
            cmd_sessions(a.since, a.until)
        elif a.cmd == "desc-get":
            cmd_desc_get(a.id)
        elif a.cmd == "desc-set":
            cmd_desc_set(a.id, a.text)
        elif a.cmd == "note":
            cmd_note(a.start, a.text)
        elif a.cmd == "retime":
            cmd_retime(a.id, a.date, a.start, a.end)
        elif a.cmd == "create":
            cmd_create(a.title, a.date, a.start, a.minutes, a.color)
        elif a.cmd == "split":
            cmd_split(a.id, a.name1, a.name2)
        else:
            cmd_tick(a.id, bool(a.done), bool(a.cross))
    except Exception as e:
        print(json.dumps({"error": str(e)[:400]}))
        sys.exit(1)


if __name__ == "__main__":
    main()
