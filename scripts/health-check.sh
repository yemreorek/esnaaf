#!/bin/bash
# Esnaaf Platform Health Check Script
# Crontab: */5 * * * * /path/to/health-check.sh

API_URL="https://esnaaf-backend-339090537138.europe-west3.run.app/api/health"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
LOG_FILE="/var/log/esnaaf-health.log"

response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL")
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$response" != "200" ]; then
  echo "[$timestamp] CRITICAL: API returned $response" >> "$LOG_FILE"
  
  # Slack bildirimi (webhook URL tanımlıysa)
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      -d "{\"text\": \"🔴 ESNAAF ALARM: API Sağlık kontrolü başarısız! HTTP $response — $(date)\"}"
  fi
else
  echo "[$timestamp] OK: API healthy" >> "$LOG_FILE"
fi
