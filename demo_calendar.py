#!/usr/bin/env python3
"""Demo calendar: copies your real calendar (2 weeks back -> 2 weeks ahead) into another Google account's calendar with every person
anonymised, so Demo mode can show a realistic day without real clients. Run with the calendar-auto-buffer venv (like cal_day.py):
    demo_calendar.py --dry-run            -> prints how a sample of events would be rewritten; writes nothing
    demo_calendar.py --to you@gmail.com
What gets rewritten: Complimentary-session bookings get a fake US client (name, +1 (xxx) 555-01xx phone, example.com email, booking
id, Aloware link); any other event naming a client, a colleague or a setter gets fake names (the same person -> the same fake name
everywhere). Personal blocks keep their titles; descriptions, attendees, locations and reminders are left off (no notifications on the
demo account). Every copy is tagged csDemo=1, so a re-run replaces only the copies it made -- your own events there are never touched.
Added Oct 21 2026."""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys

CAL_DIR = os.environ.get("CALENDAR_BUFFER_DIR", os.path.expanduser("~/Desktop/calendar-auto-buffer"))
STUDIO = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CAL_DIR)
DAYS_BACK = DAYS_AHEAD = 14
FIRST = ["Emily", "Jessica", "Ashley", "Sarah", "Megan", "Lauren", "Rachel", "Amanda", "Brittany", "Nicole", "Heather", "Stephanie", "Kayla", "Danielle",
         "Michael", "Chris", "Matt", "Josh", "Tyler", "Brandon", "Justin", "Kevin", "Ryan", "Jason", "Linda", "Karen", "Donna", "Patricia", "Susan", "Deborah"]
LAST = ["Carter", "Mitchell", "Reynolds", "Brooks", "Hayes", "Sullivan", "Foster", "Bennett", "Coleman", "Jenkins", "Perry", "Powell", "Russell", "Griffin",
        "Hughes", "Myers", "Ford", "Hamilton", "Graham", "Wallace", "Woods", "Cole", "West", "Jordan", "Owens", "Reyes", "Fisher", "Ellis", "Harrison", "Gibson"]
PLAIN_WORDS = {"is", "a", "an", "the", "and", "works", "worked", "currently", "retired", "not", "has", "was", "who", "with", "at", "in", "of", "on", "for", "occupation"}
SETTERS = ["sam", "jo", "alex", "max", "lee", "kim", "ash", "ray"]
AREA = ["212", "310", "312", "415", "512", "617", "702", "305", "404", "206"]
SESSION_RE = re.compile(r"complimentary", re.I)


def h(s, n):   # the same real name -> the same pick, every run
    return int(hashlib.md5(s.lower().encode()).hexdigest(), 16) % n


def fake_name(real):
    return f"{FIRST[h(real, len(FIRST))]} {LAST[h(real + '#', len(LAST))]}"


def fake_first(real):
    return FIRST[h(real, len(FIRST))]


def fake_phone(real):
    return f"+1 ({AREA[h(real, len(AREA))]}) 555-01{h(real + 'p', 100):02d}"


# your colleagues and setters (renamed in the copies too) live in live_docs/demo_names.json on this Mac, not in the code:
# {"team": ["Full Name", ...], "setters": ["firstname", ...]}
_NAMES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "live_docs", "demo_names.json"))) \
    if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "live_docs", "demo_names.json")) else {}
TEAM = list(_NAMES.get("team") or [])


KNOWN_SETTERS = {str(s).lower() for s in (_NAMES.get("setters") or [])}
SETTER_WORDS = set(KNOWN_SETTERS)   # + any lowercase last word seen on 2+ bookings (people_in adds them)


def _client_of(title):
    """the client named in a booking title ('... Session - Jane Doe sam', 'Jane - Complimentary ...'), without the setter word"""
    if " - " not in title:
        return ""
    left, right = title.rsplit(" - ", 1)
    if SESSION_RE.search(right):            # 'Jane - Complimentary 1-on-1 ...': the name comes first
        left, right = right, left
        right = re.sub(r"^.*?\b(?:CNC|CONF|CANCELED|E)\b[-\s]*", "", right)
    right = re.sub(r"^[^A-Za-z]*(?:(?:NR|CONF|CNC|CANCELED|CH|E)\b[\s-]*)*", "", right)   # '✅ NR-Rachel Walker' -> 'Rachel Walker'
    last = re.search(r"\s+([a-z][\w-]*)$", right.strip())
    if last and last.group(1) in SETTER_WORDS:   # trailing setter ('sam', 'jo') -- a lowercase surname ('Jane doe') stays
        right = right.strip()[:last.start()]
    return re.sub(r"^CH\s*-\s*", "", right).strip()


def people_in(events):
    """everyone to hide: each booking's client (full name), follow-up names, and the team -- longest first, so 'Mary-Jane Doe'
    is replaced before 'Anne-Lise'"""
    full = set(TEAM)
    tails = {}
    for e in events:   # setters: a lowercase last word that shows up on two or more different bookings
        m = re.search(r"\s([a-z][\w-]*)$", e.get("summary") or "")
        if m and SESSION_RE.search(e.get("summary") or ""):
            tails.setdefault(m.group(1), set()).add(e.get("summary"))
    SETTER_WORDS.update(w for w, ts in tails.items() if len(ts) >= 2)
    for e in events:
        t = e.get("summary") or ""
        if SESSION_RE.search(t):
            c = _client_of(t)
            if c and len(c) > 2:
                full.add(c)
        m = re.match(r"^\W*FU:\s*(.+)$", t)
        if m:
            full.add(m.group(1).strip())
    pairs = {" ".join(n.split()[:2]) for n in full if len(n.split()) > 2}   # 'Jane Doe C' -> also 'Jane Doe'
    singles = {n.split()[0] for n in full if n.split() and len(n.split()[0]) > 2}
    return sorted(full | pairs | singles, key=len, reverse=True)


def anonymise(title, people):
    out = title
    for real in people:
        pat = re.compile(r"(?<![A-Za-z])" + re.escape(real) + r"(?![A-Za-z])", re.I)
        if pat.search(out):
            fake = fake_name(real) if " " in real else fake_first(real)
            out = pat.sub(fake, out)
    return out


def rewrite_session(title, people):
    client = _client_of(title)
    fake = fake_name(client or title)
    new = anonymise(title, people)
    new = re.sub(r"\s([a-z][\w-]*)$", lambda m: " " + SETTERS[h(m.group(1), len(SETTERS))], new)   # the setter word: a fake one
    return new, fake


def session_description(fake, booking_seed):
    email = fake.lower().replace(" ", ".") + "@example.com"
    return (f"Attendee:\n{fake} ({email})\n\nMeeting type\nComplimentary 1-on-1 Weight Loss Support Session\n\nTeam member:\nStefan Vrecic\n\n"
            f"Booking ID:\nBKNG-DEMO{h(booking_seed, 10**6):06d}\n\nAloware: https://talk.aloware.io/contacts/9{h(booking_seed, 10**7):07d}\n\n(Demo event — made-up details)")


def demo_copy(ev, names):
    title = ev.get("summary") or ""
    body = {k: ev[k] for k in ("start", "end", "colorId", "transparency") if k in ev}
    for k in ("start", "end"):
        body[k] = {x: body[k][x] for x in ("date", "dateTime", "timeZone") if x in body[k]}
    if SESSION_RE.search(title):
        new, fake = rewrite_session(title, names)
        body["summary"] = new
        body["description"] = session_description(fake, ev.get("id", title))
        body["location"] = fake_phone(fake)
    else:
        new = anonymise(title, names)
        if re.match(r"^\W*(SS WA|FU:|n-)", title):   # notes about one person: a surname we didn't know (e.g. the booking only said "Debbie") gets a fake one too
            new = re.sub(r"\b(" + "|".join(FIRST) + r")([ -])([A-Za-z][a-z'’]+)\b(?!-[A-Z][a-z]+\b(?:\s|$))",
                         lambda m: m.group(0) if m.group(3) in LAST or m.group(3).lower() in PLAIN_WORDS else f"{m.group(1)}{m.group(2)}{LAST[h(m.group(3), len(LAST))]}", new)
        body["summary"] = new
    body["reminders"] = {"useDefault": False, "overrides": []}
    body["extendedProperties"] = {"private": {"csDemo": "1", "csDemoFrom": ev.get("id", "")[:64]}}
    return body


def service_for(email=None):
    if email:
        os.environ["CAL_ACCOUNT"] = email
    else:
        os.environ.pop("CAL_ACCOUNT", None)
    import importlib
    import accounts
    import main
    importlib.reload(accounts)
    return main.get_service()


def main_cli():
    ap = argparse.ArgumentParser()
    ap.add_argument("--to", help="the demo calendar: an account signed in under Settings, or a calendar shared with the account in use")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    os.chdir(CAL_DIR)
    src = service_for(None)
    now = dt.datetime.now(dt.timezone.utc)
    events = src.events().list(calendarId="primary", timeMin=(now - dt.timedelta(days=DAYS_BACK)).isoformat(), timeMax=(now + dt.timedelta(days=DAYS_AHEAD)).isoformat(),
                               singleEvents=True, orderBy="startTime", maxResults=2500).execute().get("items", [])
    events = [e for e in events if e.get("status") != "cancelled" and "start" in e]
    names = people_in(events)
    copies = [demo_copy(e, names) for e in events]
    if a.dry_run or not a.to:
        seen = set()
        for e, c in zip(events, copies):
            if e.get("summary") != c["summary"] and c["summary"] not in seen:
                seen.add(c["summary"]); print(f"{(e.get('summary') or '')[:70]:72} -> {c['summary'][:70]}" + (f"  [{c.get('location')}]" if c.get("location") else ""))
        print(json.dumps({"events": len(copies), "renamed": sum(1 for e, c in zip(events, copies) if e.get("summary") != c["summary"]), "written": 0}))
        return
    import accounts
    if a.to in (accounts.load().get("tokens") or {}):
        dst, cal = service_for(a.to), "primary"
    else:   # not signed in: a calendar shared with the account in use (e.g. your personal calendar shared with the work account)
        dst, cal = service_for(None), a.to
        try:   # write access, not just a look: a public calendar can be listed without being shared
            probe = dst.events().insert(calendarId=cal, body={"summary": "Call Studio access check", "start": {"date": "2000-01-01"}, "end": {"date": "2000-01-02"},
                                                              "extendedProperties": {"private": {"csDemo": "1"}}}).execute()
            dst.events().delete(calendarId=cal, eventId=probe["id"]).execute()
        except Exception:
            print(json.dumps({"error": f"Can't open {a.to}'s calendar. Share it with your work account (Google Calendar -> Settings -> {a.to} -> "
                              "Share with specific people -> add your work email with 'Make changes to events'), then try again."}))
            return
    old = []
    page = None
    while True:
        r = dst.events().list(calendarId=cal, privateExtendedProperty="csDemo=1", singleEvents=True, maxResults=2500, pageToken=page).execute()
        old += [e["id"] for e in r.get("items", [])]
        page = r.get("nextPageToken")
        if not page:
            break
    def run(reqs):   # a batch doesn't raise for the requests inside it, so count each one's outcome
        done, errors = 0, []
        def cb(_id, _resp, exc):
            nonlocal done
            if exc is None:
                done += 1
            else:
                errors.append(str(exc)[:200])
        for i in range(0, len(reqs), 50):
            batch = dst.new_batch_http_request(callback=cb)
            for req in reqs[i:i + 50]:
                batch.add(req)
            batch.execute()
        return done, errors
    removed, _ = run([dst.events().delete(calendarId=cal, eventId=i) for i in old])
    written, errors = run([dst.events().insert(calendarId=cal, body=c) for c in copies])
    out = {"events": len(copies), "removed_old": removed, "written": written, "to": a.to}
    if errors:
        out["error"] = f"{len(errors)} of {len(copies)} events couldn't be written, e.g. {errors[0]}"
    print(json.dumps(out))


if __name__ == "__main__":
    main_cli()
