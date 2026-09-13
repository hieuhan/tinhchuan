## #010 - Schema Drizzle cho Phase 2: Phát hiện văn bản mới (AI Content Pipeline)

**Ngày**: 2026-09-12
**Trạng thái**: Đang hiệu lực

**Quyết định**: 
1. Bổ sung 2 bảng mới `crawl_watch_source` và `crawl_detected_item` cùng cột `legal_source.source_file_url` vào schema Drizzle ORM ([`packages/database/src/schema/index.ts`](../../packages/database/src/schema/index.ts)).
2. Sinh migration `0001_thick_nekra.sql` và đã áp dụng thành công xuống database dev.
3. Thiết lập các quy ước cứng cho giai đoạn thu thập và xử lý văn bản bằng AI ở Phase 2.

**Bối cảnh & Thiết kế Schema**:
- Phase 2 (AI Content Pipeline) cần tầng lưu trữ các nguồn theo dõi (`crawl_watch_source`) và danh sách văn bản mới phát hiện được (`crawl_detected_item`) trước khi chuyển sang các bước phân loại AI, OCR/trích xuất văn bản và duyệt nội dung từ admin.
- Bảng `legal_source` bổ sung cột `source_file_url` (nullable) để lưu trữ liên kết file PDF gốc trên MinIO, giúp kiểm tra/audit lại nội dung pháp lý gốc thay vì chỉ phụ thuộc vào văn bản trích xuất (`extracted_text`).
- Chi tiết DDL và kiểu dữ liệu được định nghĩa trực tiếp tại [`packages/database/src/schema/index.ts`](../../packages/database/src/schema/index.ts) và file migration [`packages/database/drizzle/0001_thick_nekra.sql`](../../packages/database/drizzle/0001_thick_nekra.sql).

**Quy ước cứng cốt lõi**:
1. **AI KHÔNG BAO GIỜ tự ý nhập/tạo `tax_rule_version`**: AI Agent chỉ được quyền tham gia tự động sinh bản thảo nội dung trang bài viết (`content_page` với `status = 'draft'`). Việc tạo hoặc cập nhật quy tắc thuế (`tax_rule_version`) và căn cứ pháp lý (`legal_source`) bắt buộc phải do con người (Admin) xác minh và khởi tạo thủ công.
   - *Lý do*: Tránh lặp lại rủi ro bịa đặt số liệu/trích dẫn (hallucination) ảnh hưởng trực tiếp đến tính chính xác của công cụ tính thuế Formula Engine.
2. **Scraper phải duy trì điểm dừng theo `detectUrl` đã tồn tại**: Khi scraper duyệt qua danh sách các văn bản mới trên các cổng thông tin, scraper phải duyệt tuần tự và dừng lại ngay khi gặp một `detect_url` đã có trong bảng `crawl_detected_item` (không được cố định chỉ quét trang đầu tiên).
   - *Lý do*: Đảm bảo không bỏ sót các văn bản mới xuất bản giữa các lần quét.

**Ghi chú sự kiện đồng bộ DB (12/09/2026)**:
- Do ở giai đoạn thử nghiệm Phase 1 trước đó đã dùng lệnh `db:push` trực tiếp mà chưa qua `db:migrate`, bảng lịch sử migration `__drizzle_migrations` trong DB `tinhchuan_prod` bị thiếu entry của file migration đầu tiên `0000_curved_mystique.sql`.
- Ngày 12/09/2026, dự án đã thực hiện quy trình reset an toàn: Backup toàn bộ DB thành file `backups/tinhchuan_prod_backup_*.sql` -> Drop sạch các bảng ứng dụng và bảng migration -> Chạy lại `npm run db:migrate` để áp dụng tuần tự `0000_curved_mystique` và `0001_thick_nekra` -> Chạy lại `npm run db:seed` để nạp lại dữ liệu khởi tạo ban đầu. Lịch sử migration hiện đã đồng bộ chuẩn xác 100%.
