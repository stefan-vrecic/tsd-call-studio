# Call Studio Mobile

Android app (Kotlin, Jetpack Compose, Media3) for listening to calls by section on the phone, fully offline.
Design and reasoning: [PLAN.md](PLAN.md). Built and tested for an OPPO Reno4 5G (Android 10-12), tested on an Android 15 emulator.

## Using it
1. Mac: Call Studio sidebar, **📱 Export for phone**. Pick all or selected calls; keep "Include the audio" ticked the first time.
   Output: `~/Desktop/Call Studio Exports/Phone/Call Studio Phone <date>.zip` (about 2.5 GB for all 93 calls).
   Later, untick audio for a ~2 MB "info only" update (new marks, closers, sections, transcripts).
2. Move the zip to the phone (Google Drive, USB, any sharing app).
3. Phone: tap the zip and choose Call Studio, or Calls tab, menu, Import library. Audio already on the phone is skipped.

## Install the app (sideload)
Send `Call Studio Mobile.apk` to the phone, open it, and allow "install unknown apps" for the app you opened it from.
It is signed with the debug key, so a future build installs over it and keeps the library.

## Build
```
cd mobile
./gradlew :app:testDebugUnitTest          # 22 unit tests
./gradlew :app:assembleRelease            # app/build/outputs/apk/release/app-release.apk
```
Optional parity test against the real Mac data: export an info-only bundle, save the Mac's `/api/search-section?q=...`
responses as `mac_<query>.json` next to its `library.json`, then run the tests with `CS_PARITY_DIR=<that folder>`.

## Layout
`data/` models, filters + search, library store, zip importer, prefs. `player/` foreground media service + controller.
`ui/` Calls, Sections, Queue, Call, Now Playing, filter sheet. Bundle format: see `../phone_bundle.py`.
