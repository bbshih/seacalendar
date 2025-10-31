#!/bin/bash
set -e

echo "💾 Database Backup Setup"
echo "========================"
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run with sudo"
  echo "Usage: sudo bash scripts/setup-backups.sh"
  exit 1
fi

BACKUP_DIR="/opt/seacalendar/backups"
BACKUP_SCRIPT="/opt/seacalendar/scripts/backup.sh"

# Create backup directory
echo "Creating backup directory..."
mkdir -p "$BACKUP_DIR"
chown deploy:deploy "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

# Create backup script if it doesn't exist or update it
echo "Creating backup script..."
cat > "$BACKUP_SCRIPT" <<'EOF'
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
EOF

chmod +x "$BACKUP_SCRIPT"
chown deploy:deploy "$BACKUP_SCRIPT"

echo "✅ Backup script created: $BACKUP_SCRIPT"

# Set up cron job for daily backups at 2 AM
echo "Setting up daily backup cron job (2 AM)..."
CRON_JOB="0 2 * * * $BACKUP_SCRIPT >> /var/log/seacalendar-backup.log 2>&1"

# Add cron job for deploy user
# Get existing crontab, remove any old backup jobs, add new one
(crontab -u deploy -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" || true; echo "$CRON_JOB") | crontab -u deploy -

echo "✅ Cron job installed for user 'deploy'"

# Create log file
touch /var/log/seacalendar-backup.log
chown deploy:deploy /var/log/seacalendar-backup.log

echo ""
echo "✅ Backup automation complete!"
echo ""
echo "Details:"
echo "  - Backup directory: $BACKUP_DIR"
echo "  - Backup script: $BACKUP_SCRIPT"
echo "  - Schedule: Daily at 2:00 AM"
echo "  - Retention: 30 days"
echo "  - Log file: /var/log/seacalendar-backup.log"
echo ""
echo "Test the backup manually:"
echo "  sudo -u deploy $BACKUP_SCRIPT"
echo ""
