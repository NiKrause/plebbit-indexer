#!/bin/sh

if [ "$NODE_ENV" = "development" ]; then
    # In development, we don't need the build and can run the dev server
    # The source code is mounted as a volume
    exec npm run dev
else
    # In production, we use the pre-built application
    exec npm start
fi