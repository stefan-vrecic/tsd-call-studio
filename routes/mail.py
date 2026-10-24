"""Email notifications: status + feed for the notification box, connect / disconnect Gmail, clear the feed."""
import mail_watch


def mail_status(handler):
    handler._json(200, mail_watch.status())
    return


def mail_connect(handler):
    started = mail_watch.connect()
    handler._json(200, {"ok": True, "started": started})
    return


def mail_disconnect(handler):
    mail_watch.disconnect()
    handler._json(200, {"ok": True})
    return


def mail_clear(handler):
    mail_watch.clear()
    handler._json(200, {"ok": True})
    return
