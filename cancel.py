"""Cancelling background jobs (transcribing, writing a call review, audiobooks) from the queue panel.

A job is a plain dict (pipeline.JOBS / audiobook.AUDIOBOOK_JOBS). Cancelling sets job["cancelled"] and kills any programs
the job has running (whisper, claude, ffmpeg). A job that is still waiting its turn is skipped when the worker reaches it.
The job code asks check(job) at its safe points, which raises Cancelled; the usual error handling then cleans up and the
job ends with the message "Cancelled".
"""
import os
import signal
import subprocess
import threading

_lock = threading.Lock()
_procs = {}   # id(job) -> [Popen, ...] currently running for that job


class Cancelled(RuntimeError):
    pass


def is_cancelled(job):
    return bool(job.get("cancelled"))


def check(job):
    if is_cancelled(job):
        raise Cancelled("Cancelled")


def register(job, proc):
    with _lock:
        _procs.setdefault(id(job), []).append(proc)


def unregister(job, proc):
    with _lock:
        lst = _procs.get(id(job), [])
        if proc in lst:
            lst.remove(proc)
        if not lst:
            _procs.pop(id(job), None)


def _kill(proc):
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)   # the whole group: claude and whisper start helper programs
    except (ProcessLookupError, PermissionError, OSError):
        try:
            proc.kill()
        except OSError:
            pass


def cancel(job):
    """Marks the job cancelled and stops its programs. Returns True if something was running."""
    job["cancelled"] = True
    with _lock:
        procs = list(_procs.get(id(job), []))
    for p in procs:
        _kill(p)
    return bool(procs)


def run(job, args, timeout=None, cwd=None):
    """subprocess.run(capture_output, text) that cancel() can stop. Returns a CompletedProcess."""
    proc = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=cwd, start_new_session=True)
    register(job, proc)
    try:
        out, err = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        _kill(proc)
        proc.communicate()
        raise
    finally:
        unregister(job, proc)
    return subprocess.CompletedProcess(args, proc.returncode, out, err)
