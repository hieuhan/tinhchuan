# CONTEXT.md - apps/frontend/app

## Mục đích thư mục

Toàn bộ route công khai (`(public)/`) và trang quản trị nhẹ nếu có. Styling
CSS Modules (xem `docs/decisions/00-index.md` #002), KHÔNG dùng Tailwind ở đây.

## Quy tắc riêng (bổ sung AGENTS.md mục 6)

**Font**: Be Vietnam Pro, self-host qua `next/font/google` trong
`app/layout.tsx`, KHÔNG load qua thẻ `<link>` trỏ fonts.googleapis.com
(tránh phụ thuộc mạng ngoài, tối ưu Core Web Vitals).

**7 nguyên tắc UI bắt buộc cho nội dung liên quan luật/thuế** (áp dụng
MỌI trang Tool, không rút gọn):

1. Trích dẫn nguồn (`legalSource`) đặt NGAY DƯỚI kết quả tính toán -
   không đặt cuối trang.
2. Badge "hiệu lực từ [ngày]" hiển thị tường minh cạnh tiêu đề trang.
3. "Cập nhật lần cuối [ngày]" hiển thị gần đầu trang.
4. Semantic color cho trạng thái kết quả - xanh khi chưa chịu thuế, vàng
   cảnh báo khi có nghĩa vụ thuế. Dùng đúng token trong `globals.css`,
   không tự chọn màu mới.
5. Panel "Xem lịch sử thay đổi" có thể mở/đóng, hiển thị giá trị cũ vs
   mới theo thời gian.
6. Disclaimer bắt buộc cuối trang: "Kết quả chỉ mang tính chất tham
   khảo, không phải tư vấn thuế chính thức".
7. Layout: card viền mỏng 0.5px, bo góc 12px, không gradient/shadow
   trang trí, đổi theme qua class `.dark` dùng CSS Custom Properties.

Cấu trúc 6 phần bắt buộc mỗi trang Tool (Form/Kết quả/Cách tính/Căn cứ/
FAQ/Related) đã có ở `AGENTS.md` mục 6, không nhắc lại ở đây.

## Đã có sẵn (tránh tạo trùng)

- Xem `apps/frontend/manifest.json` TRƯỚC khi tạo component UI mới trong
  `(public)/components/ui/`.

## KHÔNG được làm ở đây

- Không import trực tiếp `@tinhchuan/database` vào Server/Client
  Component - luôn qua `lib/db/*-repository.ts`.
- Không viết công thức tính thuế trong file `page.tsx`/component - luôn
  qua `lib/formula-engine/`.
