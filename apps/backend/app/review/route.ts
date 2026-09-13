import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, crawlDetectedItem } from '@tinhchuan/database';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Kiểm tra quyền xác thực admin
  const isAuthorized = await isAuthorizedAdmin(req);
  const acceptHeader = req.headers.get('accept') || '';
  const wantsJson = acceptHeader.includes('application/json');

  if (!isAuthorized) {
    if (wantsJson) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin authentication required.' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(getAdminRedirectUrl(req, '/login'));
  }

  // 2. Query danh sách văn bản pending_review
  const items = await db.query.crawlDetectedItem.findMany({
    where: eq(crawlDetectedItem.status, 'pending_review'),
    orderBy: [desc(crawlDetectedItem.detectedAt)],
  });

  if (wantsJson) {
    return NextResponse.json({ items }, { status: 200 });
  }

  // Render HTML danh sách
  const itemsHtml = items.length === 0
    ? `<div class="p-8 text-center bg-white rounded-lg border border-slate-200">
        <p class="text-lg text-slate-500 font-medium">Không có văn bản nào đang chờ duyệt</p>
       </div>`
    : items.map((item) => {
        const previewText = (item.extractedText || '').slice(0, 200);
        return `
        <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-4">
          <h2 class="text-xl font-bold text-slate-800 mb-2">${escapeHtml(item.title)}</h2>
          <p class="text-sm text-slate-600 mb-3">
            <span class="font-semibold text-slate-700">Lý do phân loại AI:</span> ${escapeHtml(item.aiClassificationReason || 'Không có')}
          </p>
          <div class="bg-slate-50 p-3 rounded text-xs text-slate-600 font-mono mb-4 border border-slate-100 max-h-24 overflow-hidden">
            ${escapeHtml(previewText)}${previewText.length >= 200 ? '...' : ''}
          </div>
          <div class="flex items-center gap-4 text-sm font-medium">
            <a href="/review/${item.id}" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Xem chi tiết & Duyệt</a>
            ${item.sourceFileUrl ? `<a href="/files/${item.id}" target="_blank" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors">Xem file gốc</a>` : ''}
          </div>
        </div>`;
      }).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Review Dashboard - TinhChuan.vn</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
  <header class="bg-slate-900 text-white py-4 px-8 mb-8 shadow-sm">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <h1 class="text-xl font-bold">TinhChuan.vn Admin</h1>
        <nav class="flex gap-4 text-sm font-medium">
          <a href="/dashboard" class="text-slate-300 hover:text-white">Dashboard</a>
          <a href="/review" class="text-white font-semibold border-b-2 border-blue-400 pb-1">Duyệt văn bản (${items.length})</a>
        </nav>
      </div>
      <form method="POST" action="/logout">
        <button type="submit" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white">Đăng xuất</button>
      </form>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Văn bản chờ duyệt (pending_review)</h2>
      <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">${items.length} văn bản</span>
    </div>

    ${itemsHtml}
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
