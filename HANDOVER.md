# Call Studio: handover notes (written 16 Oct 2026)

Read this first if you are an assistant picking this project up. Stefan runs it on his Mac, usually leaves it open 24/7, and describes changes in plain English.

## Where things are
| What | Path |
|---|---|
| Call Studio (this project) | `/Users/stefanvrecic/Downloads/TSD Calls/_studio` |
| GitHub (private) | https://github.com/stefan-vrecic/tsd-call-studio (the remote is **behind**: many local commits are unpushed, Stefan has to `git push` from his own terminal) |
| Calendar auto-buffer + steps relay + tracker updater (a **separate** project, touches his real Google Calendar) | `/Users/stefanvrecic/Desktop/calendar-auto-buffer` |
| Track Sync Android app | `/Users/stefanvrecic/Desktop/HealthSync` (private repo `track-sync`) |
| Chapter Notes Android app | `/Users/stefanvrecic/Desktop/ChapterNotes` (private repo `chapter-notes`) |
| Recordings / transcripts | `/Users/stefanvrecic/Downloads/TSD Calls` (audio), `transcripts/`, Call Studio exports in `~/Desktop/Call Studio Exports` |

## Run it
`cd "/Users/stefanvrecic/Downloads/TSD Calls/_studio" && python3 server.py` then http://127.0.0.1:8791 (localhost only, nothing is exposed).
**Python edits need a server restart** (`pkill -f server.py; nohup python3 server.py &`); JS/CSS/HTML edits only need a hard refresh (Cmd+Shift+R). The server is NOT under launchd, so it is down after a reboot.

The new frontend also needs a build after anything under `frontend/` changes:

```sh
npm run frontend:check
npm run frontend:build
```

`npm test` runs both. The compiled files in `static/modern/` are what the Python server serves; no Node server runs in production.

## Layout
- `server.py` HTTP server; `routes/__init__.py` is the URL table (`exact()` / `prefix()`; GET matches the path without the query, POST matches the full path **with** the query). One file per area in `routes/`.
- `player.html` still contains the legacy page markup and ordered plain scripts. It now also mounts the React application in `#modern-root` and loads the compiled module from `static/modern/`.
- `frontend/` is the incremental React + TypeScript + Vite rewrite. It is deliberately divided into `api.ts`, `navigation.ts`, reusable components, pages and its own stylesheet. Vite builds it into `static/modern/modern-app.js` and `modern-app.css`.
- `static/js/*.js` one file per feature (`tracker-*.js`, `swipe-gallery.js`, `journal.js`, `content-items.js`, `networking.js`, `workouts.js`, `buffers.js`, `hover-peek.js`, `tab-layout.js` ...). `static/styles.css` is one big file (appended per feature).
- Generic document store: `routes/records.py` (`GET/POST /api/records?name=...`, whitelist `RECORDS`), client helper `recStore()` in `static/js/records.js`. Used by clients, accounting, delegation, networking, workouts, content ideas, agreements, sheet music metadata and Lead Gen.
- Tracker tab data: `tracker_store.py` + `routes/tracker.py` (`live_docs/tracker/metrics.json` + `entries.json`).
- Swipe gallery: `routes/swipe.py` (images, multi-picture items, videos, "waiting for the video" placeholders) + `static/js/swipe-gallery.js`.
- The first UX pass added a grouped left sidebar and separate Home dashboard in vanilla JS (`static/js/app-shell.js`, `home.js`, `quick-add.js`). That pass is commit `febc48c`.
- The **current uncommitted rewrite phase** replaces that visible shell, Home and Swipe Gallery with React + TypeScript. The legacy page remains mounted behind it: React owns `#home` and `#swipe`; every not-yet-migrated sidebar destination clicks its original hidden tab button and uses the original code. This is the compatibility bridge that keeps Call Studio usable during migration.
- The React Home dashboard independently reads the existing Today, Queue, Follow-ups, Swipe and Tracker APIs, so one slow card does not block the others. Universal Add supports call upload, social link, content idea and tracker shorthand; `Cmd/Ctrl+K` opens it.
- The React Swipe Gallery has grid/strip modes, image/video upload, pasted links/screenshots, drag-and-drop, local video hover preview, exact downloader progress, Retry, a full editor/viewer, source/title/link/response editing, original-link access and deletion. It reads and writes the same `live_docs/swipe.json`; there was no data migration.
- `static/js/live-call.js` now preserves the React-owned `#swipe` URL during legacy startup/back navigation. The lightweight legacy Home view sits behind modern screens instead of activating the old gallery twice.
- The React navigation bridge explicitly recognises direct call URLs (`/PersonName` and `?person=...`) as Call Studio, so a saved Home preference cannot cover a deep-linked call.
- Existing Settings now bridges live into the React shell: tab/link names, hide/unhide, tab colours, page colours, reset, top/side position, left/right/auto placement and Cmd-hover update the visible navigation immediately. Right-clicking a React sidebar destination offers Hide, with recovery through the eye icon in Settings. Items can be dragged to reorder them within their current section only; order persists in the existing `tabOrder` preference.
- The old call-review workspace was deliberately left unchanged. Its redesign is still explicitly **on hold**.
- Pasting an Instagram/TikTok/YouTube/Facebook video link into Swipe Gallery now starts a background `yt-dlp` download through `POST /api/swipe-download`. Progress is stored on the item in `live_docs/swipe.json`, rendered on its card with an exact percentage, and failed downloads have Retry. Public links work directly; login-gated posts currently surface the downloader error rather than borrowing browser cookies.
- Calendar reading/ticking for the Today tab: `cal_day.py`, run as a subprocess by `routes/day.py` with the calendar project's venv.
- `routes/day.py` now maintains a rolling five-minute Calendar cache for yesterday, today, tomorrow and two days ahead. Reading any one day warms the other three in background threads; successful tick, note, retime and split writes clear the cache immediately. `tests/test_day_cache.py` covers cached/invalidation and out-of-window behavior.
- Aloware downloads: `aloware_watch.py` (launchd `com.stefanvrecic.alowarewatch`) renames / joins / uploads recordings; `aloware_today.py` plans today's calls.

## Data (NOT in git, back it up!)
`live_docs/` (accounting, clients, delegation, journal pictures, tracker, workouts, content ideas, swipe pictures/videos, notes), `manifests/` (per-call data), `settings.json`, `clips.json`, `markers/`. Never commit these or any token / credential file. `live_docs/` currently has no backup.

## Adding a tab (touches several places, there is no single registry yet)
`player.html` (button in `#app-tabs` + a `<div id="X-view">` + a `<script>`), `static/js/live-call.js` (`STATIC_VIEWS`, `LIVE_TAB_KEYS`, the list in `showTab`, a click handler, the restore list), `static/js/settings-tab.js` (`stViews`). A single tab registry is the planned refactor.

### 2026-10-17: Tracker visual pass + configurable navigation hotkeys
- Tracker has a clearer title/caption area, compact section switcher, stronger cards, grouped section dividers, elevated summary/chart/table panels and responsive navigation. This is presentation-only: tracker storage, calculations, sync and logging behaviour were deliberately left unchanged.
- Settings now has a Hotkey column for every registered page or external-link tab. Click `Set hotkey`, press a modifier shortcut, and it saves in `localStorage` under `tabHotkeys`. Backspace/Delete clears while recording; Escape cancels; duplicates are rejected.
- macOS/browser-owned combinations such as Cmd+H, Cmd+W, Cmd+R, Cmd+L and Cmd+1–9 are intentionally blocked. Option-based combinations are the safest choice.
- Runtime lives in `static/js/tab-hotkeys.js`; Settings UI remains in `static/js/settings-tab.js`.
- Assigned hotkeys are shown as compact keyboard badges inside the React navigation items. Call Studio defaults to `Cmd+S` when that combination is unassigned. Settings includes a master `Enable custom navigation hotkeys` switch; disabling it preserves all assignments and dims their badges.
- Call Studio now automatically narrows and visually mutes the main React navigation rail while the call-library drawer is visible, creating a clearer two-drawer hierarchy. Other pages retain the normal sidebar width.
- Call priority numbers are plain high-contrast text (no pale circular badge). Purchase-list delete controls only exist for user-created items and now reveal on row hover/focus instead of resembling a persistent error marker.

For the modern sidebar, also add the destination to `frontend/src/types.ts` and `frontend/src/components/Sidebar.tsx`. The intended next refactor is a typed, shared tab registry so these lists stop drifting.

## Conventions Stefan expects
- Dark-backdrop pop-ups close on a click outside them and on Esc.
- Right-click menus are used a lot (tabs, tracker cards, swipe cards, call list).
- Before 5am still counts as the previous day (tracker); weeks start Monday.
- Always check a change in a browser; reset any test data you created; commit locally with a clear message (push only when he asks).
- Do not touch `buffers_paused.flag`, `buffer_mode.json` or the buffer logic in the calendar project without being asked: they edit his real calendar.
- Commissions in the tracker are manual: never change them unless he gives figures.

## Calendar auto-buffer (other project) in one paragraph
`buffer_logic.py` adds `aBuffer` events so he never has more than N calls in a row (N = 2/3/4 from `buffer_mode.json`; "off" = `buffers_paused.flag`). The long-running poller is launchd `com.user.calendar-auto-buffer` (restart after editing: `launchctl kickstart -k gui/$(id -u)/com.user.calendar-auto-buffer`). `steps_relay.py` reads phone messages over ntfy.sh (steps, +1 taps, Today-checklist ticks). `update_tracker.py` edits the daily tracker calendar event (flags like `--food`, `--church-visit`; all date lookups must only match an event that STARTS on that date).

## Known gaps / ideas
### Product decisions / backlog from the October UX session
- Approved and implemented: grouped navigation, Home as a separate tab, universal Add, real social-media download with percentage/retry.
- Explicitly held: redesigning the call-review workspace. Do not fold it into a migration unless Stefan reopens it.
- Future idea: an assisted Instagram Story poster using ADB/scrcpy. The safe concept is preview/confirm on desktop, then drive Stefan's connected Android phone for final posting. Treat this as a separate, brittle automation project, not part of the current rewrite.
- The wider dashboard is a core part of the product, not a side feature. The product moat is Stefan's accumulated workflow and internal thinking; preserve that structure rather than replacing it with generic AI UI.

### Rewrite roadmap
1. **Done in the uncommitted phase:** React/TypeScript/Vite foundation; modern shell; Home; universal Add; Swipe Gallery; legacy compatibility bridge.
2. Next good candidates: typed shared navigation registry and API contracts, then Tracker, Clients and Accounting one page at a time.
3. Keep the Python API and on-disk formats stable during migration. Do not do a big-bang rewrite.
4. Leave call review until the held redesign has a product decision.

### Other known gaps
- There are still no browser unit/integration tests; current verification is TypeScript + production build + real headless-browser screenshots/API checks.
- ~24 destinations are a lot; the shell now groups them, but information architecture can be tightened later.
- Tracker data still overlaps calendar events, the Tracker tab and steps relay.
- `player.html` and `static/styles.css` remain legacy monoliths. New work should live in focused React files rather than growing them; only bridge/fix legacy code where needed.
- The server should run under launchd and `live_docs/` needs a daily backup to Drive.

## Worktree state at this handover
- Stefan explicitly asked **not to commit the rewrite yet**. Expect modified `package.json`, `package-lock.json`, `player.html`, `static/js/live-call.js`, `static/styles.css`, plus new `frontend/` and generated `static/modern/` files.
- The latest committed baseline is `febc48c Add grouped dashboard shell and social downloads`.
- A completed transcript is now retained when the Claude-powered review stage fails: its manifest moves to `review_error`, the UI labels it "Transcript ready · AI review pending", and the audio/transcript remain usable. `tests/test_pipeline_review_failure.py` covers the failure path. JaneAugsburger's removed placeholder was restored from the completed local files.
- Demo mode now anonymises Follow Up names, Today calendar-event titles, Today's calls, the Aloware calls card, and the modern Home Today/processing cards. Spaced calendar names and compact recording stems share one fake identity, while stored data and operational links remain real.
- Tracker Dashboard and Charts now poll for external entry changes every five seconds while visible, so tracker updates made from chat appear without a page refresh. Forms are deliberately not auto-refreshed, preventing typed input from being discarded.
- One small requested visual fix is included in the uncommitted diff: Today previous/next arrows are larger, blue, higher contrast and gain a filled hover/focus state.
- Sidebar sections now have visible divider lines and stronger spacing/labels; Statement Box moved from Personal to Business at Stefan's request.
- Sidebar section headings now use distinct tinted labels/dots (Calls blue, Business amber, Content purple, Personal teal, etc.) so the navigation groups are easier to scan.
- The Agreements tab now has its own sticky library sidebar. Existing PandaDoc links live under Client agreements; My products starts with three editable product placeholders (name, agreement URL, notes, Open/Copy), supports add/delete, and persists in `live_docs/records/agreements.json` through `static/js/agreements.js`.
- Purchases now supports an editable, persistent page title plus user-added/deletable purchase rows. Custom rows retain the existing drag, star, tag, edit and total behavior and are stored in `live_docs/purchase-list.json`.
- Navigating away from Call Studio now strips the selected person's name from the path (`/AshleighScott#purchase` becomes `/#purchase`); a person path is restored only while that call workspace is open.
- Call Studio received a visual-only library/workspace refactor: clearer Calls header and count, primary upload action, compact drop target, grouped search/sort/filter controls, calmer call cards, common quick actions, rare bulk/maintenance tools inside a disclosure, and an intentional empty review workspace. Its processing logic and data flow were not rewritten.
- Personal now has a Music page (`static/js/sheet-music.js`) with a persistent visual sheet-music gallery. It accepts internal/HTTPS PDF links and multi-file PDF drag-and-drop anywhere on the page. Dropped files are stored under ignored `live_docs/sheet_music/` through `routes/sheet_music.py`; gallery metadata is `records/sheetmusic.json`. Sight Reading Factory is linked inside Music and as `SightReading` in the global Links group.
- Resources is a separate Business destination for clients and lead gen (`static/js/resource-library.js`, `records/resources.json`). Cards support Document, Video, Template, Tool, Folder, Link and Other types plus title, optional internal/HTTPS link, description and comma-separated tags; the view has search/type filtering and add/edit/delete. Double-clicking a card opens its editor.
- Learning is a separate Personal destination and owns the pre-existing Books and Videos shelves. The split is structural (`#learning-view` and its own route), not just two sidebar labels pointing to one page.
- Calls now has a personal Lead Gen pipeline (`static/js/lead-gen.js`, `records/leadgen.json`) with source/name/link/last-contact/follow-up fields, source/search filters and add/edit/delete. Double-clicking anywhere on a lead row (apart from its link/action controls) opens its editor. Due or overdue follow-ups sort first and receive an orange highlight. The starter set contains Balkan Sales Group; Tomy Talent, Jovan Bjelica, James Hayes, Hamza Malik, Dusan Bogdanovic, Jake Watson, Marty Kausylas, Ljiljana Ostojic and Nicolas Zapata from the supplied Facebook screenshots; JD Daley; Instagram leads Jason Cashman and Charlie Coad; and WhatsApp lead Shae Matthews. Unknown links and dates were intentionally left blank.
- The test Instagram Reel `https://www.instagram.com/reel/DeXAEJPxU0s/` is real user data in Swipe Gallery (`51b3081366a5.mp4`, title `Video by sitreps_actual`, source `Kyle Eberly`). Do not delete it as test cleanup.

## AI assistants
See `AGENT_GUIDE.md` for the tool API (`/api/agent/tools`, `/api/agent/call`) that Claude and ChatGPT use to read/change Call Studio data.
