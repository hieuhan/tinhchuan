# Trạng thái hiện tại

> File này GHI ĐÈ TOÀN BỘ mỗi phiên làm việc - KHÔNG cộng dồn lịch sử.
> Lịch sử quyết định kiến trúc xem `docs/decisions/00-index.md`.

**Cập nhật lần cuối**: 2026-08-22

## Đang ở Phase nào

Phase 1 - Tuần 1 (Nền tảng), xem `docs/checklist-phase-1.md`.

## Vừa hoàn thành

- Chốt kiến trúc: monorepo 2 app + `packages/database` dùng chung, ORM
  Drizzle, `apps/frontend` CSS Modules / `apps/backend` Tailwind (ADR
  #001-#003).
- Chốt môi trường dev: code và deploy trực tiếp trên Mac Mini, KHÔNG
  tách dev/production (ADR #004).
- Chốt CI/CD: bỏ job deploy trong GitHub Actions, `git push` chỉ để
  backup, deploy chạy tay `bash scripts/deploy.sh all` (ADR #005).
- Chốt thiết kế 6 bảng lõi: `users`, `legal_source`, `tax_rule_category`,
  `tax_rule_version`, `source_conflict`, `content_page` +
  `content_page_tax_rule` (bảng nối). `users` chưa có `role` (ADR #006).
  `content_page.content` là markdown text, không phải block JSON (ADR
  #007). Ý nghĩa chi tiết xem `packages/database/CONTEXT.md`.
- Dựng thật `apps/frontend`, `apps/backend` qua `create-next-app` +
  patch (đã build-test thành công), `packages/database` (khung Drizzle),
  `packages/content-pipeline` (khung tối thiểu).
- Cập nhật toàn bộ bộ tài liệu AI Agent: `AGENTS.md`, `CLAUDE.md`,
  `GEMINI.md`, `docs/00-glossary.md`, `docs/01-status.md` (file này),
  `docs/decisions/00-index.md`, `packages/database/CONTEXT.md`.
- Định nghĩa schema Drizzle 6 bảng + seed script (`packages/database/src/schema/index.ts` & `src/seed.ts`), đã generate migration, push schema xuống DB và seed dữ liệu ban đầu thành công.

## Đang làm / Tiếp theo

- Xóa các GitHub Secrets không còn dùng (`SSH_PRIVATE_KEY`,
  `TS_OAUTH_CLIENT_ID`, `TS_AUDIENCE`, `MAC_MINI_SSH_HOST`,
  `MAC_MINI_SSH_USER`) theo ADR #005.
- Xóa job `deploy` khỏi `.github/workflows/deploy.yml` (giữ `ci.yml` nếu
  muốn) theo ADR #005.
- Bắt đầu Checklist Phase 1 - Tuần 2: Formula Engine + UI Tool 1 (đã
  có schema DB thật).

## Việc CHƯA làm (không tự ý bắt đầu)

- Crawler + AI Agent thật trong `packages/content-pipeline` (Phase 2).
- Admin review dashboard thật (Phase 2).
- Tool 2-5 (Phase 3).
- Phân quyền (`role`), tài khoản người dùng cuối, Premium (Phase 5).
