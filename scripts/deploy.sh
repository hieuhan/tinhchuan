#!/usr/bin/env bash

# =============================================================================
# TINHCHUAN.VN - PRODUCTION DEPLOYMENT
#
# Chạy trên Mac Mini thông qua:
#
# GitHub Actions
#       ↓
# Tailscale
#       ↓
# SSH
#       ↓
# scripts/deploy.sh
#
# Usage:
#
#   bash scripts/deploy.sh
#   bash scripts/deploy.sh all
#   bash scripts/deploy.sh frontend
#   bash scripts/deploy.sh backend
# =============================================================================

set -Eeuo pipefail

# =============================================================================
# Configuration
# =============================================================================

PROJECT_DIRECTORY="${HOME}/tinhchuan"

DEPLOY_TARGET="${1:-all}"

START_TIMESTAMP="$(date +%s)"

# Docker PATH cho macOS + Docker Desktop + OrbStack.
export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$HOME/.orbstack/bin:$PATH"

# =============================================================================
# Colors
# =============================================================================

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

print_info() {
    echo -e "${COLOR_BLUE}[DEPLOY]${COLOR_RESET} $1"
}

print_success() {
    echo -e "${COLOR_GREEN}[DEPLOY]${COLOR_RESET} $1"
}

print_warning() {
    echo -e "${COLOR_YELLOW}[DEPLOY]${COLOR_RESET} $1"
}

print_error() {
    echo -e "${COLOR_RED}[DEPLOY]${COLOR_RESET} $1"
}

# =============================================================================
# Error handling
# =============================================================================

CURRENT_STEP="initialization"

handle_error() {
    local exit_code=$?

    echo ""
    print_error "Deployment thất bại."
    print_error "Step: ${CURRENT_STEP}"
    print_error "Exit code: ${exit_code}"

    echo ""
    print_error "Docker Compose status:"

    docker compose ps 2>/dev/null || true

    exit "$exit_code"
}

trap handle_error ERR

# =============================================================================
# Validate deploy target
# =============================================================================

validate_deploy_target() {
    CURRENT_STEP="validate deploy target"

    case "$DEPLOY_TARGET" in
        all)
            ;;
        frontend)
            ;;
        backend)
            ;;
        *)
            print_error "Deploy target không hợp lệ: ${DEPLOY_TARGET}"
            print_error "Giá trị hợp lệ: all | frontend | backend"
            exit 1
            ;;
    esac

    print_info "Deploy target: ${DEPLOY_TARGET}"
}

# =============================================================================
# Validate environment
# =============================================================================

validate_environment() {
    CURRENT_STEP="validate environment"

    print_info "Kiểm tra môi trường deploy..."

    if [[ ! -d "$PROJECT_DIRECTORY" ]]; then
        print_error "Không tìm thấy project: ${PROJECT_DIRECTORY}"
        exit 1
    fi

    cd "$PROJECT_DIRECTORY"

    if [[ ! -d ".git" ]]; then
        print_error "Không phải Git repository: ${PROJECT_DIRECTORY}"
        exit 1
    fi

    if [[ ! -f "docker-compose.yml" ]] &&
       [[ ! -f "docker-compose.yaml" ]] &&
       [[ ! -f "compose.yml" ]] &&
       [[ ! -f "compose.yaml" ]]; then

        print_error "Không tìm thấy Docker Compose file."
        exit 1
    fi

    if ! command -v git >/dev/null 2>&1; then
        print_error "Không tìm thấy Git."
        exit 1
    fi

    if ! command -v docker >/dev/null 2>&1; then
        print_error "Không tìm thấy Docker."
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon chưa chạy."
        exit 1
    fi

    print_info "Docker:"
    docker --version

    print_info "Docker Compose:"
    docker compose version

    print_success "Environment OK."
}

# =============================================================================
# Git information
# =============================================================================

show_git_information() {
    CURRENT_STEP="git information"

    cd "$PROJECT_DIRECTORY"

    print_info "Git branch hiện tại:"
    git branch --show-current || true

    print_info "Git commit hiện tại:"
    git rev-parse --short HEAD

    print_info "Git remote:"
    git remote -v
}

# =============================================================================
# Update source code
# =============================================================================

update_source_code() {
    CURRENT_STEP="update source code"

    cd "$PROJECT_DIRECTORY"

    print_info "Đang lấy code mới nhất từ GitHub..."

    git fetch origin main

    print_info "Reset về origin/main..."

    git reset --hard origin/main

    print_success "Source code đã được cập nhật."

    print_info "Commit sau khi cập nhật:"
    git rev-parse --short HEAD
}

# =============================================================================
# Validate Docker Compose
# =============================================================================

validate_docker_compose() {
    CURRENT_STEP="validate docker compose"

    cd "$PROJECT_DIRECTORY"

    print_info "Kiểm tra Docker Compose configuration..."

    docker compose config -q

    print_success "Docker Compose configuration hợp lệ."
}

# =============================================================================
# Save Nginx container ID
# =============================================================================

save_nginx_container_id() {
    CURRENT_STEP="save nginx container"

    NGINX_CONTAINER_ID_BEFORE="$(
        docker inspect \
            --format='{{.Id}}' \
            tinhchuan-nginx \
            2>/dev/null || echo "none"
    )"

    print_info "Nginx container trước deploy: ${NGINX_CONTAINER_ID_BEFORE}"
}

# =============================================================================
# Build and deploy
# =============================================================================

deploy_services() {
    CURRENT_STEP="build and deploy services"

    cd "$PROJECT_DIRECTORY"

    print_info "Đang build và khởi động: ${DEPLOY_TARGET}"

    case "$DEPLOY_TARGET" in

        frontend)
            print_info "Build frontend..."

            docker compose build frontend

            print_info "Restart frontend..."

            docker compose up -d --no-deps frontend
            ;;

        backend)
            print_info "Build backend..."

            docker compose build backend

            print_info "Restart backend..."

            docker compose up -d --no-deps backend
            ;;

        all)
            print_info "Build và restart toàn bộ service..."

            docker compose up -d --build
            ;;

    esac

    print_success "Build và deploy service hoàn tất."
}

# =============================================================================
# Restart Nginx
# =============================================================================

refresh_nginx() {
    CURRENT_STEP="refresh nginx"

    cd "$PROJECT_DIRECTORY"

    NGINX_CONTAINER_ID_AFTER="$(
        docker inspect \
            --format='{{.Id}}' \
            tinhchuan-nginx \
            2>/dev/null || echo "none"
    )"

    print_info "Nginx container sau deploy: ${NGINX_CONTAINER_ID_AFTER}"

    if [[ "$NGINX_CONTAINER_ID_BEFORE" == "$NGINX_CONTAINER_ID_AFTER" ]] &&
       [[ "$NGINX_CONTAINER_ID_BEFORE" != "none" ]]; then

        print_info "Nginx không được tạo lại."

        print_info "Restart Nginx để cập nhật IP container mới..."

        sleep 5

        docker restart tinhchuan-nginx

        print_success "Nginx đã được restart."
    fi
}

# =============================================================================
# Wait for services
# =============================================================================

wait_for_services() {
    CURRENT_STEP="wait for services"

    print_info "Đang chờ các container ổn định trong 50 giây..."

    sleep 50

    print_success "Đã hoàn tất thời gian chờ."
}

# =============================================================================
# Check required application services
#
# Các service này bắt buộc phải healthy.
#
# Cloudflare Tunnel không nằm trong danh sách này vì tunnel là infrastructure
# layer và healthcheck hiện tại có thể unhealthy dù container vẫn đang running.
# =============================================================================

check_required_services_health() {
    CURRENT_STEP="required services health check"

    cd "$PROJECT_DIRECTORY"

    print_info "Kiểm tra health của application services..."

    local failed_service_count=0

    local required_containers=(
        "tinhchuan-postgres"
        "tinhchuan-redis"
        "tinhchuan-minio"
        "tinhchuan-backend"
        "tinhchuan-frontend"
        "tinhchuan-nginx"
    )

    for container in "${required_containers[@]}"; do

        local health_status

        health_status="$(
            docker inspect \
                --format='{{.State.Health.Status}}' \
                "$container" \
                2>/dev/null || echo "không tìm thấy"
        )"

        if [[ "$health_status" != "healthy" ]]; then

            print_error "❌ ${container}: ${health_status}"

            failed_service_count=$((failed_service_count + 1))

        else

            print_success "✅ ${container}: healthy"

        fi
    done

    if [[ "$failed_service_count" -gt 0 ]]; then

        print_error "Có ${failed_service_count} application service không healthy."

        return 1
    fi

    print_success "Tất cả application service đều healthy."
}

# =============================================================================
# Check Cloudflare Tunnel
#
# Tunnel không block application deployment.
# Chỉ cảnh báo nếu unhealthy/stopped.
# =============================================================================

check_cloudflare_tunnel() {
    CURRENT_STEP="cloudflare tunnel check"

    print_info "Kiểm tra Cloudflare Tunnel..."

    local tunnel_container="tinhchuan-tunnel"

    local container_status

    container_status="$(
        docker inspect \
            --format='{{.State.Status}}' \
            "$tunnel_container" \
            2>/dev/null || echo "không tìm thấy"
    )"

    local health_status

    health_status="$(
        docker inspect \
            --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
            "$tunnel_container" \
            2>/dev/null || echo "không tìm thấy"
    )"

    echo ""

    case "$container_status" in

        running)

            if [[ "$health_status" == "healthy" ]]; then

                print_success "✅ ${tunnel_container}: running / healthy"

            elif [[ "$health_status" == "starting" ]]; then

                print_warning "⚠️ ${tunnel_container}: running / healthcheck starting"

            elif [[ "$health_status" == "unhealthy" ]]; then

                print_warning "⚠️ ${tunnel_container}: running / unhealthy"
                print_warning "Cloudflare Tunnel không làm deployment thất bại."

            else

                print_warning "⚠️ ${tunnel_container}: running / ${health_status}"

            fi

            ;;

        *)
            print_warning "⚠️ ${tunnel_container}: ${container_status}"
            print_warning "Cloudflare Tunnel không làm deployment thất bại."
            ;;

    esac

    echo ""

    print_info "Cloudflare Tunnel logs gần nhất:"

    docker logs \
        --tail=20 \
        "$tunnel_container" \
        2>&1 || true
}

# =============================================================================
# Cleanup old Docker images
# =============================================================================

cleanup_docker_images() {
    CURRENT_STEP="docker image cleanup"

    print_info "Dọn image Docker cũ hơn 24 giờ..."

    docker image prune \
        -f \
        --filter "until=24h" \
        2>/dev/null || true

    print_success "Docker image cleanup hoàn tất."
}

# =============================================================================
# Show deployment status
# =============================================================================

show_deployment_status() {
    CURRENT_STEP="deployment status"

    cd "$PROJECT_DIRECTORY"

    echo ""
    echo "============================================================================="
    echo "DEPLOYMENT STATUS"
    echo "============================================================================="

    echo ""
    echo "Deploy target:"
    echo "$DEPLOY_TARGET"

    echo ""
    echo "Git commit:"
    git rev-parse --short HEAD

    echo ""
    echo "Git branch:"
    git branch --show-current

    echo ""
    echo "Docker containers:"
    docker compose ps

    echo "============================================================================="
}

# =============================================================================
# Main
# =============================================================================

main() {

    echo ""
    echo "============================================================================="
    echo "🚀 TINHCHUAN.VN DEPLOYMENT"
    echo "============================================================================="
    echo ""
    echo "Project:"
    echo "$PROJECT_DIRECTORY"
    echo ""
    echo "Deploy target:"
    echo "$DEPLOY_TARGET"
    echo ""
    echo "Started:"
    date '+%Y-%m-%d %H:%M:%S'
    echo ""
    echo "============================================================================="
    echo ""

    validate_deploy_target

    validate_environment

    show_git_information

    update_source_code

    validate_docker_compose

    save_nginx_container_id

    deploy_services

    refresh_nginx

    wait_for_services

    # Application services bắt buộc phải healthy.
    check_required_services_health

    # Cloudflare Tunnel chỉ cảnh báo, không block deploy.
    check_cloudflare_tunnel

    cleanup_docker_images

    show_deployment_status

    # -------------------------------------------------------------------------
    # Tính thời gian deploy.
    # -------------------------------------------------------------------------

    local end_timestamp
    local elapsed_seconds

    end_timestamp="$(date +%s)"
    elapsed_seconds=$((end_timestamp - START_TIMESTAMP))

    echo ""
    echo "============================================================================="
    print_success "✅ TRIỂN KHAI THÀNH CÔNG"
    echo "============================================================================="
    echo ""
    echo "Deploy target:"
    echo "$DEPLOY_TARGET"
    echo ""
    echo "Commit:"
    git rev-parse --short HEAD
    echo ""
    echo "Thời gian:"
    echo "${elapsed_seconds} giây"
    echo ""
    echo "============================================================================="
}

main "$@"