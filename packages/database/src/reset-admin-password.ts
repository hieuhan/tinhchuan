import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { users } from './schema';

// Tải biến môi trường từ file .env ở gốc dự án
if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '.env.development.local') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

async function main() {
  console.log('🔄 Đang tiến hành cập nhật mật khẩu tài khoản Admin...');

  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      '❌ ADMIN_INITIAL_PASSWORD chưa được đặt trong biến môi trường! Vui lòng set ADMIN_INITIAL_PASSWORD trước khi chạy script.'
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@tinhchuan.vn';

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!existingAdmin) {
    throw new Error(
      `❌ Không tìm thấy tài khoản admin với email: ${adminEmail}. Vui lòng chạy seed trước.`
    );
  }

  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.email, adminEmail));

  console.log(`✅ Đã cập nhật mật khẩu mới thành công cho tài khoản: ${adminEmail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi khi cập nhật mật khẩu admin:', err);
  process.exit(1);
});
