#!/usr/bin/env python3
"""
Watches ~/Downloads for new Aloware call recordings and offers to rename,
move, and transcribe them into Call Studio.

Detection: macOS tags every browser download with an extended attribute
(kMDItemWhereFroms) recording its source URL. Aloware recordings carry
"talk.aloware.io" in that tag -- this lets us react only to real Aloware
calls and ignore the dozens of other mp3 sources (Close.io, OpenPhone,
Kixie, Fireflies, Dropbox, etc.) that land in the same folder.

No third-party dependencies: plain polling + xattr/osascript, both built
into macOS.
"""
import datetime
import json
import os
import re
import shutil
import subprocess
import time
import urllib.request
import urllib.parse
import urllib.error

DOWNLOADS = os.path.expanduser("~/Downloads")
STUDIO_URL = "http://127.0.0.1:8791"
STUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
MANIFESTS_DIR = os.path.join(STUDIO_DIR, "manifests")
SEEN_FILE = os.path.join(STUDIO_DIR, "_aloware_watch_seen.txt")
FFPROBE = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"
FFMPEG = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
RETRY_POLLS = 20   # a new mp3 that isn't tagged/finished yet is looked at again for ~60 s before giving up
POLL_SECONDS = 3
SETTLE_SECONDS = 1.5
# Oct 21 2026 (stricter): a finished download is left alone for GRACE_SECONDS first -- if you drop it into Call Studio yourself in that
# time (the not-transcribed call's drop slot, or the sidebar), it's already there and no dialog pops up at all.
GRACE_SECONDS = 30
FIRST_SEEN = {}   # file name -> when it first looked finished

SEEN = set()
ATTEMPTS = {}   # file name -> polls tried while it wasn't ready yet
# A download Claude starts for a known person (from their Aloware contact page) leaves this note first:
# {"stem": "10-11-NinoMarsagishvili", "mine": true, "until": <epoch>, "parts": 2, "files": []}. The next Aloware
# recording(s) arriving before "until" are renamed to that stem and queued straight away, without the dialog.
# "parts" > 1 = one call split by a dropped line: the watcher waits for that many recordings (oldest call downloaded
# first; "files" may already list parts sitting in Downloads), joins them in that order, then queues the result.
NAME_HINT_FILE = os.path.join(STUDIO_DIR, "_aloware_next_name.json")


def take_name_hint():
    try:
        with open(NAME_HINT_FILE) as f:
            hint = json.load(f)
        os.remove(NAME_HINT_FILE)
    except (OSError, ValueError):
        return None
    if time.time() > hint.get("until", 0) or not hint.get("stem"):
        return None
    return hint


def put_back_hint(hint):
    with open(NAME_HINT_FILE, "w") as f:
        json.dump(hint, f)


def join_parts(paths, out_path):
    """Joins recordings end to end (in the order given) into one mp3."""
    list_path = out_path + ".parts.txt"
    with open(list_path, "w") as f:
        for p in paths:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")
    try:
        r = subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
                            "-c:a", "libmp3lame", "-q:a", "4", out_path], capture_output=True, text=True, timeout=900)
    finally:
        os.remove(list_path)
    return r.returncode == 0 and os.path.exists(out_path)


def load_seen():
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f:
            return set(line.strip() for line in f if line.strip())
    return set()


def mark_seen(name):
    SEEN.add(name)
    with open(SEEN_FILE, "a") as f:
        f.write(name + "\n")


def is_from_aloware(path):
    # Read the extended attribute directly rather than going through mdls/
    # Spotlight -- mdls can lag several seconds (or longer) behind a
    # freshly-created file, which would silently miss a just-finished
    # download. xattr reads straight off the filesystem, no indexing delay.
    try:
        # no text=True: the attribute is a binary plist, and raw bytes in it
        # aren't valid UTF-8 -- decoding would raise before we ever see the
        # (perfectly ASCII) URL substring we're actually looking for.
        r = subprocess.run(
            ["xattr", "-p", "com.apple.metadata:kMDItemWhereFroms", path],
            capture_output=True, timeout=10,
        )
        if r.returncode != 0 and b"No such xattr" not in (r.stderr or b""):
            print("xattr failed for", os.path.basename(path), (r.stderr or b"").decode(errors="replace").strip(), flush=True)
        return b"aloware.io" in (r.stdout or b"")
    except Exception as e:
        print("xattr error for", os.path.basename(path), e, flush=True)
        return False


UUID_NAME = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)


def already_in_studio(filename):
    """True when this recording is already in Call Studio, or on its way: a call (or a queued upload) whose name is the file's
    name, with or without the MM-DD- date in front -- "Jane Doe.mp3" matches 10-21-JaneDoe and JaneDoe."""
    if UUID_NAME.match(filename):
        return False   # an unnamed Aloware download: nothing to match on
    want = sanitize_stem(filename).lower()
    strip = lambda n: re.sub(r"^\d{2}-\d{2}-", "", n).lower()
    try:
        names = [os.path.splitext(f)[0] for f in os.listdir(MANIFESTS_DIR) if f.endswith(".json")]
    except OSError:
        names = []
    try:
        with urllib.request.urlopen(STUDIO_URL + "/api/queue", timeout=3) as r:
            names += [str(q.get("name") or "") for q in json.load(r).get("items", [])]
    except Exception:
        pass
    return any(strip(n) == want for n in names)


def wait_until_settled(path):
    try:
        size1 = os.path.getsize(path)
    except OSError:
        return False
    time.sleep(SETTLE_SECONDS)
    try:
        size2 = os.path.getsize(path)
    except OSError:
        return False
    return size1 == size2 and size1 > 0


def get_duration_str(path):
    """Human-readable duration (M:SS or H:MM:SS), or None if ffprobe can't read it."""
    try:
        r = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, timeout=15,
        )
        seconds = float(r.stdout.strip())
    except Exception:
        return None
    seconds = round(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def sanitize_stem(name):
    stem = os.path.splitext(name)[0]
    stem = re.sub(r"[^A-Za-z0-9_-]+", "", stem.replace(" ", ""))
    return stem or "Unnamed"


def date_prefix():
    return datetime.datetime.now().strftime("%m-%d-")


# Plain AppleScript `display dialog` has no checkbox control at all, so
# the rename prompt and "was this your call?" used to be two separate
# dialogs in sequence. Combined into one screen (at Stefan's request) via
# JXA + NSAlert instead: NSAlert's "suppression button" is a real
# checkbox (normally used for "don't show this again", repurposed here
# as "This was mine", defaulted checked, one click to untick).
_ASK_DIALOG_JXA = r"""
ObjC.import('Cocoa');
function run(argv) {
    var message = argv[0];
    var defaultText = argv[1] || "";

    // a regular app that comes to the front, and the dialog on a floating window level, so it can't slip behind the browser
    $.NSApplication.sharedApplication.setActivationPolicy(0);
    $.NSApplication.sharedApplication.activateIgnoringOtherApps(true);

    var alert = $.NSAlert.alloc.init;
    alert.messageText = "Call Studio";
    alert.informativeText = message;
    alert.addButtonWithTitle("Rename + Transcribe");
    alert.addButtonWithTitle("Cancel");

    var field = $.NSTextField.alloc.initWithFrame($.NSMakeRect(0, 0, 300, 24));
    field.stringValue = defaultText;
    alert.accessoryView = field;
    alert.window.initialFirstResponder = field;

    alert.showsSuppressionButton = true;
    alert.suppressionButton.title = "This was mine";
    alert.suppressionButton.state = 1; // NSControlStateValueOn -- ticked by default

    alert.layout;
    alert.window.level = 25;   // NSStatusWindowLevel: above normal windows of every app
    alert.window.orderFrontRegardless;
    var response = alert.runModal;
    var clickedRename = response === 1000; // NSAlertFirstButtonReturn
    var mine = ObjC.unwrap(alert.suppressionButton.state) === 1;
    var typed = ObjC.unwrap(field.stringValue);

    return JSON.stringify({clicked: clickedRename, text: typed, mine: mine});
}
"""


def ask_dialog(filename, duration_str, default_text=""):
    """Single native dialog combining the rename prompt with a "This was
    mine" checkbox (ticked by default). Returns (button_label, typed_text,
    mine) where button_label is "Rename + Transcribe" or None if
    cancelled/dismissed; mine is a bool (meaningless when cancelled)."""
    duration_line = f"Duration: {duration_str}\n" if duration_str else ""
    message = (
        f"New Aloware recording:\n{filename}\n{duration_line}"
        f"Will be saved as: {date_prefix()}<name you type>"
    )
    try:
        r = subprocess.run(
            ["osascript", "-l", "JavaScript", "-e", _ASK_DIALOG_JXA, message, default_text],
            capture_output=True, text=True, timeout=600,
        )
    except subprocess.TimeoutExpired:
        print("dialog: no answer after 10 min for", filename, flush=True)
        return "unanswered", None, None
    if r.returncode != 0:
        print("dialog failed for", filename, (r.stderr or "").strip()[:300], flush=True)
        return "unanswered", None, None
    try:
        data = json.loads(r.stdout.strip())
    except (json.JSONDecodeError, ValueError):
        return None, None, None
    if not data.get("clicked"):
        return None, None, None
    return "Rename + Transcribe", data.get("text") or "", bool(data.get("mine"))


def notify(text):
    escaped = text.replace("\\", "\\\\").replace('"', '\\"')
    subprocess.run(["osascript", "-e", f'display notification "{escaped}" with title "Call Studio"'])


def ensure_studio_running():
    try:
        urllib.request.urlopen(STUDIO_URL + "/api/people", timeout=2)
        return True
    except Exception:
        pass
    subprocess.Popen(
        ["/opt/homebrew/bin/python3", "server.py"], cwd=STUDIO_DIR,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    for _ in range(20):
        time.sleep(0.5)
        try:
            urllib.request.urlopen(STUDIO_URL + "/api/people", timeout=2)
            return True
        except Exception:
            continue
    return False


def upload_and_queue(path, new_filename, mine=None):
    with open(path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(STUDIO_URL + "/api/upload", data=data, method="POST")
    req.add_header("X-Filename", urllib.parse.quote(new_filename))
    if mine is not None:
        req.add_header("X-Mine", "true" if mine else "false")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status == 200
    except urllib.error.URLError:
        return False


def handle_new_mp3(path):
    """Returns False when the file isn't ready to judge yet (no Aloware tag yet, or still being written), so the
    main loop looks at it again on the next poll instead of dropping it."""
    filename = os.path.basename(path)
    if not is_from_aloware(path):
        return False
    if not wait_until_settled(path):
        return False
    first = FIRST_SEEN.setdefault(filename, time.time())
    hint_waiting = os.path.exists(NAME_HINT_FILE)
    if not hint_waiting and time.time() - first < GRACE_SECONDS:
        return None   # finished, but give you a moment to drop it into Call Studio yourself
    if not hint_waiting and already_in_studio(filename):
        print(f"{filename}: already in Call Studio -- no dialog", flush=True)
        return True

    hint = take_name_hint()
    if hint:
        button, mine = "Rename + Transcribe", bool(hint.get("mine", True))
        new_stem = sanitize_stem(hint["stem"])
        parts = int(hint.get("parts") or 1)
        if parts > 1:
            files = [f for f in hint.get("files", []) if f != filename] + [filename]
            if len(files) < parts:
                hint["files"] = files
                put_back_hint(hint)
                print(f"part {len(files)}/{parts} of {new_stem}: {filename}", flush=True)
                return True
            joined = os.path.join(DOWNLOADS, new_stem + ".mp3")
            if os.path.exists(joined) or os.path.exists(os.path.join(MANIFESTS_DIR, new_stem + ".json")):
                notify(f"{new_stem} already exists — parts left as they are")
                return True
            if not join_parts([os.path.join(DOWNLOADS, f) for f in files], joined):
                notify(f"Couldn't join the {parts} parts of {new_stem} — they're still in Downloads")
                return True
            mark_seen(os.path.basename(joined))
            for f in files:
                os.remove(os.path.join(DOWNLOADS, f))
            path, filename = joined, os.path.basename(joined)
            print(f"joined {parts} parts into {filename}", flush=True)
    else:
        duration_str = get_duration_str(path)
        guess = "" if UUID_NAME.match(filename) else sanitize_stem(filename)   # "Shelley Wood.mp3" -> ShelleyWood, ready to accept
        print(f"{filename}: asking (dialog)", flush=True)
        button, text, mine = ask_dialog(filename, duration_str, guess)
        if button == "unanswered":
            notify(f"{filename} is still in Downloads — drop it into Call Studio when you're ready")
            return True
        if not button or button == "Cancel":
            print(f"{filename}: cancelled", flush=True)
            return True
        typed = sanitize_stem(text) if text else sanitize_stem(filename)
        new_stem = date_prefix() + typed

    # Guard against clobbering an existing Call Studio person -- this is
    # what actually overwrote a real call's audio the first time: the old
    # check only looked at Downloads, never at whether that name already
    # has a manifest (a different, unrelated real call).
    if os.path.exists(os.path.join(MANIFESTS_DIR, new_stem + ".json")):
        notify(f"'{new_stem}' already exists in Call Studio — rename skipped to avoid overwriting it")
        return True

    new_path = os.path.join(DOWNLOADS, new_stem + ".mp3")
    if os.path.exists(new_path) and os.path.abspath(new_path) != os.path.abspath(path):
        notify(f"{new_stem}.mp3 already exists in Downloads — skipped")
        return True
    os.rename(path, new_path)
    mark_seen(os.path.basename(new_path))  # don't re-trigger on the renamed file

    if button != "Rename + Transcribe":
        return True

    if not ensure_studio_running():
        notify(f"{new_stem}.mp3 renamed, but Call Studio's server wouldn't start — upload it manually")
        return True
    try:
        ok = upload_and_queue(new_path, new_stem + ".mp3", mine)
    except Exception as e:
        notify(f"Upload failed for {new_stem}: {e}")
        return True
    if ok:
        os.remove(new_path)
        notify(f"{new_stem} queued for transcription")
    else:
        notify(f"{new_stem}.mp3 renamed, but upload to Call Studio failed")
    return True


def seed_baseline():
    """On a fresh run (no seen-file yet), mark every mp3 already sitting in
    Downloads as seen without prompting -- we only want to react to files
    that show up AFTER the watcher starts, not backlog-prompt for every
    Aloware recording someone's ever downloaded."""
    for fn in os.listdir(DOWNLOADS):
        if fn.lower().endswith(".mp3"):
            SEEN.add(fn)
    with open(SEEN_FILE, "w") as f:
        f.write("\n".join(sorted(SEEN)) + ("\n" if SEEN else ""))


def main():
    global SEEN
    first_run = not os.path.exists(SEEN_FILE)
    SEEN = load_seen()
    if first_run:
        seed_baseline()
        print(f"First run: baselined {len(SEEN)} existing mp3(s) in {DOWNLOADS}, "
              "will only alert on new ones from here.", flush=True)
    print("Watching", DOWNLOADS, "for new Aloware recordings…", flush=True)
    while True:
        try:
            for fn in sorted(os.listdir(DOWNLOADS)):
                if not fn.lower().endswith(".mp3"):
                    continue
                if fn in SEEN:
                    continue
                path = os.path.join(DOWNLOADS, fn)
                if not os.path.isfile(path):
                    continue
                # Only mark it handled once it was actually judged: a download that isn't tagged as Aloware yet (the
                # tag can land a moment after the file) or is still growing gets looked at again next poll, for up to
                # RETRY_POLLS polls -- this used to mark it seen first, so such a file was silently skipped for good.
                result = handle_new_mp3(path)
                if result is None:
                    continue   # finished, waiting out the grace period
                tries = ATTEMPTS.get(fn, 0) + 1
                ATTEMPTS[fn] = tries
                if result is False and tries < RETRY_POLLS:
                    continue
                ATTEMPTS.pop(fn, None)
                if fn not in SEEN:
                    mark_seen(fn)
        except Exception as e:
            print("watch loop error:", e, flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
