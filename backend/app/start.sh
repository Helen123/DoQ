#!/bin/bash
echo "=== Starting DoQ API ==="
exec uvicorn app_main:app --host 0.0.0.0 --port 8000
