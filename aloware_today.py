"""Today tab -> Aloware calls card: which of today's booked calls are already in Call Studio and which still need their recording.

  plan()          every call booked today with a status: in_library | downloaded | upcoming | in_progress | no_recording | no_link | pending
  request_text()  a ready-to-paste message listing the pending calls (the download itself is done in a Claude chat, one approval at a time)
  mark(id, status) record that a call was downloaded / had no recording, so a second press never asks for it again

Safe to check as often as you like. A call with no recording (a no-show or cancellation) is marked "no_recording" and left alone once it is
more than 3 hours old or has been tried twice."""
import datetime as dt
import json
import os
import re
import subprocess

import config
import util

STATE = os.path.join(config.STUDIO_DIR, "_aloware_downloads.json")
CAL_SCRIPT = os.path.join(config.STUDIO_DIR, "cal_day.py")


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _save_state(state):
    util.write_json(STATE, state, indent=1)


def _calendar(day=None, cmd="list", extra=()):
    py = config.CALENDAR_VENV_PY if os.path.exists(config.CALENDAR_VENV_PY) else "python3"
    r = subprocess.run([py, CAL_SCRIPT, cmd] + (["--date", day] if day else []) + list(extra), capture_output=True, text=True, timeout=60)
    for line in reversed((r.stdout or "").strip().splitlines()):
        try:
            return json.loads(line)
        except ValueError:
            continue
    raise RuntimeError((r.stderr or "no answer from the calendar helper").strip()[-300:])


def _norm(s):
    return re.sub(r"[^a-z]", "", s.lower())


def _camel(name):
    return "".join(w[:1].upper() + w[1:] for w in re.sub(r"[^A-Za-z' -]", "", name).replace("'", "").split())


def _library():
    """[(mm-dd or '', normalised name, call name)] for every call already in Call Studio."""
    out = []
    folder = getattr(config, "MANIFESTS_DIR", os.path.join(config.STUDIO_DIR, "manifests"))
    for fn in os.listdir(folder) if os.path.isdir(folder) else []:
        if fn.endswith(".json"):
            m = re.match(r"(\d{1,2})-(\d{1,2})-(.*)\.json$", fn)
            out.append((f"{int(m.group(1)):02d}-{int(m.group(2)):02d}", _norm(m.group(3)), fn[:-5]) if m else ("", _norm(fn[:-5]), fn[:-5]))
    return out


def plan(day=None):
    data = _calendar(day)
    ends = {e["id"]: e.get("endIso") for e in data.get("events", [])}
    now = dt.datetime.now().astimezone()
    state, lib = _load(STATE, {}), _library()
    calls = []
    for c in data.get("calls", []):
        start = dt.datetime.fromisoformat(c["start"])
        end = dt.datetime.fromisoformat(ends[c["id"]]) if ends.get(c["id"]) else start + dt.timedelta(hours=1)
        mmdd, name_n = start.strftime("%m-%d"), _norm(c["name"])
        st = state.get(c["id"], {})
        found = next((call for d, n, call in lib if n and name_n and d in ("", mmdd) and (name_n in n or n.startswith(name_n))), None)
        if found:
            status = "in_library"
        elif st.get("status") == "downloaded":
            status = "downloaded"
        elif start > now:
            status = "upcoming"
        elif now < end + dt.timedelta(minutes=5):
            status = "in_progress"
        elif not c.get("aloware"):
            status = "no_link"
        elif st.get("status") == "no_recording" and (st.get("attempts", 0) >= 2 or now - end > dt.timedelta(hours=3)):
            status = "no_recording"
        else:
            status = "pending"
        calls.append({**c, "stem": f"{mmdd}-{_camel(c['name'])}", "status": status, "end": end.isoformat(), "call": found})
    try:   # "text them to move it forward" markers (cal_day.py moveup-*): "pending" (???) / texted / accepted / declined
        markers = _calendar(day, "moveup-list").get("markers", {})
    except Exception:
        markers = {}
    for c in calls:
        c["moveUp"] = (markers.get(c["id"]) or {}).get("status", "")
    return {"date": data.get("date"), "calls": calls}


def request_text(calls, which="today's"):
    pending = [c for c in calls if c["status"] == "pending"]
    if not pending:
        return ""
    lines = "\n".join(f"- {c['name']} · {c['time']} · {c['aloware']} · name it {c['stem']} · id {c['id']}" for c in pending)
    return (f"Download {which} Aloware calls (skip any with no recording, those are no-shows or cancellations). Use the Aloware download flow and mark each one in "
            f"_aloware_downloads.json when done:\n{lines}")


def mark(event_id, status, name="", stem=""):
    if status not in ("downloaded", "no_recording"):
        raise ValueError("status must be downloaded or no_recording")
    state = _load(STATE, {})
    old = state.get(event_id, {})
    state[event_id] = ({"status": "downloaded", "name": name, "stem": stem, "at": dt.datetime.now().isoformat(timespec="seconds")} if status == "downloaded"
                       else {"status": "no_recording", "name": name, "attempts": old.get("attempts", 0) + 1, "at": dt.datetime.now().isoformat(timespec="seconds")})
    _save_state(state)
