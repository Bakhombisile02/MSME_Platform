# MSME Database Documentation

## Database Information
- **Database Name**: msme_db
- **Type**: MySQL
- **Port**: 3306

## Database Backups
Database backups are stored outside the repository for security and size reasons. Backups are excluded from version control via `.gitignore`.

### Latest Backup Location
Database backups are available in the root directory:
- `/root/msme_db_backup_20251201_020955.sql` - Full database backup from December 1, 2025
- `/root/msme_db_backup_for_download.sql` - Formatted backup for download
- `/root/msme_db_backup.sql.gz` - Compressed backup

### Backup Script
A backup script is available at `db_backup.sh` in the backend directory.

## Restoring Database
To restore the database from a backup:

```bash
mysql -u root -p msme_db < /path/to/backup.sql
```

Or if using compressed backup:
```bash
gunzip -c /path/to/backup.sql.gz | mysql -u root -p msme_db
```

## Database Schema
The database includes tables for:
- MSME registrations and profiles
- Business information
- Directors and team members
- Service providers
- Analytics and dashboard data
- User authentication

## Configuration
Database connection is configured in `config/config.js` and initialized via:
- `db/database.js` - Database connection
- `models/index.js` - Sequelize model initialization

## Environment Variables
Required database environment variables:
- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: msme_db)
