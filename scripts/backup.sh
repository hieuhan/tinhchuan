#!/bin/sh
last_backup_date=""
while true; do
    current_hour=$(date +%H)
    current_date=$(date +%Y%m%d)
    if [ "$current_hour" = "02" ] && [ "$last_backup_date" != "$current_date" ]; then
        backup_file_path="/backups/tinhchuan_${current_date}.sql.gz"
        if pg_dump -h postgres -U "${DB_USER}" "${DB_NAME}" | gzip > "$backup_file_path"; then
            echo "[$(date)] ✅ Đã tạo backup: $backup_file_path"
            last_backup_date="$current_date"
            # Chỉ giữ lại backup trong 7 ngày gần nhất, tự động xoá file cũ hơn
            # để tránh đầy ổ đĩa SSD giới hạn của Mac Mini. "-mtime +7" nghĩa là
            # thời gian sửa đổi file (mtime) lớn hơn 7 ngày trước thời điểm hiện tại.
            find /backups -name 'tinhchuan_*.sql.gz' -mtime +7 -delete
        else
            echo "[$(date)] ❌ Backup thất bại, sẽ thử lại ở vòng lặp sau"
        fi
    fi
    sleep 60
done
