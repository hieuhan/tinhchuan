import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, crawlDetectedItem, legalSource } from '@tinhchuan/database';
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

    // Parse params from JSON or Form Data
    const contentType = req.headers.get('content-type') || '';
    let documentNumber = '';
    let documentType = '';
    let title = '';
    let issuingBody = '';
    let issuedDate = '';
    let effectiveDate = '';
    let sourceUrl = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      documentNumber = body.documentNumber || '';
      documentType = body.documentType || '';
      title = body.title || '';
      issuingBody = body.issuingBody || '';
      issuedDate = body.issuedDate || '';
      effectiveDate = body.effectiveDate || '';
      sourceUrl = body.sourceUrl || '';
    } else {
      const formData = await req.formData();
      documentNumber = formData.get('documentNumber')?.toString() || '';
      documentType = formData.get('documentType')?.toString() || '';
      title = formData.get('title')?.toString() || '';
      issuingBody = formData.get('issuingBody')?.toString() || '';
      issuedDate = formData.get('issuedDate')?.toString() || '';
      effectiveDate = formData.get('effectiveDate')?.toString() || '';
      sourceUrl = formData.get('sourceUrl')?.toString() || '';
    }

    // Validate required fields
    if (
      !documentNumber ||
      !documentType ||
      !title ||
      !issuingBody ||
      !issuedDate ||
      !effectiveDate ||
      !sourceUrl
    ) {
      return NextResponse.json(
        { error: 'Ngày có hiệu lực là bắt buộc, vui lòng kiểm tra văn bản gốc để xác định đúng ngày.' },
        { status: 400 }
      );
    }

    // RÀNG BUỘC NGÀY: effectiveDate >= issuedDate (validate phía server)
    const issuedD = new Date(issuedDate);
    const effectiveD = new Date(effectiveDate);

    if (isNaN(issuedD.getTime()) || isNaN(effectiveD.getTime())) {
      return NextResponse.json(
        { error: 'Định dạng ngày (issuedDate hoặc effectiveDate) không hợp lệ.' },
        { status: 400 }
      );
    }

    if (effectiveD < issuedD) {
      return NextResponse.json(
        {
          error: `Ngày có hiệu lực (${effectiveDate}) không được nhỏ hơn ngày ban hành (${issuedDate}).`,
        },
        { status: 400 }
      );
    }

    // 1. INSERT legal_source
    const [insertedDoc] = await db
      .insert(legalSource)
      .values({
        documentNumber: documentNumber.trim(),
        documentType: documentType.trim(),
        title: title.trim(),
        issuingBody: issuingBody.trim(),
        issuedDate,
        effectiveDate: effectiveDate.trim(),
        sourceUrl: sourceUrl.trim(),
        sourceFileUrl: item.sourceFileUrl,
      })
      .returning();

    // 2. UPDATE crawl_detected_item SET status = 'confirmed', legalSourceId = insertedDoc.id
    await db
      .update(crawlDetectedItem)
      .set({
        status: 'confirmed',
        legalSourceId: insertedDoc.id,
        updatedAt: new Date(),
      })
      .where(eq(crawlDetectedItem.id, id));

    const acceptHeader = req.headers.get('accept') || '';

    if (contentType.includes('application/json') || acceptHeader.includes('application/json')) {
      return NextResponse.json(
        {
          success: true,
          message: 'Xác nhận và tạo căn cứ pháp lý thành công',
          legalSourceId: insertedDoc.id,
          itemStatus: 'confirmed',
        },
        { status: 200 }
      );
    }

    return NextResponse.redirect(getAdminRedirectUrl(req, `/review/${id}`), 303);
  } catch (err: any) {
    console.error('💥 Error confirming document:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error confirming document' },
      { status: 500 }
    );
  }
}
