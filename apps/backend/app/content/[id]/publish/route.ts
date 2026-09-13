import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import { db, contentPage } from '@tinhchuan/database';
import { eq, and, ne } from 'drizzle-orm';

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
  const title = (formData.get('title') as string || '').trim() || page.title;
  const slug = (formData.get('slug') as string || '').trim() || page.slug;
  const metaDescription = (formData.get('metaDescription') as string || '').trim() || page.metaDescription || '';
  const content = (formData.get('content') as string || '').trim() || page.content;

  const questions = formData.getAll('faqQuestions[]') as string[];
  const answers = formData.getAll('faqAnswers[]') as string[];

  let faqItems: Array<{ question: string; answer: string }> = (page.faqItems as any) || [];
  if (questions.length > 0) {
    const parsedFaqs: Array<{ question: string; answer: string }> = [];
    for (let i = 0; i < questions.length; i++) {
      const q = (questions[i] || '').trim();
      const a = (answers[i] || '').trim();
      if (q && a) {
        parsedFaqs.push({ question: q, answer: a });
      }
    }
    faqItems = parsedFaqs;
  }

  if (!title || !slug || !content) {
    return new NextResponse('Tiêu đề, slug và nội dung là bắt buộc', { status: 400 });
  }

  // Validate slug uniqueness among published content_pages
  const existingPublished = await db.query.contentPage.findFirst({
    where: and(
      eq(contentPage.slug, slug),
      eq(contentPage.status, 'published'),
      ne(contentPage.id, pageId)
    ),
  });

  if (existingPublished) {
    return new NextResponse(
      `Slug "${slug}" đã được sử dụng bởi một bài viết khác đã xuất bản (ID #${existingPublished.id}). Vui lòng chọn slug khác.`,
      { status: 400 }
    );
  }

  // Update status to published
  await db
    .update(contentPage)
    .set({
      title,
      slug,
      metaDescription,
      content,
      faqItems,
      status: 'published',
      publishedAt: new Date(),
    })
    .where(eq(contentPage.id, pageId));

  return NextResponse.redirect(getAdminRedirectUrl(req, `/content/${pageId}`), 303);
}
