# Trạng thái hiện tại

> File này GHI ĐÈ TOÀN BỘ mỗi phiên làm việc - KHÔNG cộng dồn lịch sử.
> Lịch sử quyết định kiến trúc xem `docs/decisions/00-index.md`.

**Cập nhật lần cuối**: 2026-08-24

## Đang ở Phase nào

Phase 1 - Tuần 2 đang thực hiện. Formula Engine + Repository + Server Action đã xong. Tiếp theo: nối UI Tool 1.

## Vừa hoàn thành

- Chốt kiến trúc monorepo 2 app + `packages/database` dùng chung, Drizzle ORM, `apps/frontend` CSS Modules / `apps/backend` Tailwind (ADR #001-#003).
- Định nghĩa schema Drizzle 6 bảng lõi + seed script (`packages/database/src/schema/index.ts` & `src/seed.ts`), đã generate migration, push schema xuống DB và seed dữ liệu ban đầu thành công.
- `apps/frontend/CONTEXT.md` và `apps/backend/CONTEXT.md` đã dời từ `app/CONTEXT.md` ra `CONTEXT.md` (ngang hàng `app/`), mọi tham chiếu đã cập nhật, không còn file/dòng nào trỏ đường dẫn cũ.
- Cụm nội dung Phase 1 (`docs/product-spec.md` mục 3.2, 4 trang): ĐÃ HOÀN TẤT 4/4 TRANG — Trang chủ (`/`), Tool 1 (`/tool/thue-ban-hang-online`), Kiến thức "Cách tính thuế bán hàng Shopee, TikTok Shop" (`/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok`), Kiến thức "Nghị định 141/2026 thay đổi gì" (`/kien-thuc/nghi-dinh-141-2026-thay-doi-gi`), Kiến thức "Ngưỡng doanh thu chịu thuế 2026" (`/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026`).
- `apps/frontend/manifest.json` hiện có 6 component tái dùng (`Button`, `Breadcrumb`, `FaqAccordion`, `FeatureCard`, `StepCard`, `ArticleCard`) và 25 icon SVG tự host trong `components/icons/` (bổ sung `LockIcon`, `QuestionCircleIcon`, `CartIcon`, `ScaleIcon`, `TrendingUpIcon`).
- Convert hoàn tất trang Tool 1 Công cụ tính thuế bán hàng online (`apps/frontend/app/(public)/tool/thue-ban-hang-online/page.tsx`), có accordion lịch sử ngưỡng thuế, mini FAQ accordion, đánh dấu đầy đủ `// TODO:` nối Formula Engine.
- Bảng màu `globals.css` đã xác nhận đúng chuẩn đã duyệt (không phải bảng do AI cắt HTML tự chọn).
- **[Tuần 2] Formula Engine + Repository + Server Action — ĐÃ XONG**:
  - `apps/frontend/lib/formula-engine/tinh-thue-ban-hang-online.ts`: Hàm thuần `tinhThueOnline()`, công thức đúng theo product-spec.md mục 3.1 (GTGT không trừ ngưỡng, TNCN có trừ ngưỡng).
  - `apps/frontend/lib/db/tax-rule-repository.ts`: Hàm `getActiveTaxRule()`, chỉ đọc `status='approved'`, JOIN legalSource trả kèm trích dẫn pháp lý.
  - `apps/frontend/app/(public)/tool/thue-ban-hang-online/action.ts`: Server Action `calculateTax()`, gọi repository → formula engine, throw Error rõ ràng nếu không tìm thấy rule.
  - Unit test (`tinh-thue-ban-hang-online.test.ts`): 15/15 test pass — đối chiếu đúng ví dụ kiểm chứng (1.8 tỷ → GTGT 18 triệu, TNCN 4 triệu).
- Bổ sung quy ước chỉ thị AI Agent riêng từng app qua `apps/frontend/AGENTS.md` và `apps/frontend/CLAUDE.md` (dẫn chiếu AGENTS.md gốc và quy định riêng cho frontend).
- Kiểm tra build `apps/frontend` pass thành công (0 lỗi, 9 routes).

## Đang làm / Tiếp theo

1. Nối Server Action `calculateTax()` vào Tool 1 UI (`/tool/thue-ban-hang-online/page.tsx`) — thay thế logic tạm thời đang hardcode trong `useState`.
2. Nối Hero Status Card trang chủ với dữ liệu ngưỡng thuế từ DB.

## Việc CHƯA làm (không tự ý bắt đầu)

- Crawler + AI Agent thật, Admin review dashboard (Phase 2).
- Tool 2-5 (Phase 3).
- Phân quyền, tài khoản người dùng cuối, Premium (Phase 5).
