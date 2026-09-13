import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, crawlDetectedItem, taxRuleVersion } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await isAuthorizedAdmin(req);
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  try {
    const item = await db.query.crawlDetectedItem.findFirst({
      where: eq(crawlDetectedItem.id, id),
    });

    if (!item) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!item.legalSourceId) {
      return NextResponse.json(
        { error: 'Văn bản chưa được xác nhận tạo căn cứ pháp lý (legal_source).' },
        { status: 400 }
      );
    }

    // Parse body params
    const contentType = req.headers.get('content-type') || '';
    let categoryIdRaw = '';
    let ruleValueRaw = '';
    let effectiveFrom = '';
    let effectiveTo = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      categoryIdRaw = body.categoryId?.toString() || '';
      ruleValueRaw =
        typeof body.ruleValue === 'object'
          ? JSON.stringify(body.ruleValue)
          : body.ruleValue?.toString() || '';
      effectiveFrom = body.effectiveFrom?.toString() || '';
      effectiveTo = body.effectiveTo?.toString() || '';
    } else {
      const formData = await req.formData();
      categoryIdRaw = formData.get('categoryId')?.toString() || '';
      ruleValueRaw = formData.get('ruleValue')?.toString() || '';
      effectiveFrom = formData.get('effectiveFrom')?.toString() || '';
      effectiveTo = formData.get('effectiveTo')?.toString() || '';
    }

    const categoryId = parseInt(categoryIdRaw, 10);
    if (isNaN(categoryId) || !ruleValueRaw || !effectiveFrom) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ categoryId, ruleValue và effectiveFrom.' },
        { status: 400 }
      );
    }

    // Server-side JSON validation
    let parsedRuleValue: any;
    try {
      parsedRuleValue = JSON.parse(ruleValueRaw);
    } catch (parseErr: any) {
      return NextResponse.json(
        {
          error: `ruleValue phải là chuỗi JSON hợp lệ. Lỗi parse: ${parseErr.message}`,
        },
        { status: 400 }
      );
    }

    // Insert tax_rule_version với status mặc định 'draft'
    const [insertedRule] = await db
      .insert(taxRuleVersion)
      .values({
        categoryId,
        legalSourceId: item.legalSourceId,
        ruleValue: parsedRuleValue,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        status: 'draft',
      })
      .returning();

    const acceptHeader = req.headers.get('accept') || '';

    if (contentType.includes('application/json') || acceptHeader.includes('application/json')) {
      return NextResponse.json(
        {
          success: true,
          message: 'Đã thêm quy tắc thuế mới thành công (status: draft)',
          taxRuleVersionId: insertedRule.id,
        },
        { status: 200 }
      );
    }

    return NextResponse.redirect(getAdminRedirectUrl(req, `/review/${id}`), 303);
  } catch (err: any) {
    console.error('💥 Error adding tax rule version:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error adding tax rule' },
      { status: 500 }
    );
  }
}
