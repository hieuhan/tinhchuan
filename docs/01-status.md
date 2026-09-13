# Trạng thái hiện tại

> File này GHI ĐÈ TOÀN BỘ mỗi phiên làm việc - KHÔNG cộng dồn lịch sử.
> Lịch sử quyết định kiến trúc xem `docs/decisions/00-index.md`.

**Cập nhật lần cuối**: 2026-09-14

## Đang ở Phase nào

- **Phase 1**: Hoàn tất 100% và đang live trên production.
- **Phase 2 (AI Content Pipeline)**: ĐÃ HOÀN THÀNH TOÀN BỘ (Stage 1 Crawler Multi-Source, Stage 2 AI Classification, Stage 3 MinIO & Text Extraction, Stage 4 Admin Review Dashboard + AI Content Generation + Telegram Notification + Dynamic Frontend Knowledge Base Route).

## Vừa hoàn thành

- **Hợp nhất Trang kiến thức động & Quản lý Cache Frontend**:
  - Chuyển đổi toàn bộ 3 bài viết Phase 1 từ file tĩnh sang PostgreSQL DB `content_page` (`status = 'published'`).
  - Xây dựng route động `apps/frontend/app/(public)/kien-thuc/[slug]/page.tsx` sử dụng renderer `marked` (GFM), hỗ trợ SEO Structured Data (Breadcrumb, FAQ), CTA Box tái sử dụng và Disclaimer.
  - Cập nhật trang danh mục `/kien-thuc` và trang chủ `/` query bài viết động từ DB.
  - Xóa 3 thư mục route tĩnh cũ.
  - Khai báo `export const dynamic = 'force-dynamic'` và `export const revalidate = 0` cho route động `[slug]/page.tsx`, đảm bảo Next.js phát header `Cache-Control: no-cache, no-store` và Cloudflare set `cf-cache-status: DYNAMIC` cho HTML pages.
  - Rà soát làm sạch 100% link chết và các chuỗi rác kiểm thử trong cột `title`/`content` DB.

- **AI Content Generation & Content Review Dashboard (Mảnh cuối cùng của Phase 2)**:
  - Xây dựng module `apps/backend/lib/generate-content.ts` gọi Claude Sonnet 5 (`anthropic/claude-sonnet-5`) qua OpenRouter API để sinh tự động bài viết kiến thức (`content` markdown) và FAQ (`faqItems` JSON) từ `legal_source`, `tax_rule_version` và `extracted_text` đã duyệt.
  - Tự động sinh `slug` chuẩn SEO, tự động kiểm tra và xử lý trùng lặp slug (thêm hậu tố `-2`, `-3`...).
  - Xây dựng route `POST /review/[id]/generate-content`: Tự động tạo bài viết `status = 'draft'` và liên kết đầy đủ với TẤT CẢ các phiên bản quy tắc thuế `tax_rule_version` của văn bản nguồn (`content_page_tax_rule`).
  - Xây dựng giao diện Quản lý Bài viết:
    - `GET /content`: Danh sách bài viết có bộ lọc theo trạng thái (`unfinished`, `draft`, `published`, `all`).
    - `GET /content/[id]`: Trang biên tập bài viết hiển thị đầy đủ văn bản nguồn gốc, các `tax_rule_version` liên kết, form chỉnh sửa `title`, `slug`, `metaDescription`, `content` (markdown), và danh sách câu hỏi FAQ tương tác (thêm/xóa/sửa từng cặp).
    - `POST /content/[id]/save`: Lưu nháp bài viết, giữ nguyên trạng thái hiện tại.
    - `POST /content/[id]/publish`: Kiểm tra trùng lặp slug với bài viết đã xuất bản khác phía server, chuyển `status = 'published'` và set `publishedAt = now()`.
  - Đã test end-to-end thành công với dữ liệu thật của Nghị quyết 43/2026/QH16.

- **Trích xuất & Prefill Metadata Thuộc tính (Stage 3 & Stage 4 / Phase 2)**:
  - Bổ sung 5 cột metadata vào schema `crawl_detected_item`: `documentNumber`, `documentType`, `issuingBody`, `issuedDate`, `effectiveDate`.
  - Xây dựng `metadataParsers` registry (`congbao_chinhphu`, `vanban_chinhphu`) trích xuất tự động Số ký hiệu, Loại văn bản, Cơ quan ban hành, Ngày ban hành, Ngày hiệu lực trực tiếp từ HTML trang chi tiết trong Stage 3.
  - Cập nhật trang `GET /review/[id]` tự động prefill các giá trị trích xuất vào form "Xác nhận & Tạo căn cứ pháp lý".

- **Telegram Notification (Mảnh cuối cùng của Stage 4 / Phase 2)**:
  - Xây dựng helper `apps/backend/lib/telegram.ts` (`sendTelegramNotification`) gửi thông báo HTML trực tiếp tới Telegram Bot khi có văn bản mới đạt `status = 'pending_review'`.

## Đang làm / Tiếp theo

1. Chuẩn bị kế hoạch cho Phase 3 (Phát triển 4/5 Tool tính thuế còn lại ngoài Tool 1).

## Việc CHƯA làm (không tự ý bắt đầu)

- Vision OCR fallback cho các nguồn PDF dạng ảnh scan (Stage 3 - tạm thời chưa cần vì nguồn Công báo Chính phủ luôn sẵn file text layer).
- Cột `content_page.structuredData` (jsonb) cho timeline/so sánh (Phase 2 - ADR #008).
- Tool 2-5 (Phase 3).
- Phân quyền, tài khoản người dùng cuối, Premium (Phase 5).
