#!/usr/bin/env bash
set -e
echo "[refresh-auth] Deleting stale auth file..."
rm -f .auth/free-user.json
echo "[refresh-auth] Re-running globalSetup..."
npx playwright test --list 2>&1 | head -3
echo "[refresh-auth] Auth file refreshed: .auth/free-user.json"
