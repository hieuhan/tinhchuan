import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, contentPage } from '@tinhchuan/database';
import { eq, ne, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdmin(req);
  if (!isAuthorized) {
    return NextResponse.redirect(getAdminRedirectUrl(req, '/login'));
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || 'unfinished';

  let pages = [];
  if (statusFilter === 'published') {
    pages = await db.select().from(contentPage).where(eq(contentPage.status, 'published')).orderBy(desc(contentPage.updatedAt));
  } else if (statusFilter === 'draft') {
    pages = await db.select().from(contentPage).where(eq(contentPage.status, 'draft')).orderBy(desc(contentPage.updatedAt));
  } else if (statusFilter === 'all') {
    pages = await db.select().from(contentPage).orderBy(desc(contentPage.updatedAt));
  } else {
    // default 'unfinished': ne 'published'
    pages = await db.select().from(contentPage).where(ne(contentPage.status, 'published')).orderBy(desc(contentPage.updatedAt));
  }

  const rowsHtml = pages.map((p) => {
    let statusBadge = '';
    if (p.status === 'published') {
      statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Đã xuất bản (published)</span>';
    } else if (p.status === 'draft') {
      statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Bản nháp (draft)</span>';
    } else {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">${p.status}</span>`;
    }

    const updatedStr = p.updatedAt ? new Date(p.updatedAt).toLocaleString('vi-VN') : '—';

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="px-4 py-3 font-semibold text-slate-800">
          <a href="/content/${p.id}" class="hover:text-blue-600">${escapeHtml(p.title)}</a>
        </td>
        <td class="px-4 py-3 text-xs font-mono text-slate-500">${escapeHtml(p.slug)}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-xs text-slate-500">${updatedStr}</td>
        <td class="px-4 py-3 text-right">
          <a href="/content/${p.id}" class="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm">
            ✏️ Duyệt & Sửa
          </a>
        </td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quản lý Bài viết - Admin TinhChuan.vn</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
  <header class="bg-slate-900 text-white py-4 px-8 mb-8 shadow-sm">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <h1 class="text-xl font-bold">TinhChuan.vn Admin</h1>
        <nav class="flex gap-4 text-sm font-medium">
          <a href="/dashboard" class="text-slate-300 hover:text-white">Dashboard</a>
          <a href="/review" class="text-slate-300 hover:text-white">Duyệt văn bản</a>
          <a href="/content" class="text-white font-semibold underline underline-offset-4">Quản lý Bài viết</a>
        </nav>
      </div>
      <form method="POST" action="/logout">
        <button type="submit" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white">Đăng xuất</button>
      </form>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Quản lý Bài viết (Content Review)</h2>
        <p class="text-sm text-slate-600">Duyệt, chỉnh sửa và xuất bản các bài viết do AI sinh tự động.</p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 border-b border-slate-200 mb-6">
      <a href="/content?status=unfinished" class="px-4 py-2 text-sm font-medium border-b-2 ${statusFilter === 'unfinished' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}">
        Cần xử lý (${pages.length && statusFilter === 'unfinished' ? pages.length : 'Nháp'})
      </a>
      <a href="/content?status=draft" class="px-4 py-2 text-sm font-medium border-b-2 ${statusFilter === 'draft' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}">
        Bản nháp (Draft)
      </a>
      <a href="/content?status=published" class="px-4 py-2 text-sm font-medium border-b-2 ${statusFilter === 'published' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}">
        Đã xuất bản (Published)
      </a>
      <a href="/content?status=all" class="px-4 py-2 text-sm font-medium border-b-2 ${statusFilter === 'all' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}">
        Tất cả
      </a>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Tiêu đề bài viết</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3">Ngày cập nhật</th>
            <th class="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">Chưa có bài viết nào trong danh mục này.</td></tr>'}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
