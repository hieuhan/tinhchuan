import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import {
  db,
  crawlDetectedItem,
  legalSource,
  taxRuleCategory,
  taxRuleVersion,
  contentPage,
  contentPageTaxRule,
} from '@tinhchuan/database';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const item = await db.query.crawlDetectedItem.findFirst({
    where: eq(crawlDetectedItem.id, id),
  });

  if (!item) {
    if (wantsJson) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return new NextResponse('<h1>404 - Không tìm thấy văn bản</h1>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fetch associated legal_source if confirmed
  let createdLegalSource: any = null;
  let taxRules: any[] = [];

  if (item.legalSourceId) {
    createdLegalSource = await db.query.legalSource.findFirst({
      where: eq(legalSource.id, item.legalSourceId),
    });

    taxRules = await db.query.taxRuleVersion.findMany({
      where: eq(taxRuleVersion.legalSourceId, item.legalSourceId),
    });
  }

  // Fetch categories for tax rule form
  const categories = await db.query.taxRuleCategory.findMany();

  if (wantsJson) {
    return NextResponse.json(
      { item, legalSource: createdLegalSource, taxRules, categories },
      { status: 200 }
    );
  }

  // Deduce default metadata values: ưu tiên lấy từ item (metadata đã trích xuất), fallback sang deduce từ title
  const defaultDocNo = item.documentNumber || (item.title.match(/(\d+[\/\w\-]+)/)?.[1] ?? '');

  let defaultType = item.documentType || 'Nghị định';
  if (!item.documentType) {
    if (item.title.toLowerCase().includes('nghị quyết') || item.title.includes('/QH')) {
      defaultType = 'Nghị quyết';
    } else if (item.title.toLowerCase().includes('thông tư') || item.title.includes('/TT-')) {
      defaultType = 'Thông tư';
    } else if (item.title.toLowerCase().includes('luật')) {
      defaultType = 'Luật';
    }
  }

  let defaultIssuingBody = item.issuingBody || 'Chính phủ';
  if (!item.issuingBody) {
    if (item.title.toLowerCase().includes('nghị quyết') || item.title.includes('/QH')) {
      defaultIssuingBody = 'Quốc hội';
    } else if (item.title.toLowerCase().includes('thông tư') || item.title.includes('/TT-')) {
      defaultIssuingBody = item.title.includes('BTC') ? 'Bộ Tài chính' : 'Ngân hàng Nhà nước';
    } else if (item.title.toLowerCase().includes('luật')) {
      defaultIssuingBody = 'Quốc hội';
    }
  }

  const defaultIssuedDate = item.issuedDate || '';
  const defaultEffectiveDate = item.effectiveDate || '';

  // Render Action Block A or B
  let actionBlockHtml = '';

  if (item.status === 'pending_review') {
    actionBlockHtml = `
      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
        <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Hành động duyệt (Pending Review)</span>
          <span class="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">Chờ duyệt</span>
        </h3>

        <div class="flex items-center gap-4 mb-6">
          <form method="POST" action="/review/${item.id}/reject" onsubmit="return confirm('Bạn có chắc chắn muốn TỪ CHỐI văn bản này?');">
            <button type="submit" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors">
              ❌ Từ chối
            </button>
          </form>
        </div>

        <h4 class="text-md font-bold text-slate-800 mb-3">Tạo căn cứ pháp lý (legal_source) mới:</h4>
        <form method="POST" action="/review/${item.id}/confirm" class="space-y-4 max-w-2xl bg-slate-50 p-4 rounded-md border border-slate-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Số ký hiệu (documentNumber) *</label>
              <input name="documentNumber" type="text" required value="${escapeHtml(defaultDocNo)}" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" placeholder="vd: 43/2026/QH16" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Loại văn bản (documentType) *</label>
              <select name="documentType" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                <option value="Nghị định" ${defaultType === 'Nghị định' ? 'selected' : ''}>Nghị định</option>
                <option value="Thông tư" ${defaultType === 'Thông tư' ? 'selected' : ''}>Thông tư</option>
                <option value="Nghị quyết" ${defaultType === 'Nghị quyết' ? 'selected' : ''}>Nghị quyết</option>
                <option value="Luật" ${defaultType === 'Luật' ? 'selected' : ''}>Luật</option>
                <option value="Văn bản hợp nhất" ${defaultType === 'Văn bản hợp nhất' ? 'selected' : ''}>Văn bản hợp nhất</option>
                ${!['Nghị định', 'Thông tư', 'Nghị quyết', 'Luật', 'Văn bản hợp nhất'].includes(defaultType) ? `<option value="${escapeHtml(defaultType)}" selected>${escapeHtml(defaultType)}</option>` : ''}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tên/Trích yếu văn bản (title) *</label>
            <input name="title" type="text" required value="${escapeHtml(item.title)}" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Cơ quan ban hành *</label>
              <input name="issuingBody" type="text" required value="${escapeHtml(defaultIssuingBody)}" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Ngày ban hành (issuedDate) *</label>
              <input name="issuedDate" type="date" required value="${escapeHtml(defaultIssuedDate)}" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Ngày có hiệu lực (effectiveDate) *</label>
              <input name="effectiveDate" type="date" required value="${escapeHtml(defaultEffectiveDate)}" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
              ${(item.documentType === 'Văn bản hợp nhất' || defaultType === 'Văn bản hợp nhất') && !item.effectiveDate ? `
              <p class="text-xs text-amber-600 mt-1">⚠️ Văn bản hợp nhất thường không có ngày hiệu lực riêng - cần kiểm tra văn bản gốc được hợp nhất để xác định đúng ngày, không nên mặc định dùng ngày ban hành.</p>` : ''}
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nguồn URL (sourceUrl) *</label>
            <input name="sourceUrl" type="url" required value="${escapeHtml(item.detectUrl)}" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
          </div>

          <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-sm transition-colors">
            ✅ Xác nhận & Tạo căn cứ pháp lý
          </button>
        </form>
      </div>`;
  } else if (item.status === 'confirmed') {
    const legalSourceHtml = createdLegalSource
      ? `<div class="bg-emerald-50 border border-emerald-200 p-4 rounded-md mb-6">
          <h4 class="text-sm font-bold text-emerald-900 mb-2">Căn cứ pháp lý đã tạo (ID: ${createdLegalSource.id}):</h4>
          <ul class="text-xs text-emerald-800 space-y-1 font-mono">
            <li><strong>Số ký hiệu:</strong> ${escapeHtml(createdLegalSource.documentNumber)}</li>
            <li><strong>Loại văn bản:</strong> ${escapeHtml(createdLegalSource.documentType)}</li>
            <li><strong>Tên văn bản:</strong> ${escapeHtml(createdLegalSource.title)}</li>
            <li><strong>Cơ quan ban hành:</strong> ${escapeHtml(createdLegalSource.issuingBody)}</li>
            <li><strong>Ngày ban hành:</strong> ${createdLegalSource.issuedDate} | <strong>Hiệu lực:</strong> ${createdLegalSource.effectiveDate}</li>
          </ul>
        </div>`
      : `<p class="text-sm text-red-600">Đã confirm nhưng chưa có legalSourceId.</p>`;

    const taxRulesListHtml = taxRules.length === 0
      ? `<p class="text-xs text-slate-500 italic mb-4">Chưa có quy tắc thuế nào được tạo cho văn bản này.</p>`
      : taxRules.map((tr) => `
          <div class="bg-slate-50 border border-slate-200 p-3 rounded mb-3 text-xs">
            <div class="flex items-center justify-between font-semibold text-slate-700 mb-1">
              <span>Category ID: ${tr.categoryId} | ID: ${tr.id}</span>
              <span class="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono">${tr.status}</span>
            </div>
            <p class="text-slate-600"><strong>Hiệu lực:</strong> ${tr.effectiveFrom} ${tr.effectiveTo ? `đến ${tr.effectiveTo}` : '(Vô thời hạn)'}</p>
            <pre class="mt-2 bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto text-[11px] font-mono">${escapeHtml(JSON.stringify(tr.ruleValue, null, 2))}</pre>
          </div>
        `).join('');

    const categoryOptionsHtml = categories
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} (${c.code})</option>`)
      .join('');

    actionBlockHtml = `
      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
        <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Quản lý Quy tắc thuế (Confirmed)</span>
          <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">Đã xác nhận</span>
        </h3>

        ${legalSourceHtml}

        <div class="mb-6">
          <h4 class="text-sm font-bold text-slate-800 mb-3">Danh sách quy tắc thuế hiện có (${taxRules.length}):</h4>
          ${taxRulesListHtml}
        </div>

        <h4 class="text-sm font-bold text-slate-800 mb-3">Thêm quy tắc thuế mới (tax_rule_version):</h4>
        <form method="POST" action="/review/${item.id}/add-tax-rule" class="space-y-4 max-w-2xl bg-slate-50 p-4 rounded-md border border-slate-200">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Danh mục quy tắc thuế (categoryId) *</label>
            <select name="categoryId" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white">
              ${categoryOptionsHtml}
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Quy tắc thuế JSON (ruleValue) *</label>
            <textarea name="ruleValue" rows="5" required class="w-full p-2 border border-slate-300 rounded text-xs font-mono bg-white" placeholder='{"threshold": 10000000000, "pitDiscount": 0.3}'></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hiệu lực từ (effectiveFrom) *</label>
              <input name="effectiveFrom" type="date" required class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Hiệu lực đến (effectiveTo - optional)</label>
              <input name="effectiveTo" type="date" class="w-full p-2 border border-slate-300 rounded text-sm bg-white" />
            </div>
          </div>

          <button type="submit" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm transition-colors">
            ➕ Thêm quy tắc thuế (Status: draft)
          </button>
        </form>
      </div>`;
  } else {
    let contentGenBlock = '';
    if ((item.status as string) === 'confirmed' && item.legalSourceId) {
      const linkedRules = await db.query.taxRuleVersion.findMany({
        where: eq(taxRuleVersion.legalSourceId, item.legalSourceId),
      });
      const ruleIds = linkedRules.map((r: any) => r.id);
      let existingPage = null;
      if (ruleIds.length > 0) {
        const linkedRule = await db.query.contentPageTaxRule.findFirst({
          where: inArray(contentPageTaxRule.taxRuleVersionId, ruleIds),
        });
        if (linkedRule) {
          existingPage = await db.query.contentPage.findFirst({
            where: eq(contentPage.id, linkedRule.contentPageId),
          });
        }
      }

      if (existingPage) {
        contentGenBlock = `
          <div class="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
            <div>
              <span class="text-sm font-semibold text-purple-900">Bài viết đã được tạo:</span>
              <span class="text-sm font-bold text-purple-700 ml-1">${escapeHtml(existingPage.title)}</span>
              <span class="ml-2 px-2 py-0.5 text-xs rounded bg-purple-200 text-purple-800 font-mono">${existingPage.status}</span>
            </div>
            <a href="/content/${existingPage.id}" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded shadow-sm">
              ✏️ Mở trang biên tập bài viết
            </a>
          </div>`;
      } else {
        contentGenBlock = `
          <div class="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
            <div>
              <h4 class="text-sm font-bold text-purple-900">Sinh nội dung bài viết tự động (AI Stage 4)</h4>
              <p class="text-xs text-purple-700">Tạo bài viết kiến thức + FAQ từ văn bản và quy tắc thuế đã duyệt bằng Claude Sonnet 5.</p>
            </div>
            <form method="POST" action="/review/${item.id}/generate-content">
              <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded shadow-sm flex items-center gap-2">
                ✨ Sinh nội dung bài viết
              </button>
            </form>
          </div>`;
      }
    }

    actionBlockHtml = `
      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
        <h3 class="text-lg font-bold text-slate-800 mb-2">Trạng thái: <span class="uppercase text-emerald-600">${item.status}</span></h3>
        <p class="text-sm text-slate-600">Văn bản này đã được xác nhận (status: ${item.status}).</p>
        ${contentGenBlock}
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chi tiết văn bản - Admin TinhChuan.vn</title>
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
        </nav>
      </div>
      <form method="POST" action="/logout">
        <button type="submit" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white">Đăng xuất</button>
      </form>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4">
    <div class="mb-4">
      <a href="/review" class="text-sm text-blue-600 hover:underline">← Quay lại danh sách chờ duyệt</a>
    </div>

    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-3">${escapeHtml(item.title)}</h2>
      <div class="flex flex-wrap gap-4 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
        <div><strong>Nguồn phát hiện:</strong> <a href="${escapeHtml(item.detectUrl)}" target="_blank" class="text-blue-600 hover:underline">${escapeHtml(item.detectUrl)}</a></div>
        <div><strong>Status:</strong> <span class="px-2 py-0.5 bg-slate-100 font-mono text-slate-800 rounded">${item.status}</span></div>
        <div><strong>Phân loại AI:</strong> <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded">${item.aiClassification}</span></div>
      </div>

      <div class="mb-4">
        <h3 class="text-sm font-bold text-slate-700 mb-1">Lý do phân loại AI:</h3>
        <p class="text-sm bg-amber-50 text-amber-900 p-3 rounded border border-amber-200">${escapeHtml(item.aiClassificationReason || 'Không có')}</p>
      </div>

      ${item.adminNotes ? `
      <div class="mb-4">
        <h3 class="text-sm font-bold text-slate-700 mb-1">Ghi chú Admin:</h3>
        <p class="text-sm bg-blue-50 text-blue-900 p-3 rounded border border-blue-200">${escapeHtml(item.adminNotes)}</p>
      </div>` : ''}

      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-bold text-slate-700">Nội dung trích xuất (${(item.extractedText || '').length} ký tự):</h3>
        ${item.sourceFileUrl ? `<a href="/files/${item.id}" target="_blank" class="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium">📥 Xem file gốc</a>` : ''}
      </div>

      <div class="max-h-96 overflow-y-auto bg-slate-900 text-slate-100 p-4 rounded-md font-mono text-xs leading-relaxed whitespace-pre-wrap">
        ${escapeHtml(item.extractedText || 'Chưa có nội dung trích xuất')}
      </div>
    </div>

    ${actionBlockHtml}
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
