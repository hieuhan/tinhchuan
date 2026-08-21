## #006 - Bảng `users`: chưa cần phân quyền (role)

**Ngày**: 2026-08-21
**Trạng thái**: Đang hiệu lực

**Quyết định**: Bảng `users` (đăng nhập `apps/backend`) KHÔNG có cột
`role` - chỉ có `id`, `email`, `passwordHash`, `name`, `status`
(`active`/`disabled`), `lastLoginAt`, `createdAt`.

**Lý do**: Phase 1 chỉ 1 admin duy nhất (chính chủ dự án), dùng nội bộ -
chưa có khái niệm phân quyền nào cần biểu diễn. Thêm cột `role` khi thật
sự có reviewer thứ 2 (Phase 2+) là 1 dòng migration đơn giản, không cần
thiết kế trước.

**Đã cân nhắc và loại**: Thiết kế sẵn `role` enum với 1 giá trị `admin`
để "phòng khi cần" - loại vì đoán trước nhu cầu chưa xác nhận, đúng tinh
thần tránh over-engineering.
