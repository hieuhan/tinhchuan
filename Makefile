.PHONY: help up down restart deploy logs status backup_now clean db_migrate db_studio

help: ## 📖 Hiển thị danh sách lệnh hỗ trợ
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## 🚀 Khởi động toàn bộ hệ thống (build lại nếu có thay đổi)
	@echo "⏳ Đang khởi động hệ thống..."
	@docker compose up -d --build
	@echo "⏳ Đang chờ các dịch vụ ổn định (50 giây)..."
	@sleep 50
	@make status

down: ## 🛑 Dừng toàn bộ containers
	@docker compose down

restart: down up ## 🔄 Khởi động lại toàn bộ hệ thống

deploy: ## 🚀 Deploy thủ công: pull code mới nhất rồi build lại và khởi động
	@echo "⏳ Đang pull code mới nhất từ Git..."
	@git pull
	@$(MAKE) up

logs: ## 📜 Xem log realtime (vd: make logs s=backend)
	@docker compose logs -f --tail=50 $(s)

status: ## 🩺 Kiểm tra trạng thái sức khỏe
	@docker compose ps

backup_now: ## 💾 Backup PostgreSQL ngay lập tức
	@mkdir -p backups
	@docker compose exec postgres pg_dump -U $$(grep DB_USER .env | cut -d= -f2) $$(grep DB_NAME .env | cut -d= -f2) | gzip > backups/manual_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "✅ Đã tạo backup"

db_migrate: ## 🗄️ Áp dụng Drizzle migration (chạy trên HOST, không phải trong container)
	@npm run db:migrate --workspace=packages/database

db_studio: ## 🔎 Mở Drizzle Studio (chạy trên HOST)
	@npm run db:studio --workspace=packages/database

clean: ## 🧹 Dọn dẹp image và cache Docker không dùng
	@docker system prune -af
	@echo "✅ Đã dọn dẹp tài nguyên Docker thừa"
