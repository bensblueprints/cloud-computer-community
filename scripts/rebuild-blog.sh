#!/bin/bash
# Cron job: Regenerate skills data and rebuild frontend
# Runs on the production server (51.161.172.76)
# Usage: Add to crontab with: crontab -e
# Example (daily at 3am): 0 3 * * * /root/cloud-computer-community/scripts/rebuild-blog.sh >> /var/log/blog-rebuild.log 2>&1

set -e

LOG_PREFIX="[blog-rebuild $(date '+%Y-%m-%d %H:%M:%S')]"
PROJECT_DIR="/root/cloud-computer-community"

echo "$LOG_PREFIX Starting blog rebuild..."

cd "$PROJECT_DIR"

# Pull latest from GitHub
echo "$LOG_PREFIX Pulling latest code..."
git pull origin main

# Regenerate skills data
echo "$LOG_PREFIX Regenerating skills data..."
cd "$PROJECT_DIR/frontend/src/data"
node generate-skills.cjs

# Build frontend
echo "$LOG_PREFIX Building frontend..."
cd "$PROJECT_DIR/frontend"
npm run build

# Rebuild and restart frontend container
echo "$LOG_PREFIX Rebuilding Docker container..."
cd "$PROJECT_DIR"
docker-compose up -d --build frontend

echo "$LOG_PREFIX Blog rebuild complete!"
