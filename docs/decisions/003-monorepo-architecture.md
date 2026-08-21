## #003 - Kiến trúc repo: Monorepo (không multi-repo)

**Ngày**: 2026-08-21
**Trạng thái**: Đang hiệu lực

**Quyết định**: 1 repo Git duy nhất, `apps/frontend` + `apps/backend` +
`packages/database` (+ `packages/content-pipeline`) qua npm workspaces.

**Lý do**: Solo dev, ~15h/tuần. Multi-repo (đề xuất cũ, dùng GitHub
Packages cho `@tinhchuan/shared`) tối ưu cho nhiều team làm việc độc lập
- không phù hợp quy mô hiện tại. Monorepo giúp schema Drizzle dùng chung
chống schema drift (build lỗi TypeScript ngay nếu 1 app dùng sai field).

**Đã cân nhắc và loại**: Multi-repo + Private Package Registry.
