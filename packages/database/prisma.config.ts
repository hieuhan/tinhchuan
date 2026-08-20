import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// npm workspace chạy lệnh với cwd = packages/database, nhưng file .env thật
// nằm ở ROOT monorepo (tạo từ .env.example) - "dotenv/config" mặc định chỉ
// tìm .env trong cwd hiện tại nên sẽ KHÔNG thấy, phải trỏ đường dẫn tường minh.
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
