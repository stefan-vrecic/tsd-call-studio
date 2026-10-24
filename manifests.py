"""Per-call manifest files (manifests/<name>.json): the placeholder written while a call is processing."""
import json
import os

import config


def write_placeholder_manifest(stem, mp3_filename, status):
    """Write a minimal in-progress manifest so the person shows up in the
    sidebar immediately, well before Claude's analysis (the expensive,
    slow step) finishes. Never clobbers a manifest that already exists --
    that's a real, completed entry (or mid-refresh from a batch run), not
    ours to overwrite. Returns True if it actually wrote one."""
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
    if os.path.exists(manifest_path):
        return False
    with open(manifest_path, "w") as f:
        json.dump({"name": stem, "mp3": mp3_filename, "status": status}, f, indent=2)
    return True


def update_manifest_status(stem, status, error=None):
    """Update a placeholder without ever hiding a usable transcript.

    ``error`` is retained for diagnostics when the AI review fails and is
    cleared automatically when processing later resumes.
    """
    manifest_path = os.path.join(config.MANIFESTS_DIR, f"{stem}.json")
    if not os.path.exists(manifest_path):
        return
    with open(manifest_path) as f:
        manifest = json.load(f)
    manifest["status"] = status
    if error:
        manifest["reviewError"] = error
    else:
        manifest.pop("reviewError", None)
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
