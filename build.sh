#!/usr/bin/env bash
# Build script for Render

set -o errexit

# Render build hooks can run before generated secrets are injected.
# Use a build-only fallback so collectstatic/migrate don't crash at import time.
export SECRET_KEY="${SECRET_KEY:-render-build-only-secret-key}"

python3 -m pip install -r requirements.txt

python3 manage.py collectstatic --no-input
python3 manage.py migrate
