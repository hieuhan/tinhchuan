#!/usr/bin/env bash
# =============================================================================
# bootstrap/setup.sh - Khởi tạo hạ tầng Docker cho Next.js Fullstack
# =============================================================================
set -euo pipefail

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_RED='\033[0;31m'
COLOR_CYAN='\033[0;36m'
COLOR_RESET='\033[0m'

print_success() { echo -e "${COLOR_GREEN}$1${COLOR_RESET}"; }
print_warning() { echo -e "${COLOR_YELLOW}$1${COLOR_RESET}"; }
print_error()   { echo -e "${COLOR_RED}$1${COLOR_RESET}"; }
print_step()    { echo -e "\n${COLOR_CYAN}$1${COLOR_RESET}"; }

SCRIPT_DIRECTORY="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT_DIRECTORY="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
cd "${PROJECT_ROOT_DIRECTORY}"

print_success "📍 Thư mục gốc dự án: ${PROJECT_ROOT_DIRECTORY}"

# ⚠️  LƯU Ý VERSION: cloudflared, MinIO, và Dozzle ra bản mới rất thường xuyên
# (gần như hàng tháng). Các tag image trong script này (cloudflare/2025.4.0,
# minio/RELEASE.2025-04-22, dozzle/v8.12.6) có thể đã cũ hơn 1 năm tại thời
# điểm bạn deploy thật. Trước khi "make up" lần đầu trên production, chạy:
#   docker pull cloudflare/cloudflared:latest && docker inspect --format='{{.Id}}' cloudflare/cloudflared:latest
# rồi pin lại đúng tag cụ thể mới nhất (không nên dùng ":latest" trôi nổi lâu dài).

# =============================================================================
# BƯỚC 1: Tạo cấu trúc thư mục
# =============================================================================
print_step "📁 [Bước 1/9] Đang tạo cấu trúc thư mục..."
mkdir -p config/postgres/init config/redis config/nginx/conf.d config/nginx/errors \
         config/nginx/snippets config/cloudflare
mkdir -p .github/workflows scripts bootstrap
mkdir -p data/postgres data/redis data/minio data/nginx-cache
mkdir -p logs/postgres logs/nginx logs/backend logs/frontend
mkdir -p backups
mkdir -p packages/database/prisma packages/database/src
mkdir -p apps/frontend/app apps/frontend/lib apps/frontend/public
mkdir -p apps/backend/app apps/backend/lib apps/backend/public
print_success "   ✅ Đã tạo toàn bộ thư mục."

# =============================================================================
# BƯỚC 2: File log trống
# =============================================================================
print_step "📄 [Bước 2/9] Đang tạo file log trống..."
touch logs/postgres/postgresql.log logs/nginx/access.log logs/nginx/error.log
print_success "   ✅ Đã tạo file log."

# =============================================================================
# BƯỚC 3: Cấu hình PostgreSQL
# =============================================================================
print_step "🐘 [Bước 3/9] Đang tạo cấu hình PostgreSQL..."
cat > config/postgres/postgresql.conf << 'EOF'
listen_addresses = '*'
port = 5432
max_connections = 60
superuser_reserved_connections = 3
shared_buffers = 384MB
work_mem = 8MB
maintenance_work_mem = 128MB
effective_cache_size = 1024MB
random_page_cost = 1.1
effective_io_concurrency = 200
wal_level = replica
max_wal_size = 1GB
checkpoint_completion_target = 0.9
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql.log'
log_min_duration_statement = 1000
log_timezone = 'Asia/Ho_Chi_Minh'
EOF

cat > config/postgres/pg_hba.conf << 'EOF'
local   all   all   scram-sha-256
host    all   all   127.0.0.1/32   scram-sha-256
host    all   all   ::1/128        scram-sha-256
host    all   all   172.28.0.0/16  scram-sha-256
EOF

cat > config/postgres/init/01-extensions.sql << 'EOF'
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'vietnamese') THEN
    CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);
    ALTER TEXT SEARCH CONFIGURATION vietnamese ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;
  END IF;
END $$;
EOF
print_success "   ✅ Đã tạo cấu hình PostgreSQL."

# =============================================================================
# BƯỚC 4: Cấu hình Redis
# =============================================================================
print_step "🔴 [Bước 4/9] Đang tạo cấu hình Redis..."
cat > config/redis/redis.conf << 'EOF'
bind 0.0.0.0
port 6379
protected-mode yes
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
loglevel notice
EOF
print_success "   ✅ Đã tạo cấu hình Redis."

# =============================================================================
# BƯỚC 5: Cấu hình Nginx
# =============================================================================
print_step "🌐 [Bước 5/9] Đang tạo cấu hình Nginx..."
generate_error_page() {
  local code=$1; local emoji=$2; local msg=$3
  cat > "config/nginx/errors/${code}.html" << EOHTML
<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>${code}</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f8fafc}
.box{text-align:center;max-width:480px;padding:1.5rem}h1{font-size:3rem;margin:0}p{color:#6b7280;line-height:1.6}
.countdown{font-weight:600;color:#3b82f6}</style></head>
<body><div class="box"><h1>${emoji} ${code}</h1>
<p>${msg}. Trang sẽ tự tải lại sau <span class="countdown" id="cd">5</span> giây.</p></div>
<script>var s=5;setInterval(()=>{s--;document.getElementById('cd').textContent=s;if(s<=0)location.reload()},1000)</script>
</body></html>
EOHTML
}
generate_error_page "502" "🔄" "Hệ thống đang khởi động lại"
generate_error_page "503" "🛠️" "Hệ thống đang bảo trì"
generate_error_page "504" "⏱️" "Máy chủ phản hồi quá lâu"

cat > config/nginx/snippets/real-ip.conf << 'EOF'
real_ip_header CF-Connecting-IP;
set_real_ip_from 172.28.0.0/16;
set_real_ip_from 127.0.0.1/32;
EOF

cat > config/nginx/snippets/security-headers.conf << 'EOF'
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
EOF

cat > config/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;
events { worker_connections 2048; multi_accept on; use epoll; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  include /etc/nginx/snippets/real-ip.conf;
  log_format main '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent';
  access_log /var/log/nginx/access.log main;
  sendfile on; tcp_nopush on; tcp_nodelay on; keepalive_timeout 65;
  server_tokens off; client_max_body_size 25m;
  
  limit_req_zone $binary_remote_addr zone=web_limit:10m rate=50r/s;
  limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=10r/s;
  limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
  
  proxy_cache_path /var/cache/nginx/cdn levels=1:2 keys_zone=cdn_cache:10m max_size=5g inactive=30d;
  include /etc/nginx/conf.d/*.conf;
}
EOF

cat > config/nginx/conf.d/00-default.conf << 'EOF'
server {
  listen 80 default_server;
  server_name _;
  location = /healthz {
    access_log off;
    add_header Content-Type text/plain;
    return 200 "ok";
  }
  location / { return 444; }
}
EOF

cat > config/nginx/conf.d/10-web.conf << 'EOF'
server {
  listen 80; server_name tinhchuan.vn www.tinhchuan.vn;
  include /etc/nginx/snippets/security-headers.conf;
  location / {
    limit_req zone=web_limit burst=50 nodelay;
    proxy_pass http://frontend:3000;
    proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
EOF

cat > config/nginx/conf.d/20-admin.conf << 'EOF'
server {
  listen 80; server_name admin.tinhchuan.vn;
  include /etc/nginx/snippets/security-headers.conf;
  add_header Cache-Control "no-store" always;
  
  location = /admin/login {
    limit_req zone=login_limit burst=3 nodelay;
    proxy_pass http://backend:3000;
    proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;
  }
  
  location / {
    limit_req zone=admin_limit burst=10 nodelay;
    proxy_pass http://backend:3000;
    proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 300s;
  }
}
EOF

cat > config/nginx/conf.d/30-cdn.conf << 'EOF'
server {
  listen 80; server_name cdn.tinhchuan.vn;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Access-Control-Allow-Origin "*" always;
  location ~ ^/private/ { return 404; }
  location /media/ {
    proxy_pass http://minio:9000/media/;
    proxy_cache cdn_cache; proxy_cache_valid 200 30d;
    expires 30d; add_header Cache-Control "public, immutable";
  }
  location / { return 404; }
}
EOF
print_success "   ✅ Đã tạo cấu hình Nginx."

# =============================================================================
# BƯỚC 6: Dockerfile
# =============================================================================
print_step "🐳 [Bước 6/9] Đang tạo Dockerfile..."
cat > Dockerfile << 'EOF'
ARG APP_NAME
FROM node:24-alpine AS base
WORKDIR /app

FROM base AS dependencies
ARG APP_NAME
# Không cần build tool (python3/make/g++) nữa: bcryptjs là pure JS và Prisma 7
# là rust-free client, không còn package nào cần compile native binary.
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
RUN npm ci

FROM base AS builder
ARG APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1
# KHÔNG cần khai báo DATABASE_URL giả ở đây. "prisma generate" không kết nối
# DB thật, chỉ đọc schema.prisma để sinh code - lý do trước đây phải bịa giá
# trị giả là vì packages/database/prisma.config.ts dùng helper env('DATABASE_URL')
# của Prisma, helper này ép buộc biến PHẢI tồn tại (throw PrismaConfigEnvError
# nếu thiếu). Đã đổi sang process.env.DATABASE_URL (xem prisma.config.ts) -
# trả về undefined thay vì throw, và từ Prisma 7.2.0 trở lên (dự án dùng 7.9.1)
# "prisma generate" chấp nhận url undefined. Giá trị DATABASE_URL thật chỉ
# thật sự bắt buộc khi chạy "prisma migrate deploy" lúc runtime, lấy từ
# "environment:" trong docker-compose.yml, không liên quan bước build này.
COPY package.json package-lock.json* ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY apps/ ./apps/

WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app
RUN npm run build --workspace=apps/${APP_NAME}

FROM base AS runner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME="0.0.0.0"

RUN addgroup -g 1001 -S nodejs && adduser -S app_user -u 1001 -G nodejs

COPY --from=builder --chown=app_user:nodejs /app/apps/${APP_NAME}/.next/standalone /app
COPY --from=builder --chown=app_user:nodejs /app/apps/${APP_NAME}/.next/static /app/apps/${APP_NAME}/.next/static
COPY --from=builder --chown=app_user:nodejs /app/apps/${APP_NAME}/public /app/apps/${APP_NAME}/public
# Prisma 7 sinh client vào packages/database/generated/client (đường dẫn tự
# khai báo qua "output" trong schema.prisma), KHÔNG còn ở node_modules/.prisma
# như Prisma 6 nữa - "next build" standalone đôi khi trace thiếu file này nên
# copy tay để chắc chắn container runtime luôn có sẵn.
COPY --from=builder --chown=app_user:nodejs /app/packages/database/generated /app/packages/database/generated

USER app_user
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD node apps/${APP_NAME}/server.js
EOF
print_success "   ✅ Đã tạo Dockerfile."

# =============================================================================
# BƯỚC 7: docker-compose.yml & Script Backup
# =============================================================================
print_step "🐙 [Bước 7/9] Đang tạo docker-compose.yml và script backup..."

cat > scripts/backup.sh << 'EOF'
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
EOF
chmod +x scripts/backup.sh

# --- Docker Compose (ĐÃ SỬA LỖI YAML FLOW MAPPING) ---
cat > docker-compose.yml << 'EOF'
x-logging-config: &logging_config
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

networks:
  tinhchuan_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

services:
  postgres:
    image: postgres:17.11-alpine
    container_name: tinhchuan-postgres
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 1.5g
    cpus: 1.5
    logging: *logging_config
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      TZ: ${TIMEZONE}
    command: ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - ./config/postgres/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
      - ./config/postgres/init:/docker-entrypoint-initdb.d:ro
      - ./logs/postgres:/var/log/postgresql
    ports: ["127.0.0.1:5432:5432"]
    networks: [tinhchuan_network]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7.4-alpine
    container_name: tinhchuan-redis
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 256m
    cpus: 0.5
    logging: *logging_config
    command: ["redis-server", "/usr/local/etc/redis/redis.conf", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - ./data/redis:/data
      - ./config/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    ports: ["127.0.0.1:6379:6379"]
    networks: [tinhchuan_network]
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2025-04-22T22-12-26Z
    container_name: tinhchuan-minio
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 1g
    cpus: 1.0
    logging: *logging_config
    command: ["server", "/data", "--console-address", ":9001"]
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      TZ: ${TIMEZONE}
    volumes: ["./data/minio:/data"]
    ports: ["127.0.0.1:9000:9000", "127.0.0.1:9001:9001"]
    networks: [tinhchuan_network]
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  backend:
    image: tinhchuan-backend:latest
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: backend
    container_name: tinhchuan-backend
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 768m
    cpus: 1.5
    logging: *logging_config
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NEXT_PUBLIC_CDN_URL: ${NEXT_PUBLIC_CDN_URL}
      AUTH_SECRET: ${AUTH_SECRET}
      TZ: ${TIMEZONE}
    ports: ["127.0.0.1:3001:3000"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks: [tinhchuan_network]

  frontend:
    image: tinhchuan-frontend:latest
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: frontend
    container_name: tinhchuan-frontend
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 1g
    cpus: 1.5
    logging: *logging_config
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NEXT_PUBLIC_CDN_URL: ${NEXT_PUBLIC_CDN_URL}
      TZ: ${TIMEZONE}
    ports: ["127.0.0.1:3000:3000"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks: [tinhchuan_network]

  nginx:
    image: nginx:1.27-alpine
    container_name: tinhchuan-nginx
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 256m
    cpus: 0.5
    logging: *logging_config
    environment:
      TZ: ${TIMEZONE}
    volumes:
      - ./config/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./config/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./config/nginx/snippets:/etc/nginx/snippets:ro
      - ./config/nginx/errors:/usr/share/nginx/errors:ro
      - ./data/nginx-cache:/var/cache/nginx
      - ./logs/nginx:/var/log/nginx
    ports: ["127.0.0.1:80:80"]
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    networks: [tinhchuan_network]
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3

  tunnel:
    image: cloudflare/cloudflared:2025.4.0
    container_name: tinhchuan-tunnel
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 128m
    cpus: 0.5
    logging: *logging_config
    command: ["tunnel", "--no-autoupdate", "run"]
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
      TZ: ${TIMEZONE}
    networks: [tinhchuan_network]
    depends_on:
      nginx:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO /dev/null http://127.0.0.1:2000/ready || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

  dozzle:
    image: amir20/dozzle:v8.12.6
    container_name: tinhchuan-dozzle
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 128m
    cpus: 0.25
    logging: *logging_config
    environment:
      DOZZLE_NO_ANALYTICS: "true"
      TZ: ${TIMEZONE}
    volumes: ["/var/run/docker.sock:/var/run/docker.sock:ro"]
    ports: ["127.0.0.1:9999:8080"]
    networks: [tinhchuan_network]

  postgres_backup:
    image: postgres:17.11-alpine
    container_name: tinhchuan-postgres-backup
    platform: linux/arm64
    restart: unless-stopped
    mem_limit: 256m
    cpus: 0.5
    logging: *logging_config
    environment:
      TZ: ${TIMEZONE}
      PGPASSWORD: ${DB_PASSWORD}
      DB_USER: ${DB_USER}
      DB_NAME: ${DB_NAME}
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh:ro
    depends_on:
      postgres:
        condition: service_healthy
    networks: [tinhchuan_network]
    entrypoint: /bin/sh /backup.sh
EOF
print_success "   ✅ Đã tạo docker-compose.yml và script backup."

# =============================================================================
# BƯỚC 8: Makefile, .env, CI/CD
# =============================================================================
print_step "⚙️ [Bước 8/9] Đang tạo Makefile, .env, CI/CD..."
cat > Makefile << 'EOF'
.PHONY: help up down restart logs status backup_now clean prisma_migrate prisma_studio

help: ## 📖 Hiển thị danh sách lệnh hỗ trợ
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## 🚀 Khởi động toàn bộ hệ thống
	@echo "⏳ Đang khởi động hệ thống..."
	@docker compose up -d --build
	@echo "⏳ Đang chờ các dịch vụ ổn định (50 giây)..."
	@sleep 50
	@make status

down: ## 🛑 Dừng toàn bộ containers
	@docker compose down

restart: down up ## 🔄 Khởi động lại toàn bộ hệ thống

logs: ## 📜 Xem log realtime (vd: make logs s=backend)
	@docker compose logs -f --tail=50 $(s)

status: ## 🩺 Kiểm tra trạng thái sức khỏe
	@docker compose ps

backup_now: ## 💾 Backup PostgreSQL ngay lập tức
	@mkdir -p backups
	@docker compose exec postgres pg_dump -U $$(grep DB_USER .env | cut -d= -f2) $$(grep DB_NAME .env | cut -d= -f2) | gzip > backups/manual_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "✅ Đã tạo backup"

prisma_migrate: ## 🗄️ Áp dụng Prisma migration
	@docker compose exec backend npx prisma migrate deploy

prisma_studio: ## 🔎 Mở Prisma Studio
	@docker compose exec backend npx prisma studio

clean: ## 🧹 Dọn dẹp image và cache Docker không dùng
	@docker system prune -af
	@echo "✅ Đã dọn dẹp tài nguyên Docker thừa"
EOF

cat > .env.example << 'EOF'
TIMEZONE=Asia/Ho_Chi_Minh
# Tên DB khớp với Checklist_Phase1.md ("Tạo database `tinhchuan`") - đổi tên
# tại đây nếu bạn muốn dùng quy ước khác, nhưng nhớ sửa đồng bộ ở checklist.
DB_NAME=tinhchuan
DB_USER=tinhchuan_app
DB_PASSWORD=ThayBang_openssl_rand_base64_32
# DATABASE_URL dùng cho Prisma CLI chạy TRÊN HOST (npx prisma generate/studio/
# migrate ngoài Docker) - trỏ "localhost" qua cổng đã forward ở docker-compose
# (127.0.0.1:5432). LƯU Ý: phải tự đồng bộ tay 3 giá trị user/password/dbname
# bên dưới khớp với DB_USER/DB_PASSWORD/DB_NAME ở trên (dotenv không tự nội
# suy biến). Bên trong Docker, backend/frontend dùng DATABASE_URL riêng trỏ
# hostname "postgres" - đã cấu hình sẵn trong docker-compose.yml, không đọc
# giá trị này.
DATABASE_URL=postgresql://tinhchuan_app:ThayBang_openssl_rand_base64_32@localhost:5432/tinhchuan
REDIS_PASSWORD=ThayBang_openssl_rand_base64_32
MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=ThayBang_openssl_rand_base64_32
AUTH_SECRET=ThayBang_openssl_rand_base64_48
NEXT_PUBLIC_CDN_URL=https://cdn.tinhchuan.vn
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
EOF

cat > .gitignore << 'EOF'
.env
node_modules/
.next/
data/
logs/
backups/
.DS_Store
EOF

cat > config/cloudflare/tunnel-config.yml << 'EOF'
ingress:
  - hostname: tinhchuan.vn
    service: http://nginx:80
  - hostname: www.tinhchuan.vn
    service: http://nginx:80
  - hostname: admin.tinhchuan.vn
    service: http://nginx:80
  - hostname: cdn.tinhchuan.vn
    service: http://nginx:80
  - service: http_status:404
EOF

cat > scripts/deploy.sh << 'DEPLOY_SH_EOF'
#!/usr/bin/env bash

# =============================================================================
# TINHCHUAN.VN - DEPLOY SCRIPT
#
# Luồng:
# GitHub Actions
#   ↓
# Tailscale
#   ↓
# SSH
#   ↓
# Mac Mini
#   ↓
# deploy.sh
#   ↓
# OrbStack / Docker Compose
#   ↓
# Nginx
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

PROJECT_DIRECTORY="$HOME/tinhchuan"
DEPLOY_TARGET="${1:-all}"
START_TIMESTAMP=$(date +%s)

# PATH cho macOS + Homebrew + OrbStack.
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.orbstack/bin:$PATH"

# =============================================================================
# Logging
# =============================================================================

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_RESET='\033[0m'

print_info() {
    echo -e "[DEPLOY] $1"
}

print_success() {
    echo -e "${COLOR_GREEN}[DEPLOY] $1${COLOR_RESET}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}[DEPLOY] $1${COLOR_RESET}"
}

print_error() {
    echo -e "${COLOR_RED}[DEPLOY] $1${COLOR_RESET}"
}

# =============================================================================
# Error handling
# =============================================================================

CURRENT_STEP="initialization"

handle_error() {
    local exit_code=$?

    echo ""
    print_error "========================================"
    print_error "❌ DEPLOYMENT THẤT BẠI"
    print_error "========================================"

    print_error "Step: $CURRENT_STEP"
    print_error "Exit code: $exit_code"

    echo ""
    print_error "Docker Compose status:"

    docker compose ps 2>/dev/null || true

    echo ""

    exit "$exit_code"
}

trap handle_error ERR

# =============================================================================
# Validate deploy target
# =============================================================================

CURRENT_STEP="validate deploy target"

case "$DEPLOY_TARGET" in
    all)
        ;;
    frontend)
        ;;
    backend)
        ;;
    *)
        print_error "Deploy target không hợp lệ: $DEPLOY_TARGET"

        print_error "Cách dùng:"
        print_error "  bash scripts/deploy.sh all"
        print_error "  bash scripts/deploy.sh frontend"
        print_error "  bash scripts/deploy.sh backend"

        exit 1
        ;;
esac

# =============================================================================
# Header
# =============================================================================

echo ""
echo "============================================================================="
echo "🚀 TINHCHUAN.VN DEPLOYMENT"
echo "============================================================================="

echo "Project:"
echo "$PROJECT_DIRECTORY"

echo "Deploy target:"
echo "$DEPLOY_TARGET"

echo "Started:"
date "+%Y-%m-%d %H:%M:%S"

echo "============================================================================="

# =============================================================================
# Change project directory
# =============================================================================

CURRENT_STEP="change project directory"

cd "$PROJECT_DIRECTORY"

# =============================================================================
# Validate deployment environment
# =============================================================================

CURRENT_STEP="validate deployment environment"

print_info "Kiểm tra môi trường deploy..."

echo "Docker:"
docker --version

echo "Docker Compose:"
docker compose version

echo "Docker Context:"
docker context show

echo "Git:"
git --version

print_success "Environment OK."

# =============================================================================
# Validate OrbStack Docker socket
# =============================================================================

CURRENT_STEP="validate orbstack"

ORBSTACK_DOCKER_SOCKET="$HOME/.orbstack/run/docker.sock"

if [ ! -S "$ORBSTACK_DOCKER_SOCKET" ]; then
    print_error "Không tìm thấy Docker socket của OrbStack:"
    print_error "$ORBSTACK_DOCKER_SOCKET"
    exit 1
fi

print_success "OrbStack Docker socket OK."

# =============================================================================
# Validate Git repository
# =============================================================================

CURRENT_STEP="validate git repository"

echo "Git branch hiện tại:"
git branch --show-current

echo "Git commit hiện tại:"
git rev-parse --short HEAD

echo "Git remote:"
git remote -v

# =============================================================================
# Update source code
# =============================================================================

CURRENT_STEP="update source code"

print_info "Đang lấy code mới nhất từ GitHub..."

git fetch origin main

print_info "Reset về origin/main..."

git reset --hard origin/main

print_success "Source code đã được cập nhật."

echo "Commit sau khi cập nhật:"
git rev-parse --short HEAD

# =============================================================================
# Validate Docker Compose
# =============================================================================

CURRENT_STEP="validate docker compose configuration"

print_info "Kiểm tra Docker Compose configuration..."

docker compose config -q

print_success "Docker Compose configuration hợp lệ."

# =============================================================================
# Build and deploy
# =============================================================================

CURRENT_STEP="build and deploy services"

print_info "Đang build và khởi động: $DEPLOY_TARGET"

case "$DEPLOY_TARGET" in

    # =========================================================================
    # Deploy toàn bộ
    # =========================================================================

    all)

        print_info "Build và restart toàn bộ service..."

        docker compose up -d --build

        print_success "Build và deploy toàn bộ service hoàn tất."

        ;;

    # =========================================================================
    # Deploy frontend
    # =========================================================================

    frontend)

        print_info "Build frontend..."

        docker compose build frontend

        print_info "Restart frontend..."

        docker compose up -d --no-deps frontend

        print_success "Frontend đã được deploy."

        ;;

    # =========================================================================
    # Deploy backend
    # =========================================================================

    backend)

        print_info "Build backend..."

        docker compose build backend

        print_info "Restart backend..."

        docker compose up -d --no-deps backend

        print_success "Backend đã được deploy."

        ;;

esac

# =============================================================================
# Restart Nginx
#
# Frontend/backend có thể được recreate với container/IP mới.
# Nginx cần restart để resolve lại upstream/service endpoint.
# =============================================================================

CURRENT_STEP="restart nginx"

print_info "Restart Nginx để cập nhật kết nối tới frontend/backend..."

if ! docker inspect tinhchuan-nginx >/dev/null 2>&1; then

    print_error "Không tìm thấy container tinhchuan-nginx."

    exit 1

fi

docker restart tinhchuan-nginx

print_success "Nginx đã được restart."

# Chờ Nginx khởi động lại.
sleep 5

# =============================================================================
# Wait for services
# =============================================================================

CURRENT_STEP="wait for services"

print_info "Đang chờ các service ổn định..."

sleep 15

# =============================================================================
# Health check
# =============================================================================

CURRENT_STEP="health check"

print_info "Đang kiểm tra trạng thái service..."

FAILED_SERVICE_COUNT=0

REQUIRED_CONTAINERS=(
    tinhchuan-postgres
    tinhchuan-redis
    tinhchuan-minio
    tinhchuan-backend
    tinhchuan-frontend
    tinhchuan-nginx
)

for container in "${REQUIRED_CONTAINERS[@]}"; do

    health_status="$(
        docker inspect \
            --format='{{.State.Health.Status}}' \
            "$container" \
            2>/dev/null || echo "not_found"
    )"

    case "$health_status" in

        healthy)

            print_success "✅ $container: healthy"

            ;;

        starting)

            print_warning "⏳ $container: starting"

            ;;

        not_found)

            print_error "❌ $container: not_found"

            FAILED_SERVICE_COUNT=$((FAILED_SERVICE_COUNT + 1))

            ;;

        *)

            print_error "❌ $container: $health_status"

            FAILED_SERVICE_COUNT=$((FAILED_SERVICE_COUNT + 1))

            ;;

    esac

done

# =============================================================================
# Docker Compose status
# =============================================================================

CURRENT_STEP="docker compose status"

echo ""
print_info "Docker Compose status:"

docker compose ps

# =============================================================================
# Cleanup old images
# =============================================================================

CURRENT_STEP="cleanup docker images"

print_info "Đang dọn image Docker cũ..."

docker image prune \
    -f \
    --filter "until=24h" \
    2>/dev/null || true

print_success "Docker cleanup hoàn tất."

# =============================================================================
# Calculate deployment time
# =============================================================================

END_TIMESTAMP=$(date +%s)
ELAPSED_SECONDS=$((END_TIMESTAMP - START_TIMESTAMP))

# =============================================================================
# Deployment result
# =============================================================================

echo ""

if [ "$FAILED_SERVICE_COUNT" -gt 0 ]; then

    print_error "============================================================================="
    print_error "❌ TRIỂN KHAI THẤT BẠI"
    print_error "============================================================================="

    print_error "Deploy target:"
    print_error "$DEPLOY_TARGET"

    print_error "Commit:"
    print_error "$(git rev-parse --short HEAD)"

    print_error "Service lỗi:"
    print_error "$FAILED_SERVICE_COUNT"

    print_error "Thời gian:"
    print_error "${ELAPSED_SECONDS} giây"

    print_error "============================================================================="

    exit 1

fi

print_success "============================================================================="
print_success "✅ TRIỂN KHAI THÀNH CÔNG"
print_success "============================================================================="

print_success "Deploy target:"
print_success "$DEPLOY_TARGET"

print_success "Commit:"
print_success "$(git rev-parse --short HEAD)"

print_success "Thời gian:"
print_success "${ELAPSED_SECONDS} giây"

print_success "============================================================================="
DEPLOY_SH_EOF
chmod +x scripts/deploy.sh

cat > .github/workflows/deploy.yml << 'DEPLOY_YML_EOF'
# =============================================================================
# GITHUB ACTIONS - Tự động deploy TinhChuan.vn
# GitHub Actions → Tailscale → SSH → Mac Mini → deploy.sh
# =============================================================================

name: "🚀 Deploy TinhChuan.vn"

on:
  push:
    branches:
      - main

    paths-ignore:
      - "*.md"
      - "docs/**"

  workflow_dispatch:
    inputs:
      deploy_part:
        description: "Phần cần deploy"
        required: true
        default: "all"
        type: choice
        options:
          - all
          - frontend
          - backend

# GitHub OIDC permission.
# Bắt buộc khi sử dụng Tailscale Workload Identity Federation.
permissions:
  id-token: write
  contents: read

concurrency:
  group: deploy-production
  cancel-in-progress: true

jobs:

  deploy:
    name: "Deploy to Mac Mini"

    runs-on: ubuntu-latest

    timeout-minutes: 20

    steps:

      # =======================================================================
      # 1. Kết nối GitHub Runner vào Tailscale
      # =======================================================================

      - name: "🔐 Kết nối Tailscale"
        uses: tailscale/github-action@v4
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          audience: ${{ secrets.TS_AUDIENCE }}
          tags: tag:ci
          ping: ${{ secrets.MAC_MINI_SSH_HOST }}

      # =======================================================================
      # 2. Kiểm tra Tailscale
      # =======================================================================

      - name: "🔎 Kiểm tra Tailscale"
        run: |
          set -e

          echo "========================================"
          echo "TAILSCALE STATUS"
          echo "========================================"

          tailscale status

          echo ""
          echo "========================================"
          echo "TAILSCALE IP"
          echo "========================================"

          tailscale ip -4

      # =======================================================================
      # 3. SSH tới Mac Mini
      # =======================================================================

      - name: "🚀 Deploy qua SSH"
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.MAC_MINI_SSH_HOST }}
          username: ${{ secrets.MAC_MINI_SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}

          port: 22

          timeout: 30s

          command_timeout: 15m

          script_stop: true

          script: |
            set -e

            PROJECT_DIRECTORY="$HOME/tinhchuan"
            DEPLOY_PART="${{ github.event.inputs.deploy_part || 'all' }}"

            echo "========================================"
            echo "TINHCHUAN.VN DEPLOYMENT"
            echo "========================================"

            echo "Hostname:"
            hostname

            echo ""
            echo "User:"
            whoami

            echo ""
            echo "Deploy part:"
            echo "$DEPLOY_PART"

            echo ""
            echo "GitHub commit:"
            echo "${{ github.sha }}"

            echo ""
            echo "========================================"
            echo "RUN DEPLOY SCRIPT"
            echo "========================================"

            cd "$PROJECT_DIRECTORY"

            bash scripts/deploy.sh "$DEPLOY_PART"
DEPLOY_YML_EOF
print_success "   ✅ Đã tạo Makefile, .env, CI/CD."

# =============================================================================
# BƯỚC 9: Phân quyền và hoàn tất
# =============================================================================
print_step "🔐 [Bước 9/9] Đang thiết lập phân quyền..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x bootstrap/*.sh 2>/dev/null || true
print_success "   ✅ Đã thiết lập phân quyền script."

print_success "✅ HOÀN TẤT! Hạ tầng đã sẵn sàng."
echo ""
echo "💡 Bước tiếp theo:"
echo "   1. bash bootstrap/init-projects.sh (để tạo source code)"
echo "   2. cp .env.example .env && điền mật khẩu thật"
echo "   3. make up"