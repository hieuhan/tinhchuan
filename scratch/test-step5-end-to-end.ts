import { db, crawlDetectedItem, legalSource, taxRuleVersion, contentPage, contentPageTaxRule, crawlWatchSource } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';
import { generateContentPage } from '../apps/backend/lib/generate-content';

async function testStep5() {
  console.log('🚀 Bắt đầu Step 5: Test end-to-end AI Content Generation với Nghị quyết 43/2026/QH16...\n');

  // 1. Find legal_source for NQ 43/2026
  const docs = await db.select().from(legalSource);
  console.log('Existing legal_sources in DB:');
  docs.forEach(d => console.log(`- ID: ${d.id} | Number: ${d.documentNumber} | Title: ${d.title}`));

  let nq43Doc = docs.find(d => d.documentNumber?.includes('43/2026') || d.title?.includes('43/2026'));
  if (!nq43Doc && docs.length >= 2) {
    nq43Doc = docs.find(d => d.id === 2);
  }

  if (!nq43Doc) {
    console.log('⚠️ Không tìm thấy legal_source NQ 43, đang tạo record giả lập cho NQ 43/2026/QH16...');
    const [inserted] = await db.insert(legalSource).values({
      documentNumber: '43/2026/QH16',
      documentType: 'Nghị quyết',
      title: 'Nghị quyết số 43/2026/QH16 về chính sách giảm 30% thuế TNCN và TNDN cho hộ kinh doanh nhỏ và vừa năm 2026-2027',
      issuingBody: 'Quốc hội',
      issuedDate: '2026-06-15',
      effectiveDate: '2026-07-01',
      sourceUrl: 'https://congbao.chinhphu.vn/van-ban-43-2026-qh16',
    }).returning();
    nq43Doc = inserted;
  }

  console.log(`\n📌 Sử dụng Legal Source ID: ${nq43Doc.id} (${nq43Doc.documentNumber})`);

  // Check tax_rule_version for this legalSource
  let rules = await db.select().from(taxRuleVersion).where(eq(taxRuleVersion.legalSourceId, nq43Doc.id));
  if (rules.length === 0) {
    console.log('⚠️ Chưa có tax_rule_version cho legal_source này, đang tạo record tax_rule_version test...');
    const [insRule] = await db.insert(taxRuleVersion).values({
      categoryId: 1,
      legalSourceId: nq43Doc.id,
      ruleValue: {
        pitDiscount: 0.3,
        citDiscount: 0.3,
        applicableYears: ['2026', '2027'],
        maxRevenueThreshold: 10000000000,
        description: 'Giảm 30% thuế TNCN và TNDN cho hộ kinh doanh có doanh thu đến 10 tỷ đồng/năm trong hai năm 2026 và 2027',
      },
      effectiveFrom: '2026-07-01',
      status: 'approved',
    }).returning();
    rules = [insRule];
  }

  console.log(`📌 Tax Rule Versions linked (${rules.length}):`);
  rules.forEach(r => console.log(`  - ID: ${r.id} | RuleValue: ${JSON.stringify(r.ruleValue)}`));

  // Check crawl_detected_item
  let item = await db.query.crawlDetectedItem.findFirst({
    where: eq(crawlDetectedItem.legalSourceId, nq43Doc.id),
  });

  if (!item) {
    console.log('⚠️ Chưa có crawl_detected_item cho legal_source này, đang tạo crawl_detected_item test...');
    const watchSource = await db.query.crawlWatchSource.findFirst();
    const [insItem] = await db.insert(crawlDetectedItem).values({
      watchSourceId: watchSource?.id || '00000000-0000-0000-0000-000000000000',
      title: nq43Doc.title,
      detectUrl: `https://congbao.chinhphu.vn/test-nq43-${Date.now()}`,
      status: 'confirmed',
      legalSourceId: nq43Doc.id,
      extractedText: `QUỐC HỘI NƯỚC CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Nghị quyết số 43/2026/QH16 ngày 15/06/2026.
Quy định giảm 30% số thuế thu nhập cá nhân (TNCN) và thuế thu nhập doanh nghiệp (TNDN) phải nộp cho các hộ kinh doanh, cá nhân kinh doanh có doanh thu trong năm không quá 10 tỷ đồng (10.000.000.000 VNĐ).
Thời gian áp dụng chính sách giảm thuế: từ ngày 01/01/2026 đến hết ngày 31/12/2027 (gồm năm 2026 và năm 2027).
Quy định này không áp dụng đối với cá nhân có doanh thu trên 10 tỷ đồng/năm. Các trường hợp đã tạm nộp đủ 100% thuế trước khi Nghị quyết ban hành sẽ được kê khai giảm trừ hoặc hoàn lại ở kỳ quyết toán cuối năm.`,
      documentNumber: nq43Doc.documentNumber,
      documentType: nq43Doc.documentType,
      issuingBody: nq43Doc.issuingBody,
      issuedDate: nq43Doc.issuedDate,
      effectiveDate: nq43Doc.effectiveDate,
    }).returning();
    item = insItem;
  }

  console.log(`\n📌 Item ID: ${item.id} | Status: ${item.status}`);

  // 2. Call generateContentPage
  console.log('\n🤖 Đang gọi Claude Sonnet 5 qua OpenRouter để sinh bài viết...');
  const result = await generateContentPage(nq43Doc.id);

  console.log('\n===============================================================');
  console.log('NGUYÊN VĂN BÀI VIẾT DO CLAUDE SONNET 5 SINH RA');
  console.log('===============================================================');
  console.log('TITLE:', result.title);
  console.log('SLUG:', result.slug);
  console.log('META DESCRIPTION:', result.metaDescription);
  console.log('\n--- CONTENT (MARKDOWN) ---');
  console.log(result.content);
  console.log('\n--- FAQ ITEMS ---');
  console.log(JSON.stringify(result.faqItems, null, 2));
  console.log('===============================================================\n');

  // 3. Save into content_page DB
  const [page] = await db.insert(contentPage).values({
    title: result.title,
    slug: result.slug,
    metaDescription: result.metaDescription,
    content: result.content,
    faqItems: result.faqItems,
    pageType: 'knowledge',
    status: 'draft',
    publishedAt: null,
  }).returning();

  console.log(`✅ Đã lưu vào content_page (ID: ${page.id}, status: ${page.status})`);

  for (const r of rules) {
    await db.insert(contentPageTaxRule).values({
      contentPageId: page.id,
      taxRuleVersionId: r.id,
    });
  }

  // 4. Test Edit / Save Draft
  const updatedTitle = page.title + ' [Đã duyệt nội dung nháp]';
  await db.update(contentPage).set({
    title: updatedTitle,
  }).where(eq(contentPage.id, page.id));

  const pageAfterEdit = await db.query.contentPage.findFirst({ where: eq(contentPage.id, page.id) });
  console.log(`✅ Test sửa & lưu nháp thành công! Title sau sửa: "${pageAfterEdit?.title}"`);

  // 5. Test Publish
  await db.update(contentPage).set({
    status: 'published',
    publishedAt: new Date(),
  }).where(eq(contentPage.id, page.id));

  const pageAfterPublish = await db.query.contentPage.findFirst({ where: eq(contentPage.id, page.id) });
  console.log(`✅ Test xuất bản (Publish) thành công! Status: "${pageAfterPublish?.status}", PublishedAt: ${pageAfterPublish?.publishedAt?.toISOString()}`);
}

testStep5().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test Step 5 thất bại:', err);
  process.exit(1);
});
