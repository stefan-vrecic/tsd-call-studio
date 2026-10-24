#!/bin/bash
# Start/stop/check the Aloware download watcher.
#
# It's installed as a launchd agent with KeepAlive=true, so a plain `kill`
# on the process just gets it instantly relaunched -- use this script
# instead, it unloads the agent properly so "stop" actually sticks.

PLIST="$HOME/Library/LaunchAgents/com.stefanvrecic.alowarewatch.plist"

case "$1" in
  start)
    launchctl load -w "$PLIST" 2>/dev/null
    sleep 1
    if pgrep -f "aloware_watch.py" > /dev/null; then
      echo "Running (pid $(pgrep -f aloware_watch.py))."
    else
      echo "Didn't start -- check /tmp/aloware_watch.log"
    fi
    ;;
  stop)
    launchctl unload -w "$PLIST" 2>/dev/null
    pkill -f "aloware_watch.py" 2>/dev/null
    sleep 1
    if pgrep -f "aloware_watch.py" > /dev/null; then
      echo "Still running -- something's wrong."
    else
      echo "Stopped."
    fi
    ;;
  restart)
    "$0" stop
    "$0" start
    ;;
  status)
    if pgrep -f "aloware_watch.py" > /dev/null; then
      echo "Running (pid $(pgrep -f aloware_watch.py))."
    else
      echo "Not running."
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
