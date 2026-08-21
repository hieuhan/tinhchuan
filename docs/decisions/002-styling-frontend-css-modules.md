## #002 - Styling apps/frontend: CSS Modules (không Tailwind)

**Ngày**: 2026-08-21
**Trạng thái**: Đang hiệu lực

**Quyết định**: `apps/frontend` dùng CSS Modules + CSS Custom Properties
(nguồn màu ở `apps/frontend/app/globals.css`). `apps/backend` (admin CMS)
dùng Tailwind CSS.

**Lý do**: HTML/CSS đã cắt sẵn cho TOÀN BỘ hệ thống (5 Tool + trang kiến
thức), convert sang Tailwind là làm lại việc đã xong, không sinh giá trị
mới. Cơ chế cắt tiếp diễn: AI Agent khác cắt HTML/CSS cho từng Tool mới,
PHẢI đọc `apps/frontend/manifest.json` trước để tái dùng component đã
có, tránh trùng lặp/lệch chuẩn giữa các lần cắt độc lập. `apps/backend`
chưa có thiết kế cắt sẵn nên Tailwind giúp dựng UI nhanh hơn.

**Đã cân nhắc và loại**: Tailwind cho cả 2 app.
