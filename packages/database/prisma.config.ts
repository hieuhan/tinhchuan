import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// npm workspace chạy lệnh với cwd = packages/database, nhưng file .env thật
// nằm ở ROOT monorepo (tạo từ .env.example) - "dotenv/config" mặc định chỉ
// tìm .env trong cwd hiện tại nên sẽ KHÔNG thấy, phải trỏ đường dẫn tường minh.
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

// QUAN TRỌNG - KHÔNG dùng helper env('DATABASE_URL') của Prisma ở đây.
// Khác biệt giữa 2 cách lấy biến môi trường:
//   - env('DATABASE_URL')       -> ép buộc biến PHẢI tồn tại, nếu thiếu sẽ
//                                   throw "PrismaConfigEnvError" ngay cả khi
//                                   chỉ chạy "prisma generate" (lệnh này chỉ
//                                   đọc schema.prisma để sinh code, KHÔNG hề
//                                   kết nối DB thật).
//   - process.env.DATABASE_URL  -> trả về undefined thay vì throw. Từ Prisma
//                                   7.2.0 trở lên (dự án dùng 7.9.1), lệnh
//                                   "prisma generate" chấp nhận url undefined.
// Nhờ vậy image build trong Docker (bootstrap/setup.sh, stage "builder") KHÔNG
// còn cần khai báo DATABASE_URL giả nữa. Giá trị thật chỉ thực sự bắt buộc
// khi chạy "prisma migrate deploy"/"db push" - lúc đó container đã nhận
// DATABASE_URL thật từ "environment:" trong docker-compose.yml, hoặc trên
// host thì lấy từ .env đã load ở dòng loadEnv() bên trên.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
