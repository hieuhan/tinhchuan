# Trạng thái hiện tại

> File này GHI ĐÈ TOÀN BỘ mỗi phiên làm việc - KHÔNG cộng dồn lịch sử.
> Lịch sử quyết định kiến trúc xem `docs/decisions/00-index.md`.

**Cập nhật lần cuối**: 2026-09-13

## Đang ở Phase nào

- **Phase 1**: Hoàn tất 100% và đang live trên production.
- **Phase 2 (AI Content Pipeline)**: ĐÃ HOÀN THÀNH TOÀN BỘ 4 GIAI ĐOẠN (Stage 1 Crawler Multi-Source, Stage 2 AI Classification, Stage 3 MinIO & Text Extraction, Stage 4 Admin Review Dashboard + AI Content Generation + Telegram Notification).

## Vừa hoàn thành

- **AI Content Generation & Content Review Dashboard (Mảnh cuối cùng của Phase 2)**:
  - Xây dựng module `apps/backend/lib/generate-content.ts` gọi Claude Sonnet 5 (`anthropic/claude-sonnet-5`) qua OpenRouter API để sinh tự động bài viết kiến thức (`content` markdown) và FAQ (`faqItems` JSON) từ `legal_source`, `tax_rule_version` và `extracted_text` đã duyệt.
  - Tự động sinh `slug` chuẩn SEO, tự động kiểm tra và xử lý trùng lặp slug (thêm hậu tố `-2`, `-3`...).
  - Xây dựng route `POST /review/[id]/generate-content`: Tự động tạo bài viết `status = 'draft'` và liên kết đầy đủ với TẤT CẢ các phiên bản quy tắc thuế `tax_rule_version` của văn bản nguồn (`content_page_tax_rule`).
  - Xây dựng giao diện Quản lý Bài viết:
    - `GET /content`: Danh sách bài viết có bộ lọc theo trạng thái (`unfinished`, `draft`, `published`, `all`).
    - `GET /content/[id]`: Trang biên tập bài viết hiển thị đầy đủ văn bản nguồn gốc, các `tax_rule_version` liên kết, form chỉnh sửa `title`, `slug`, `metaDescription`, `content` (markdown), và danh sách câu hỏi FAQ tương tác (thêm/xóa/sửa từng cặp).
    - `POST /content/[id]/save`: Lưu nháp bài viết, giữ nguyên trạng thái hiện tại.
    - `POST /content/[id]/publish`: Kiểm tra trùng lặp slug với bài viết đã xuất bản khác phía server, chuyển `status = 'published'` và set `publishedAt = now()`.
  - Đã test end-to-end thành công với dữ liệu thật của Nghị quyết 43/2026/QH16 (Claude Sonnet 5 sinh bài viết chính xác 100% về giảm 30% thuế TNCN/TNDN năm 2026-2027 cho doanh thu <= 10 tỷ, không bịa đặt số liệu).

- **Trích xuất & Prefill Metadata Thuộc tính (Stage 3 & Stage 4 / Phase 2)**:
  - Bổ sung 5 cột metadata vào schema `crawl_detected_item`: `documentNumber`, `documentType`, `issuingBody`, `issuedDate`, `effectiveDate`.
  - Xây dựng `metadataParsers` registry (`congbao_chinhphu`, `vanban_chinhphu`) trích xuất tự động Số ký hiệu, Loại văn bản, Cơ quan ban hành, Ngày ban hành, Ngày hiệu lực trực tiếp từ HTML trang chi tiết trong Stage 3.
  - Cập nhật trang `GET /review/[id]` tự động prefill các giá trị trích xuất vào form "Xác nhận & Tạo căn cứ pháp lý" (input `effectiveDate` bắt buộc nhập thật, có cảnh báo ngữ cảnh `⚠️` hướng dẫn Admin đối chiếu văn bản gốc cho Văn bản hợp nhất khi chưa có ngày hiệu lực).
  - Đã backfill metadata thành công cho toàn bộ văn bản hiện có và test trích xuất/prefill end-to-end.

- **Telegram Notification (Mảnh cuối cùng của Stage 4 / Phase 2)**:
  - Xây dựng helper `apps/backend/lib/telegram.ts` (`sendTelegramNotification`) gửi thông báo HTML trực tiếp tới Telegram Bot khi có văn bản mới đạt `status = 'pending_review'`.
  - Bọc try/catch & cờ fallback an toàn: Lỗi gửi Telegram CHỈ log console, KHÔNG throw hay làm đứt đoạn pipeline scan/classify/extract chính.
  - Tích hợp link trực tiếp mở trang duyệt: `https://admin.tinhchuan.vn/review/${item.id}`.
  - Đã test kiểm chứng thành công cả 2 luồng: Gửi tin nhắn thật qua Telegram Bot (API `"ok": true`) và test lỗi bot token sai (pipeline vẫn chạy trọn vẹn, không crash job).

- **Admin Review Dashboard (Stage 4)**:
  - Hoàn tất xây dựng các route quản trị trong `apps/backend`:
    - `GET /review`: Trang danh sách các văn bản `pending_review` (bọc `isAuthorizedAdmin`, preview 200 ký tự, link file gốc, empty state).
    - `GET /review/[id]`: Trang chi tiết văn bản (hiển thị full extractedText, link file gốc, Action Block A duyệt `pending_review` và Action Block B tạo `tax_rule_version`).
    - `POST /review/[id]/reject`: Từ chối văn bản (`status` -> `'rejected'`).
    - `POST /review/[id]/confirm`: Xác nhận tạo `legal_source` mới (bắt buộc nhập `effectiveDate` thật, không default ngầm, validate `effectiveDate >= issuedDate`), cập nhật `status = 'confirmed'`, `legalSourceId`.
    - `POST /review/[id]/add-tax-rule`: Thêm quy tắc thuế `tax_rule_version` mới (validate JSON `ruleValue` phía server, `status` mặc định `'draft'`).
  - Đã test kiểm chứng thành công với dữ liệu thật NQ 43/2026/QH16 và VBHN 28/2026/VBHN-TT-BTC.

## Đang làm / Tiếp theo

1. Chuẩn bị kế hoạch cho Phase 3 (Phát triển 4/5 Tool tính thuế còn lại ngoài Tool 1).

## Việc CHƯA làm (không tự ý bắt đầu)

- Vision OCR fallback cho các nguồn PDF dạng ảnh scan (Stage 3 - tạm thời chưa cần vì nguồn Công báo Chính phủ luôn sẵn file text layer).
- Cột `content_page.structuredData` (jsonb) cho timeline/so sánh (Phase 2 - ADR #008).
- Tool 2-5 (Phase 3).
- Phân quyền, tài khoản người dùng cuối, Premium (Phase 5).
