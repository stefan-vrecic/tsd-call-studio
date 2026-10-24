"""Paths, tool locations and constants shared by every Call Studio module. Importing this first also puts the
Homebrew/nvm bin folders on PATH. Tests (and anything else) can point a path somewhere else by assigning to
the attribute here, e.g. config.AUDIOBOOKS_DIR = "...", because every module reads it as config.NAME."""
import glob
import json
import os
import shutil


# When this server gets started outside a normal login shell (a reboot
# auto-relaunch, launchd, Automator, etc.) PATH can come in stripped down
# to just /usr/bin:/bin:/usr/sbin:/sbin -- which silently breaks every
# shutil.which() lookup below (whisper-cli, ffmpeg, claude all live
# under Homebrew/nvm/~/.local, none of which are on that minimal PATH),
# and every upload then fails at "transcribing" with a bare
# FileNotFoundError. Belt-and-suspenders fix: make sure the directories
# these tools actually live in are always on PATH before resolving any
# of them, regardless of how/where this process was launched from.
_nvm_bins = sorted(glob.glob(os.path.expanduser("~/.nvm/versions/node/*/bin")), reverse=True)
for _extra_path in (
    "/opt/homebrew/bin", "/usr/local/bin",
    os.path.expanduser("~/.local/bin"),
    *_nvm_bins,  # newest nvm-installed node version first, if any are present
):
    if _extra_path not in os.environ.get("PATH", "").split(os.pathsep):
        os.environ["PATH"] = _extra_path + os.pathsep + os.environ.get("PATH", "")

PORT = 8791
STUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
try:
    with open(os.path.join(STUDIO_DIR, "local_config.json"), encoding="utf-8") as _config_file:
        LOCAL_CONFIG = json.load(_config_file)
except (OSError, ValueError):
    LOCAL_CONFIG = {}
FOLDER = os.path.dirname(STUDIO_DIR)  # ".../tsd calls"
AUDIO_DIR = os.path.join(FOLDER, "audio-recordings")
TRANSCRIPTS_DIR = os.path.join(FOLDER, "transcripts")
TRANSCRIPTS_TXT_DIR = os.path.join(TRANSCRIPTS_DIR, "txt")
REVIEWS_DIR = os.path.join(FOLDER, "reviews-follow-along")
TIMESTAMPS_DIR = os.path.join(FOLDER, "timestamps")
MARKERS_DIR = os.path.join(STUDIO_DIR, "markers")   # <call>.json {"markers": [{"a", "b", "label"}]}: ranges handed to the player (e.g. times Stefan pasted in chat)
MANIFESTS_DIR = os.path.join(STUDIO_DIR, "manifests")
EXPORTS_ROOT = os.path.join(os.path.expanduser("~/Desktop"), "Call Studio Exports")
SETTINGS_PATH = os.path.join(STUDIO_DIR, "settings.json")
LIVE_DOCS_DIR = os.path.join(STUDIO_DIR, "live_docs")  # the script + objections PDFs shown on the Live Call tab
STATIC_DIR = os.path.join(STUDIO_DIR, "static")  # the page's stylesheet and scripts
AUDIOBOOKS_DIR = os.path.join(FOLDER, "audiobooks")
os.makedirs(AUDIOBOOKS_DIR, exist_ok=True)
BASE_SCRIPTS_DIR = os.path.join(STUDIO_DIR, "base_scripts")
BASE_SCRIPTS_RAW_DIR = os.path.join(BASE_SCRIPTS_DIR, "_raw")
BUILDER_JS = os.path.join(STUDIO_DIR, "build_followalong.js")
CALENDAR_BUFFER_DIR = os.path.expanduser("~/Desktop/calendar-auto-buffer")
CALENDAR_VENV_PY = os.path.join(CALENDAR_BUFFER_DIR, "venv", "bin", "python3")
WHISPER_MODEL = os.path.expanduser("~/whisper-models/ggml-base.en-q5_1.bin")
WHISPER_CLI = shutil.which("whisper-cli") or "whisper-cli"
FFMPEG = shutil.which("ffmpeg") or "ffmpeg"
FFPROBE = shutil.which("ffprobe") or "ffprobe"
CLAUDE = shutil.which("claude") or os.path.expanduser("~/.local/bin/claude")
CODEX = shutil.which("codex") or "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"
PDFTOTEXT = shutil.which("pdftotext") or "pdftotext"

VIDEO_EXT = {".mp4", ".mkv", ".mov", ".m4v"}
WHISPER_NATIVE_AUDIO = {".mp3", ".wav", ".flac", ".ogg"}
MEDIA_EXT_PREFERENCE = [".mp3", ".m4a", ".wav", ".flac", ".ogg", ".mp4", ".mov", ".mkv", ".m4v"]
TRANSCRIPT_EXT = {".srt", ".txt"}
BASE_SCRIPT_MAX_CHARS = 20000

os.makedirs(MANIFESTS_DIR, exist_ok=True)
os.makedirs(LIVE_DOCS_DIR, exist_ok=True)
os.makedirs(BASE_SCRIPTS_RAW_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(TRANSCRIPTS_TXT_DIR, exist_ok=True)
os.makedirs(REVIEWS_DIR, exist_ok=True)
os.makedirs(TIMESTAMPS_DIR, exist_ok=True)
os.makedirs(MARKERS_DIR, exist_ok=True)
AUDIO_CHAPTERS_SCRIPT = os.path.expanduser("~/.claude/skills/audio-chapters/scripts/make_chapters.py")
DRIVE_APP_ROOT = os.path.expanduser(LOCAL_CONFIG.get("driveAppRoot") or os.environ.get("CALL_STUDIO_DRIVE_ROOT") or "~/Library/CloudStorage/GoogleDrive/My Drive")
DRIVE_AUDIOBOOK_FOLDER_NAME = "TSD Calls – Chapters"
DRIVE_INBOX_FOLDER_NAME = "Aloware Calls"   # drop recordings here (e.g. from the phone); see drive_inbox.py
DRIVE_AUDIOBOOK_FOLDER_ID = LOCAL_CONFIG.get("driveAudiobookFolderId", "")  # optional Drive folder ID verification
