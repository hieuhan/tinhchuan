import { NextRequest } from 'next/server';
import { redis } from './redis';
import { db, users } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

/**
 * Kiểm tra xác thực admin THẬT bằng session token trong Redis & trạng thái user trong DB.
 * Trả về true nếu session hợp lệ và user status = 'active', ngược lại trả về false.
 */
export async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_session')?.value;

  // 1. Nếu không có cookie -> từ chối
  if (!token) {
    return false;
  }

  try {
    // 2. Tra Redis key "admin_session:<token>"
    const sessionVal = await redis.get(`admin_session:${token}`);
    if (!sessionVal) {
      return false;
    }

    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return false;
    }

    // 3. Verify user vẫn tồn tại và có status = 'active' trong bảng users
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || user.status !== 'active') {
      return false;
    }

    return true;
  } catch (err) {
    console.error('💥 Lỗi khi kiểm tra admin session:', err);
    return false;
  }
}

/**
 * Tạo URL redirect chuẩn xác cho admin routes khi chạy sau Nginx reverse proxy / Cloudflare Tunnel.
 * Đọc Host / X-Forwarded-Host và X-Forwarded-Proto từ request header để đảm bảo redirect về đúng domain public (admin.tinhchuan.vn),
 * thay vì bị đổi thành http://backend:3000 hay http://localhost:3000.
 */
export function getAdminRedirectUrl(req: NextRequest, targetPath: string): URL {
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'admin.tinhchuan.vn';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return new URL(targetPath, `${proto}://${host}`);
}
