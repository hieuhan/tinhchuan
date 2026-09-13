import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db, users } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    let email = '';
    let password = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = body.email || '';
      password = body.password || '';
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();
      email =
        formData.get('email')?.toString() ||
        formData.get('username')?.toString() ||
        '';
      password = formData.get('password')?.toString() || '';
    } else {
      const body = await req.json().catch(() => ({}));
      email = body.email || '';
      password = body.password || '';
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Sai email hoặc mật khẩu' },
        { status: 401 }
      );
    }

    // Query user từ DB
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.trim().toLowerCase()),
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Sai email hoặc mật khẩu' },
        { status: 401 }
      );
    }

    // So khớp password bằng bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Sai email hoặc mật khẩu' },
        { status: 401 }
      );
    }

    // Tạo session token 32 bytes hex
    const token = crypto.randomBytes(32).toString('hex');
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 ngày

    // Lưu vào Redis: key admin_session:<token> => userId
    await redis.set(`admin_session:${token}`, user.id.toString(), 'EX', ttlSeconds);

    // Cập nhật lastLoginAt trong DB
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Set cookie admin_session
    const response = NextResponse.json(
      { success: true, message: 'Đăng nhập thành công' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ttlSeconds,
    });

    return response;
  } catch (err: any) {
    console.error('💥 Lỗi xử lý POST /login:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Đăng nhập quản trị - TinhChuan.vn</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
  <div class="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm">
    <h1 class="text-2xl font-bold mb-6 text-slate-800">Đăng nhập quản trị</h1>
    <form method="POST" action="/login">
      <div class="mb-4">
        <label class="block mb-2 text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin@tinhchuan.vn" />
      </div>
      <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-slate-700">Mật khẩu</label>
        <input name="password" type="password" required class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" class="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Đăng nhập</button>
    </form>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
