"""Move-forward (MVFWD) stats for the Tracker: how many prospects Stefan asked to bring their call forward, how many accepted
(= calls moved forward), how many declined, and how many moved-forward calls closed.

One record per call in live_docs/mvfwd.json, so a call counts once however often its label is changed:
  {call id: {"name", "callDate", "asked": "YYYY-MM-DD" | null, "outcome": "accepted" | "declined" | null, "outcomeAt": date, "closed": date | null}}
Asked = the tracker day the first texted / yes / no status was set; setting the label back to ?? or NA (or removing the marker)
takes the call out again. After every change the affected days are recounted and written to the four trackers with
tracker_store.set_day, so the numbers are always exact (never +1 on top of an old count)."""
import json
import os
import threading

import config
import tracker_store as store
import util

PATH = os.path.join(config.LIVE_DOCS_DIR, "mvfwd.json")
METRICS = [   # id, name, emoji, aliases
    ("mvfwd_asked", "MVFWD asked", "📲", ["move forward asked", "asked to move forward", "mvfwd asked"]),
    ("mvfwd_accepted", "MVFWD accepted", "⏩", ["moved forward", "calls moved forward", "mvfwd yes"]),
    ("mvfwd_declined", "MVFWD declined", "✋", ["move forward declined", "mvfwd no"]),
    ("mvfwd_closed", "MVFWD closes", "💰", ["moved forward closes", "mvfwd close", "closed after moving forward"]),
]
_LOCK = threading.Lock()


def _read():
    try:
        with open(PATH, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def ensure_metrics():
    """The four trackers exist (Sales section, counts, monthly view)."""
    metrics = store.load_metrics()
    have = {m["id"] for m in metrics}
    added = False
    for mid, name, emoji, aliases in METRICS:
        if mid not in have:
            metrics.append({"id": mid, "name": name, "emoji": emoji, "type": "count", "unit": "", "agg": "sum", "direction": "up", "targets": {},
                            "goal": None, "defaultPeriod": "m", "chart": "bar", "quick": [], "private": False, "group": "Sales",
                            "aliases": aliases, "archived": False, "multi": False, "rolling": 0, "starred": False})
            added = True
    if added:
        store.save_metrics(metrics)


def _recount(ledger, dates):
    for date in sorted(d for d in dates if d):
        counts = {
            "mvfwd_asked": sum(1 for r in ledger.values() if r.get("asked") == date),
            "mvfwd_accepted": sum(1 for r in ledger.values() if r.get("outcome") == "accepted" and r.get("outcomeAt") == date),
            "mvfwd_declined": sum(1 for r in ledger.values() if r.get("outcome") == "declined" and r.get("outcomeAt") == date),
            "mvfwd_closed": sum(1 for r in ledger.values() if r.get("closed") == date),
        }
        for mid, n in counts.items():
            store.set_day(mid, date, n if n else None, "from the MVFWD labels" if n else "")


def record(call_id, status, name="", call_date=""):
    """A call's move-forward label changed to pending (??) / texted / accepted / declined / na / none."""
    ensure_metrics()
    today = store.tracker_today()
    with _LOCK:
        ledger = _read()
        r = ledger.get(call_id) or {"name": name, "callDate": call_date, "asked": None, "outcome": None, "outcomeAt": None, "closed": None}
        if name:
            r["name"] = name
        if call_date:
            r["callDate"] = call_date
        touched = {r.get("asked"), r.get("outcomeAt"), r.get("closed")}
        if status in ("texted", "accepted", "declined"):
            r["asked"] = r.get("asked") or today
            if status == "texted":
                r["outcome"], r["outcomeAt"] = None, None
            elif r.get("outcome") != status:
                r["outcome"], r["outcomeAt"] = status, today
        else:   # back to ??, NA or no marker: not asked after all
            r.update(asked=None, outcome=None, outcomeAt=None, closed=None)
        touched |= {r.get("asked"), r.get("outcomeAt"), today}
        ledger[call_id] = r
        util.write_json(PATH, ledger, ensure_ascii=False, indent=1)
        _recount(ledger, touched)
        return r


def mark_closed(call_id=None, name=""):
    """A moved-forward call closed: counted once, on today. Finds the call by id, else by (part of) the name among accepted ones."""
    ensure_metrics()
    today = store.tracker_today()
    with _LOCK:
        ledger = _read()
        cid = call_id if call_id in ledger else None
        if not cid and name:
            needle = " ".join(name.lower().split())
            hits = [k for k, r in ledger.items() if needle in (r.get("name") or "").lower()]
            accepted = [k for k in hits if ledger[k].get("outcome") == "accepted"]
            pick = accepted or hits
            if len(pick) > 1:
                raise ValueError("more than one call matches: " + ", ".join(ledger[k]["name"] for k in pick))
            cid = pick[0] if pick else None
        if not cid:
            raise ValueError(f"no move-forward call matches '{name or call_id}'")
        r = ledger[cid]
        if r.get("closed"):
            return {**r, "note": "already counted as closed"}
        r["closed"] = today
        util.write_json(PATH, ledger, ensure_ascii=False, indent=1)
        _recount(ledger, {today})
        return r


def summary():
    ledger = _read()
    return {"asked": sum(1 for r in ledger.values() if r.get("asked")), "accepted": sum(1 for r in ledger.values() if r.get("outcome") == "accepted"),
            "declined": sum(1 for r in ledger.values() if r.get("outcome") == "declined"), "closed": sum(1 for r in ledger.values() if r.get("closed")),
            "calls": [{"name": r.get("name"), "callDate": r.get("callDate"), "asked": r.get("asked"), "outcome": r.get("outcome"), "closed": r.get("closed")}
                      for r in ledger.values() if r.get("asked")]}
