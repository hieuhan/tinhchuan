# CONTEXT.md - packages/database

## Mục đích thư mục

Schema Drizzle ORM dùng CHUNG cho `apps/frontend` và `apps/backend` (single
source of truth) - cả 2 app import từ `@tinhchuan/database`, KHÔNG tự định
nghĩa bảng riêng ở app nào.

## Quy tắc riêng (bổ sung AGENTS.md)

- ORM: **Drizzle** (xem `docs/decisions/00-index.md` #001). Schema định nghĩa
  bằng TypeScript thuần trong `src/schema/`, KHÔNG có ngôn ngữ schema
  riêng, KHÔNG cần bước `generate` để có type - type suy ra trực tiếp từ
  file schema.
- Migration: `npm run db:generate` (sinh SQL migration từ schema),
  `npm run db:push` (đẩy trực tiếp - CHỈ dùng khi đang thử nghiệm cấu
  trúc bảng, xem `docs/decisions/00-index.md` #004), `npm run db:migrate` (áp
  migration có kiểm soát - dùng khi schema đã ổn định/production).
- Query viết gần SQL nhất có thể - ưu tiên
  `db.select().from(table).where(...)` rõ ràng hơn là lồng nhiều helper
  trừu tượng không cần thiết.
- Dữ liệu tham chiếu (`legal_source`, `tax_rule_category`,
  `tax_rule_version`) CHỈ thêm/sửa qua `src/seed.ts`, không sửa tay trực
  tiếp trong DB (kể cả DB đang dùng để dev - xem `docs/decisions/00-index.md`
  #004, hiện dev và production dùng chung 1 DB).

## Ý nghĩa 6 bảng lõi

Nguyên tắc thiết kế chung: KHÔNG bao giờ UPDATE dòng cũ trong
`tax_rule_version`, chỉ INSERT dòng mới (versioning theo
`effectiveFrom`/`effectiveTo`). Quy tắc đọc dữ liệu (`status = 'approved'`)
là quy tắc BẮT BUỘC, xem `AGENTS.md` mục 5, không nhắc lại ở đây.

1. **users** - tài khoản đăng nhập `apps/backend`. CHƯA có cột `role`
   (xem `docs/decisions/00-index.md` #006) - Phase 1 chỉ 1 admin nội bộ.
   `passwordHash` dùng bcryptjs, không lưu password thô.
2. **legalSource** - văn bản pháp luật gốc (số hiệu, ngày ban hành, link
   chính thức). Mọi trích dẫn đều trỏ về đây.
3. **taxRuleCategory** - danh mục loại quy tắc thuế (ngưỡng, biểu thuế
   suất, giảm trừ...).
4. **taxRuleVersion** - bảng lõi, mỗi dòng là một giá trị cụ thể có hiệu
   lực trong khoảng thời gian, `ruleValue` dùng kiểu `jsonb` để linh hoạt
   cấu trúc (mỗi Tool có hình dạng dữ liệu khác nhau, validate bằng Zod
   schema riêng ở `lib/formula-engine/` khi dùng, không validate ở tầng
   DB), `status` bắt buộc qua `approved` (con người duyệt qua `reviewedBy`
   trỏ `users.id`) mới được Formula Engine dùng để tính.
5. **sourceConflict** - hàng đợi khi crawler (Phase 2) phát hiện nhiều
   nguồn mâu thuẫn, chờ con người xử lý (`resolvedBy` trỏ `users.id`) ở
   `apps/backend/app/admin/conflicts`.
6. **contentPage** + **contentPageTaxRule** - Tool/FAQ/Knowledge/Data
   Page. Cột `content` là **markdown text** (xem `docs/decisions/00-index.md`
   #007, KHÔNG phải block-based JSON), render qua `react-markdown` ở
   `apps/frontend`. `faqItems` (jsonb) tách riêng cho schema.org
   `FAQPage`. Bảng nối `contentPageTaxRule` biết trang nào đang dùng quy
   tắc thuế nào, để biết cần rà lại trang nào khi luật đổi.

DDL đầy đủ: xem `docs/database-schema.sql` (chưa tạo - sẽ sinh cùng lúc
với `src/schema/index.ts`).

## Đã có sẵn (tránh tạo trùng)

- `src/schema/index.ts` - 6 bảng + bảng nối `content_page_tax_rule` đã định
  nghĩa đầy đủ (`users`, `legal_source`, `tax_rule_category`,
  `tax_rule_version`, `source_conflict`, `content_page`).
- `src/client.ts` - tạo `Pool` + `drizzle(pool, { schema })`, cache global
  chỉ ở non-production.
- `src/index.ts` - `export { db } from './client'; export * from './schema';`
  - điểm import DUY NHẤT cho `apps/frontend`/`apps/backend`.
- `src/seed.ts` - seed idempotent: 1 admin, 1 `legal_source` (Nghị định
  141/2026/NĐ-CP), 1 `tax_rule_category`, 1 `tax_rule_version` (ngưỡng 1
  tỷ, `status='approved'`). Chạy: `npm run db:seed --workspace=packages/database`.
- `src/migrate.ts` - áp migration đã generate trong `drizzle/`. Chạy:
  `npm run db:migrate --workspace=packages/database`.

## KHÔNG được làm ở đây

- Không viết business logic (validate, tính toán) trong file schema -
  đây chỉ là tầng data access thuần túy.
- Không import `next` hoặc bất kỳ package riêng của `apps/frontend`/
  `apps/backend` vào package này.
- Không thêm cột `role` vào `users` khi chưa có nhu cầu thật (xem
  `docs/decisions/00-index.md` #006).