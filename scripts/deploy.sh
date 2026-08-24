#!/usr/bin/env bash

# =============================================================================
# TINHCHUAN.VN - DEPLOY SCRIPT
#
# Luồng:
# GitHub Actions / Thủ công
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
