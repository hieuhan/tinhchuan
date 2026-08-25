## #009 - Thống nhất quản lý biến môi trường bằng Symlink / Hardlink

**Ngày**: 2026-08-25
**Trạng thái**: Đang hiệu lực

**Bối cảnh**:
Trước đây, `packages/database` đọc biến môi trường từ file `.env` ở ROOT monorepo thông qua khai báo `loadEnv({ path: path.resolve(process.cwd(), '../../.env') })` trong code, trong khi `apps/frontend` và `apps/backend` (Next.js dev server) tự động đọc `.env.development.local` tại chính thư mục của chúng hoặc thư mục gốc tùy theo ngữ cảnh chạy. Khi tiến hành thay đổi các cấu hình nhạy cảm như `DB_PASSWORD`, việc chỉ sửa một trong hai nơi dẫn tới lỗi mất kết nối DB (`ECONNREFUSED` / Authentication failed) ở nơi còn lại mà không có cảnh báo gì.

**Quyết định**:
1. **Một nguồn sự thật duy nhất (Single Source of Truth)**: Giữ duy nhất một file `.env` tại ROOT của monorepo chứa toàn bộ secret và cấu hình môi trường.
2. **Liên kết qua file `.env.local`**: Tạo liên kết tượng trưng (symlink) hoặc liên kết cứng (hardlink trên Windows) từ thư mục root `.env` vào các thư mục ứng dụng dưới tên `.env.local` thay vì `.env.development.local`.
   - Trên Linux/Mac:
     ```bash
     ln -sf ../../.env apps/frontend/.env.local
     ln -sf ../../.env apps/backend/.env.local
     ```
   - Trên Windows (nếu thiếu đặc quyền tạo Symlink):
     ```cmd
     mklink /H apps\frontend\.env.local .env
     mklink /H apps\backend\.env.local .env
     ```
3. **Quy tắc thay đổi secret**: Từ nay về sau, khi có bất kỳ thay đổi nào liên quan tới các biến môi trường hoặc mật khẩu, chỉ sửa đổi DUY NHẤT tại file `.env` ở ROOT monorepo.
4. **Bảo vệ Docker Build**: Đảm bảo cấu hình `.dockerignore` tại root loại trừ hoàn toàn tất cả các file `.env*` để tránh làm rò rỉ secret vào Docker build context / build image.

**Lý do**:
- Tên `.env.local` được Next.js tự động nạp ở mọi `NODE_ENV` (cả lúc dev lẫn build production), trong khi `.env.development.local` chỉ được nạp ở chế độ dev (`NODE_ENV=development`). Việc dùng `.env.local` đảm bảo tính nhất quán trên mọi môi trường và hỗ trợ build Docker image chính xác.
- Symlink/Hardlink là giải pháp đơn giản nhất giúp giữ đúng một nguồn sự thật duy nhất mà không cần cài đặt thêm bất kỳ package quản lý cấu hình phức tạp nào (`dotenv-cli`, `turbo`, v.v.), tuân thủ tinh thần tránh over-engineering cho một dự án quy mô nhỏ chạy trên single Mac Mini host.
