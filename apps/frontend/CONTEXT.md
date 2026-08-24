# CONTEXT.md - apps/frontend

## Mục đích thư mục

Toàn bộ Next.js app công khai: route (`app/(public)/`), component dùng
chung (`components/`), business logic (`lib/formula-engine/`,
`lib/db/`). Styling CSS Modules (xem `docs/decisions/00-index.md` #002),
KHÔNG dùng Tailwind ở đây.

## Quy tắc riêng (bổ sung AGENTS.md mục 6)

**Font**: Be Vietnam Pro, self-host qua `next/font/google` trong
`app/layout.tsx`, KHÔNG load qua thẻ `<link>` trỏ fonts.googleapis.com
(tránh phụ thuộc mạng ngoài, tối ưu Core Web Vitals).

**Biến NEXT_PUBLIC_***: Đổi biến `NEXT_PUBLIC_*` trong `.env` khi không sửa code sẽ bị Docker BuildKit cache layer `npm run build`, cần rebuild với cờ `--no-cache` để Next.js inline giá trị mới.

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

- **TRƯỚC KHI CẮT** (không phải lúc convert): nếu dùng AI Agent/công cụ
  KHÔNG đọc được repo này để cắt HTML/CSS, PHẢI cung cấp cho công cụ đó
  đúng nội dung `app/globals.css` hiện tại (copy nguyên file, không gõ
  lại tay) - để nó dùng đúng token màu đã duyệt, không tự chọn màu mặc
  định. Nếu dùng Claude Code/Gemini CLI có quyền đọc repo, chỉ cần dặn
  "đọc app/globals.css trước khi cắt", không cần copy tay.
- File HTML/CSS/JS đã cắt đặt tạm ở `design-source/<slug-trang>/` (root
  repo, gitignore, KHÔNG commit) - tên thư mục con PHẢI KHỚP CHÍNH XÁC
  đoạn slug cuối cùng của route (KHÔNG thêm tiền tố nhóm route như
  `tool-1-`, `kien-thuc-`... vì đã dư thừa với path cha). Ví dụ:
  route `/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok` ->
  `design-source/cach-tinh-thue-ban-hang-tren-shopee-tiktok/` (ĐÚNG),
  KHÔNG phải `design-source/kien-thuc-cach-tinh-thue-shopee-tiktok/`
  (SAI - thừa tiền tố, thiếu chữ). Danh sách slug chính thức đã quy
  hoạch: xem `docs/product-spec.md` mục 3.2 - đối chiếu TRƯỚC khi đặt
  tên thư mục, không tự rút gọn/đổi khác.
- `design-source/shared/` (nếu có) chứa style THẬT SỰ dùng chung nhiều
  trang (header/footer/reset) - map sang `components/layout/`. KHÔNG
  chấp nhận input dạng gộp phẳng 1-2 file style cho MỌI trang - nếu
  nhận được input như vậy, YÊU CẦU tách lại theo từng thư mục trang
  trước khi convert, KHÔNG tự đoán ranh giới trang từ file gộp.
- Tách theo vai trò, KHÔNG gộp hết vào 1 file:
  - Header/Footer/ThemeToggle dùng chung mọi trang ->
    `apps/frontend/components/layout/`
  - Component đủ tổng quát để trang khác tái dùng ->
    `apps/frontend/components/ui/`, BẮT BUỘC cập nhật `manifest.json`
    sau khi tạo
  - Nội dung đặc thù CHỈ 1 trang dùng -> viết ngay trong route đó
    (`app/(public)/...`), KHÔNG đưa vào `components/ui/`
- Màu: đối chiếu `app/globals.css` TRƯỚC - MÀU GIỮ VAI TRÒ TƯƠNG ĐƯƠNG
  (ví dụ màu chủ đạo/thương hiệu trong design, dù giá trị hex khác) PHẢI
  ánh xạ vào token đã có (`var(--color-primary)`...), KHÔNG tạo token
  song song mới cho cùng 1 vai trò. Chỉ thêm token mới khi màu đó phục
  vụ vai trò THẬT SỰ chưa có tương ứng (ví dụ 1 màu nhấn phụ hoàn toàn
  mới). Không hard-code hex trong `.module.css`.
- JS thô (toggle menu, accordion...) chuyển thành `useState`/event
  handler React, không giữ thao tác DOM thuần
  (`document.querySelector`...).
- Ảnh dùng `next/image`, không dùng thẻ `<img>` thô.
- Icon dùng SVG component tự host trong `components/icons/`, không CDN
  ngoài.
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

## Dữ liệu tĩnh vs dữ liệu từ DB - phân loại khi convert MỌI trang

- **Layout/marketing chrome** (Header, Footer, Hero, "vì sao chọn",
  các bước quy trình...) - KHÔNG map với bảng nào trong
  `packages/database/src/schema/`, giữ hardcode trong code, KHÔNG cần
  nối DB.
- **Số liệu thuế cụ thể** (ngưỡng, thuế suất, kết quả tính toán) - LUÔN
  LUÔN qua `lib/formula-engine/` + `lib/db/` đọc `tax_rule_version`
  (`status='approved'`), KHÔNG BAO GIỜ hardcode trong `.tsx`/JSX, kể cả
  khi cắt HTML có số liệu mẫu - đánh dấu rõ
  `// TODO: nối Formula Engine, không giữ số tĩnh` ngay tại chỗ, không
  để lẫn như text thường.
- **Danh sách nội dung động** (`ArticleCard` liệt kê bài Kiến thức...)
  - `content_page` hiện CHƯA có dữ liệu (bảng rỗng ở Phase 1), tạm giữ
  dữ liệu mẫu/tĩnh NHƯNG PHẢI đánh dấu
  `// TODO: query content_page (status='approved', pageType='knowledge')`
  - không được để quên khi bảng có dữ liệu thật.