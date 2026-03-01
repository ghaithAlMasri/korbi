#!/bin/bash

if [ -f /.dockerenv ]; then
    echo "Running in Docker"
    fastapi dev app/main.py --host 0.0.0.0 --port 8000 --reload
else
    echo "Running locally with uv"
    uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000 --reload
fi
