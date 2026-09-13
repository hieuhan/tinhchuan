## #012 - Kịch bản kiểm thử (Test script) tuyệt đối không thao tác trực tiếp lên dữ liệu Production

**Ngày**: 2026-09-14
**Trạng thái**: Đang hiệu lực

**Quyết định**:
1. Các kịch bản kiểm thử và thử nghiệm trong thư mục `scratch/` tuyệt đối không được thực hiện các thao tác ghi/sửa dữ liệu (`UPDATE`, `INSERT`) trực tiếp lên cơ sở dữ liệu Production mà không có cơ chế cách ly (isolation), bọc transaction rollback, hoặc dọn dẹp (cleanup) dữ liệu tự động sau khi kết thúc.
2. Mọi script test hoặc khảo sát tạm thời trong `scratch/` sau khi hoàn thành nhiệm vụ và không còn giá trị tài liệu tham khảo lâu dài phải được xóa ngay khỏi codebase.
3. Các script lưu trữ lại làm tài liệu tham khảo (như `scratch/migrate-phase1-articles.ts`) bắt buộc phải thêm comment cảnh báo rõ ràng ở đầu file (`// Script này đã chạy 1 lần, KHÔNG chạy lại - chỉ dùng làm tài liệu tham khảo.`) để tránh việc vô tình thực thi lại.

**Bối cảnh & Lý do**:
Trong quá trình phát triển Phase 2, đã xảy ra 2 sự cố thực tế do kịch bản test trong `scratch/` can thiệp dữ liệu thật:
1. Kịch bản test API `scratch/test-step5-end-to-end.ts` khi chạy test chỉnh sửa bài viết đã tự động nối chuỗi `+ ' [Đã duyệt nội dung nháp]'` trực tiếp vào cột `title` của bài viết trong `content_page` DB production.
2. Script migration `scratch/migrate-phase1-articles.ts` lấy lại bản nội dung mẫu từ file static trước khi đường dẫn chết (dead link) được sửa, dẫn đến việc link chết tái xuất hiện trong DB sau khi migrate.

**Hành động đã thực hiện**:
1. Khôi phục tiêu đề gốc chuẩn xác cho bài viết bị ảnh hưởng trong `content_page` DB và làm sạch 100% link chết.
2. Rà soát và xóa bỏ 18 file test/dump tạm thời trong `scratch/`, chỉ giữ lại `migrate-phase1-articles.ts` có gắn cờ cảnh báo header.
3. Xóa bỏ file `docs/decisions-and-conventions.md` không đúng quy ước kiến trúc ADR của dự án.
