import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;

    if (token) {
      // Xóa session key khỏi Redis
      await redis.del(`admin_session:${token}`);
    }

    // Xóa cookie admin_session phía client
    const response = NextResponse.json(
      { success: true, message: 'Đăng xuất thành công' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'admin_session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (err: any) {
    console.error('💥 Lỗi xử lý POST /logout:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
