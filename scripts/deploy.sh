#!/usr/bin/env bash
# Deploy Yuan website to production server.
# Usage: ./scripts/deploy.sh
# Requires: sshpass, SSH access to root@www.yuanzzzz.com (port 22)

set -euo pipefail

SERVER="root@www.yuanzzzz.com"
SSH_PORT="${SSH_PORT:-22}"
SSH_PASS="${SSH_PASS:-1452}"
APP_DIR="/root/website"

echo "==> Pushing latest code to GitHub..."
git push origin master

echo "==> Deploying on server..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
cd /root/website

echo "==> Pull latest..."
git fetch origin
git merge --ff-only origin/master
# Keep runtime uploads (including Obsidian images), environment files and backups.

echo "==> Install & build..."
npm install
npm run build

echo "==> Restart app..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart website 2>/dev/null || pm2 restart all
elif systemctl is-active --quiet yuan-website 2>/dev/null; then
  systemctl restart yuan-website
else
  pkill -f "next start" 2>/dev/null || true
  nohup npm start > /var/log/yuan-website.log 2>&1 &
fi

echo "==> Done. HEAD: $(git rev-parse --short HEAD)"
REMOTE

echo "Deploy complete."
