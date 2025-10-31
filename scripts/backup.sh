#!/bin/bash
# Database backup script for SeaCalendar
# This script backs up the PostgreSQL database to a timestamped file

set -e

BACKUP_DIR="/opt/seacalendar/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="seacalendar-dev-db"
DB_NAME="seacalendar_dev"
BACKUP_FILE="$BACKUP_DIR/seacalendar_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Create backup
echo "$(date): Starting backup..."
docker exec -t "$CONTAINER_NAME" pg_dump -U dev "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "$(date): Backup completed: $BACKUP_FILE"

  # Remove backups older than retention period
  find "$BACKUP_DIR" -name "seacalendar_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "$(date): Old backups cleaned up (retention: ${RETENTION_DAYS} days)"
else
  echo "$(date): Backup failed!"
  exit 1
fi
