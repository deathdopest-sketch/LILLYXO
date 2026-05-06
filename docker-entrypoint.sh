#!/bin/sh
set -e

# Clean up stale Xvfb lock from previous run (happens on container restart)
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

# Start Xvfb virtual display
Xvfb :99 -screen 0 1366x768x24 -ac &

# Poll until display is ready (up to 10s)
i=0
while ! DISPLAY=:99 xdpyinfo >/dev/null 2>&1; do
  i=$((i + 1))
  if [ $i -ge 20 ]; then
    echo "xvfb: display :99 never became ready" >&2
    exit 1
  fi
  sleep 0.5
done

echo "xvfb: display :99 ready"
export DISPLAY=:99
exec "$@"
