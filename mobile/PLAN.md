# Call Studio Mobile: plan

Target phone: **OPPO Reno4 5G** (6.4" 1080x2400 AMOLED, 90 Hz, 8 GB RAM, 128 GB, ColorOS on Android 10-12). One hand,
mostly commuting/walking/at the gym, earphones in, screen often off. Everything below follows from that.

## 1. What the phone is for

Study other people's calls, one section at a time, without the Mac: "listen to 30 Desire sections back to back from
the closers I want to learn from, read the line I just heard, jump to the full call if it gets interesting."

The Mac stays the place where calls are transcribed, reviewed and marked. The phone is a **read-only listening and
study client** that carries its own copy of the files (Stefan wants the audio *on the phone*, not streamed from the Mac).

## 2. Feature triage

| Feature on the Mac | Phone? | Why |
|---|---|---|
| Listen to a call, seek, speed | **Yes** (core) | background + lock-screen + earphone buttons are mandatory on a phone |
| Section timeline, jump to a section | **Yes** | main way into a call |
| Search a section across all calls | **Yes** (core) | the reason for the app |
| Filter: Mine / Not mine / by closer (multi-select, counts) | **Yes** | same filters as the Mac, thumb-friendly sheet |
| Favourites | **Yes** (local only) | cheap, useful |
| Transcript (synced, tap to seek, in-call search) | **Yes** | read along; only for the ONE call/section that is playing |
| Transcript text search across all calls | **Yes** | phone can scan 93 transcripts in well under a second |
| Review summary (objections, recommendations, follow-up) | **Yes**, read-only tab | no cost, good for context |
| Play several things / pause / resume where you left | **Yes** | one player, a queue, and a remembered position per section |
| Queue of sections (the phone version of the clip basket) | **Yes** | plays 50 sections back to back with titles; persisted |
| A/B marker drag, exporting clips, audiobooks, zip | No | "further exporting is pointless" on a phone; the queue replaces the basket |
| Upload, transcribe, review, gap scan, base scripts | No | needs whisper + Claude (Mac only) |
| Rename, mark mine/closer, highlight, notes, Q&A, follow-up events, CRM | No | edits belong on the Mac; they arrive with the next library update |
| Several transcripts at once | No | can't fit; one transcript for what is playing |
| Several audio tracks at the same moment | No | physically pointless on one set of earphones. "Play multiple" = a queue + per-item resume |
| Demo mode, theme-per-page tweaks | No | follows the system dark/light setting |

## 3. Phone constraints and the decisions they force

1. **Playback must survive the screen turning off.** A foreground `MediaSessionService` (Media3) owns the player. That gives
   a notification, lock-screen controls, Bluetooth/earphone buttons and audio focus (pauses for calls, ducks for maps).
2. **ColorOS kills background apps aggressively.** A foreground media service with a MediaSession is the best defence; the
   Settings screen shows the three ColorOS toggles to flip once (battery > allow background activity, auto-launch, lock in
   recents). I cannot flip them for you.
3. **Android 10-12 scoped storage.** No broad storage permission is requested. Import uses the system file picker (works
   without permissions) and the app keeps its library in its own private folder. Android 13+ notification permission is
   requested lazily; if refused, playback still works.
4. **2.4 GB of audio.** Imported once, kept in app storage (about 2% of 128 GB). Files already on the phone (same name and
   size) are skipped on re-import, so updates don't re-copy everything.
5. **No network needed, ever.** No account, no cloud, nothing leaves the phone. Zero runtime permissions at install.
6. **Small screen = one job per screen.** Three bottom tabs, one persistent mini-player, one full-screen call view.
7. **One thumb.** Primary actions in the bottom half: bottom tabs, bottom filter sheet, mini-player; search fields at the top
   but filters one tap away at the bottom; touch targets 48 dp+; no drag-only interactions (reordering has buttons).

## 4. Navigation

```
Bottom tabs:   [ Calls ]   [ Sections ]   [ Queue ]          mini-player sits above the tabs
```

* **Calls**: search by name, chips `Mine | Not mine | Favourites`, a `Closers (n)` button opening the filter sheet, sort
  Newest/Priority. Each row: name, date, closer, outcome, priority, 🔥 highlight line. Tap opens the Call view.
* **Sections**: the cross-call search. Top: search box + horizontally scrolling chips of the most common sections with
  counts (Desire 70, FCOI 109 ...). Segmented `Section | Words` switches between section-name search and transcript
  text search. Same filter chips + `Closers` sheet. Results are cards: call, closer, `10:34-11:47 · 1:13`, description.
  Tap = play that section (stops at its end). The playing card expands to show that section's transcript, synced.
  `Play all (N)` loads every result as one playlist. `+` adds a card to the Queue.
* **Queue**: persisted list of sections. Play, move up/down, remove, clear, total time. Auto-advances.
* **Call view** (pushed over the tabs): header with the call, then three tabs `Sections | Transcript | Review`.
  Sections = the timeline (current one highlighted, tap to jump). Transcript = synced lines, tap a line to jump, search box,
  "follow" toggle. Review = objections, recommendations, follow-up, script coverage.
* **Now playing** (tap the mini-player): big seek bar with section ticks, -15s/+15s/prev/next, speed 1x-2.5x, sleep
  timer, the three transcript lines around the current position.
* **Menu (top right of Calls)**: Import library, library info, clear library, ColorOS tips.
* **First run**: empty state with one big "Import library" button and the 3 steps to get a bundle.

Back always goes up one level; from a tab root it exits. The mini-player is hidden on the Now playing sheet.

## 5. Getting files onto the phone (the "rar" question)

RAR is a proprietary format and nothing here can create it; `.zip` does the same job and opens natively on Android.

1. Mac: new **📱 Export for phone** button creates `Call Studio Phone <date>.zip` in `~/Desktop/Call Studio Exports/Phone/`:
   * `library.json`: every call's data (rows, closer, marks, review fields) + audio duration
   * `audio/<file>`: the recordings (copied as they are, stored not compressed since mp3 is already compressed)
   * `transcripts/<call>.json`: transcript lines `[start, end, speaker, text]`
   * Options: all calls / selected calls; include audio or "info only" (a tiny file for refreshing marks and closers).
2. Move the zip to the phone: Google Drive, USB cable, or any file-sharing app.
3. Phone: tap the zip in Files/Drive and choose **Call Studio**, or open the app and press Import. Progress bar; done.
4. Next time: export again, import again. Existing audio is skipped, info is replaced, favourites/queue/positions are kept.

## 6. Architecture (Kotlin, Jetpack Compose, Media3)

```
data/    Models.kt        Call, Row, TranscriptLine (kotlinx-serialization)
         LibraryStore.kt  library.json + audio files in app storage; atomic writes
         Importer.kt      streams the zip, merges, skips audio already present, reports progress
         Search.kt        filters, section search (same rule as the Mac), transcript search
         Prefs.kt         favourites, queue, positions, filter choice (SharedPreferences, JSON)
player/  PlaybackService  MediaSessionService + ExoPlayer, audio focus, noisy-headset pause
         PlayerController connects the UI to the service (MediaController), exposes StateFlows
ui/      Theme, MainScreen (tabs + mini-player), CallsScreen, SectionsScreen, QueueScreen, CallScreen,
         NowPlayingSheet, FilterSheet, Components, ImportScreen
App.kt   Application, MainActivity (handles ACTION_VIEW/SEND zips), AppViewModel
```

* **Section playback uses clipped media items** (`ClippingConfiguration` start/end). A section stops at its end, a queue of
  sections advances by itself, and the lock screen shows the section title. Whole-call playback is an unclipped item.
* **Resume**: positions are saved per section and per call (every few seconds and on pause), so switching between
  results and coming back picks up where you were.
* **Search** is in memory (about 1,000 timeline rows). Transcript search scans the transcript files on a background
  thread (about 11 MB of text).
* **No database**: the data is a few hundred KB of JSON plus audio files; a database would only add failure modes.
* minSdk 26, target 34, Kotlin 2.0.21, AGP 8.6.1, Gradle 8.9 (same as TabletJournal, so the toolchain is known to work here).

## 7. Testing plan

1. JVM unit tests: filter combinations and counts, section search parity with the Mac, import merge/skip logic.
2. Build the debug APK; run on an emulator shaped like the Reno4 5G (1080x2400).
3. Generate a real bundle with the Mac exporter (3 real calls) and import it on the emulator.
4. Drive the app with adb: filters, section search, playback of a clipped section, queue auto-advance, transcript sync,
   lock-screen/notification controls, rotation, process death and resume.
5. Differential check that the Mac exporter's `library.json` matches `/api/people` and `/api/search-section` for the same calls.

## 8. Out of scope for now (and what would unlock it)

* Live sync with the Mac: needs the Mac reachable (Tailscale); deliberately not done, files live on the phone.
* Play Store release: the APK is sideloaded (you allow "install unknown apps" for the app you open it from once).
* iPhone version: not requested.
