import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, contentPage } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

export async function POST(
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
    return new NextResponse('ID không hợp lệ', { status: 400 });
  }

  const page = await db.query.contentPage.findFirst({
    where: eq(contentPage.id, pageId),
  });

  if (!page) {
    return new NextResponse('Không tìm thấy bài viết', { status: 404 });
  }

  const formData = await req.formData();
  const title = (formData.get('title') as string || '').trim();
  const slug = (formData.get('slug') as string || '').trim();
  const metaDescription = (formData.get('metaDescription') as string || '').trim();
  const content = (formData.get('content') as string || '').trim();

  const questions = formData.getAll('faqQuestions[]') as string[];
  const answers = formData.getAll('faqAnswers[]') as string[];

  const faqItems: Array<{ question: string; answer: string }> = [];
  for (let i = 0; i < questions.length; i++) {
    const q = (questions[i] || '').trim();
    const a = (answers[i] || '').trim();
    if (q && a) {
      faqItems.push({ question: q, answer: a });
    }
  }

  if (!title || !slug || !content) {
    return new NextResponse('Tiêu đề, slug và nội dung là bắt buộc', { status: 400 });
  }

  // Update draft
  await db
    .update(contentPage)
    .set({
      title,
      slug,
      metaDescription,
      content,
      faqItems,
    })
    .where(eq(contentPage.id, pageId));

  return NextResponse.redirect(getAdminRedirectUrl(req, `/content/${pageId}`), 303);
}
