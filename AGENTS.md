# AGENTS.md - Hướng dẫn cho AI Coding Agent

> File này là nguồn chỉ thị DUY NHẤT cho mọi AI coding agent làm việc
> trong repo này (Claude Code, Gemini CLI, Codex, Cursor...). File này mô
> tả TRẠNG THÁI HIỆN TẠI - khi 1 quy tắc đổi, SỬA ĐÈ dòng cũ, không cộng
> thêm dòng mới bên cạnh. Lý do "tại sao đổi" nằm ở `docs/decisions/00-index.md`.

## 1. Dự án này là gì

TinhChuan.vn - nền tảng tra cứu và tính thuế cá nhân cho người Việt Nam
(người bán hàng online, freelancer, người chuyển nhượng bất động sản).
Không phải AI chatbot, không phải blog - là nền tảng dữ liệu + công cụ
tính toán + nội dung giải thích, có trích dẫn nguồn pháp luật cho mọi
số liệu.

## 2. Tech stack - KHÔNG tự ý đổi

- Framework: Next.js 16 (App Router), TypeScript, monorepo npm workspaces
  (`apps/frontend`, `apps/backend`, `packages/database`,
  `packages/content-pipeline`)
- Database: PostgreSQL 17, ORM **Drizzle** (schema TypeScript thuần trong
  `packages/database/src/schema/`)
- Styling: `apps/frontend` dùng **CSS Modules** + CSS Custom Properties
  (KHÔNG Tailwind - HTML/CSS đã cắt sẵn toàn hệ thống). `apps/backend`
  dùng **Tailwind CSS**.
- Font: Be Vietnam Pro, self-host qua `next/font/google` (chỉ
  `apps/frontend`, `apps/backend` không bắt buộc)
- Hạ tầng: 1 máy Mac Mini M1 duy nhất, Docker Compose, Cloudflare Tunnel,
  domain tinhchuan.vn - **code và deploy trực tiếp trên máy này, không
  tách môi trường dev/production** (xem `docs/decisions/00-index.md` #004)
- Deploy: chạy TAY `bash scripts/deploy.sh all` ngay tại Mac Mini.
  KHÔNG dùng GitHub Actions dưới bất kỳ hình thức nào - không có
  `.github/workflows/` trong repo (xem `docs/decisions/00-index.md` #005).
  `git push` lên GitHub CHỈ để backup code, không trigger gì.

## 3. Lệnh thường dùng

```bash
npm install                              # cài dependency toàn workspace
npm run dev:frontend / dev:backend       # chạy dev server local
npm run build --workspace=apps/<app>     # build production
npm run lint --workspace=apps/<app>      # kiểm tra lint
npm run db:generate --workspace=packages/database  # sinh SQL migration từ schema Drizzle
npm run db:push --workspace=packages/database       # đẩy schema xuống DB (CHỈ dùng khi đang thử nghiệm cấu trúc bảng)
npm run db:migrate --workspace=packages/database    # áp migration có kiểm soát (dùng khi schema đã ổn định)
bash scripts/deploy.sh all               # deploy thủ công ngay tại Mac Mini
```

## 4. Quy tắc code bắt buộc

- Tên biến, tên bảng, tên hàm: **tiếng Anh chuẩn, rõ ràng, không viết
  tắt** - tra `docs/00-glossary.md` trước khi đặt tên khái niệm nghiệp vụ
  mới, THÊM vào đó nếu chưa có.
- Comment trong code: **tiếng Việt**, ngắn gọn, dễ hiểu
- Clean architecture - tách rõ 3 lớp: UI (`app/`), business logic
  (`lib/formula-engine/`), data access (`lib/db/`)
- **Tránh over-engineering** - không tạo thêm bảng, service, abstraction
  nếu chưa có nhu cầu thực tế ở giai đoạn hiện tại (xem
  `docs/checklist-phase-1.md`)
- Không thêm package/dependency mới nếu chưa thực sự cần thiết

## 5. Quy tắc dữ liệu - QUAN TRỌNG, không được vi phạm

- Bảng `tax_rule_version` có version theo `effective_from`/`effective_to`.
  **KHÔNG BAO GIỜ UPDATE dòng cũ** khi luật thay đổi - luôn INSERT dòng mới.
- Mọi truy vấn từ phía người dùng **CHỈ được đọc `status = 'approved'`**.
  Dữ liệu `draft`/`pending_review` do AI Agent sinh, chưa qua con người
  duyệt, tuyệt đối không hiển thị cho người dùng cuối.
- Mọi giá trị thuế/ngưỡng hiển thị ra UI phải kèm trích dẫn `legal_source`.
- Dữ liệu tham chiếu (`legal_source`, `tax_rule_category`,
  `tax_rule_version`) CHỈ thêm/sửa qua `packages/database/src/seed.ts` -
  không sửa tay trực tiếp trong DB, kể cả DB đang dùng để dev.
- `users.role` CHƯA tồn tại (Phase 1 chỉ dùng nội bộ, 1 admin duy nhất) -
  không tự ý thêm phân quyền khi chưa có nhu cầu thật.

## 6. Quy tắc UI

- Mỗi trang Tool bắt buộc đủ: Form → Kết quả → Cách tính → Căn cứ pháp lý
  → FAQ → Tool liên quan.
- Chi tiết 7 nguyên tắc UI cho nội dung pháp lý/thuế: xem
  `apps/frontend/CONTEXT.md` (không nhắc lại ở đây - chỉ áp dụng
  trong thư mục đó).

## 7. Việc CHƯA làm ở giai đoạn hiện tại (Phase 1)

- Crawler + AI Agent tự động sinh nội dung (Phase 2)
- Admin review dashboard (Phase 2)
- 4/5 Tool còn lại ngoài Tool đầu tiên (Phase 3)
- Phân quyền nhiều role, tài khoản người dùng cuối, Premium (Phase 5)

## 8. Bảo mật

- Không bao giờ commit `.env`, API key, connection string vào git
- `DATABASE_URL` và các secret khác đọc từ biến môi trường, không hardcode
- Mật khẩu tài khoản `users` LUÔN hash qua bcryptjs, không bao giờ lưu
  plain text

## 9. Thứ tự đọc tài liệu (tiết kiệm token - đọc đúng mức cần, không hơn)

1. Luôn đọc file này + `docs/01-status.md` đầu tiên.
2. Đang sửa trong 1 thư mục có `CONTEXT.md` cạnh đó → đọc file đó, ĐỦ để
   bắt đầu code, không cần đọc thêm.
3. Chỉ đọc `docs/product-spec.md` khi task cần hiểu sâu nghiệp vụ (viết
   Formula Engine, nội dung Knowledge).
4. Chỉ đọc `docs/decisions/00-index.md` khi định đổi 1 quyết định kiến trúc đã
   có, hoặc không rõ "tại sao" 1 dòng ở mục 2 tồn tại.
5. Trước khi tạo component UI mới trong `apps/frontend`: đọc
   `apps/frontend/manifest.json`, TÁI DÙNG nếu đã có component tương tự.

## 10. Quy tắc tự bảo trì

- File này mô tả TRẠNG THÁI HIỆN TẠI - không giữ lại lý do lịch sử ở đây
  (lý do → `docs/decisions/00-index.md`), không giữ lại việc-đã-làm (→
  `docs/01-status.md` và bị ghi đè mỗi phiên).
- Nếu sửa file này khiến nó vượt quá **150 dòng**: KHÔNG cố viết ngắn lại
  cho vừa - tách nội dung ít dùng nhất sang `CONTEXT.md` của thư mục liên
  quan, chỉ để lại 1 dòng trỏ tới.
- Trước khi chuyển sang Phase tiếp theo: soát lại file này còn dòng nào
  chỉ đúng cho Phase vừa xong không, soát `docs/01-status.md` xóa việc đã
  xong (không giữ lại như nhật ký).
