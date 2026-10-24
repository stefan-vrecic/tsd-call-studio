"""The Tracker tab's own store (separate from the calendar tracker): a list of things you track (metrics) and a log of entries.

  live_docs/tracker/metrics.json   {"metrics": [ {id, name, emoji, type, unit, agg, direction, targets{d,w,m}, goal, defaultPeriod,
                                                   chart, quick[], private, group, aliases[], archived} ]}
  live_docs/tracker/entries.json   {"entries": [ {id, metric, date, value, note, at, source} ]}

type: count | minutes | amount | money | rating | yesno | weight.   agg (how entries of a day become the day's number): sum | avg | last | any.
direction: up (more is better) | down | limit (a ceiling, like calories).   The tracker day rolls over at 4am, like the calendar tracker.
"""
import datetime as dt
import json
import os
import re
import threading
import time
import uuid

import config
import private_profile
import util

DIR = os.path.join(config.LIVE_DOCS_DIR, "tracker")
METRICS_PATH = os.path.join(DIR, "metrics.json")
ENTRIES_PATH = os.path.join(DIR, "entries.json")
_lock = threading.Lock()


def _m(id, name, emoji, type, group, targets=None, default="d", chart="bar", unit="", direction="up", agg=None, quick=None, private=False, aliases=None, goal=None, multi=False, rolling=0, starred=False):
    agg = agg or {"rating": "avg", "weight": "last", "yesno": "any"}.get(type, "sum")
    return {"id": id, "name": name, "emoji": emoji, "type": type, "unit": unit, "agg": agg, "direction": direction, "targets": targets or {},
            "goal": goal, "defaultPeriod": default, "chart": chart, "quick": quick or [], "private": private, "group": group,
            "aliases": aliases or [], "archived": False, "multi": multi, "rolling": rolling, "starred": starred}


DEFAULT_METRICS = [
    # sales
    _m("calls_taken", "Calls taken", "📞", "count", "Sales", {"m": 90}, "m", "bar", quick=[1], aliases=["calls", "call"]),
    _m("calls_closed", "Calls closed", "✅", "count", "Sales", {"m": 27}, "m", "bar", quick=[1], aliases=["closes", "closed", "sales"]),
    _m("one_call_closes", "1-call closes", "1️⃣", "count", "Sales", {}, "m", "bar", quick=[1], aliases=["1 call close", "one call close"]),
    _m("followup_conversions", "Follow-up conversions", "🔁", "count", "Sales", {}, "m", "bar", quick=[1], aliases=["followup conversion", "follow up conversion"]),
    _m("deposits", "Deposits", "🪙", "count", "Sales", {}, "m", "bar", quick=[1], aliases=["deposit"]),
    _m("followups", "Follow-ups done", "📲", "count", "Sales", {"d": 5}, "d", "bar", quick=[1, 5], aliases=["follow up", "follow ups", "followup"]),
    _m("sales_training", "Sales training hours", "🎓", "amount", "Sales", {}, "w", "bar", unit="h", quick=[0.5, 1], aliases=["training hours", "sales training"]),
    _m("objections", "Objections handled", "🛡️", "count", "Sales", {}, "w", "bar", quick=[1], aliases=["objection"]),
    _m("meetings_1to1", "1-1 meetings", "🤝", "count", "Sales", {}, "w", "bar", quick=[1], aliases=["1-1 meetings", "one to one"]),
    _m("revenue", "Total revenue", "💵", "money", "Money", {}, "m", "bar", unit="$", quick=[], aliases=["rev", "sales revenue"]),
    _m("commissions", "Commissions", "💰", "money", "Money", {"m": 8000}, "m", "line", unit="$", quick=[], aliases=["comms", "commission"]),
    _m("cash_sales", "Cash collected (sales)", "🏦", "money", "Money", {}, "m", "bar", unit="$", quick=[], aliases=["cash collected", "sales cash", "cash collected sales", "cash sales"]),
    _m("cash_business", "Cash collected (business)", "💼", "money", "Money", {}, "m", "bar", unit="$", quick=[], aliases=["business cash", "cash collected business", "cash business", "personal business"]),
    # body & habits
    _m("approaches", "Approaches", "🚶", "count", "Social", {"w": 40}, "w", "bar", quick=[1, 3], aliases=["approach", "apps"]),
    _m("contacts", "Contacts exchanged", "📇", "count", "Social", {}, "w", "bar", quick=[1], aliases=["numbers", "contact"]),
    _m("meetings_women_1to1", "1-1 meetings with women", "☕", "count", "Social", {}, "w", "bar", quick=[1], aliases=["dates", "1-1 with women"]),
    _m("meetings_women_group", "1-many meetings with women", "👯", "count", "Social", {}, "w", "bar", quick=[1], aliases=["group meetings", "1-many"]),
    _m("calories", "Calories", "🍽️", "amount", "Body", {"d": 2400}, "d", "line", unit="kcal", direction="limit", quick=[], aliases=["cals", "kcal", "food"]),
    _m("steps", "Steps", "👣", "amount", "Body", {"d": 10000, "w": 70000}, "d", "bar", quick=[1000], aliases=["step"]),
    _m("bodyweight", "Body weight", "⚖️", "weight", "Body", {}, "d", "line", unit="kg", direction="down", goal=78.0, aliases=["weight", "bw"], rolling=7),
    _m("training", "Training minutes", "🏋️", "minutes", "Body", {"w": 300}, "w", "bar", unit="min", quick=[15, 30, 60], aliases=["gym", "workout", "training mins"]),
    _m("mobility", "Mobility exercises", "🤸", "rating", "Body", {}, "d", "bar", aliases=["mobility", "stretch", "stretches", "stretching", "dynamic stretch"]),
    _m("sleep_quality", "Sleep quality", "😴", "rating", "Mind", {"d": 8}, "d", "line", unit="/10", aliases=["sleep"]),
    _m("enjoyment", "Enjoyment of life today", "😊", "rating", "Mind", {"d": 8}, "d", "line", unit="/10", aliases=["enjoyment", "mood"], multi=True),
    _m("meditation", "Meditation", "🧘", "minutes", "Mind", {"d": 20}, "d", "bar", unit="min", quick=[5, 10, 20], aliases=["meditate", "meditation mins"]),
    _m("affirmations", "Affirmations", "🗣️", "count", "Mind", {"w": 1000}, "w", "bar", quick=[100, 500], aliases=["affirm", "affirms"]),
    _m("church", "Church visits", "⛪", "count", "Mind", {"w": 7}, "w", "bar", quick=[1], aliases=["church visit"]),
    _m("guitar", "Guitar minutes", "🎸", "minutes", "Hobbies", {"d": 90}, "d", "bar", unit="min", quick=[15, 30, 60], aliases=["guitar mins"]),
    _m("reading", "Dedicated reading time", "📖", "minutes", "Hobbies", {"d": 30}, "d", "bar", unit="min", quick=[10, 20, 30], aliases=["read", "reading mins"]),
    _m("songs_danced", "Songs danced", "💃", "count", "Hobbies", {}, "d", "bar", quick=[1, 3], aliases=["songs", "dance"]),
] + private_profile.metric_defaults()


def tracker_today():
    """The tracker's 'today': the local date of (now - 4h), same rule as the calendar tracker."""
    return (dt.datetime.now() - dt.timedelta(hours=4)).date().isoformat()


def _read(path, key, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f).get(key, default)
    except (OSError, ValueError):
        return default


def _write(path, key, value):
    os.makedirs(DIR, exist_ok=True)
    util.write_json(path, {key: value}, ensure_ascii=False)


def load_metrics():
    with _lock:
        metrics = _read(METRICS_PATH, "metrics", None)
        if metrics is None:                       # first run: your starting list
            metrics = DEFAULT_METRICS
            _write(METRICS_PATH, "metrics", metrics)
        return metrics


def save_metrics(metrics):
    with _lock:
        _write(METRICS_PATH, "metrics", metrics)


def load_entries():
    with _lock:
        return _read(ENTRIES_PATH, "entries", [])


def add_entry(metric, value, date=None, note="", source="manual", at=None):
    entry = {"id": uuid.uuid4().hex[:10], "metric": metric, "date": date or tracker_today(), "value": float(value),
             "note": (note or "")[:300], "at": at or int(time.time()), "source": source}
    with _lock:
        entries = _read(ENTRIES_PATH, "entries", [])
        entries.append(entry)
        _write(ENTRIES_PATH, "entries", entries)
    return entry


def delete_entry(entry_id):
    with _lock:
        entries = _read(ENTRIES_PATH, "entries", [])
        keep = [e for e in entries if e["id"] != entry_id]
        _write(ENTRIES_PATH, "entries", keep)
        return len(entries) - len(keep)


def replace_imported(new_entries):
    """The backfill from the calendar tracker: replaces earlier imports, keeps everything you logged by hand -- and skips a day you
    typed over in the Sheet (that number wins)."""
    with _lock:
        entries = [e for e in _read(ENTRIES_PATH, "entries", []) if e.get("source") != "import"]
        typed = {(e["metric"], e["date"]) for e in entries if e.get("source") == "sheet"}
        _write(ENTRIES_PATH, "entries", entries + [e for e in new_entries if (e["metric"], e["date"]) not in typed])


def set_day(metric, date, value, note=""):
    """The Sheet: make one tracker's day exactly `value` (None = empty). Its entries for that day are replaced by one."""
    with _lock:
        entries = _read(ENTRIES_PATH, "entries", [])
        removed = [e["id"] for e in entries if e["metric"] == metric and e["date"] == date]
        keep = [e for e in entries if not (e["metric"] == metric and e["date"] == date)]
        entry = None
        if value is not None:
            entry = {"id": uuid.uuid4().hex[:10], "metric": metric, "date": date, "value": float(value), "note": (note or "")[:300], "at": int(time.time()), "source": "sheet"}
            keep.append(entry)
        _write(ENTRIES_PATH, "entries", keep)
        return removed, entry


def find_metric(metrics, text):
    """A metric from something typed in chat: its id, its name, or an alias (case and spacing ignored)."""
    norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
    key = norm(text)
    for m in metrics:
        if m.get("archived"):
            continue
        if key in {norm(m["id"]), norm(m["name"])} | {norm(a) for a in m.get("aliases", [])}:
            return m
    for m in metrics:                              # then a unique "starts with"
        if not m.get("archived") and norm(m["name"]).startswith(key) and len(key) >= 3:
            return m
    return None
