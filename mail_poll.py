#!/usr/bin/env python3
"""Reads Gmail for Call Studio's notification box. Runs under the calendar-auto-buffer venv (it has the Google libraries;
the server's own python doesn't), as a short-lived process:

    mail_poll.py auth                  opens the Google consent page once and saves a read-only token
    mail_poll.py poll --since EPOCH    prints JSON for inbox mail newer than EPOCH: {"email": ..., "messages": [...]}

Read-only on purpose: the only permission asked for is gmail.readonly, which can't send, delete or change anything.
Set GMAIL_FAKE_FILE=<json file> to read pretend messages instead of Gmail (used by the tests).
"""
import argparse
import json
import os
import sys

STUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_PATH = os.environ.get("GMAIL_TOKEN", os.path.join(STUDIO_DIR, "gmail_token.json"))
CREDS_PATH = os.environ.get("GMAIL_CREDENTIALS", os.path.expanduser("~/Desktop/calendar-auto-buffer/credentials.json"))
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def _creds():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            _save(creds)
        else:
            raise RuntimeError("Gmail login expired. Connect Gmail again in Settings.")
    return creds


def _save(creds):
    fd = os.open(TOKEN_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)  # only this user can read it
    with os.fdopen(fd, "w") as f:
        f.write(creds.to_json())


def cmd_auth():
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    if not os.path.exists(CREDS_PATH):
        raise RuntimeError(f"No Google client file at {CREDS_PATH}")
    flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
    creds = flow.run_local_server(port=0, open_browser=True, prompt="consent",
                                  authorization_prompt_message="", success_message="Gmail is connected. You can close this tab.")
    _save(creds)
    email = build("gmail", "v1", credentials=creds, cache_discovery=False).users().getProfile(userId="me").execute().get("emailAddress")
    print(json.dumps({"ok": True, "email": email}))


def _header(headers, name):
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return h.get("value", "")
    return ""


def cmd_poll(since):
    fake = os.environ.get("GMAIL_FAKE_FILE")
    if fake:
        with open(fake) as f:
            data = json.load(f)
        msgs = [m for m in data.get("messages", []) if int(m.get("internalDate", 0)) // 1000 >= since]
        print(json.dumps({"email": data.get("email", "fake@example.com"), "messages": msgs}))
        return
    from googleapiclient.discovery import build
    svc = build("gmail", "v1", credentials=_creds(), cache_discovery=False)
    email = svc.users().getProfile(userId="me").execute().get("emailAddress")
    listing = svc.users().messages().list(userId="me", q=f"in:inbox after:{int(since)}", maxResults=40).execute()
    out = []
    for ref in listing.get("messages", []):
        m = svc.users().messages().get(userId="me", id=ref["id"], format="metadata",
                                       metadataHeaders=["From", "Subject"]).execute()
        h = m.get("payload", {}).get("headers", [])
        out.append({"id": m["id"], "threadId": m.get("threadId"), "from": _header(h, "From"),
                    "subject": _header(h, "Subject") or "(no subject)", "snippet": m.get("snippet", ""),
                    "internalDate": int(m.get("internalDate", 0)), "labels": m.get("labelIds", [])})
    print(json.dumps({"email": email, "messages": out}))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("auth")
    p = sub.add_parser("poll")
    p.add_argument("--since", type=float, required=True)
    a = ap.parse_args()
    try:
        if a.cmd == "auth":
            cmd_auth()
        else:
            cmd_poll(a.since)
    except Exception as e:  # always answer in JSON so the server can show a readable message
        msg = str(e)
        if "accessNotConfigured" in msg or "has not been used in project" in msg or "SERVICE_DISABLED" in msg:
            msg = "The Gmail API isn't switched on for the Google project yet (see the link in Settings)."
        print(json.dumps({"error": msg[:400]}))
        sys.exit(1)


if __name__ == "__main__":
    main()
