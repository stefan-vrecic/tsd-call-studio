"""The Tracker's ❓ Questions list and its one-line logging: "taken 3 closed 1 fu sleep 7 bw 79.2 rev 3000 (Sarah)".

QUESTIONS is the list shown on the tab, word for word as Stefan wrote it. parse() turns a typed line into entries:
  <word> <number> [modifier] [(note)]   ... repeated, spaces or commas between.
  closed N            -> Calls closed +N and 1-call closes +N        (the default)
  closed N fu         -> Calls closed +N and Follow-up conversions +N  ("fu" / "follow up")
  meetings N [group]  -> 1-1 meetings with women, or 1-many with "group"
  8k / 8.5k           -> 8000 / 8500
Used by routes/tracker.py (/api/tracker-quick, the tab's box) and tracker_cli.py quick (chat).
"""
import re

QUESTIONS = [
    ("Sales", [("taken", "calls_taken"), ("closed", "closed"), ("followups", "followups"), ("trainingHours", "sales_training")]),
    ("Money", [("rev", "revenue"), ("comms", "commissions"), ("cashCollected", "cash_sales")]),
    ("Social", [("approaches", "approaches"), ("contacts", "contacts"), ("meetings", "meetings")]),
    ("Body", [("calories", "calories"), ("steps", "steps"), ("bw", "bodyweight"), ("mobility", "mobility")]),
    ("Mind", [("sleep", "sleep_quality"), ("enjoyment", "enjoyment"), ("meditation", "meditation"), ("affirmations", "affirmations"), ("church", "church")]),
    ("Hobbies", [("guitarMins", "guitar"), ("songsDanced", "songs_danced"), ("minsRead", "reading")]),
    ("Private", [("oralOrgasms", "private_a"), ("ejaculation", "private_b")]),
]

_norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
KEYS = {_norm(word): target for _, items in QUESTIONS for word, target in items}
KEYS.update({
    "calls": "calls_taken", "callstaken": "calls_taken", "close": "closed", "closes": "closed",
    "followup": "followups", "fus": "followups", "training": "sales_training", "traininghrs": "sales_training", "trainhours": "sales_training",
    "revenue": "revenue", "commissions": "commissions", "comm": "commissions", "cash": "cash_sales",
    "app": "approaches", "apps": "approaches", "approach": "approaches", "contact": "contacts", "meeting": "meetings",
    "cals": "calories", "cal": "calories", "kcal": "calories", "kcals": "calories", "weight": "bodyweight", "bodyweight": "bodyweight",
    "stretch": "mobility", "stretches": "mobility", "stretching": "mobility", "dynamicstretch": "mobility",
    "med": "meditation", "affirms": "affirmations", "affirmation": "affirmations",
    "guitar": "guitar", "songs": "songs_danced", "dance": "songs_danced", "danced": "songs_danced", "read": "reading", "reading": "reading",
    "oral": "private_a", "ejac": "private_b", "came": "private_b",
})

_ITEM = re.compile(
    r"([a-zA-Z][a-zA-Z \-]*?)\s*[:=]?\s*(-?\d+(?:\.\d+)?)(\s*k(?![a-z]))?"
    r"(?:\s*(fu|follow[ -]?up(?![a-z])|1[ -]?call|one[ -]?call|group|1-1|1to1|1:1))?"
    r"(?:\s*\(([^)]*)\))?", re.I)


def parse(text):
    """-> (items, problems). items: [{"metric", "value", "note", "word"}]; problems: words / bits it couldn't use."""
    items, problems, used = [], [], 0
    for mt in _ITEM.finditer(text or ""):
        gap = text[used:mt.start()].strip(" ,;\n\t")
        if gap:
            problems.append(gap)
        used = mt.end()
        word, num, k, mod, note = mt.group(1).strip(), float(mt.group(2)), mt.group(3), (mt.group(4) or "").lower(), (mt.group(5) or "").strip()
        value = num * 1000 if k else num
        target = KEYS.get(_norm(word))
        if not target:
            problems.append(f"{word} {mt.group(2)}")
            continue
        if target == "closed":
            fu = mod.startswith("f")
            tag = "FU" if fu else "1-call"
            items.append({"metric": "calls_closed", "value": value, "note": " · ".join(x for x in (tag, note) if x), "word": word})
            items.append({"metric": "followup_conversions" if fu else "one_call_closes", "value": value, "note": note, "word": word})
        elif target == "meetings":
            items.append({"metric": "meetings_women_group" if mod == "group" else "meetings_women_1to1", "value": value, "note": note, "word": word})
        else:
            items.append({"metric": target, "value": value, "note": note, "word": word})
    tail = (text or "")[used:].strip(" ,;\n\t")
    if tail:
        problems.append(tail)
    return items, problems
