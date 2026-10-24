#!/usr/bin/env python3
"""One-off (safe to repeat): fills the Tracker tab's history from the daily tracker events on your Google Calendar.

Run it with the calendar venv:  ~/Desktop/calendar-auto-buffer/venv/bin/python3 tracker_backfill.py [--since 2026-08-23]

Each day's tracker title holds running totals ("mCalls 17/90", "wApp. 5/100", "dC 2311/2400" ...). Daily counters (calories, guitar, steps,
affirmations) become that day's entry. Weekly / monthly running totals (approaches, church visits, calls) become the day's increase: today's
number minus the previous day's, starting again at 0 on Monday / on the 1st. Earlier imports are replaced; entries you logged by hand are kept.
Weekly/monthly history is only as good as the titles were: a title that was left with stale numbers can show a missing or doubled day.
"""
import argparse
import datetime as dt
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cal_day
import tracker_store as store

DAILY = {"g": "guitar", "c": "calories", "cal": "calories", "cals": "calories", "calories": "calories", "steps": "steps",
         "affirms": "affirmations", "affirmations": "affirmations", "kcals": "calories", "cardio": "training"}
CUMULATIVE = {  # label -> (tracker id, how it resets)
    "app.": ("approaches", "w"), "app": ("approaches", "w"), "a": ("approaches", "w"), "approaches": ("approaches", "w"),
    "churchvisits": ("church", "w"), "church visits": ("church", "w"),
    "calls": ("calls_taken", "m"),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default="2026-08-23")
    a = ap.parse_args()
    svc = cal_day._service()
    tz = cal_day.ZoneInfo(svc.calendars().get(calendarId="primary").execute().get("timeZone", "UTC"))
    lo = dt.datetime.fromisoformat(a.since + "T00:00:00").replace(tzinfo=tz)
    hi = dt.datetime.now(tz) + dt.timedelta(days=1)
    items, page = [], None
    while True:
        r = svc.events().list(calendarId="primary", timeMin=lo.isoformat(), timeMax=hi.isoformat(), singleEvents=True, orderBy="startTime",
                              maxResults=2500, pageToken=page).execute()
        items += r.get("items", [])
        page = r.get("nextPageToken")
        if not page:
            break
    days = {}                                    # date -> parsed counters of that day's tracker event (the first one found)
    for ev in items:
        title = ev.get("summary") or ""
        looks_like_tracker = cal_day.TRACKER_RE.search(title) or re.search(r"\b(?:d?G)\s*[–:-]?\s*\d+\s*/\s*\d+", title)   # older titles had only "G–35/120 | c–2400/2400"
        if "dateTime" not in ev.get("start", {}) or not looks_like_tracker or ev.get("status") == "cancelled":
            continue
        date = dt.datetime.fromisoformat(ev["start"]["dateTime"]).astimezone(tz).date().isoformat()
        days.setdefault(date, cal_day.parse_tracker(title))
    out, last = [], {}                           # last: (metric id, reset kind) -> (date, value)
    stamp = lambda d: int(time.mktime(dt.datetime.fromisoformat(d + "T22:00:00").timetuple()))
    for date in sorted(days):
        d = dt.date.fromisoformat(date)
        for s in days[date]:
            if "value" not in s:
                continue
            label = s["label"].lower().strip().rstrip(":").strip()
            if s["period"] in ("", "d") and label in DAILY and not (label in ("a",)):
                if s["value"] > 0:
                    out.append({"id": f"imp-{date}-{DAILY[label]}", "metric": DAILY[label], "date": date, "value": float(s["value"]), "note": "from the calendar tracker", "at": stamp(date), "source": "import"})
            elif label in CUMULATIVE and s["period"] in ("", "w", "m"):
                mid, reset = CUMULATIVE[label]
                key = (mid, reset)
                prev = last.get(key)
                same = prev and ((reset == "w" and dt.date.fromisoformat(prev[0]).isocalendar()[:2] == d.isocalendar()[:2]) or (reset == "m" and prev[0][:7] == date[:7]))
                delta = (s["value"] - prev[1]) if same else s["value"]
                last[key] = (date, s["value"])
                if delta > 0:
                    out.append({"id": f"imp-{date}-{mid}", "metric": mid, "date": date, "value": float(delta), "note": "from the calendar tracker", "at": stamp(date), "source": "import"})
            elif s["period"] == "w" and label in ("affirms", "affirmations"):
                pass                              # (weekly affirmations running total: the daily entries above already cover the older days)
    store.replace_imported(out)
    by = {}
    for e in out:
        by[e["metric"]] = by.get(e["metric"], 0) + 1
    print(f"{len(days)} tracker days read ({min(days)} to {max(days)}); {len(out)} entries imported:", by)


if __name__ == "__main__":
    main()
