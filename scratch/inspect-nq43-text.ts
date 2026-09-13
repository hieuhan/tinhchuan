import { db, crawlDetectedItem } from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

async function inspectText() {
  const item = await db.query.crawlDetectedItem.findFirst({
    where: eq(crawlDetectedItem.id, 'b581d8cd-5e62-4d81-9de4-cfed821b8e88'),
  });

  if (!item) {
    console.log('❌ Không tìm thấy item với ID b581d8cd-5e62-4d81-9de4-cfed821b8e88');
    return;
  }

  console.log('=== FULL EXTRACTED TEXT OF NQ 43/2026 ===');
  console.log(item.extractedText);
  console.log('=========================================\n');

  const text = item.extractedText || '';
  
  // 1. Search "chia"
  const chiaIndex = text.toLowerCase().indexOf('chia');
  if (chiaIndex !== -1) {
    const start = Math.max(0, chiaIndex - 50);
    const length = 600;
    console.log('🔍 Đoạn chứa từ "chia":');
    console.log(text.substring(start, start + length));
  } else {
    console.log('❌ KHÔNG TÌM THẤY từ "chia" trong extracted_text!');
  }

  console.log('');

  // 2. Search "ưu đãi"
  const uudaiIndex = text.toLowerCase().indexOf('ưu đãi');
  if (uudaiIndex !== -1) {
    const start = Math.max(0, uudaiIndex - 50);
    const length = 600;
    console.log('🔍 Đoạn chứa từ "ưu đãi":');
    console.log(text.substring(start, start + length));
  } else {
    console.log('❌ KHÔNG TÌM THẤY từ "ưu đãi" trong extracted_text!');
  }
}

inspectText().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
