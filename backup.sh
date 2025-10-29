#!/bin/bash

# SeaCalendar Database Backup Script

BACKUP_DIR="/opt/seacalendar/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if container exists and is running
if ! docker ps --format '{{.Names}}' | grep -q '^seacalendar-db$'; then
    echo "Error: seacalendar-db container is not running"
    exit 1
fi

# Backup database
if docker exec seacalendar-db pg_dump -U seacalendar seacalendar | gzip > $BACKUP_FILE; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
    
    # Show backup size
    ls -lh $BACKUP_FILE
else
    echo "❌ Backup failed"
    rm -f $BACKUP_FILE  # Remove empty/corrupted file
    exit 1
fi
