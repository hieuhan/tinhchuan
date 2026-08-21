#!/bin/sh
# Vòng lặp nền chạy trong container "postgres_backup": mỗi phút kiểm tra giờ
# hệ thống, đúng 2h sáng (giờ VN) thì dump toàn bộ database, nén gzip và lưu
# vào /backups (đã mount ra thư mục ./backups trên host).
last_backup_date=""
while true; do
    current_hour=$(date +%H)
    current_date=$(date +%Y%m%d)
    if [ "$current_hour" = "02" ] && [ "$last_backup_date" != "$current_date" ]; then
        backup_file_path="/backups/tinhchuan_${current_date}.sql.gz"
        if pg_dump -h postgres -U "${DB_USER}" "${DB_NAME}" | gzip > "$backup_file_path"; then
            echo "[$(date)] ✅ Đã tạo backup: $backup_file_path"
            last_backup_date="$current_date"
            # Xoá các bản backup cũ hơn 7 ngày để tránh đầy ổ đĩa Mac Mini
            find /backups -name 'tinhchuan_*.sql.gz' -mtime +7 -delete
        else
            echo "[$(date)] ❌ Backup thất bại, sẽ thử lại ở vòng lặp sau"
        fi
    fi
    sleep 60
done
