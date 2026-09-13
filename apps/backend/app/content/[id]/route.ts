import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, contentPage, contentPageTaxRule, taxRuleVersion, legalSource } from '@tinhchuan/database';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await isAuthorizedAdmin(req);
  if (!isAuthorized) {
    return NextResponse.redirect(getAdminRedirectUrl(req, '/login'));
  }

  const { id } = await params;
  const pageId = parseInt(id, 10);
  if (isNaN(pageId)) {
    return new NextResponse('ID bài viết không hợp lệ', { status: 400 });
  }

  const page = await db.query.contentPage.findFirst({
    where: eq(contentPage.id, pageId),
  });

  if (!page) {
    return new NextResponse('Không tìm thấy bài viết', { status: 404 });
  }

  // Find linked tax_rule_versions and legal_source
  const pageRules = await db.query.contentPageTaxRule.findMany({
    where: eq(contentPageTaxRule.contentPageId, pageId),
  });

  const ruleIds = pageRules.map((pr: any) => pr.taxRuleVersionId);

  let linkedRules: any[] = [];
  let linkedLegalSource: any = null;

  if (ruleIds.length > 0) {
    linkedRules = await db.query.taxRuleVersion.findMany({
      where: inArray(taxRuleVersion.id, ruleIds),
    });

    if (linkedRules.length > 0 && linkedRules[0].legalSourceId) {
      linkedLegalSource = await db.query.legalSource.findFirst({
        where: eq(legalSource.id, linkedRules[0].legalSourceId),
      });
    }
  }

  const faqItemsList = (page.faqItems as Array<{ question: string; answer: string }>) || [];

  const faqFieldsHtml = faqItemsList.map((item, idx) => `
    <div class="faq-item p-4 bg-slate-50 border border-slate-200 rounded-md mb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-500 uppercase">Câu hỏi #${idx + 1}</span>
        <button type="button" onclick="this.closest('.faq-item').remove()" class="text-xs text-red-600 hover:underline">❌ Xóa câu hỏi này</button>
      </div>
      <div class="mb-2">
        <label class="block text-xs font-semibold text-slate-700 mb-1">Câu hỏi (Question)</label>
        <input type="text" name="faqQuestions[]" value="${escapeHtml(item.question)}" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Trả lời (Answer)</label>
        <textarea name="faqAnswers[]" rows="2" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white">${escapeHtml(item.answer)}</textarea>
      </div>
    </div>
  `).join('');

  const rulesListHtml = linkedRules.map((r) => `
    <li class="p-3 bg-slate-50 border border-slate-200 rounded text-xs mb-2">
      <div><strong>ID Quy tắc:</strong> ${r.id} | <strong>Category ID:</strong> ${r.categoryId}</div>
      <div><strong>Trạng thái:</strong> ${r.status} | <strong>Hiệu lực:</strong> ${r.effectiveFrom} → ${r.effectiveTo || 'Vô hạn'}</div>
      <pre class="mt-1 p-2 bg-slate-900 text-slate-100 rounded text-[11px] font-mono">${JSON.stringify(r.ruleValue, null, 2)}</pre>
    </li>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Biên tập Bài viết #${page.id} - Admin TinhChuan.vn</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
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
    <div class="mb-4">
      <a href="/content" class="text-sm text-blue-600 hover:underline">← Quay lại danh sách bài viết</a>
    </div>

    <!-- Header info -->
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài viết ID #${page.id}</span>
          <h2 class="text-2xl font-bold text-slate-800">${escapeHtml(page.title)}</h2>
        </div>
        <div>
          ${page.status === 'published' 
            ? '<span class="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-sm">🟢 Đã xuất bản (published)</span>'
            : '<span class="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded text-sm">🟠 Bản nháp (draft)</span>'}
        </div>
      </div>

      <!-- Legal Source origin -->
      <div class="bg-slate-50 p-4 rounded border border-slate-200 text-xs text-slate-700 mb-4">
        <h3 class="font-bold text-slate-900 mb-2">📜 Nguồn gốc dữ liệu pháp lý (Legal Source & Rules):</h3>
        ${linkedLegalSource ? `
          <div class="mb-2">
            <strong>Văn bản gốc:</strong> ${escapeHtml(linkedLegalSource.documentNumber)} - ${escapeHtml(linkedLegalSource.title)}
            <br />
            <strong>Ban hành:</strong> ${linkedLegalSource.issuedDate} | <strong>Cơ quan:</strong> ${escapeHtml(linkedLegalSource.issuingBody)}
            ${linkedLegalSource.sourceUrl ? ` | <a href="${escapeHtml(linkedLegalSource.sourceUrl)}" target="_blank" class="text-blue-600 underline">Xem văn bản gốc 🔗</a>` : ''}
          </div>
        ` : '<div>Chưa có thông tin văn bản nguồn.</div>'}

        <h4 class="font-bold text-slate-800 mt-3 mb-1">Các quy tắc thuế liên kết (${linkedRules.length}):</h4>
        <ul class="list-none pl-0">
          ${rulesListHtml || '<li class="text-slate-500">Chưa có quy tắc nào.</li>'}
        </ul>
      </div>

      <!-- Edit Form -->
      <form id="editForm" method="POST" action="/content/${page.id}/save">
        <div class="mb-4">
          <label class="block text-sm font-bold text-slate-700 mb-1">Tiêu đề bài viết (Title) *</label>
          <input type="text" name="title" value="${escapeHtml(page.title)}" required class="w-full p-2.5 border border-slate-300 rounded-md text-base font-semibold text-slate-900 bg-white" />
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Slug URL *</label>
            <input type="text" name="slug" value="${escapeHtml(page.slug)}" required class="w-full p-2 border border-slate-300 rounded text-sm font-mono bg-white" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Meta Description (Max 160 ký tự)</label>
            <input type="text" name="metaDescription" value="${escapeHtml(page.metaDescription || '')}" maxLength="160" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-bold text-slate-700 mb-1">Nội dung bài viết (Markdown Content) *</label>
          <textarea name="content" rows="18" required class="w-full p-4 border border-slate-300 rounded-md text-sm font-mono bg-slate-900 text-slate-100 leading-relaxed">${escapeHtml(page.content)}</textarea>
        </div>

        <!-- FAQ Items section -->
        <div class="mb-6 border-t border-slate-200 pt-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-bold text-slate-800">Câu hỏi thường gặp (FAQ Items)</h3>
            <button type="button" id="addFaqBtn" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold border border-slate-300">
              ➕ Thêm câu hỏi FAQ
            </button>
          </div>
          <div id="faqContainer">
            ${faqFieldsHtml || '<p id="emptyFaqMsg" class="text-xs text-slate-500 italic">Chưa có câu hỏi FAQ nào.</p>'}
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex items-center justify-between border-t border-slate-200 pt-6">
          <button type="submit" class="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-sm rounded-md shadow-sm">
            💾 Lưu nháp (Save Draft)
          </button>
          <button type="submit" formAction="/content/${page.id}/publish" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-md shadow-sm flex items-center gap-2">
            🚀 Xuất bản (Publish)
          </button>
        </div>
      </form>
    </div>
  </main>

  <script>
    document.getElementById('addFaqBtn').addEventListener('click', function() {
      const container = document.getElementById('faqContainer');
      const emptyMsg = document.getElementById('emptyFaqMsg');
      if (emptyMsg) emptyMsg.remove();
      
      const count = container.querySelectorAll('.faq-item').length + 1;
      const div = document.createElement('div');
      div.className = 'faq-item p-4 bg-slate-50 border border-slate-200 rounded-md mb-3';
      div.innerHTML = \`
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 uppercase">Câu hỏi #\${count}</span>
          <button type="button" onclick="this.closest('.faq-item').remove()" class="text-xs text-red-600 hover:underline">❌ Xóa câu hỏi này</button>
        </div>
        <div class="mb-2">
          <label class="block text-xs font-semibold text-slate-700 mb-1">Câu hỏi (Question)</label>
          <input type="text" name="faqQuestions[]" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Trả lời (Answer)</label>
          <textarea name="faqAnswers[]" rows="2" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white"></textarea>
        </div>
      \`;
      container.appendChild(div);
    });
  </script>
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
