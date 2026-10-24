"""Reading .srt transcripts."""
import re


SRT_TIME_RE = re.compile(r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")
SRT_SPEAKER_RE = re.compile(r"^([A-Za-z][A-Za-z0-9 _'-]{1,24}):\s+(.*)$")


def parse_srt(path):
    """Parse an .srt into [{start, end, speaker, text}, ...] (seconds as
    floats). Speaker separation is opportunistic: whisper.cpp's plain output
    has no diarization, so this only fills in `speaker` if most blocks
    consistently start with a "Name: " prefix (e.g. from a diarizing
    transcription tool) -- otherwise every block's speaker is None."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    blocks = []
    for chunk in re.split(r"\n\s*\n", content.strip()):
        lines = chunk.strip().split("\n")
        if len(lines) < 2:
            continue
        m = SRT_TIME_RE.match(lines[1])
        if not m:
            continue
        sh, sm, ss, sms, eh, em, es, ems = (int(g) for g in m.groups())
        start = sh * 3600 + sm * 60 + ss + sms / 1000
        end = eh * 3600 + em * 60 + es + ems / 1000
        text = " ".join(lines[2:]).strip()
        blocks.append({"start": start, "end": end, "text": text})

    matches = [SRT_SPEAKER_RE.match(b["text"]) for b in blocks]
    has_speakers = bool(blocks) and (sum(1 for m in matches if m) / len(blocks)) > 0.6
    for b, m in zip(blocks, matches):
        if has_speakers and m:
            b["speaker"] = m.group(1)
            b["text"] = m.group(2)
        else:
            b["speaker"] = None

    return has_speakers, blocks
