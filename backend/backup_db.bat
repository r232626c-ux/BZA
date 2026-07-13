@echo off
REM BIOZONE Daily Database Backup Script
REM This script activates the virtual environment and runs the backup

cd /d "%~dp0"
call venv\Scripts\activate.bat
python backup_db.py
call venv\Scripts\deactivate.bat

echo Backup completed at %DATE% %TIME% >> backup_log.txt