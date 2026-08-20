#!/usr/bin/env bash
# =============================================================================
# DEPLOY SCRIPT - Pull code, build, restart và kiểm tra sức khỏe
# =============================================================================
set -euo pipefail

# Bổ sung PATH để tìm thấy docker trên macOS (Docker Desktop / OrbStack)
export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$HOME/.orbstack/bin:$PATH"

COLOR_GREEN='\033[0;32m'; COLOR_RED='\033[0;31m'; COLOR_RESET='\033[0m'
print_success() { echo -e "${COLOR_GREEN}[DEPLOY] $1${COLOR_RESET}"; }
print_error()   { echo -e "${COLOR_RED}[DEPLOY] $1${COLOR_RESET}"; }

PROJECT_DIRECTORY="${HOME}/tinhchuan"
cd "$PROJECT_DIRECTORY"

DEPLOY_TARGET="${1:-all}"
START_TIMESTAMP=$(date +%s)

# Lưu ID container Nginx trước khi deploy để so sánh sau (nếu backend/frontend
# đổi container mới, Nginx cần restart lại để resolve đúng IP mới của chúng)
NGINX_CONTAINER_ID_BEFORE=$(docker inspect --format='{{.Id}}' tinhchuan-nginx 2>/dev/null || echo "none")

print_success "Đang pull code mới nhất từ Git..."
git fetch origin main && git reset --hard origin/main

print_success "Đang build và khởi động (${DEPLOY_TARGET})..."
case "$DEPLOY_TARGET" in
    frontend)
        docker compose build frontend
        docker compose up -d --no-deps frontend
        ;;
    backend)
        docker compose build backend
        docker compose up -d --no-deps backend
        ;;
    all)
        docker compose up -d --build
        ;;
    *)
        print_error "Cách dùng: all | frontend | backend"; exit 1
        ;;
esac

# Nếu Nginx không bị tạo lại (deploy frontend/backend riêng lẻ), restart thủ
# công để nó re-resolve đúng IP container mới của backend/frontend
NGINX_CONTAINER_ID_AFTER=$(docker inspect --format='{{.Id}}' tinhchuan-nginx 2>/dev/null || echo "none")
if [ "$NGINX_CONTAINER_ID_BEFORE" = "$NGINX_CONTAINER_ID_AFTER" ] && [ "$NGINX_CONTAINER_ID_BEFORE" != "none" ]; then
    print_success "Đang khởi động lại Nginx để cập nhật IP container mới..."
    sleep 5
    docker restart tinhchuan-nginx
fi

print_success "Đang chờ các container ổn định (50 giây)..."
sleep 50

# Chỉ kiểm tra các container có khai báo healthcheck (postgres/redis/minio/
# nginx/tunnel qua docker-compose.yml, backend/frontend qua HEALTHCHECK trong
# Dockerfile) - dozzle và postgres_backup không có healthcheck nên bỏ qua.
FAILED_SERVICE_COUNT=0
for container in tinhchuan-postgres tinhchuan-redis tinhchuan-minio tinhchuan-backend tinhchuan-frontend tinhchuan-nginx tinhchuan-tunnel; do
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "không tìm thấy")
    if [ "$health_status" != "healthy" ]; then
        print_error "❌ ${container}: ${health_status}"
        FAILED_SERVICE_COUNT=$((FAILED_SERVICE_COUNT + 1))
    fi
done

# Dọn image cũ (>24h, không còn container nào dùng) để giải phóng ổ cứng -
# quan trọng trên Mac Mini 16GB vì mỗi lần build image mới sẽ để lại image cũ
docker image prune -f --filter "until=24h" 2>/dev/null || true

ELAPSED_SECONDS=$(( $(date +%s) - START_TIMESTAMP ))
if [ "$FAILED_SERVICE_COUNT" -eq 0 ]; then
    print_success "✅ Triển khai thành công (${ELAPSED_SECONDS} giây)"
else
    print_error "⚠️  Có ${FAILED_SERVICE_COUNT} dịch vụ không ổn định - kiểm tra 'make logs s=<tên>'"
    exit 1
fi
