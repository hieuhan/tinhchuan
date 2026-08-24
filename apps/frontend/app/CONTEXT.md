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

## Quy trình convert HTML/CSS thô (design-source/)

- File HTML/CSS/JS đã cắt đặt tạm ở `design-source/<slug-trang>/` (root
  repo, gitignore, KHÔNG commit) - tên thư mục con KHỚP slug route sẽ
  dùng (`design-source/tool-1-thue-ban-hang-online/` ứng với
  `app/(public)/tool/thue-ban-hang-online/`).
- `design-source/shared/` (nếu có) chứa style THẬT SỰ dùng chung nhiều
  trang (header/footer/reset) - map sang `components/layout/`. KHÔNG
  chấp nhận input dạng gộp phẳng 1-2 file style cho MỌI trang - nếu
  nhận được input như vậy, YÊU CẦU tách lại theo từng thư mục trang
  trước khi convert, KHÔNG tự đoán ranh giới trang từ file gộp.
- Tách theo vai trò, KHÔNG gộp hết vào 1 file:
  - Header/Footer dùng chung mọi trang -> `components/layout/`
  - Component đủ tổng quát để trang khác tái dùng -> `components/ui/`,
    BẮT BUỘC cập nhật `manifest.json` sau khi tạo
  - Nội dung đặc thù CHỈ 1 trang dùng -> viết ngay trong route đó, KHÔNG
    đưa vào `components/ui/`
- Màu: đối chiếu `app/globals.css` TRƯỚC - chỉ thêm token mới khi màu
  THẬT SỰ chưa có tương ứng, không hard-code hex trong `.module.css`.
- JS thô (toggle menu, accordion...) chuyển thành `useState`/event
  handler React, không giữ thao tác DOM thuần
  (`document.querySelector`...).
- Ảnh dùng `next/image`, không dùng thẻ `<img>` thô.
- Sau khi convert xong 1 trang: KHÔNG tự xóa `design-source/<slug-trang>/`
  - giữ lại để đối chiếu bằng mắt, chỉ xóa khi có xác nhận tay.

## Tổ chức CSS - KHÔNG tạo style.css/responsive.css dùng chung

`app/globals.css` CHỈ chứa design token (`--color-*`), CSS reset tối
thiểu, và typography mặc định (`body { font-family: ... }`) - KHÔNG
thêm style bố cục hay `@media` vào đây.

Mọi style khác (kể cả responsive) nằm trong `.module.css` CẠNH component
sở hữu nó - không tạo file CSS dùng chung nhiều trang (kể cả tên gọi
`style.css`/`responsive.css`/`layout.css`...). Lý do: CSS dùng chung
nhiều Agent cùng sửa dễ xung đột, và tích lũy rác không ai dám xóa -
đúng vấn đề CSS Modules được chọn để giải quyết (xem
`docs/decisions/002-styling-frontend-css-modules.md`).

**Breakpoint chuẩn** (dùng đúng con số này trong MỌI file `.module.css`,
không tự chọn số khác - CSS Custom Properties không dùng được bên trong
`@media` nên phải quy ước bằng số cố định):
- Mobile: mặc định, không cần `@media`
- Tablet: `@media (min-width: 768px)`
- Desktop: `@media (min-width: 1024px)`