"""The prompt that makes Claude write a call's follow-along doc + manifest."""
import os

import config
import settings
import util


CANONICAL_SECTIONS = (
    "Greeting, Discovery, Challenge, Price Anchor, Reasons Why, FCOI, Desire, "
    "Commitment Question, Transition/Offer/1:1 Coaching, Identify Certainty, Spouse Check, "
    "Personal Highlight, Why Now, The Investment, 3 Whys, Wobble Toolkit, Fear Split, "
    "Commitment Ask, Payment Collection, Onboarding/Close"
)

DISAMBIGUATION_RULE = (
    "Named techniques need real structural evidence, not just resemblance — do not label something with a "
    "specific named technique just because it superficially resembles it (e.g. \"any moment involving "
    "self-doubt\" is NOT automatically Wobble Toolkit; \"any 3-item written list\" is NOT automatically 3 Whys "
    "or Wobble Toolkit — the script has multiple distinct \"write down 3 things\" moments and they are not "
    "interchangeable). Specifically:\n"
    "- Wobble Toolkit = ALL THREE of: (1) re-reading the 3 Whys, (2) remembering the consequence of \"Option B\" "
    "/ talking yourself out of it, (3) Trust — referencing a named case-study client + the guarantee. If a "
    "moment is missing any of these three, it is not Wobble Toolkit.\n"
    "- 3 Whys = the client writes down and reads back her top three reasons weight loss matters to her. This is "
    "distinct from Wobble Toolkit even though Wobble Toolkit references the 3 Whys.\n"
    "- If the closer has the client write down three commitments to guarantee success (typically along the "
    "lines of progress-not-perfection / stay in contact with the coach / be honest) — that is a DIFFERENT, "
    "separate moment. Label it \"Commitment Ask\", never Wobble Toolkit or 3 Whys.\n"
    "- Fear Split = a literal two-column exercise (fear of failure vs. fear of regret/continuing to overthink), "
    "not just any moment of financial hesitation.\n"
    "If you are not confident a moment genuinely matches a specific named technique's real structure, use a "
    "plain descriptive label instead of the branded name — an under-specific but honest label beats a "
    "confident but wrong one, especially since this feeds a compliance checklist that gets taken at face value."
)


def build_prompt(name, srt_path, txt_path, media_filename, duration, spec_path, docx_out, manifest_out,
                  base_script_name=None, base_script_text=None, transcription_note=None, csv_out=None):
    merge_rule = (
        f"IMPORTANT — keep sections coarse, not fragmented: use ONLY these overarching section names "
        f"(pick the closest match, or a short plain label like \"Technical start\"/\"Unscripted tangent\" "
        f"for anything that fits none of them): {CANONICAL_SECTIONS}. "
        f"Never invent a hyphenated sub-label like \"FCOI – Consequence projection\" or \"Reasons Why – Grandchildren\" "
        f"— that's exactly the kind of over-fragmentation to avoid.\n\n"
        f"MECHANICAL RULE, apply it as a literal last step before writing the rows array: after you've drafted "
        f"your rows, scan them top to bottom. Whenever two or more CONSECUTIVE rows share the exact same section "
        f"label, you MUST collapse them into a single row: the timestamp becomes the start of the first and the "
        f"end of the last (e.g. three consecutive \"FCOI\" rows covering 13:20-15:37, 15:37-16:43, 16:43-18:21 "
        f"become ONE row \"13:20-18:21 | FCOI\"), and the description becomes those descriptions joined together "
        f"(trim to keep it readable, but keep every distinct beat — don't just keep the first one). Do this "
        f"repeatedly until no two consecutive rows share a label. A row with the same label as an EARLIER "
        f"non-adjacent row (the call left that section and came back to it later) is fine to leave separate — "
        f"only collapse rows that are consecutive right now.\n\n"
        f"This keeps row counts low (most calls should land around 12-20 rows) and keeps the cross-call section "
        f"search usable — a search for \"FCOI\" should return about one hit per call, not three. A call whose "
        f"rows still contain consecutive duplicate labels after this step has not followed the instructions."
    )
    if base_script_text:
        base_script_block = f"""

You have the actual written base script to compare this call against — "{base_script_name}":
---BEGIN BASE SCRIPT---
{base_script_text}
---END BASE SCRIPT---

Use it for real, verified comparison (not guesswork): name each timeline row's Section using the base script's own section names where the closer is actually following it, note when the closer skips a section entirely, reorders sections, adds unscripted material, or says something that contradicts the script. In the findings, call out specific verified deviations (e.g. "skips the Wobble Toolkit entirely" or "quotes the Greeting almost verbatim") rather than hedged language like "appears to" or "may match" — you have the ground truth, so state matches and deviations as fact.

Also go through the base script section-by-section (every named step/section in it) and produce a "skippedSections" list: for EVERY section in the base script, one entry stating what actually happened on this call — "Covered, ~12:47" / "Skipped entirely" / "Covered but heavily abridged (one line only)" / "Covered out of order, after Investment instead of before" / etc. Include sections that WERE covered too (don't only list the skipped ones) so this reads as a complete script-coverage checklist, not just a gap list."""
        section_guidance = (
            "Section labels should follow the base script's own section names when the closer is on-script, "
            "and use a plain descriptive label (e.g. \"Unscripted rapport tangent\") when they're off it. "
            + merge_rule + "\n\n" + DISAMBIGUATION_RULE
        )
    else:
        base_script_block = ""
        section_guidance = (
            "Section labels should name what's actually happening, inferred from the call's own structure. "
            "No base script was supplied for this call, so don't claim things \"match the script\" — describe "
            "only what's observable in the transcript itself. " + merge_rule
        )

    return f"""You are generating a "Script Follow-Along" document for a sales call transcript, matching a house format already used for other calls in this folder ({config.FOLDER}).

Read the transcript at {srt_path} in full{f' (and {txt_path} if useful)' if txt_path else ''}. The audio duration is approximately {util.seconds_to_label(duration)}.{base_script_block}

Then:
1. Watch for and flag as CAUTION (in one short paragraph, or use an empty string "" if nothing applies):
   - Any mismatch between the client's name/email as stated on the call and the file name "{name}".
   - Any moment a full card number, expiry date, or CVC is read aloud — flag that it happens, but NEVER reproduce the actual digits in your output.
   - Any other sensitive PII (SSN, passwords, etc.) — same rule: flag, don't reproduce.
2. Build a chronological timeline covering the whole call: an array of [timestamp_range, section_label, description] rows, roughly one row per overarching section actually present (typically 12-20 rows for a 30-90 minute call — see the merging rule below, this is NOT a target to pad out with sub-sections). Use ranges like "12:47–13:57", or "1:11:00–1:12:00" once past an hour. {section_guidance}
3. Write 3-6 "Summary of Findings" bullets: notable structural/behavioral observations — script deviations, notable disclosures, pricing specifics, how the call ends, anything unusual. Match a plain, analytical tone, e.g.: "Names FOUR destructive behaviour patterns... Reaches a full close inside the recording: Discovery → Challenge → Investment → payment → signed agreement → onboarding booked."
4. Write exactly 3 "recommendations" — the biggest, most impactful things THIS closer should improve on for THIS specific call, in priority order (most impactful first). Be concrete and actionable, tied to specific moments/timestamps where possible (e.g. "Price anchor never actually anchored — jumps from Challenge straight to Reasons Why at 6:47, skipping the holidays/handbags contrast entirely" beats generic advice like "improve price anchoring"). {"Ground these in real deviations from the base script where you have them (missed FCOI follow-ups, sections skipped/reordered/abridged, weak commitment language) rather than generic sales-coaching platitudes." if base_script_text else "No base script was supplied, so base these on what's actually observable going wrong or being left on the table in the call itself, not generic sales advice."} If the call is genuinely strong with nothing significant to flag, it's fine to note smaller polish items rather than manufacturing false criticism.
5. Check the first few minutes of the call (this is typically where it comes up, as the closer confirms intake details) for the prospect's stated height and weight:
   - "height": as stated, in whatever unit they used (e.g. "5'2\"", "5 foot 2"). Empty string "" if never mentioned.
   - "weight": as stated (e.g. "16 stone", "16st 5lb", "224 lbs"). Empty string "" if never mentioned.
6. Assess this prospect's follow-up outlook:
   - "saleClosed": true if this call actually ended in a completed sale — payment collected (even just a deposit) and/or the agreement signed — false otherwise (including "verbally said yes but the recording ends before payment/signature actually happen").
   - "primaryObjection": the single biggest thing standing between this prospect and buying, in plain language (e.g. "Needs to discuss the investment with her husband before committing", "Skeptical after several failed diet attempts, not yet convinced this is different", "Says she can't afford it right now"). Empty string "" if the call closed cleanly with no real objection surfaced, or if saleClosed is true.
   - "secondaryObjection": the next biggest thing, same style. Empty string "" if there genuinely wasn't a second one, or if saleClosed is true.
   - "followUpPriority": if saleClosed is true, use null — a closed sale isn't something to prioritize for a follow-up call, it's just done. Otherwise, an integer 0-5 rating how urgently/worthwhile a follow-up is —
     4 = strong genuine interest and a real, addressable objection (e.g. needs to talk to a spouse, waiting on payday) with a concrete reason to believe she'll come back
     3 = real interest but meaningful unresolved hesitation or skepticism — a genuine toss-up
     2 = lukewarm — significant doubt or a financial/trust objection with no clear path past it
     1 = very unlikely but not a flat no — weak fit or mostly disengaged
     0 = do not follow up — explicit no, clearly can't/won't afford it, hostile, or wrong fit entirely
     Base this on what actually happened on the call (buying signals, tone, specific commitments made or declined), not on a generic assumption that every lead deserves a mid-range score.
   - "followUpDate": if saleClosed is true, use the onboarding call date/time if one was booked (e.g. "Onboarding call booked 10am tomorrow with Alice"). Otherwise, if the client or closer named a specific date, day, or concrete timeframe to reconnect, resolve it to an actual calendar date and write THAT (e.g. a closer saying "I need about a week" becomes "21st September" if today is the 14th, not "~1 week"; "next Tuesday" becomes the actual date of next Tuesday) — always anchor relative phrases ("a week", "shortly", "next Tuesday") to today's real date, never leave them relative. If the timeframe is a real range rather than a point (e.g. "sometime after she's back from holiday but before month-end"), give a concrete date range instead of one date. Empty string "" if nothing concrete was scheduled at all (no timeframe of any kind was mentioned).
   - "followUpEventDate": the SAME timeframe as followUpDate above, but ONLY when it resolves to one single specific calendar day, in strict "YYYY-MM-DD" format (e.g. "2026-09-21") — this drives an automatic calendar reminder, so it must be an actual unambiguous date, never a range or vague window. null if followUpDate is empty, is a range ("Wednesday or Thursday", "sometime after the 20th"), or is otherwise not one specific day.
   - "followUpProcess": if saleClosed is true or followUpPriority is 0, use empty string "". Otherwise a SHORT explanation (1-3 sentences) of the recommended follow-up for the closer: which channel to use first (text vs. call, based on what actually fits this prospect/situation) and why, tied to something specific from THIS call. This is advice for the closer to read, NOT something to send: do not include the message itself here.
   - "followUpMessage": if saleClosed is true or followUpPriority is 0, use empty string "". Otherwise the text message the closer can copy and send as-is (the closer's name is {settings.closer_name()}: use it if the message needs the closer's name, and never write a placeholder like [closer]): ONLY the message, with no quotation marks around it and no preamble such as "Something like:". Written in a warm, natural, first-person voice (not salesy or templated), referencing something specific from THIS call (their stated objection, a detail they shared, what they were waiting on) so it reads as genuinely personal. If the best next step is a phone call rather than a text, use "" here and put the key talking points for the call in "followUpProcess" instead.
7. Write a JSON spec file to {spec_path} with exactly this shape:
{{
  "name": "{name}",
  "mp3": "{media_filename}",
  "srt": "{os.path.basename(srt_path)}",
  "duration": "{util.seconds_to_label(duration)}",
  "transcriptionNote": "{transcription_note}",
  "caution": "<string, or empty string>",
  "findings": ["...", "..."],
  "rows": [["0:00–0:32", "Greeting", "..."], ...]{', "skippedSections": [["Section Name", "Covered, ~12:47 / Skipped entirely / Covered but abridged / etc."], ...]' if base_script_text else ''},
  "recommendations": ["...", "...", "..."],
  "height": "...",
  "weight": "...",
  "saleClosed": false,
  "primaryObjection": "...",
  "secondaryObjection": "...",
  "followUpPriority": 0,
  "followUpDate": "...",
  "followUpEventDate": "YYYY-MM-DD or null",
  "followUpProcess": "...",
  "followUpMessage": "..."
}}
8. Run: node "{config.BUILDER_JS}" "{spec_path}" "{docx_out}" "{manifest_out}"{f' "{csv_out}"' if csv_out else ''}
9. Confirm {docx_out}, {manifest_out}{f', and {csv_out}' if csv_out else ''} now exist.

Do not ask for confirmation, do not produce any other output or commentary — just do the steps above and stop."""
