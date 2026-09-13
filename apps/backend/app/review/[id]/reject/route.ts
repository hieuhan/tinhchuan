import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, crawlDetectedItem } from '@tinhchuan/database';
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

    await db
      .update(crawlDetectedItem)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(crawlDetectedItem.id, id));

    const acceptHeader = req.headers.get('accept') || '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json') || acceptHeader.includes('application/json')) {
      return NextResponse.json(
        { success: true, message: 'Đã từ chối văn bản', id },
        { status: 200 }
      );
    }

    return NextResponse.redirect(getAdminRedirectUrl(req, '/review'), 303);
  } catch (err: any) {
    console.error('💥 Error rejecting document:', err);
    return NextResponse.json(
      { error: 'Internal Server Error rejecting document' },
      { status: 500 }
    );
  }
}
