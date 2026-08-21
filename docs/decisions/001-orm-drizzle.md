## #001 - ORM: Drizzle (thay Prisma)

**Ngày**: 2026-08-21
**Trạng thái**: Đang hiệu lực

**Bối cảnh**: `packages/database` ban đầu setup Prisma 7 (rust-free
client), nhưng chưa định nghĩa model nào khi quyết định đổi - chi phí
chuyển đổi bằng 0.

**Quyết định**: Dùng Drizzle ORM.

**Lý do**: Tiêu chí ưu tiên là "gần với DB nhất" và triển khai self-host
trên Docker dài hạn (KHÔNG serverless/edge) nên lợi thế cold-start của
Drizzle không phải yếu tố quyết định chính - lý do chính là kiểm soát
trực tiếp query trên cột `jsonb` (`ruleValue`) và lọc khoảng ngày
(`effectiveFrom`/`effectiveTo`) của `tax_rule_version` mà không qua lớp
trừu tượng riêng.

**Đã cân nhắc và loại**: Prisma 7 - dù đã bỏ Rust engine (nhanh hơn đáng
kể so với Prisma 6), vẫn giữ ngôn ngữ schema riêng (PSL) và client tự
sinh code, không phải "gần SQL nhất" theo đúng tiêu chí đặt ra.

**Đề xuất cũ bị từ chối** (từng có trong `tinhchuan_architecture_context.md`
đã xóa khỏi repo): multi-repo (frontend/backend/shared repo riêng) + Drizzle
+ GitHub Packages cho `@tinhchuan/shared`. Bị từ chối phần multi-repo vì
không phù hợp quy mô 1 dev part-time - xem #003.
