#!/usr/bin/env sh
set -eu

# Chạy trên VPS host. Backup được nén và có quyền đọc chỉ dành cho user hiện tại.
deploy_dir="${IORDER_DEPLOY_DIR:-$HOME/apps/iorder-website/deploy}"
backup_dir="${IORDER_BACKUP_DIR:-$HOME/backups/iorder-postgres}"
retention_days="${IORDER_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date +%F-%H%M%S)"
target="$backup_dir/iordercms-$timestamp.sql.gz"
temporary="$target.tmp"

umask 077
mkdir -p "$backup_dir"
cd "$deploy_dir"

docker compose exec -T postgres pg_dump -U admin_iorder -d iorderCMS | gzip > "$temporary"
mv "$temporary" "$target"
find "$backup_dir" -type f -name 'iordercms-*.sql.gz' -mtime +"$retention_days" -delete

printf 'PostgreSQL backup created: %s\n' "$target"
