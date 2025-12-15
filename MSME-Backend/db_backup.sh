#!/bin/bash

# Configuration
BACKUP_DIR="/root/MSME Full Code Backup/MSME-Backend/db_backups"
REPO_DIR="/root/MSME Full Code Backup/MSME-Backend"
DB_NAME="msme_db"
DB_USER="root"
RETENTION_DAYS=730  # 2 years

# Generate date-based filename
DATE=$(TZ="Africa/Johannesburg" date +%Y-%m-%d)
YEAR=$(TZ="Africa/Johannesburg" date +%Y)
MONTH=$(TZ="Africa/Johannesburg" date +%m)
BACKUP_SUBDIR="$BACKUP_DIR/$YEAR/$MONTH"
BACKUP_FILE="$BACKUP_SUBDIR/msme_db_backup_$DATE.sql"

# Create year/month subdirectory
mkdir -p "$BACKUP_SUBDIR"

# Create the backup
mysqldump -u "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "$(date): Backup failed!" >> /var/log/db_backup.log
    exit 1
fi

# Compress the backup
gzip -f "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "$(date): Backup created: $BACKUP_FILE" >> /var/log/db_backup.log

# Delete backups older than 2 years
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
# Remove empty directories
find "$BACKUP_DIR" -type d -empty -delete

# Git commit and push
cd "$REPO_DIR"
git add db_backups/
git commit -m "DB backup: $DATE"
git push origin main 2>/dev/null || git push origin master 2>/dev/null

if [ $? -eq 0 ]; then
    echo "$(date): Backup pushed to GitHub" >> /var/log/db_backup.log
else
    echo "$(date): GitHub push failed" >> /var/log/db_backup.log
fi
