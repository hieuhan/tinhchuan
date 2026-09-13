import { db, contentPage } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

async function revertStatus() {
  const slug = 'nghi-quyet-43-2026-qh16-giam-30-thue-tncn-tndn';
  const updated = await db.update(contentPage).set({
    status: 'draft',
    publishedAt: null,
  }).where(eq(contentPage.slug, slug)).returning();

  console.log(`✅ Đã revert status về 'draft' cho bài viết slug "${slug}":`);
  console.log(updated);
}

revertStatus().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
