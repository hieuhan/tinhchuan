import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, getAdminRedirectUrl } from '@/lib/auth';
import {
  db,
  crawlDetectedItem,
  taxRuleVersion,
  contentPage,
  contentPageTaxRule,
} from '@tinhchuan/database';
import { eq } from 'drizzle-orm';
import { generateContentPage } from '@/lib/generate-content';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await isAuthorizedAdmin(req);
  if (!isAuthorized) {
    return NextResponse.redirect(getAdminRedirectUrl(req, '/login'));
  }

  const { id } = await params;
  if (!id) {
    return new NextResponse('ID không hợp lệ', { status: 400 });
  }

  const item = await db.query.crawlDetectedItem.findFirst({
    where: eq(crawlDetectedItem.id, id),
  });

  if (!item || item.status !== 'confirmed' || !item.legalSourceId) {
    return new NextResponse('Văn bản chưa được xác nhận hoặc thiếu legalSourceId', { status: 400 });
  }

  const legalSourceId = item.legalSourceId;

  // Generate content using AI
  const generated = await generateContentPage(legalSourceId);

  // Insert into content_page
  const [newPage] = await db
    .insert(contentPage)
    .values({
      title: generated.title,
      slug: generated.slug,
      metaDescription: generated.metaDescription,
      content: generated.content,
      faqItems: generated.faqItems,
      pageType: 'knowledge',
      status: 'draft',
      publishedAt: null,
    })
    .returning();

  // Find all tax_rule_versions for this legalSourceId
  const rules = await db.query.taxRuleVersion.findMany({
    where: eq(taxRuleVersion.legalSourceId, legalSourceId),
  });

  // Link content_page to all tax_rule_versions
  for (const rule of rules) {
    await db.insert(contentPageTaxRule).values({
      contentPageId: newPage.id,
      taxRuleVersionId: rule.id,
    });
  }

  // Redirect to content detail page
  return NextResponse.redirect(getAdminRedirectUrl(req, `/content/${newPage.id}`), 303);
}
