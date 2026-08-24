# Trạng thái hiện tại

> File này GHI ĐÈ TOÀN BỘ mỗi phiên làm việc - KHÔNG cộng dồn lịch sử.
> Lịch sử quyết định kiến trúc xem `docs/decisions/00-index.md`.

**Cập nhật lần cuối**: 2026-08-25

## Đang ở Phase nào

Phase 1 — Hoàn thiện trang Tool 1 và 3 bài viết Kiến thức. Đã review 10/10 tiêu chuẩn UI/UX, tích hợp Server Action và nghiệm thu tài liệu kiến trúc.

## Vừa hoàn thành

- Cụm nội dung Phase 1: ĐÃ HOÀN TẤT 5/5 TRANG — Trang chủ (`/`), Tool 1 (`/tool/thue-ban-hang-online`), Bài kiến thức "Shopee, TikTok Shop" (`/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok`), Bài kiến thức "Nghị định 141/2026" (`/kien-thuc/nghi-dinh-141-2026-thay-doi-gi`), Bài kiến thức "Ngưỡng doanh thu 2026" (`/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026`).
- Tích hợp Google Analytics 4 (GA4): Đã gắn component `Script` từ `next/script` trong root layout (`apps/frontend/app/layout.tsx`) với `strategy="afterInteractive"`, đọc biến môi trường `NEXT_PUBLIC_GA_MEASUREMENT_ID`, hỗ trợ phân tách môi trường dev/production.
- Review UI & Logic Tool 1: Đã nghiệm thu 10/10 mục chuẩn UI/UX, responsive, semantic colors, trích dẫn căn cứ pháp lý động, tái sử dụng component `<FaqAccordion>` và xử lý 3 trạng thái lỗi (`OVER_PHASE1_LIMIT`, `NO_ACTIVE_RULE`, `DB_UNAVAILABLE`).
- Bảo mật tài khoản Admin: Đã bỏ chuỗi password hardcode trong `seed.ts`, đọc `ADMIN_INITIAL_PASSWORD` từ biến môi trường (throw Error trong production nếu thiếu), tạo script riêng `packages/database/src/reset-admin-password.ts` hỗ trợ cập nhật mật khẩu an toàn.
- Quyết định kiến trúc dữ liệu: Đã chốt hoãn bổ sung cột `content_page.structuredData` (jsonb) sang Phase 2 (xem chi tiết ADR #008).
- Kiểm tra build production `apps/frontend` và unit test Formula Engine (23/23 pass) thành công.

## Đang làm / Tiếp theo

1. Nối Hero Status Card trang chủ với dữ liệu ngưỡng thuế từ DB.
2. Soát lại toàn bộ checklist Phase 1 trước khi kết thúc Phase 1.

## Việc CHƯA làm (không tự ý bắt đầu)

- Crawler + AI Agent thật, Admin review dashboard (Phase 2).
- Cột `content_page.structuredData` (jsonb) cho timeline/so sánh (Phase 2 - ADR #008).
- Tool 2-5 (Phase 3).
- Phân quyền, tài khoản người dùng cuối, Premium (Phase 5).
