#!/usr/bin/env python3
"""
Daily PostgreSQL Backup Script for BIOZONE
Creates a compressed backup of all tables and stores it with timestamp.
All backups are kept indefinitely.
"""

import os
import subprocess
import datetime
import gzip
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection details
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Parse DATABASE_URL (format: postgresql+asyncpg://user:password@host:port/dbname)
from urllib.parse import urlparse
parsed = urlparse(DATABASE_URL)
host = parsed.hostname
port = parsed.port or 5432
dbname = parsed.path.lstrip('/')
user = parsed.username
password = parsed.password

# pg_dump path (bundled with the app)
PG_DUMP_PATH = Path(__file__).parent.parent / "electron" / "postgres" / "pgsql" / "bin" / "pg_dump.exe"

# Backup directory
BACKUP_DIR = Path(__file__).parent / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

# Generate timestamp
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_filename = f"biozone_backup_{timestamp}.sql.gz"
backup_path = BACKUP_DIR / backup_filename

def create_backup():
    """Create a compressed PostgreSQL backup using pg_dump"""
    try:
        # Set PGPASSWORD environment variable for pg_dump
        env = os.environ.copy()
        env['PGPASSWORD'] = password

        # pg_dump command
        cmd = [
            str(PG_DUMP_PATH),
            '--host', host,
            '--port', str(port),
            '--username', user,
            '--dbname', dbname,
            '--no-password',
            '--format', 'custom',  # Use custom format for better compression
            '--compress', '9',     # Maximum compression
            '--verbose'
        ]

        print(f"Starting backup: {backup_path}")

        # Run pg_dump and pipe to gzip
        with gzip.open(backup_path, 'wb') as f:
            result = subprocess.run(
                cmd,
                env=env,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode == 0:
            print(f"Backup completed successfully: {backup_path}")
            print(f"Backup size: {backup_path.stat().st_size / (1024*1024):.2f} MB")
            return True
        else:
            print(f"Backup failed: {result.stderr}")
            return False

    except Exception as e:
        print(f"Error during backup: {e}")
        return False

if __name__ == "__main__":
    print("BIOZONE Database Backup Started")
    print(f"Backup directory: {BACKUP_DIR}")

    success = create_backup()
    if success:
        print("Backup process completed successfully")
    else:
        print("Backup process failed")
        exit(1)