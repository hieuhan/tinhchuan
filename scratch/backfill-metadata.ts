import path from 'node:path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(process.cwd(), '.env') });

if (process.env.DATABASE_URL?.includes('@postgres:')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@postgres:', '@127.0.0.1:');
}

import { db, crawlDetectedItem } from '../packages/database/src';
import { eq, inArray } from 'drizzle-orm';
import { cdnAgent, metadataParsers } from '../apps/backend/jobs/extract-detected-item-content';

async function backfill() {
  console.log('🚀 Bắt đầu backfill metadata cho các bản ghi hiện có...');
  
  const items = await db.query.crawlDetectedItem.findMany({
    where: inArray(crawlDetectedItem.id, [
      'b581d8cd-5e62-4d81-9de4-cfed821b8e88',
      '37276582-bce3-496a-a283-3db1e575c4a4',
      '22746910-fc8e-41d8-9770-a7c50e356388',
    ]),
    with: { watchSource: true },
  });

  for (const item of items) {
    console.log(`\n📌 Đang xử lý: ${item.title}`);
    console.log(`   URL: ${item.detectUrl}`);
    
    const parserKey = item.watchSource?.parserKey || (item.detectUrl.includes('congbao') ? 'congbao_chinhphu' : 'vanban_chinhphu');
    const isCdn = item.detectUrl.includes('chinhphu.vn');

    const res = await fetch(item.detectUrl, {
      ...(isCdn ? { dispatcher: cdnAgent } : {}),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    } as any);

    if (!res.ok) {
      console.error(`❌ Lỗi HTTP ${res.status} khi fetch ${item.detectUrl}`);
      continue;
    }

    const html = await res.text();
    const parser = metadataParsers[parserKey];
    if (!parser) {
      console.warn(`⚠️ Không tìm thấy metadata parser cho key: ${parserKey}`);
      continue;
    }

    const meta = parser(html);
    console.log(`   --> Metadata trích xuất được:`, meta);

    await db
      .update(crawlDetectedItem)
      .set({
        documentNumber: meta.documentNumber || null,
        documentType: meta.documentType || null,
        issuingBody: meta.issuingBody || null,
        issuedDate: meta.issuedDate || null,
        effectiveDate: meta.effectiveDate || null,
        updatedAt: new Date(),
      })
      .where(eq(crawlDetectedItem.id, item.id));

    console.log(`   ✅ Đã cập nhật DB thành công.`);
  }

  console.log('\n🎉 Hoàn tất backfill metadata.');
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Lỗi backfill:', err);
    process.exit(1);
  });
