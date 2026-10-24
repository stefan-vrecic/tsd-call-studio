# Call Studio – guide for AI assistants (Claude and ChatGPT/Codex)

This file is for any AI working with Stefan's Call Studio, whether it is the **voice command dock** or a coding session (Claude Code, Codex)
opened in this folder. Both providers use the same tools and the same rules.

## 1. The one rule
Read and change Call Studio data **through the tool API below**, not by editing files in `live_docs/` by hand. The tools validate input,
write atomically and keep the screen in sync (the Tracker tab refreshes itself every 5 seconds).

## 2. Server
- Runs at `http://127.0.0.1:8791` (Python, `server.py`). Not under launchd: after a restart run `cd "~/Downloads/TSD Calls/_studio" && nohup python3 server.py &`.
- Python edits need a restart; JS/CSS need a hard refresh. The React part (`frontend/`) needs `npm run frontend:build`.

## 3. The tool API
```
GET  /api/agent/tools                          -> {"tools":[{name, kind: read|write, description, args}]}
POST /api/agent/call  {"tool": "...", "args": {...}} -> {"ok": true, "result": ...}  or  {"ok": false, "error": "..."}
```
Example: `curl -s -X POST -d '{"tool":"followups_list","args":{}}' http://127.0.0.1:8791/api/agent/call`

Always call `GET /api/agent/tools` first: it is the source of truth for tool names and arguments (this file does not repeat them, so it can't go stale).

| Area | Tools |
|---|---|
| Navigate | `navigate` |
| Search | `transcripts_search`, `books_search` |
| Swipe Gallery | `swipe_list`, `swipe_add` |
| Follow-ups | `followups_list`, `followup_update` |
| Tracker | `tracker_read`, `tracker_log` (mode `add` or `set`) |
| Calendar / tasks | `calendar_day`, `calendar_create`, `todo_add`, `todos_list` |
| Lead Gen | `leadgen_list`, `leadgen_add`, `leadgen_update` |
| Buffers | `buffers_get`, `buffers_set` (off / 2 / 3 / 4) |
| Purchases | `purchases_list`, `purchase_add` |
| Agreements | `agreements_list`, `agreement_prepare` (drafts only) |

## 4. How the voice dock works (so you behave correctly inside it)
1. Fixed shortcuts run first with no AI (`open <page>`, `add 500 to steps`, `add X to my to-do list`, `create an event at 3pm called X`, call search).
2. Otherwise the app sends you the tool list and the command. **Reply with exactly one JSON object and nothing else:**
   - `{"calls":[{"tool":"followups_list","args":{}}, ...]}` to use tools (batch everything you already know you need)
   - `{"answer":"short plain-text reply"}` when done or when no tool is needed
3. The app runs your calls and returns the results; you may call more tools, up to 3 rounds, then give `answer`.
4. Provider details: ChatGPT = `codex exec` (read-only sandbox); Claude = `claude -p` in plan mode on the Haiku model (cheap routing).
   Both can only act through the tools, which is why the tool list is the safety boundary.

## 5. Rules (apply to both of you)
- **Never claim something was done unless a tool returned `ok: true`.** Never invent data – read it first.
- **Nothing is deleted** (there is no delete tool) and **nothing is sent to other people.** `agreement_prepare` matches a calendar event to a
  prospect and an agreement link and writes a draft; Stefan sends it himself. Agreement products need a link saved in the Agreements tab first.
- **Commissions are manual:** never add or change commission/revenue figures unless Stefan gives the numbers in the same message.
- Tracker "today" rolls over at 4am (so at 1am "today" is still yesterday's tracker day); calendar "today" rolls over at midnight.
- Dates: `today`, `yesterday`, `tomorrow` or `YYYY-MM-DD`. Calendar times are 24h `HH:MM`.
- Keep answers short and spoken-friendly. Don't read out ids.
- Anything outside the tools (editing code, files, other apps) is not available from the voice dock; say so briefly.

## 6. Data map (read-only knowledge; use the tools to change it)
- `live_docs/tracker/entries.json` + `metrics.json` – Tracker (grid, dashboard). The Google Calendar tracker event title is a separate copy
  kept in step by `~/Desktop/calendar-auto-buffer/update_tracker.py` (it pushes every change into Call Studio via `studio_sync.py`).
- `live_docs/followups.json`, `purchase-list.json`, `swipe.json`, `books.json` – single-purpose stores.
- `live_docs/records/<name>.json` – generic stores (`leadgen`, `agreements`, `todos`, `networking`, `workouts`, `resources`, ...). Registered in `routes/records.py`.
- Call transcripts and manifests are searched by `routes/transcript_search.py`; books by `routes/booksearch.py`.

## 7. Adding a new tool (for a coding session)
Write a function `def my_tool(a): ... return {...}` in `routes/agent.py` (raise `ValueError` for user-facing errors), add one `_t("my_tool", "read"|"write", "what it does", {"arg": "meaning"}, my_tool)`
line to `TOOLS`, restart the server. It then appears in `/api/agent/tools` and the voice dock automatically.

## 8. Other docs
`HANDOVER.md` – architecture, run commands, React frontend layout, current worktree state. `README.md` – overview.
