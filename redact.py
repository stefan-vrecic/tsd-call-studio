"""Redact: replaces spoken credit card numbers in a transcript with "BEEP BEEP BEEP".

A card number in a transcript is a run of digits (as digits, or as spoken digit words) that adds up to 13-19 digits, however whisper
split it up: "4 5 2 1, 3 4 5 6 ...", "4521 3456 7890 1234", with commas, dashes or full stops between the groups, and across
subtitle lines. The whole run becomes BEEP BEEP BEEP, once, in the line where it starts; digits left over in the following lines go.
Shorter number runs (phone numbers, prices, dates) are left alone.
"""
import re

BEEP = "BEEP BEEP BEEP"
_WORDS = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9}
_TOKEN = re.compile(r"\d+|[A-Za-z]+|[^\sA-Za-z\d]+|\s+")   # digits | words | punctuation | spaces
_SEP = re.compile(r"^[\s,.\-–—]*$")                           # what may sit between the groups of one card number


def _joins(sep):
    """Groups of one card number are joined by a space (with or without a comma / full stop) or by dashes. A comma or full stop WITHOUT
    a space inside the digits is a decimal point or a thousands mark (4.75, 1,200), so it ends the run."""
    return bool(re.search(r"\s", sep)) or bool(re.fullmatch(r"[-–—]+", sep))
MIN_DIGITS, MIN_DIGITS_GROUPED, MAX_DIGITS = 13, 15, 19   # one digit at a time: 13 is enough; spoken in bigger groups it must be 15+ to count


_MULTI = {"double": 1, "triple": 2, "treble": 2}      # "double eight" = 88: the word adds the extra digits


def _digit_count(tok):
    if tok.isdigit():
        return len(tok)
    low = tok.lower()
    if low in _MULTI:
        return _MULTI[low]
    return 1 if low in _WORDS else None


_FILLERS = {"yep", "yeah", "yes", "okay", "ok", "mhm", "uh", "um", "right", "sorry", "sure", "then", "next", "again", "go", "ahead"}


def find_runs(tokens, min_single=MIN_DIGITS, min_grouped=MIN_DIGITS_GROUPED, max_digits=MAX_DIGITS, fillers=False):
    """[(first_token_index, last_token_index, digit_total)] for every card-number-looking run in a token list.
    fillers=True lets up to two filler words ("yep", "okay", "uh") sit between the groups: the person on the other end confirming as it is read out."""
    runs, i, n = [], 0, len(tokens)
    while i < n:
        c = _digit_count(tokens[i])
        if c is None:
            i += 1
            continue
        start, last, total, j, sizes = i, i, c, i + 1, [c]
        while j < n:
            if _digit_count(tokens[j]) is not None:       # digits straight after digits ("12" "34": same group)
                total += _digit_count(tokens[j]); sizes.append(_digit_count(tokens[j])); last = j; j += 1
            else:
                k, said = j, 0
                while k < n:                              # separators, and (if allowed) a couple of filler words
                    if _SEP.match(tokens[k]):
                        k += 1
                    elif fillers and said < 2 and tokens[k].lower() in _FILLERS:
                        said += 1; k += 1
                    else:
                        break
                gap = "".join(tokens[j:k])
                if k < n and k > j and _digit_count(tokens[k]) is not None and (said or _joins(gap)):
                    j = k                                  # the gap joins this group to the next one
                else:
                    break
        need = min_single if all(x == 1 for x in sizes) else min_grouped
        if need <= total <= max_digits:
            runs.append((start, last, total))
        i = last + 1
    return runs


_CARD_TRIGGERS = ("card", "long number")                                                      # then 6+ digits within the next 100 words
_DETAIL_TRIGGERS = ("security code", "securitycode", "expiry", "expiration", "expirate", "expire", "cvv", "cvc", "ccc",
                    "three digit", "3 digit", "digits on the back", "back of the card")                # then even 3 digits within the next 30 words
_WINDOW, _DETAIL_WINDOW = 100, 30


TAIL = 0.40       # for closed calls the card details are read out near the end: only the last 40% of the call gets the deeper pass


def context_runs(tokens, from_index=0):
    """Digits read out while card details are being taken. After "card" / "long number", a run of 6 or more digits in the next stretch of
    speech is part of it (the second half of the number, broken up by "yep"s); after "expiry", "security code", "CVV" ... even a short run
    of 3 digits is (the expiry date, the three digits on the back). Only used for closed calls, and only in the last part of the call."""
    runs = []
    for i, t in enumerate(tokens):
        if i < from_index:
            continue
        low = "".join(tokens[i:i + 5]).lower().replace(" ", "")
        if any(low.startswith(w.replace(" ", "")) for w in _DETAIL_TRIGGERS):
            end, need = min(len(tokens), i + _DETAIL_WINDOW), 3
        elif any(low.startswith(w.replace(" ", "")) for w in _CARD_TRIGGERS):
            end, need = min(len(tokens), i + _WINDOW), 6
        else:
            continue
        for a, b, tot in find_runs(tokens[i:end], need, need, 24, fillers=True):
            runs.append((i + a, i + b, tot))
    return runs


def all_runs(tokens, deep=False):
    """The whole-card-number pass (always) plus, when deep=True (calls that closed), the pass for details read out after card talk in the
    last part of the call. Merged into non-overlapping runs."""
    spans = sorted(find_runs(tokens) + (context_runs(tokens, int(len(tokens) * (1 - TAIL))) if deep else []))
    merged = []
    for a, b, tot in spans:
        if merged and a <= merged[-1][1] + 1:
            merged[-1] = (merged[-1][0], max(b, merged[-1][1]), merged[-1][2] + tot)
        else:
            merged.append((a, b, tot))
    return merged


def redact_text(text, deep=False):
    """A plain text transcript. Returns (new_text, number_of_cards_redacted)."""
    toks = _TOKEN.findall(text)
    runs = all_runs(toks, deep)
    for a, b, _ in reversed(runs):
        toks[a:b + 1] = [BEEP]
    return "".join(toks), len(runs)


def redact_srt(srt_text, deep=False):
    """An .srt file: finds runs across the subtitle lines. Returns (new_srt_text, number_of_cards_redacted)."""
    blocks = re.split(r"\n\s*\n", srt_text.strip("\n"))
    parsed = []                           # [header_lines, text_lines]
    for b in blocks:
        lines = b.split("\n")
        parsed.append((lines[:2], lines[2:]) if len(lines) >= 3 else (lines, []))
    # one token list for the whole file, remembering which block each token came from
    toks, owner = [], []
    for bi, (_, text_lines) in enumerate(parsed):
        for t in _TOKEN.findall(" ".join(text_lines)):
            toks.append(t); owner.append(bi)
        toks.append(" "); owner.append(bi)
    runs = all_runs(toks, deep)
    if not runs:
        return srt_text, 0
    drop, touched = set(), set()
    for a, b, _ in runs:
        toks[a] = BEEP                    # the run's first token becomes the beep, the rest of the run is dropped
        drop.update(range(a + 1, b + 1))
        touched.update(owner[a:b + 1])
    new_text = [[] for _ in parsed]
    for idx, t in enumerate(toks):
        if idx not in drop:
            new_text[owner[idx]].append(t)
    out = []
    for bi, (head, text_lines) in enumerate(parsed):
        if bi not in touched:
            out.append("\n".join(head + text_lines))      # untouched: byte for byte as before
            continue
        body = re.sub(r"\s+", " ", "".join(new_text[bi])).strip()
        out.append("\n".join(head + [body if body.strip(" ,.-") else "…"]))
    return "\n\n".join(out) + "\n", len(runs)


def redact_files(srt_path=None, txt_path=None, deep=False):
    """Redacts a finished transcript's .srt and/or .txt in place. Returns how many number runs were replaced.
    (Repeated until nothing more is found: taking numbers out shortens the call, which moves where "the end" starts.)"""
    import os
    total = 0
    for path, fn in ((srt_path, redact_srt), (txt_path, redact_text)):
        if not path or not os.path.isfile(path):
            continue
        done = 0
        for _ in range(4):
            with open(path, encoding="utf-8", errors="replace") as f:
                new, n = fn(f.read(), deep)
            if not n:
                break
            with open(path + ".tmp", "w", encoding="utf-8") as f:
                f.write(new)
            os.replace(path + ".tmp", path)
            done += n
        total = max(total, done)
    return total
