#!/bin/sh

echo "Cleaning up old files..."
rm -f /app/data/plebbit.log /app/data/auth_key

echo "Starting plebbit-cli daemon..."
/app/plebbit-cli/bin/run daemon 2>&1 | tee /app/data/plebbit.log &

while true; do
  if grep -q "plebbit rpc: listening on.*secret auth key for remote connections" /app/data/plebbit.log; then
    echo "Found auth key line in log, extracting..."
    echo "Log line content:"
    grep "plebbit rpc: listening on.*secret auth key for remote connections" /app/data/plebbit.log | tail -n 1
    echo "Attempting to extract auth key..."
    AUTH_KEY=$(grep "plebbit rpc: listening on.*secret auth key for remote connections" /app/data/plebbit.log | tail -n 1 | sed -n 's/.*ws:\/\/[^:]*:[0-9]*\/\/\([^ ]*\).*/\1/p')
    echo "Extracted AUTH_KEY: $AUTH_KEY"
    if [ -n "$AUTH_KEY" ]; then
      echo "$AUTH_KEY" > /app/data/auth_key
      echo "Successfully extracted auth key: $AUTH_KEY"
      break
    else
      echo "Failed to extract auth key, retrying..."
    fi
  fi
  sleep 1
done

wait