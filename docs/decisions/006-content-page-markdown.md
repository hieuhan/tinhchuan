## #007 - `content_page.content`: markdown text, không dùng block-based JSON

**Ngày**: 2026-08-21
**Trạng thái**: Đang hiệu lực

**Quyết định**: Cột `content` của bảng `content_page` là kiểu `text`,
nội dung dạng **markdown** (cùng cú pháp với các file `.md` trong repo:
`##`, `**`, `-`, `>`...), render qua `react-markdown` ở `apps/frontend`.
KHÔNG dùng cấu trúc block-based JSON (kiểu Notion). FAQ tách riêng thành
cột `faqItems` (jsonb) vì cần dữ liệu có cấu trúc cho schema.org
`FAQPage`.

**Lý do**: Roadmap không có kế hoạch xây editor kéo-thả nào (`docs/product-spec.md`
mục 6, Phase 2 chỉ có "Admin review dashboard" - duyệt nội dung, không
phải soạn thảo). 2 nguồn tạo nội dung thật (Phase 1: viết tay; Phase 2:
Claude API sinh) đều tự nhiên ra markdown - ép sang block JSON không có
UI nào tiêu thụ, và ép AI sinh đúng cấu trúc JSON phức tạp còn tăng rủi
ro lỗi định dạng, tốn thêm chi phí gọi lại API.

**Đã cân nhắc và loại**: Block-based JSON "chuẩn bị trước cho editor
tương lai" - loại vì không có editor nào trong roadmap thật, thiết kế
trước khi có UI tiêu thụ dễ sai và phải đổi lại khi editor thật hình
thành.
