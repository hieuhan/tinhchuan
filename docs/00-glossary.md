# Thuật ngữ nghiệp vụ - chuẩn hóa Việt → Anh

> Đọc file này TRƯỚC khi đặt tên biến/bảng/hàm mới liên quan nghiệp vụ
> thuế. Nếu 1 khái niệm chưa có ở đây, THÊM vào bảng này khi đặt tên lần
> đầu - không để mỗi lần code lại tự dịch khác nhau.

| Tiếng Việt | Tên chuẩn (English) | Ghi chú |
|---|---|---|
| Doanh thu | `revenue` | |
| Ngưỡng chịu thuế / ngưỡng miễn thuế | `taxThreshold` | Không dùng `nguong`, `limit` |
| Thuế suất | `taxRate` | |
| Thuế giá trị gia tăng | `vatTax` hoặc `gtgtTax` | Ưu tiên `vatTax` cho code mới |
| Thuế thu nhập cá nhân | `personalIncomeTax` hoặc `pitTax` | |
| Văn bản pháp luật gốc | `legalSource` | Tên bảng: `legal_source` |
| Danh mục quy tắc thuế | `taxRuleCategory` | Tên bảng: `tax_rule_category` |
| Phiên bản quy tắc thuế | `taxRuleVersion` | Tên bảng: `tax_rule_version` |
| Hiệu lực từ | `effectiveFrom` | |
| Hiệu lực đến | `effectiveTo` | |
| Đã duyệt | `approved` | Giá trị enum `status`, KHÔNG dịch khác |
| Chờ duyệt | `pendingReview` | |
| Nháp | `draft` | |
| Xung đột nguồn | `sourceConflict` | Tên bảng: `source_conflict` |
| Trang nội dung | `contentPage` | Tên bảng: `content_page` |
| Tài khoản đăng nhập | `user` | Tên bảng: `users`, KHÔNG có `role` (xem ADR #006) |
| Mật khẩu đã băm | `passwordHash` | Luôn qua bcryptjs, không lưu plain text |
| Nội dung dạng markdown | `content` | Không phải "plain text" - có cú pháp `##`/`**`/`-` (xem ADR #007) |
| Câu hỏi thường gặp | `faqItems` | Kiểu jsonb, mảng `{question, answer}` |
| Hộ kinh doanh | `householdBusiness` | |
| Kê khai theo doanh thu thực tế | `actualRevenueDeclaration` | |
| Chuyển nhượng bất động sản | `realEstateTransfer` | |
| Quyết toán thuế cuối năm | `annualTaxSettlement` | |
