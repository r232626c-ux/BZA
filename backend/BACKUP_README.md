# BIOZONE Database Backup Setup Instructions
# ==========================================

## Overview
This setup creates daily automated backups of your BIOZONE PostgreSQL database to prevent data loss.

## Files Created
- `backup_db.py` - Python script that creates compressed database backups
- `backup_db.bat` - Windows batch file to run the backup script
- `backups/` - Directory where backup files are stored

## Backup Features
- Daily compressed backups using PostgreSQL's pg_dump
- **All backups kept indefinitely** (no automatic cleanup)
- Timestamped filenames
- Logs backup operations

## Setting up Daily Backups with Windows Task Scheduler

### Step 1: Open Task Scheduler
1. Press Windows + R, type `taskschd.msc`, press Enter
2. Click "Create Task..." in the right panel

### Step 2: General Settings
- Name: `BIOZONE Daily Backup`
- Description: `Daily backup of BIOZONE PostgreSQL database`
- Security options: Select "Run whether user is logged on or not"
- Check "Run with highest privileges"

### Step 3: Triggers
1. Click "New..." under Triggers
2. Begin the task: "On a schedule"
3. Settings:
   - Daily
   - Start: Choose a time when the system is usually running (e.g., 2:00 AM)
   - Recur every: 1 days
4. Click OK

### Step 4: Actions
1. Click "New..." under Actions
2. Action: "Start a program"
3. Program/script: `C:\Users\complexb\Desktop\BIOZONE\biozone\biozone\backend\backup_db.bat`
4. Start in: `C:\Users\complexb\Desktop\BIOZONE\biozone\biozone\backend`
5. Click OK

### Step 5: Conditions (Optional)
- Uncheck "Start the task only if the computer is on AC power" if you want backups on battery
- Other settings as needed

### Step 6: Settings
- Check "If the task fails, restart every: 1 minute, up to 3 times"
- Check "Run task as soon as possible after a scheduled start is missed"
- Click OK

### Step 7: Test the Task
1. Right-click the task and select "Run"
2. Check the backup directory for a new .sql.gz file
3. Check backup_log.txt for success message

## Manual Backup
To run a backup manually:
1. Open Command Prompt as Administrator
2. Navigate to: `cd C:\Users\complexb\Desktop\BIOZONE\biozone\biozone\backend`
3. Run: `backup_db.bat`

## Restoring from Backup
To restore from a backup file:
1. Stop the BIOZONE application
2. Run: `pg_restore -h localhost -p 5432 -U biozone_user -d biozone backup_file.sql.gz`
3. Start the application

## Monitoring
- Check `backup_log.txt` for daily backup status
- Monitor the `backups/` directory for new files
- **All backups are kept indefinitely** - monitor disk space usage

## Troubleshooting
- Ensure PostgreSQL is running during backup time
- Check that DATABASE_URL environment variable is set
- Verify the backup directory has write permissions