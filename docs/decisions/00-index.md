# Mục lục quyết định kiến trúc (ADR)

> Đọc file này TRƯỚC - cực ngắn, đủ biết quyết định nào đang hiệu lực.
> Chỉ mở file chi tiết khi cần hiểu đầy đủ lý do/bối cảnh.
>
> QUY TẮC: mã số 3 chữ số KHÔNG BAO GIỜ tái sử dụng dù entry bị thay thế.
> Thêm entry mới = thêm file mới + thêm 1 dòng vào bảng này, KHÔNG sửa/
> xóa dòng cũ.

| # | Tiêu đề | Trạng thái | File |
|---|---|---|---|
| 001 | ORM: Drizzle (thay Prisma) | Đang hiệu lực | [001-orm-drizzle.md](./001-orm-drizzle.md) |
| 002 | Styling apps/frontend: CSS Modules (không Tailwind) | Đang hiệu lực | [002-styling-frontend-css-modules.md](./002-styling-frontend-css-modules.md) |
| 003 | Kiến trúc repo: Monorepo (không multi-repo) | Đang hiệu lực | [003-monorepo-architecture.md](./003-monorepo-architecture.md) |
| 004 | Môi trường dev: code và deploy trực tiếp trên Mac Mini | Đang hiệu lực | [004-dev-environment-mac-mini.md](./004-dev-environment-mac-mini.md) |
| 005 | CI/CD: Không dùng GitHub Actions, deploy thủ công | Đang hiệu lực | [005-no-github-actions.md](./005-no-github-actions.md) |
| 006 | Bảng `users`: chưa cần phân quyền (role) | Đang hiệu lực | [006-users-table-no-role.md](./006-users-table-no-role.md) |
| 007 | `content_page.content`: markdown text, không dùng block-based JSON | Đang hiệu lực | [007-content-page-markdown.md](./007-content-page-markdown.md) |
| 008 | Hoãn cột `content_page.structuredData` (jsonb) sang Phase 2 | Đang hiệu lực | [008-structured-data-phase-2.md](./008-structured-data-phase-2.md) |
| 009 | Thống nhất quản lý biến môi trường bằng Symlink / Hardlink | Đang hiệu lực | [009-env-management-symlink.md](./009-env-management-symlink.md) |

