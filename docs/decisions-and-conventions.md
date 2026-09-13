# Decisions and Conventions

## Learnings worth not relearning

- Script test trong scratch/ tuyệt đối không được thao tác trực tiếp lên dữ liệu production mà không có cơ chế cách ly/rollback (2 sự cố thật: title content_page bị dính chuỗi " [Đã duyệt nội dung nháp]" từ script test-step5-end-to-end.ts; link chết tái xuất hiện do script migrate lấy nhầm bản nội dung cũ trước khi đã vá lỗi).
