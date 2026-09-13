import { db } from '../packages/database/src/client';
import { contentPage } from '../packages/database/src/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const pages = await db.select().from(contentPage);
  console.log(`Found ${pages.length} pages in content_page table:`);
  for (const page of pages) {
    console.log(`- ID: ${page.id} | Slug: ${page.slug} | Type: ${page.pageType} | Status: ${page.status}`);
  }

  const sample = pages.find(p => p.slug.includes('nghi-dinh-141') || p.slug.includes('cach-tinh-thue')) || pages[0];
  if (sample) {
    console.log('\n================ SAMPLE ARTICLE DETAILS ================');
    console.log('Title:', sample.title);
    console.log('Slug:', sample.slug);
    console.log('Meta Description:', sample.metaDescription);
    console.log('\n--- CONTENT (MARKDOWN) ---');
    console.log(sample.content);
    console.log('\n--- FAQ ITEMS (JSON) ---');
    console.log(JSON.stringify(sample.faqItems, null, 2));
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
