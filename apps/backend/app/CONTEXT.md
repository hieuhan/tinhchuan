# CONTEXT.md - apps/backend/app

## Mục đích thư mục

CMS quản trị nội bộ (đăng nhập, duyệt nội dung AI sinh, xử lý xung đột
nguồn). Chỉ 1 admin dùng ở Phase 1 (xem `docs/decisions/00-index.md`
#006 - chưa có phân quyền). Styling Tailwind CSS (xem
`docs/decisions/00-index.md` #002), KHÁC với `apps/frontend` (CSS
Modules).

## Quy tắc riêng (bổ sung AGENTS.md)

- **Xác thực**: so khớp `passwordHash` (bcryptjs) với bảng `users`,
  KHÔNG dùng JWT - lưu session token trong Redis để có thể thu hồi ngay
  lập tức (đăng xuất/khóa tài khoản có hiệu lực tức thì, JWT không làm
  được điều này).
- Mọi route dưới `admin/` (trừ `admin/login`) PHẢI kiểm tra session hợp
  lệ trước khi render - chặn ở middleware hoặc đầu mỗi Server Component,
  không chặn phía client.
- Trang `review` hiển thị dữ liệu `status = 'pending_review'` - đây là
  NƠI DUY NHẤT trong toàn hệ thống được phép đọc dữ liệu chưa duyệt
  (khác với `apps/frontend`, chỉ đọc `approved` - xem `AGENTS.md` mục 5).
- Sau khi admin duyệt (approve/reject), cập nhật `reviewedBy` (trỏ
  `users.id` của admin đang đăng nhập) và `reviewedAt` - không để trống.

## Đã có sẵn (tránh tạo trùng)

- Route `admin/{login,dashboard,review,conflicts}` hiện CHỈ là khung
  đường dẫn theo kế hoạch (`AGENTS.md` mục 7 - Phase 2 mới build thật),
  CHƯA có logic/UI thật - xem `docs/01-status.md` để biết trạng thái
  chính xác trước khi cho là đã tồn tại.

## KHÔNG được làm ở đây

- Không tự thêm cột `role`/hệ thống phân quyền khi chưa có nhu cầu thật
  (xem `docs/decisions/00-index.md` #006).
- Không import trực tiếp `@tinhchuan/database` vào Server/Client
  Component - luôn qua `lib/db/*-repository.ts`.
- Không để lộ dữ liệu `pending_review`/`draft` ra ngoài phạm vi CMS này
  (không expose qua API công khai nào).
