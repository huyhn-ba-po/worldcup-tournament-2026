#!/bin/bash
# Auto-pull + rebuild + restart wc2026 container.
# Chạy mỗi 10 phút qua cron. Skip rebuild/restart nếu không có code mới
# (results.json đã được mount vào container, host pull về là container thấy ngay).

REPO_DIR="/root/worldcup-tournament-2026"
LOG_FILE="$REPO_DIR/logs/deploy.log"

mkdir -p "$REPO_DIR/logs"

cd "$REPO_DIR" || {
  echo "[$(date)] ERROR: Can't cd to $REPO_DIR" >> "$LOG_FILE"
  exit 1
}

# Bước 1: Git pull — so HEAD trước/sau để biết có commit mới không
BEFORE=$(git rev-parse HEAD)
PULL_OUTPUT=$(git pull --quiet origin main 2>&1)
PULL_EXIT=$?

if [ $PULL_EXIT -ne 0 ]; then
  echo "[$(date)] Git pull FAILED (exit $PULL_EXIT): $PULL_OUTPUT" >> "$LOG_FILE"
  exit 1
fi

AFTER=$(git rev-parse HEAD)

# Không có code mới → exit sớm. results.json (đã mount) tự reflect, không cần restart.
if [ "$BEFORE" = "$AFTER" ]; then
  exit 0
fi

echo "[$(date)] Có code mới ($BEFORE → $AFTER), bắt đầu rebuild..." >> "$LOG_FILE"

# Bước 2: Build Docker image (cache reuse khi Dockerfile + deps không đổi → nhanh)
BUILD_OUTPUT=$(docker build -t wc2026-webapp:latest "$REPO_DIR/webapp" 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "[$(date)] Docker build FAILED (exit $BUILD_EXIT): $BUILD_OUTPUT" >> "$LOG_FILE"
  exit 1
fi

# Bước 3: Xoá container cũ, chạy container mới
docker stop wc2026 > /dev/null 2>&1
docker rm wc2026 > /dev/null 2>&1

docker run -d \
  --name wc2026 \
  --restart unless-stopped \
  -p 3456:3000 \
  -v "$REPO_DIR/webapp/src/data/results.json:/app/src/data/results.json" \
  wc2026-webapp:latest > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date)] Deploy OK — container restarted" >> "$LOG_FILE"
else
  echo "[$(date)] Docker run FAILED" >> "$LOG_FILE"
  exit 1
fi
