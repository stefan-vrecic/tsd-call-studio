# Call Studio

Local tool for reviewing sales-call recordings: transcribe (whisper), review (Claude), then listen back by section,
search a section across every call, and export clips / chaptered audiobooks. Everything runs on 127.0.0.1.

Run: `python3 server.py` then open http://127.0.0.1:8791

## Layout
- `server.py` the HTTP server (static files, media, dispatch)
- `routes/` one file per area of the API; `routes/__init__.py` is the URL table
- `config.py` paths and tool locations (read as `config.NAME` everywhere so tests can repoint them)
- `pipeline.py` upload -> transcribe -> review -> manifest; `prompts.py` the review prompt
- `audiobook.py` whole-call audiobooks + Google Drive copy; `transcript_sync.py` copies every transcript to Drive `transcripts/`; `clips.py` the multi-clip basket exports
- `util.py`, `settings.py`, `srt.py`, `followup.py`, `manifests.py` small helpers
- `player.html` + `static/` the web page (plain scripts; load order is in `player.html`)
- `aloware_watch.py` watches Downloads for new Aloware recordings
- `drive_inbox.py` watches `My Drive/Aloware Calls`: a recording uploaded there (e.g. from the phone) is copied in, processed, gets its audiobook, and the original moves to `processed/`

Data (manifests, recordings, settings, clips) is not in the repo; see `.gitignore`.
