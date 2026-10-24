#!/usr/bin/env python3
"""Log to the Tracker tab from a terminal (this is how chat logging works: "add 3 approaches" -> tracker_cli.py log approaches 3).

    tracker_cli.py log <tracker> <value> [--note TEXT] [--date YYYY-MM-DD]     add an entry (a rating or weight is a reading, the rest add up)
    tracker_cli.py undo <tracker> [--date YYYY-MM-DD]                          remove that tracker's latest entry for the day
    tracker_cli.py quick "taken 3 closed 1 fu sleep 7" [--date D]                 a whole line, same as the Questions box (tracker_quick.py)
    tracker_cli.py today                                                       today's numbers for every tracker
    tracker_cli.py list                                                        the trackers and what they're called

<tracker> is a name, an id or an alias ("comms", "sleep", "1-call close"). Talks to the running Call Studio when it's up and edits the
files directly when it isn't.
"""
import argparse
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tracker_store as store

URL = "http://127.0.0.1:8791"


def _post(path, payload):
    req = urllib.request.Request(URL + path, data=json.dumps(payload).encode(), method="POST")
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read())


def _server_up():
    try:
        urllib.request.urlopen(URL + "/api/tracker", timeout=2).read(1)
        return True
    except Exception:
        return False


def day_value(metric, entries):
    vals = [e["value"] for e in sorted(entries, key=lambda e: e["at"])]
    if not vals:
        return None
    return {"sum": sum(vals), "avg": sum(vals) / len(vals), "last": vals[-1], "any": 1.0 if any(vals) else 0.0}[metric["agg"]]


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    lg = sub.add_parser("log"); lg.add_argument("tracker"); lg.add_argument("value", type=float); lg.add_argument("--note", default=""); lg.add_argument("--date", default=None)
    un = sub.add_parser("undo"); un.add_argument("tracker"); un.add_argument("--date", default=None)
    qk = sub.add_parser("quick"); qk.add_argument("text"); qk.add_argument("--date", default=None)
    sub.add_parser("today"); sub.add_parser("list")
    a = ap.parse_args()
    metrics = store.load_metrics()
    if a.cmd == "list":
        for m in metrics:
            if not m.get("archived"):
                print(f"{m['emoji']} {m['name']:32} id={m['id']:22} {m['type']}  aliases: {', '.join(m.get('aliases', []))}")
        return
    if a.cmd == "today":
        today = store.tracker_today()
        entries = [e for e in store.load_entries() if e["date"] == today]
        print("Tracker day:", today)
        for m in metrics:
            if m.get("archived"):
                continue
            v = day_value(m, [e for e in entries if e["metric"] == m["id"]])
            if v is not None:
                t = m["targets"].get("d")
                print(f"  {m['emoji']} {m['name']}: {v:g}{(' / ' + format(t, 'g')) if t else ''} {m.get('unit', '')}")
        return
    if a.cmd == "quick":
        if _server_up():
            d = _post("/api/tracker-quick", {"text": a.text, "date": a.date})
            entries, problems = d["entries"], d["problems"]
        else:
            import tracker_quick
            items, problems = tracker_quick.parse(a.text)
            entries = [store.add_entry(i["metric"], i["value"], a.date, i["note"], source="quick") for i in items]
        names = {m["id"]: m for m in metrics}
        for e in entries:
            m = names.get(e["metric"], {"emoji": "", "name": e["metric"], "unit": ""})
            print(f"logged {m['emoji']} {m['name']} {e['value']:g}{m.get('unit', '')}{'  (' + e['note'] + ')' if e['note'] else ''}  for {e['date']}")
        if problems:
            print("NOT LOGGED (didn't understand):", ", ".join(problems))
        return
    m = store.find_metric(metrics, a.tracker)
    if not m:
        sys.exit(f"No tracker called '{a.tracker}'. Try: tracker_cli.py list")
    if a.cmd == "log":
        if _server_up():
            e = _post("/api/tracker-log", {"metric": m["id"], "value": a.value, "date": a.date, "note": a.note})["entry"]
        else:
            e = store.add_entry(m["id"], a.value, a.date, a.note)
        day = [x for x in store.load_entries() if x["date"] == e["date"] and x["metric"] == m["id"]]
        print(f"logged {m['emoji']} {m['name']} {a.value:g}{m.get('unit', '')} for {e['date']}  (the day is now {day_value(m, day):g}{m.get('unit', '')})")
    else:
        date = a.date or store.tracker_today()
        mine = sorted([x for x in store.load_entries() if x["date"] == date and x["metric"] == m["id"]], key=lambda x: x["at"])
        if not mine:
            sys.exit("nothing to undo for that day")
        last = mine[-1]
        if _server_up():
            _post("/api/tracker-delete", {"id": last["id"]})
        else:
            store.delete_entry(last["id"])
        print(f"removed {m['name']} {last['value']:g} ({date})")


if __name__ == "__main__":
    main()
