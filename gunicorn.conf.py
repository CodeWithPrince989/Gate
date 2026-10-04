import os

# Default port is 10000 on Render if $PORT is not set
port = os.environ.get("PORT", "10000")

# Bind to 0.0.0.0 explicitly as required by modern PaaS (Render, Heroku, etc.)
bind = f"0.0.0.0:{port}"

# Use maximum concurrency based on WEB_CONCURRENCY injected by Render
# For standard free instances, this might be 1, but we parse it dynamically.
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))

# Log to stdout for Render logging pipeline
accesslog = "-"
errorlog = "-"
