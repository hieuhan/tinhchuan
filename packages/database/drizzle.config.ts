import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL chưa được cấu hình trong file .env ở thư mục gốc dự án.');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
