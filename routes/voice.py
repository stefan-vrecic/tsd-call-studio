"""Voice command transcription, safe app actions, and AI routing for the global top dock."""
import datetime as dt
import json
import os
import re
import subprocess
import tempfile
import time
import uuid

import config
import tracker_store
from . import agent, day, records, voice_guide
import util


MAX_AUDIO_BYTES = 20 * 1024 * 1024
MAX_PROMPT_CHARS = 8000
def _tab_routes():
    """Spoken page names -> (tab key, label), built from the one tab list in static/js/tab-registry.js (its JSON between the
    /*TABS*/ ... /*END*/ markers): each tab's key, its sidebar label (e.g. "journal planner") and its extra "say" words."""
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "js", "tab-registry.js")
    with open(path, encoding="utf-8") as f:
        tabs = json.loads(re.search(r"/\*TABS\*/(.*?)/\*END\*/", f.read(), re.S).group(1))
    out = {}
    for t in tabs:
        for phrase in [t["key"], re.sub(r"[^a-z0-9]+", " ", t["label"].lower()).strip(), *t.get("say", [])]:
            out.setdefault(phrase, (t["key"], t["label"]))
    return out


# + a few words for a section of a tab (the view itself is picked by VOICE_VIEWS below)
VOICE_ROUTES = {**_tab_routes(), "workouts": ("tracker", "Workouts"), "workout": ("tracker", "Workouts"), "gym": ("tracker", "Workouts")}
HISTORY_PATH = os.path.join(config.LIVE_DOCS_DIR, "voice-history.json")
INSTRUCTIONS_PATH = os.path.join(config.LIVE_DOCS_DIR, "voice-instructions.txt")
DEFAULT_INSTRUCTIONS = """Keep responses concise and action-focused.

Useful Call Studio commands:
- Open [page], for example: Open Swipe Gallery.
- Search all calls for [words] section [section name] closer [closer name].
- Add [amount] to [tracker] today.
- Add [task] to my to-do list.
- Create an event at [time] today called [name].
- Create my roadmap diagram.

When swipe files or other local files are attached, use them as creative reference material. Identify the hook, structure, angle, and reusable idea before drafting new content. Never claim an app action succeeded unless Call Studio reports that it did."""


def _history():
    try:
        with open(HISTORY_PATH, encoding="utf-8") as f:
            value = json.load(f)
        return value if isinstance(value, list) else []
    except (OSError, ValueError):
        return []


def _remember(provider, prompt, status, payload):
    rows = _history()
    rows.insert(0, {"at": int(time.time()), "provider": provider, "prompt": prompt, "status": status,
                    "action": payload.get("action", "answer"), "answer": payload.get("answer") or payload.get("error", "")})
    util.write_json(HISTORY_PATH, rows[:200], ensure_ascii=False, indent=1)


def _reply(handler, code, payload, provider, prompt):
    _remember(provider, prompt, "ok" if code < 400 else "error", payload)
    handler._json(code, payload)


def voice_history(handler):
    handler._json(200, {"items": _history()})


def voice_history_clear(handler):
    with open(HISTORY_PATH, "w", encoding="utf-8") as f: json.dump([], f)
    handler._json(200, {"ok": True})


# ONE source of truth for both assistants (ChatGPT/Codex and Claude): the voice guide, live_docs/voice-guide.md (routes/voice_guide.py).
# The voice bar's "Instructions" panel and Settings -> Voice command -> 📖 Voice guide both read and write that same file, and
# _agent_loop sends its text, word for word, to whichever assistant is picked. (voice-instructions.txt is no longer used.)
def voice_instructions_get(handler):
    handler._json(200, {"instructions": voice_guide.read_guide()})


def voice_instructions_save(handler):
    body = _json_body(handler)
    value = str((body or {}).get("instructions") or "")[:voice_guide.MAX_BYTES]
    with open(voice_guide.PATH + ".part", "w", encoding="utf-8") as f:
        f.write(value)
    os.replace(voice_guide.PATH + ".part", voice_guide.PATH)
    handler._json(200, {"ok": True})


def _todo_action(prompt):
    match = re.match(r"^(?:please\s+)?(?:add|put|create)\s+(.+?)\s+(?:to|on)\s+(?:my\s+)?(?:general\s+)?to[ -]?do(?:\s+list)?[.!?]*$", prompt.strip(), re.I)
    if not match: return None
    text = match.group(1).strip(" .")
    doc = records.load_record("todos") or {"items": []}
    doc.setdefault("items", []).insert(0, {"id": uuid.uuid4().hex[:10], "text": text, "done": False, "created": int(time.time())})
    records.save_record("todos", doc)
    return {"provider": "app", "action": "todo", "answer": f"Added ‘{text}’ to your Home to-do list."}


def _call_search_action(prompt):
    if not re.search(r"\bsearch\b", prompt, re.I) or not re.search(r"\bcalls?\b", prompt, re.I): return None
    section = closer = ""
    m = re.search(r"\bsection\s+(.+?)(?=\s+(?:filter(?:ed)?\s+by|closer)\b|$)", prompt, re.I)
    if m: section = m.group(1).strip(" .")
    m = re.search(r"\b(?:filter(?:ed)?\s+by\s+)?closer(?:\s+name)?\s+(.+)$", prompt, re.I)
    if m: closer = m.group(1).strip(" .")
    quoted = re.search(r"[‘\"'](.+?)[’\"']", prompt)
    q = quoted.group(1) if quoted else ""
    if not q:
        m = re.search(r"\b(?:for|containing|mentions? of)\s+(.+?)(?=\s+section\b|\s+(?:filter(?:ed)?\s+by|closer)\b|$)", prompt, re.I)
        if m: q = m.group(1).strip(" .")
    if not (q or section): return {"error": "tell me the words or section to search for"}
    return {"provider": "app", "action": "call_search", "query": q, "section": section, "closer": closer, "route": "studio", "answer": "Opening the filtered call search."}


def _diagram_action(prompt):
    if re.search(r"\b(?:create|download|make)\b.*\b(?:miro|diagram|xml|roadmap|timeline map|dashboard map)\b", prompt, re.I):
        return {"provider": "app", "action": "download", "url": "/api/roadmap-diagram", "answer": "Created an editable diagram from your saved roadmap."}
    return None


# pages that are a section inside another page: "workouts" = Tracker -> Workouts (sent to the page as `view`)
VOICE_VIEWS = {"workouts": "workouts", "workout": "workouts", "gym": "workouts", "tracker sheet": "sheet", "sheet": "sheet",
               "tracker charts": "charts", "charts": "charts", "tracker dashboard": "dash", "dashboard": "dash"}


def _navigation_action(prompt):
    text = prompt.strip().rstrip("?.!").strip()
    text = re.sub(r"^(?:(?:hey|ok|okay)[, ]+)?(?:please[, ]+)?(?:(?:can|could|would|will)\s+you\s+(?:please\s+)?|i\s+(?:want|need)\s+(?:you\s+)?to\s+|let'?s\s+)?", "", text, flags=re.I)
    # "open the tracker", "go tracker tab", "Tracker tab", "tracker" -- a verb, a "tab/page" word, or just the page's name on its own
    match = re.match(r"^(?:please\s+)?(?P<verb>(?:open|show(?:\s+me)?|go(?:\s+to|\s+into)?|goto|take\s+me\s+to|switch\s+to|bring\s+up|jump\s+to|navigate\s+to|visit|head\s+to)\s+)?"
                     r"(?:the\s+|my\s+)?(?P<name>.+?)(?P<tab>\s+(?:page|tab|section|screen))?$", text, re.I)
    if not match:
        return None
    name = re.sub(r"\s+", " ", re.sub(r"[-_]+", " ", match.group("name").lower())).strip()
    name = {"followup": "follow up", "followups": "follow ups", "lead generation": "lead gen", "leadgen": "lead gen"}.get(name, name)
    # "tracker tab calories" -> the Tracker's Log, scrolled to that metric's box (which flashes)
    tm = re.match(r"^tracker(?:\s+(?:tab|page))?[\s,:-]+(.+)$", name)
    if tm:
        tracker_target = tm.group(1).strip()
        view = VOICE_VIEWS.get(tracker_target) or VOICE_VIEWS.get("tracker " + tracker_target)
        if view:
            label = tracker_target.title()
            return {"provider": "app", "action": "navigate", "route": "tracker", "view": view, "answer": f"Opening {label}."}
        metric = tracker_store.find_metric(tracker_store.load_metrics(), tracker_target)
        if metric:
            return {"provider": "app", "action": "navigate", "route": "tracker", "view": "log", "metric": metric["id"], "answer": f"Opening {metric['name']}."}
    target = VOICE_ROUTES.get(name) or VOICE_ROUTES.get(name + "s") or (VOICE_ROUTES.get(name[:-1]) if name.endswith("s") else None)
    if not target:
        return None   # not a page name we know: let the assistant work it out (it has the navigate tool and the page list)
    route, label = target
    out = {"provider": "app", "action": "navigate", "route": route, "answer": f"Opening {label}."}
    if VOICE_VIEWS.get(name):
        out["view"] = VOICE_VIEWS[name]
    return out


def voice_split(handler):
    """POST {"prompt"} -> {"nav": <navigation reply or null>, "rest": "<what's left for the assistant>"}. Instant (no AI): a command like
    "go to the tracker tab and what was my workout" switches page straight away, and only "what was my workout" waits for the assistant."""
    body = _json_body(handler) or {}
    prompt = str(body.get("prompt") or "").strip()
    whole = _navigation_action(prompt)   # "tracker tab, calories" is one place, not two commands
    if whole:
        handler._json(200, {"nav": whole, "rest": ""})
        return
    parts = [p.strip() for p in re.split(r"(?:[.?!;]+\s*|,\s*(?:and\s+|then\s+)?|\s+(?:and then|and|then|after that|also)\s+)", prompt, flags=re.I) if p and p.strip()]
    for i, part in enumerate(parts):
        nav = _navigation_action(part)
        if nav:
            rest = ". ".join(parts[:i] + parts[i + 1:]).strip()
            handler._json(200, {"nav": nav, "rest": rest})
            return
    handler._json(200, {"nav": None, "rest": prompt})


def _tracker_date(prompt):
    """Remove an optional date suffix and return (remaining prompt, tracker date)."""
    text = prompt.strip().rstrip("?.!").strip()
    match = re.search(r"\s+(?:(?:for|on|to)\s+)?(today|yesterday|\d{4}-\d{2}-\d{2})$", text, re.I)
    if not match:
        return text, tracker_store.tracker_today()
    label = match.group(1).lower()
    if label == "today":
        date = tracker_store.tracker_today()
    elif label == "yesterday":
        date = (dt.date.fromisoformat(tracker_store.tracker_today()) - dt.timedelta(days=1)).isoformat()
    else:
        try:
            date = dt.date.fromisoformat(label).isoformat()
        except ValueError:
            return text, None
    return text[:match.start()].strip(), date


def _tracker_action(prompt):
    """Execute narrowly defined tracker commands; return a response payload or None."""
    text, date = _tracker_date(prompt)
    if date is None:
        return {"error": "that tracker date is not valid"}
    text = re.sub(r"^(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?", "", text, flags=re.I)
    amount = r"(?P<amount>[-+]?(?:[$£€]\s*)?\d[\d,]*(?:\.\d+)?)"
    patterns = [
        ("add", rf"^(?:add|log|record)\s+{amount}\s+(?:to|for|in)\s+(?P<metric>.+)$"),
        ("add", rf"^(?:add|log|record)\s+{amount}\s+(?P<metric>.+)$"),
        ("set", rf"^(?:set|change)\s+(?P<metric>.+?)\s+to\s+{amount}$"),
    ]
    action = match = None
    for candidate, pattern in patterns:
        match = re.match(pattern, text, re.I)
        if match:
            action = candidate
            break
    if not match:
        return None
    raw_amount = re.sub(r"[$£€,\s]", "", match.group("amount"))
    try:
        value = float(raw_amount)
    except ValueError:
        return {"error": "I couldn't read that tracker amount"}
    metric = tracker_store.find_metric(tracker_store.load_metrics(), match.group("metric"))
    if not metric:
        return {"error": f"I couldn't find a tracker named {match.group('metric').strip()}"}
    if metric.get("type") == "rating" and not 1 <= value <= 10:
        return {"error": f"{metric['name']} must be between 1 and 10"}
    if action == "set":
        tracker_store.set_day(metric["id"], date, value, note="Voice command")
        verb = "Set"
    else:
        tracker_store.add_entry(metric["id"], value, date, "Voice command", source="voice")
        verb = "Added"
    shown = f"${value:,.2f}".rstrip("0").rstrip(".") if metric.get("type") == "money" else f"{value:g}{metric.get('unit') or ''}"
    day = "today" if date == tracker_store.tracker_today() else date
    return {"provider": "app", "action": "tracker", "answer": f"{verb} {shown} {'to ' if action == 'add' else 'for '}{metric['name']} for {day}."}


def _calendar_action(prompt):
    """Create a simple timed calendar event from common spoken phrasings."""
    text = prompt.strip().rstrip("?.!").strip()
    text = re.sub(r"^(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?", "", text, flags=re.I)
    if not re.match(r"^(?:add|create|make|schedule|at)\b", text, re.I):
        return None
    if not (re.search(r"\bevent\b", text, re.I) or re.match(r"^schedule\b", text, re.I)):
        return None
    time_match = re.search(r"\b(?:at|for)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", text, re.I)
    if not time_match:
        return {"error": "tell me what time to create the event, for example 10:30 AM"}
    hour, minute, meridiem = int(time_match.group(1)), int(time_match.group(2) or 0), (time_match.group(3) or "").lower()
    if meridiem:
        if not 1 <= hour <= 12:
            return {"error": "that event hour is not valid"}
        hour = hour % 12 + (12 if meridiem == "pm" else 0)
    if not 0 <= hour <= 23 or not 0 <= minute <= 59:
        return {"error": "that event time is not valid"}

    today = dt.date.fromisoformat(tracker_store.tracker_today())
    date_match = re.search(r"\b(today|tomorrow|\d{4}-\d{2}-\d{2})\b", text, re.I)
    date_label = date_match.group(1).lower() if date_match else "today"
    try:
        event_date = today if date_label == "today" else today + dt.timedelta(days=1) if date_label == "tomorrow" else dt.date.fromisoformat(date_label)
    except ValueError:
        return {"error": "that event date is not valid"}

    explicit_title = re.search(r"\b(?:called|named|titled|which is)\s+(.+)$", text, re.I)
    if explicit_title:
        title = explicit_title.group(1)
    else:
        scheduled = re.match(r"^schedule\s+(.+?)\s+(?:at|for)\s+\d", text, re.I)
        event_first = re.match(r"^(?:add|create|make|at)\s+(?:an?\s+)?(?:calendar\s+)?event\s+(.+?)\s+(?:at|for)\s+\d", text, re.I)
        title = (scheduled or event_first).group(1) if scheduled or event_first else ""
    title = re.sub(r"\s+\b(?:today|tomorrow)\b.*$", "", title, flags=re.I).strip(" ,:-")
    if not title:
        return {"error": "tell me the event name, for example ‘add an event at 10:30 AM today called Testing’"}

    start = f"{hour:02d}:{minute:02d}"
    result = day.create_calendar_event(title[:120], event_date.isoformat(), start, minutes=30, color="9")
    if result.get("error"):
        return {"error": f"calendar event was not created: {result['error']}"}
    when = "today" if event_date == today else "tomorrow" if event_date == today + dt.timedelta(days=1) else event_date.isoformat()
    answer = f"Created ‘{result.get('title', title)}’ {when}, {result.get('start', start)}–{result.get('end', '')}. View it in Today or Google Calendar."
    return {"provider": "app", "action": "calendar", "answer": answer, "link": result.get("link", "")}


def _json_body(handler):
    try:
        return json.loads(handler._read_body() or b"{}")
    except (ValueError, TypeError):
        return None


def voice_transcribe(handler):
    audio = handler._read_body()
    if not audio:
        handler._json(400, {"error": "record something first"})
        return
    if len(audio) > MAX_AUDIO_BYTES:
        handler._json(413, {"error": "voice recording is too large (20 MB maximum)"})
        return
    content_type = (handler.headers.get("Content-Type") or "").lower()
    suffix = ".ogg" if "ogg" in content_type else ".mp4" if "mp4" in content_type else ".webm"
    try:
        with tempfile.TemporaryDirectory(prefix="call-studio-voice-") as folder:
            source = os.path.join(folder, "voice" + suffix)
            wav = os.path.join(folder, "voice.wav")
            output = os.path.join(folder, "transcript")
            with open(source, "wb") as f:
                f.write(audio)
            converted = subprocess.run(
                [config.FFMPEG, "-loglevel", "error", "-y", "-i", source, "-ar", "16000", "-ac", "1", wav],
                capture_output=True, text=True, timeout=90,
            )
            if converted.returncode != 0:
                raise RuntimeError((converted.stderr or "could not read that recording")[-500:])
            transcribed = subprocess.run(
                [config.WHISPER_CLI, "-m", config.WHISPER_MODEL, "-of", output, "-otxt", "-np", "-nt", wav],
                capture_output=True, text=True, timeout=180,
            )
            transcript_path = output + ".txt"
            if transcribed.returncode != 0 or not os.path.isfile(transcript_path):
                raise RuntimeError((transcribed.stderr or transcribed.stdout or "Whisper did not produce a transcript")[-500:])
            with open(transcript_path, encoding="utf-8", errors="replace") as f:
                text = f.read().strip()
        if not text:
            handler._json(422, {"error": "I couldn’t hear any speech in that recording"})
            return
        handler._json(200, {"text": text})
    except subprocess.TimeoutExpired:
        handler._json(504, {"error": "voice transcription timed out"})
    except (OSError, RuntimeError) as exc:
        handler._json(500, {"error": f"voice transcription failed: {exc}"})


def voice_command(handler):
    body = _json_body(handler)
    if body is None:
        handler._json(400, {"error": "invalid JSON"})
        return
    provider = str(body.get("provider") or "").lower()
    prompt = str(body.get("prompt") or "").strip()
    if provider not in {"chatgpt", "claude"}:
        handler._json(400, {"error": "provider must be ChatGPT or Claude"})
        return
    if not prompt:
        handler._json(400, {"error": "say or type a command first"})
        return
    if len(prompt) > MAX_PROMPT_CHARS:
        handler._json(413, {"error": "command is too long"})
        return

    navigation_result = _navigation_action(prompt)
    if navigation_result:
        if navigation_result.get("error"):
            _reply(handler, 400, navigation_result, provider, prompt)
        else:
            _reply(handler, 200, navigation_result, provider, prompt)
        return

    tracker_result = _tracker_action(prompt)
    if tracker_result:
        if tracker_result.get("error"):
            _reply(handler, 400, tracker_result, provider, prompt)
        else:
            _reply(handler, 200, tracker_result, provider, prompt)
        return


    todo_result = _todo_action(prompt)
    if todo_result:
        _reply(handler, 200, todo_result, provider, prompt); return

    search_result = _call_search_action(prompt)
    if search_result:
        _reply(handler, 400 if search_result.get("error") else 200, search_result, provider, prompt); return

    diagram_result = _diagram_action(prompt)
    if diagram_result:
        _reply(handler, 200, diagram_result, provider, prompt); return

    calendar_result = _calendar_action(prompt)
    if calendar_result:
        if calendar_result.get("error"):
            _reply(handler, 400, calendar_result, provider, prompt)
        else:
            _reply(handler, 200, calendar_result, provider, prompt)
        return

    try:
        custom = ""   # (the voice guide is the only instructions now: added inside _agent_loop for both assistants)
    except OSError: custom = ""
    attachments = [str(x.get("path") or "") for x in body.get("attachments", []) if isinstance(x, dict) and x.get("path")][:10]
    try:
        payload = _agent_loop(provider, prompt, custom, attachments)
        _reply(handler, 200, payload, provider, prompt)
    except subprocess.TimeoutExpired:
        _reply(handler, 504, {"error": f"{provider.title()} took too long to answer"}, provider, prompt)
    except (OSError, RuntimeError) as exc:
        _reply(handler, 502, {"error": f"{provider.title()} could not answer: {exc}"}, provider, prompt)


def _ask_llm(provider, text):
    if provider == "claude":
        # tool routing is cheap work: Haiku, and none of Claude Code's own start-up (plugins, MCP servers, settings, skills, its big
        # system prompt) -- that start-up was ~13 s of every call; trimmed it's ~4-5 s (measured Oct 19 2026). (--bare would be faster
        # still but needs an API key; this Mac signs in with OAuth.)
        command = [config.CLAUDE, "-p", text, "--no-session-persistence", "--model", "haiku", "--tools", "", "--disable-slash-commands",
                   "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}', "--setting-sources", "", "--exclude-dynamic-system-prompt-sections",
                   "--system-prompt", "You are the JSON-only router of a voice assistant. Follow the instructions in the message exactly."]
    else:
        command = [config.CODEX, "--ask-for-approval", "never", "--sandbox", "read-only", "-C", config.STUDIO_DIR,
                   "exec", "--ephemeral", "--skip-git-repo-check", "--color", "never",
                   "-c", 'model_reasoning_effort="low"', "-c", "project_doc_max_bytes=0",   # routing is light work; same instructions as Claude, nothing extra
                   text]
    result = subprocess.run(command, capture_output=True, text=True, timeout=180)
    out = (result.stdout or "").strip()
    if result.returncode != 0 or not out:
        raise RuntimeError((result.stderr or result.stdout or "no response produced")[-700:].strip())
    return out


def _parse_json(text):
    start = text.find("{")
    while start != -1:
        depth = 0
        for k in range(start, len(text)):
            depth += (text[k] == "{") - (text[k] == "}")
            if depth == 0:
                try:
                    return json.loads(text[start:k + 1])
                except ValueError:
                    break
        start = text.find("{", start + 1)
    return None


def _quick_data(prompt=""):
    """Data that's free to read (local files), handed over up front so simple questions ("what was my workout yesterday", "how many
    follow ups") are answered in ONE model call instead of a tool round first (each call costs ~4-5 s)."""
    try:
        week = agent.call("tracker_read", {"days": 7})
        open_fu = agent.call("followups_list", {})
        values = week["result"]["values"] if week["ok"] else {}
        names = [m["name"] for m in tracker_store.load_metrics() if not m.get("archived") and not m.get("private")]
        workouts = agent.call("workouts_list", {"days": 7})
        today = dt.date.today()
        days = {(today - dt.timedelta(days=n)).strftime("%a %d %b"): (today - dt.timedelta(days=n)).isoformat() for n in range(8)}   # "Fri 16 Oct": "2026-10-16"
        wk = [{**e, "weekday": dt.date.fromisoformat(e["date"]).strftime("%A")} for e in (workouts["result"]["entries"] if workouts["ok"] else []) if e.get("date")]
        snap = {"dates": {"today": today.strftime("%A %Y-%m-%d"), "last_8_days": days},   # so "Friday" can't be mixed up with Saturday
                "workouts_last_7_days": wk,
                "pages": {"tracker": "#tracker", "tracker sheet (day by day)": "#tracker", "follow up tab": "#followup", "today / calendar": "#today", "roadmap": "#roadmap", "lead gen": "#leadgen"},
                "tracker_last_7_days": values,
                "trackers_with_nothing_logged_this_week": [n for n in names if n not in values],   # "workout yesterday?" -> Training minutes: nothing logged
                "follow_up_tab": ({**{k: open_fu["result"][k] for k in ("page", "open", "done")}, "newest_15": open_fu["result"]["items"][:15]}   # newest first, with call + Aloware links (15 keeps it quick)
                                  if re.search(r"follow|\bFU\b", prompt, re.I) else {"open": open_fu["result"]["open"], "page": "#followup"}) if open_fu["ok"] else None}
        if re.search(r"talk(ed)?\s+(to|with)|spoke|speak|chat(ted)?|met\b|meet|network|collab|catch up|caught up|who did i", prompt, re.I):
            nw = agent.call("networking_list", {})
            if nw["ok"]:
                snap["collab_and_networking"] = nw["result"]
        # the calendar costs a second or two, so only when the question is about it (saves a whole model round, ~5 s)
        if re.search(r"follow|\bFU\b|calendar|schedule|events?|meetings?|calls? (today|tomorrow)|what'?s on|agenda|talk(ed)?\s+(to|with)|spoke|who did i", prompt, re.I):
            when = "tomorrow" if re.search(r"tomorrow", prompt, re.I) else "today"
            cal = agent.call("calendar_day", {"date": when})
            if cal["ok"]:
                snap["calendar_" + when] = cal["result"]
        return ("QUICK DATA (already read for you; answer from it when it's enough, otherwise use tools):\n"
                + json.dumps(snap, ensure_ascii=False, separators=(",", ":"))[:16000] + "\n\n")
    except Exception:
        return ""


def _agent_loop(provider, prompt, custom, attachments, max_rounds=3):
    """The model picks Call Studio tools (routes/agent.py) as JSON; the app runs them and feeds results back until it answers."""
    tools = json.dumps([{"name": t["name"], "kind": t["kind"], "does": t["description"], "args": t["args"]} for t in agent.TOOLS.values()], separators=(",", ":"))
    intro = (
        "You are the concise voice assistant inside Stefan's Call Studio. You can read and change his data ONLY through the tools below.\n"
        f"Today is {dt.date.today().isoformat()} (tracker day {tracker_store.tracker_today()}).\n"
        "Reply with ONLY one JSON object, nothing else:\n"
        '  {"calls":[{"tool":"<name>","args":{...}}, ...]}   to use tools (batch every call you already know you need)\n'
        '  {"answer":"<short plain-text reply>"}              when you are done or no tool is needed\n'
        "SEVERAL THINGS AT ONCE (\"what was my workout on Friday, then go to the tab\", any order): do them all. Opening a page needs no "
        "second round: reply {\"calls\":[{\"tool\":\"navigate\",\"args\":{\"page\":\"tracker\"}}],\"answer\":\"...\"} together "
        "(\"the tab\" = the page the question is about: workouts/steps -> tracker, follow-ups -> follow up, events -> today).\n"
        "You are a router, not an agent: do NOT run shell commands, open files or use any tools of your own -- only the Call Studio TOOLS "
        "below, by naming them in your JSON. Both ChatGPT and Claude get these exact instructions.\n"
        "Never say something was done unless a tool result says ok:true. Never invent data: read it with a tool first. "
        "There is no delete and nothing is ever sent to other people; agreement_prepare only drafts.\n"
        "LINKS: when it helps Stefan jump there, put up to 3 links in the answer as markdown [label](link), using ONLY links found in "
        "the data: a page (\"page\" fields, e.g. #tracker, #followup, #today), a call or a moment in it (\"link\" fields like /?person=X&t=90), "
        "a calendar item (its \"url\"). Never make a link up.\n"
        "Follow-ups for a day (\"follow ups today\", \"who do I follow up with tomorrow\"): ALWAYS call BOTH followups_list AND calendar_day for that "
        "day (unless QUICK DATA already has that day's calendar), then answer with both: the Follow up tab people, plus the calendar followUps list (say they're from the calendar; done ones are ticked ✅).\n\n"
        f"TOOLS: {tools}\n"
        + (f"\nOwner instructions:\n{custom}\n" if custom else "")
        + (f"\nSTEFAN'S VOICE GUIDE (what his words mean -- follow it):\n{voice_guide.read_guide()[:8000]}\n" if voice_guide.read_guide().strip() else "")
        + ("\nAttached local files (use as inputs if relevant):\n" + "\n".join(attachments) + "\n" if attachments else "")
    )
    transcript, ran, ui = _quick_data(prompt) + f"User command: {prompt}", [], None
    for _ in range(max_rounds):
        raw = _ask_llm(provider, intro + "\n" + transcript)
        reply = _parse_json(raw)
        if not reply:
            return {"provider": provider, "action": "answer", "answer": raw}
        if reply.get("answer") is not None and not reply.get("calls"):
            payload = {"provider": provider, "action": "agent" if ran else "answer", "answer": str(reply["answer"]), "steps": ran}
            if ui:
                payload.update(ui)
            return payload
        calls = (reply.get("calls") or [])[:8]
        # an answer that comes with nothing but page-opening calls is final: open the page(s) and reply now (no extra round)
        nav_only = reply.get("answer") is not None and calls and all(str(c.get("tool")) == "navigate" for c in calls)
        results = []
        for c in calls:
            r = agent.call(str(c.get("tool", "")), c.get("args") or {})
            ran.append({"tool": c.get("tool"), "ok": r["ok"]})
            if r["ok"] and isinstance(r["result"], dict) and r["result"].get("ui"):
                ui = r["result"]["ui"]
            results.append({"tool": c.get("tool"), **r})
        if nav_only and all(r["ok"] for r in results):
            payload = {"provider": provider, "action": "agent", "answer": str(reply["answer"]), "steps": ran}
            if ui:
                payload.update(ui)
            return payload
        transcript += f"\n\nYou called tools. Results:\n{json.dumps(results, ensure_ascii=False)[:14000]}\n\nNow reply with JSON: more calls, or the final answer."
    return {"provider": provider, "action": "agent", "answer": "I ran out of steps before finishing: " + ", ".join(r["tool"] for r in ran), "steps": ran}
