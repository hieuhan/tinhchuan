#!/usr/bin/env bash

# =============================================================================
# TINHCHUAN.VN - DEPLOY SCRIPT
#
# Luồng:
# GitHub
#   ↓
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
# Docker Compose / OrbStack
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
# Colors
# =============================================================================

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_RESET='\033[0m'

# =============================================================================
# Logging
# =============================================================================

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
# Move to project directory
# =============================================================================

CURRENT_STEP="change project directory"

cd "$PROJECT_DIRECTORY"

# =============================================================================
# Validate environment
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
# Get current Nginx container ID
# =============================================================================

CURRENT_STEP="get nginx container"

NGINX_CONTAINER_ID_BEFORE="$(
    docker inspect \
        --format='{{.Id}}' \
        tinhchuan-nginx \
        2>/dev/null || echo "none"
)"

print_info "Nginx container trước deploy:"
echo "$NGINX_CONTAINER_ID_BEFORE"

# =============================================================================
# Build and deploy
# =============================================================================

CURRENT_STEP="build and deploy services"

print_info "Đang build và khởi động: $DEPLOY_TARGET"

case "$DEPLOY_TARGET" in

    all)

        print_info "Build và restart toàn bộ service..."

        docker compose up -d --build

        ;;

    frontend)

        print_info "Build và restart frontend..."

        docker compose build frontend

        docker compose up -d \
            --no-deps \
            frontend

        ;;

    backend)

        print_info "Build và restart backend..."

        docker compose build backend

        docker compose up -d \
            --no-deps \
            backend

        ;;

esac

print_success "Build và deploy hoàn tất."

# =============================================================================
# Check Nginx container
# =============================================================================

CURRENT_STEP="check nginx container"

NGINX_CONTAINER_ID_AFTER="$(
    docker inspect \
        --format='{{.Id}}' \
        tinhchuan-nginx \
        2>/dev/null || echo "none"
)"

print_info "Nginx container sau deploy:"
echo "$NGINX_CONTAINER_ID_AFTER"

# Nếu Nginx không được recreate thì restart để cập nhật network.
if [
    "$NGINX_CONTAINER_ID_BEFORE" = "$NGINX_CONTAINER_ID_AFTER"
] && [
    "$NGINX_CONTAINER_ID_BEFORE" != "none"
]; then

    print_warning "Nginx không được recreate."

    print_info "Restart Nginx để đảm bảo network configuration mới..."

    docker restart tinhchuan-nginx

    print_success "Nginx đã được restart."

fi

# =============================================================================
# Wait for containers
# =============================================================================

CURRENT_STEP="wait for services"

print_info "Đang chờ các service ổn định..."

sleep 20

# =============================================================================
# Health check
# =============================================================================

CURRENT_STEP="health check"

print_info "Đang kiểm tra trạng thái service..."

FAILED_SERVICE_COUNT=0

# Các container production hiện tại của TinhChuan.
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