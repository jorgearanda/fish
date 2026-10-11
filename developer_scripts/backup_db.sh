#!/bin/bash
# Dump the fish database, zip it, and upload to Dropbox via rclone.
# Skips the backup if nothing in the database has changed since the last
# backup (new runs, microworld edits, participant links, ...).
# Every night it also writes one line to $DROPBOX_DEST/fish-backup-status.txt,
# so an old date on that file means the job itself is not running.
# Requires: mongodump, mongosh, rclone configured with a remote named "dropbox"
# Usage: bash backup_db.sh (cron runs it with /bin/bash, so it works even
# when a git pull drops the executable bit)

set -e

LAST_HASH_FILE="$HOME/.fish_last_backup_hash"
DROPBOX_DEST="dropbox:/fish-backups"
STATUS_FILE="fish-backup-status.txt"

write_status() {
  echo "$(date -u '+%Y-%m-%d %H:%M UTC')  $1" | rclone rcat "$DROPBOX_DEST/$STATUS_FILE"
}

# A fingerprint of every collection's contents
LATEST_HASH=$(mongosh fish --quiet --eval "print(db.runCommand({dbHash: 1}).md5)" \
  2>/dev/null | tail -1 || echo "")

LAST_HASH=$(cat "$LAST_HASH_FILE" 2>/dev/null || echo "")

if [ -n "$LATEST_HASH" ] && [ "$LATEST_HASH" = "$LAST_HASH" ]; then
  echo "$(date -u +%FT%TZ) No changes since last backup. Skipping."
  write_status "skipped: no changes since the last backup"
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

echo "$LATEST_HASH" > "$LAST_HASH_FILE"
write_status "backup saved: $BACKUP_NAME.tar.gz"

echo "Done. Backup saved to $DROPBOX_DEST/$BACKUP_NAME.tar.gz"
