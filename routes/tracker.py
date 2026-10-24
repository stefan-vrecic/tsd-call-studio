"""The Tracker tab: metrics + entries (tracker_store.py)."""
import json
import re

import tracker_quick as quick
import tracker_store as store


def _body(handler):
    try:
        return json.loads(handler._read_body().decode("utf-8", errors="replace") or "{}")
    except ValueError:
        return None


def _value_error(metric, value):
    if metric and metric.get("type") == "rating" and value is not None and not 1 <= value <= 10:
        return f"{metric['name']} must be between 1 and 10"
    return None


def tracker_get(handler):
    handler._json(200, {"metrics": store.load_metrics(), "entries": store.load_entries(), "today": store.tracker_today(),
                        "questions": quick.QUESTIONS})
    return


def tracker_log(handler):
    """POST {"metric": id or name, "value": number, "date"?: "YYYY-MM-DD", "note"?: text}."""
    p = _body(handler)
    metrics = store.load_metrics()
    m = store.find_metric(metrics, str((p or {}).get("metric", "")))
    try:
        value = float((p or {}).get("value"))
    except (TypeError, ValueError):
        value = None
    date = str((p or {}).get("date") or "") or None
    if not m or value is None or (date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date)):
        handler._json(400, {"error": "need a tracker (its name or id), a number and optionally a date like 2026-10-15"})
        return
    error = _value_error(m, value)
    if error:
        handler._json(400, {"error": error})
        return
    handler._json(200, {"entry": store.add_entry(m["id"], value, date, (p or {}).get("note", "")), "metric": m["name"]})
    return


def tracker_set(handler):
    """POST {"metric": id, "date": "YYYY-MM-DD", "value": number or null} -- the Sheet sets a whole day (null clears it)."""
    p = _body(handler) or {}
    date, mid, value = str(p.get("date") or ""), str(p.get("metric") or ""), p.get("value")
    metrics = store.load_metrics()
    metric = next((m for m in metrics if m["id"] == mid), None)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date) or not metric:
        handler._json(400, {"error": "need a tracker id and a date"})
        return
    if value is not None:
        try:
            value = float(value)
        except (TypeError, ValueError):
            handler._json(400, {"error": "not a number"})
            return
        error = _value_error(metric, value)
        if error:
            handler._json(400, {"error": error})
            return
    removed, entry = store.set_day(mid, date, value)
    handler._json(200, {"removed": removed, "entry": entry})
    return


def tracker_delete(handler):
    p = _body(handler) or {}
    handler._json(200, {"removed": store.delete_entry(str(p.get("id", "")))})
    return


def tracker_quick(handler):
    """POST {"text": "taken 3 closed 1 fu ...", "date"?: "YYYY-MM-DD", "dry"?: true} -> what it reads (and, unless dry, logs it)."""
    p = _body(handler) or {}
    date = p.get("date") or None
    if date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(date)):
        handler._json(400, {"error": "bad date"})
        return
    items, problems = quick.parse(str(p.get("text") or ""))
    known = {m["id"]: m for m in store.load_metrics()}
    problems += [f"{i['word']} (no tracker {i['metric']})" for i in items if i["metric"] not in known]
    problems += [f"{i['word']} (must be 1–10)" for i in items if i["metric"] in known and _value_error(known[i["metric"]], i["value"])]
    items = [i for i in items if i["metric"] in known and not _value_error(known[i["metric"]], i["value"])]
    entries = [] if p.get("dry") else [store.add_entry(i["metric"], i["value"], date, i["note"], source="quick") for i in items]
    handler._json(200, {"items": items, "problems": problems, "entries": entries})
    return


def tracker_metric(handler):
    """POST a metric definition (create or update by id), or {"id": ..., "archived": true}."""
    p = _body(handler)
    if not p or not str(p.get("name") or p.get("id") or "").strip():
        handler._json(400, {"error": "a tracker needs a name"})
        return
    metrics = store.load_metrics()
    mid = p.get("id") or re.sub(r"[^a-z0-9]+", "_", str(p["name"]).lower()).strip("_")[:40]
    clean = {"id": mid, "name": str(p.get("name") or mid)[:60], "emoji": str(p.get("emoji") or "📊")[:4],
             "type": p.get("type") if p.get("type") in ("count", "minutes", "amount", "money", "rating", "yesno", "weight") else "count",
             "unit": str(p.get("unit") or "")[:10], "direction": p.get("direction") if p.get("direction") in ("up", "down", "limit") else "up",
             "targets": {k: float(v) for k, v in (p.get("targets") or {}).items() if k in ("d", "w", "m") and str(v) not in ("", "None")},
             "goal": float(p["goal"]) if p.get("goal") not in (None, "") else None,
             "defaultPeriod": p.get("defaultPeriod") if p.get("defaultPeriod") in ("d", "w", "m") else "d",
             "chart": p.get("chart") if p.get("chart") in ("bar", "line") else "bar",
             "quick": [float(x) for x in (p.get("quick") or [])][:5], "private": bool(p.get("private")),
             "group": str(p.get("group") or "Other")[:20], "aliases": [str(a)[:30] for a in (p.get("aliases") or [])][:8],
             "archived": bool(p.get("archived")), "hidden": bool(p.get("hidden")), "multi": bool(p.get("multi")), "starred": bool(p.get("starred")), "rolling": max(0, min(int(p.get("rolling") or 0), 60)),   # rolling: read as the average of the last N days (Body weight: 7)   # multi: a rating logged several times a day -> the day shows their average

             "color": p["color"] if re.fullmatch(r"#[0-9a-fA-F]{6}", str(p.get("color") or "")) else ""}
    clean["agg"] = p.get("agg") if p.get("agg") in ("sum", "avg", "last", "any") else {"rating": "avg", "weight": "last", "yesno": "any"}.get(clean["type"], "sum")
    for i, m in enumerate(metrics):
        if m["id"] == mid:
            metrics[i] = {**m, **clean}
            break
    else:
        metrics.append(clean)
    store.save_metrics(metrics)
    handler._json(200, {"metric": clean})
    return


def tracker_order(handler):
    """POST {"ids": [metric ids in the new order]} -- re-orders the trackers: the order within a section, and (the sections appear in the order their first tracker does)
    the order of the sections. Ids not listed keep their relative order after the listed ones; unknown ids are ignored."""
    p = _body(handler)
    ids = [str(i) for i in (p or {}).get("ids") or []]
    metrics = store.load_metrics()
    by_id = {m["id"]: m for m in metrics}
    new = [by_id[i] for i in dict.fromkeys(ids) if i in by_id]
    listed = {m["id"] for m in new}
    new += [m for m in metrics if m["id"] not in listed]
    store.save_metrics(new)
    handler._json(200, {"ok": True, "ids": [m["id"] for m in new]})
