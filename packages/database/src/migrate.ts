// Áp dụng migration đã generate sẵn trong thư mục drizzle/. Chạy bằng:
// npm run db:migrate --workspace=packages/database (thực thi trên HOST, dùng
// DATABASE_URL trỏ "localhost" đã forward cổng - xem ghi chú trong .env.example).
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString?.includes('@postgres:')) {
    connectionString = connectionString.replace('@postgres:', '@127.0.0.1:');
  }
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('✅ Đã áp dụng migration thành công.');
}

main().catch((error) => {
  console.error('❌ Migration thất bại:', error);
  process.exit(1);
});
