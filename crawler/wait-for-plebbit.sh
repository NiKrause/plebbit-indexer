#!/bin/sh

echo "Waiting for plebbit-cli auth key..."
while [ ! -f /app/data/auth_key ]; do
  sleep 1
done
export PLEBBIT_AUTH_KEY=$(cat /app/data/auth_key)
echo "Found auth key: $PLEBBIT_AUTH_KEY"
export PLEBBIT_WS_URL=ws://plebbit-cli:9138/$PLEBBIT_AUTH_KEY
echo "connecting to $PLEBBIT_WS_URL"
npm start