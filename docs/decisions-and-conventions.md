# Decisions and Conventions

## Phase 2 decisions already reached

- **Duyệt quy tắc thuế**: AI Agent không tự động nhập `tax_rule_version` vào DB. Chỉ người dùng (Admin) mới có quyền xem xét, duyệt và xác nhận nhập `tax_rule_version`.
- **Crawl Pipeline**: Scraper dừng lại khi phát hiện URL đã tồn tại/đã xử lý trong cơ sở dữ liệu.
- **Trích xuất văn bản PDF**: Luôn ưu tiên dùng text layer sẵn có của file PDF trước; chỉ dùng Vision OCR làm phương án fallback khi PDF là bản scan ảnh.

## Hard conventions

- **Append-only Versioning**: Bảng `tax_rule_version` tuân thủ nguyên tắc append-only (luôn INSERT dòng mới khi luật thay đổi, KHÔNG BAO GIỜ UPDATE dòng cũ).
- **Trạng thái tài liệu**: File `docs/01-status.md` ghi đè toàn bộ ở mỗi phiên làm việc để phản ánh đúng trạng thái hiện tại, không cộng dồn nhật ký lịch sử.
- **Quy ước đặt tên & Comment**: Tên biến, tên bảng, tên hàm dùng tiếng Anh chuẩn, rõ ràng. Comment trong code dùng tiếng Việt ngắn gọn, dễ hiểu.

## Working with the AI Agent

- **Nguồn chỉ thị**: AI Agent tuân thủ nghiêm ngặt chỉ thị trong `AGENTS.md` và `GEMINI.md`.
- **Hiển thị dữ liệu người dùng**: Mọi truy vấn và thông tin thuế hiển thị ra UI cho người dùng cuối CHỈ được đọc dữ liệu có `status = 'approved'` hoặc `'published'`.

## Learnings worth not relearning

- **AI Fabrication Risk**: Dữ liệu thuế và căn cứ pháp lý tuyệt đối không được tự bịa ra hay suy đoán. Mọi số liệu phải trích dẫn văn bản gốc `legal_source`.
- **Env Var Single Source of Truth**: Quản lý biến môi trường tập trung bằng symlink / hardlink (xem ADR 009), không cấu hình phân tán rải rác.
- **NEXT_PUBLIC_* Build-time**: Các biến `NEXT_PUBLIC_*` trong Next.js được inline tại thời điểm build bundle, không thể thay đổi ở client runtime nếu không rebuild.
- **Deploy & Git Reset --hard**: Lệnh `deploy.sh` chạy `git reset --hard origin/main`, do đó mọi thay đổi local bắt buộc phải được commit/push trước khi chạy deploy.
- **Symlinks Windows/Cross-platform**: Tránh dùng symlink phụ thuộc OS; ưu tiên đường dẫn tương đối hoặc cấu hình tương thích môi trường.
- **Lighthouse Preset**: Cấu hình audit Lighthouse cần dùng đúng flag và preset chuẩn (ví dụ không dùng sai preset=perf).
- **Drizzle AggregateError**: Bọc và chuẩn hóa lỗi DB từ Drizzle ORM (`AggregateError`) để tránh làm crash V8 / Turbopack error inspector khi log.
- **set_real_ip_from Cloudflare**: Nginx reverse proxy cần cấu hình `set_real_ip_from` đúng dải IP của Cloudflare để nhận diện chuẩn IP thật từ người dùng (`X-Forwarded-For`).
- **Script Test & DB Production**: Script test trong `scratch/` tuyệt đối không được thao tác trực tiếp lên dữ liệu production mà không có cơ chế cách ly/rollback (2 sự cố thật: title `content_page` bị dính chuỗi `" [Đã duyệt nội dung nháp]"` từ script `test-step5-end-to-end.ts`; link chết tái xuất hiện do script migrate lấy nhầm bản nội dung cũ trước khi đã vá lỗi).
