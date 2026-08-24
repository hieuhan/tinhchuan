## #008 - Không thêm cột `content_page.structuredData` ở Phase 1, hoãn sang Phase 2

**Ngày**: 2026-08-24
**Trạng thái**: Đang hiệu lực

**Quyết định**: KHÔNG thêm cột `structuredData` (jsonb) vào bảng `content_page` ở Phase 1. Trì hoãn việc thiết kế và bổ sung cột này sang Phase 2 khi tiến hành chuyển đổi và quản lý nội dung qua CMS/Database.

**Bối cảnh & Lý do cốt lõi**:
- 3 trang Kiến thức hiện tại ở Phase 1 đang hardcode nội dung trực tiếp bằng JSX thuần, chưa truy vấn từ bảng `content_page`. Nếu thêm cột `structuredData` ở thời điểm này, cột sẽ ở trạng thái trống (NULL), không có thành phần nào tiêu thụ hoặc thực hiện kiểm chứng thiết kế schema JSONB.
- Các phần cấu trúc nội dung đặc thù (như Timeline lịch sử, bảng so sánh ngưỡng thuế) trong 3 trang Kiến thức chính là "spec sống" (living specification) thực tế nhất. Việc hoãn sang Phase 2 giúp thiết kế schema `structuredData` bám sát các React component đang hoạt động thực tế thay vì suy đoán trước cấu trúc.
- Tuân thủ nguyên tắc cốt lõi tại `AGENTS.md` mục 4: "Tránh over-engineering — không tạo thêm bảng, cột, service hay abstraction khi chưa có nhu cầu thực tế ở giai đoạn hiện tại".
- Chi phí trì hoãn rất thấp: Việc bổ sung một cột JSONB nullable (`structuredData`) vào bảng PostgreSQL ở Phase 2 không gây ra bất kỳ breaking change nào cho cấu trúc DB hay ứng dụng hiện tại.

**Việc cần làm ở Phase 2**: Khi quay lại triển khai Phase 2, trước khi thiết kế schema cho `structuredData`, cần tham chiếu trực tiếp JSX của các thành phần Timeline và bảng so sánh trong 3 trang Kiến thức (`apps/frontend/app/(public)/kien-thuc/...`) làm cơ sở định nghĩa cấu trúc JSONB chính xác nhất.
