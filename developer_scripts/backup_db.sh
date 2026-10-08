#!/bin/bash
# Dump the fish database, zip it, and upload to Dropbox via rclone.
# Skips the backup if no new runs have been saved since the last backup.
# Requires: mongodump, mongosh, rclone configured with a remote named "dropbox"
# Usage: ./backup_db.sh

set -e

LAST_RUN_FILE="$HOME/.fish_last_backup_run_id"
DROPBOX_DEST="dropbox:/fish-backups"

LATEST_ID=$(mongosh fish --quiet --eval \
  "const r = db.runs.findOne({}, {projection: {_id:1}, sort: {_id:-1}}); print(r ? r._id.toString() : '')" \
  2>/dev/null | tail -1 || echo "")

LAST_ID=$(cat "$LAST_RUN_FILE" 2>/dev/null || echo "")

if [ "$LATEST_ID" = "$LAST_ID" ]; then
  echo "No new runs since last backup. Skipping."
  exit 0
fi

BACKUP_NAME="fish-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$HOME/$BACKUP_NAME"
ARCHIVE="$HOME/$BACKUP_NAME.tar.gz"

echo "Dumping database..."
mongodump --db fish --out "$BACKUP_DIR"

echo "Compressing..."
tar -czf "$ARCHIVE" -C "$HOME" "$BACKUP_NAME"

echo "Uploading to Dropbox..."
rclone copy "$ARCHIVE" "$DROPBOX_DEST"

echo "Cleaning up local files..."
rm -rf "$BACKUP_DIR" "$ARCHIVE"

echo "$LATEST_ID" > "$LAST_RUN_FILE"

echo "Done. Backup saved to $DROPBOX_DEST/$BACKUP_NAME.tar.gz"
