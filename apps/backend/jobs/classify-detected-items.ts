import path from 'node:path';
import { config as loadEnv } from 'dotenv';

// Load environment variables from .env in project root
if (!process.env.DATABASE_URL || !process.env.OPENROUTER_API_KEY) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

// Job này chạy trực tiếp trên host (không trong container),
// nên cần nối tới Postgres qua 127.0.0.1 thay vì hostname "postgres"
if (process.env.DATABASE_URL?.includes('@postgres:')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    '@postgres:',
    '@127.0.0.1:'
  );
}

import { eq } from 'drizzle-orm';

const MODEL_NAME = 'anthropic/claude-haiku-4.5';

const SYSTEM_PROMPT = `Bạn là bộ phân loại văn bản pháp luật cho website TinhChuan.vn - công cụ tính thuế và tra cứu pháp lý dành cho người bán hàng online, freelancer, và hộ kinh doanh cá nhân tại Việt Nam.

Nhiệm vụ: đọc tiêu đề văn bản pháp luật, xác định văn bản đó có LIÊN QUAN trực tiếp tới các chủ đề sau không:
- Thuế thu nhập cá nhân (TNCN), thuế giá trị gia tăng (GTGT) cho cá nhân/ hộ kinh doanh, đặc biệt liên quan bán hàng online/thương mại điện tử
- Ngưỡng doanh thu chịu thuế
- Bảo hiểm xã hội (BHXH), bảo hiểm thất nghiệp (BHTN)
- Đăng ký hộ kinh doanh, đăng ký doanh nghiệp cá nhân
- Lao động tự do, freelancer

Lưu ý: văn bản dạng 'Văn bản hợp nhất' (hợp nhất các văn bản cũ đã có từ trước) chỉ coi là 'relevant' nếu nội dung hợp nhất thuộc đúng các chủ đề trên - không tự động loại hay tự động nhận vì là văn bản hợp nhất.

Trả lời DUY NHẤT bằng JSON, không thêm text nào khác, đúng format:
{"classification": "relevant" | "not_relevant", "reason": "<giải thích ngắn gọn 1 câu bằng tiếng Việt>"}`;

interface AiResponse {
  classification: 'relevant' | 'not_relevant';
  reason: string;
}

/**
 * Gọi OpenRouter API để phân loại 1 tiêu đề văn bản (có retry 1 lần nếu lỗi)
 */
async function classifyTitleWithAi(title: string): Promise<AiResponse | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY không được tìm thấy trong môi trường!');
  }

  let attempt = 0;
  while (attempt < 2) {
    attempt++;
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tinhchuan.vn',
          'X-Title': 'TinhChuan.vn AI Classifier',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: title },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';

      // Clean markdown code blocks (ví dụ ```json ... ```)
      const cleanedContent = rawContent
        .replace(/^\s*```json/i, '')
        .replace(/```\s*$/, '')
        .trim();

      const parsed = JSON.parse(cleanedContent);

      if (
        (parsed.classification === 'relevant' || parsed.classification === 'not_relevant') &&
        typeof parsed.reason === 'string' &&
        parsed.reason.trim().length > 0
      ) {
        return {
          classification: parsed.classification,
          reason: parsed.reason.trim(),
        };
      }

      throw new Error(`Format JSON không khớp yêu cầu: ${rawContent}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        `   ⚠️ Lần thử ${attempt}/2 thất bại cho title "${title.substring(0, 40)}...": ${errorMessage}`
      );

      if (attempt >= 2) {
        return null;
      }
    }
  }

  return null;
}

/**
 * Main execution function for classifying pending detected items
 */
export async function classifyDetectedItems() {
  console.log(
    `[${new Date().toISOString()}] 🚀 Bắt đầu job phân loại AI cho văn bản mới (Model: ${MODEL_NAME})...`
  );

  // Dynamic import để đảm bảo process.env.DATABASE_URL đã được override 127.0.0.1
  const { db, crawlDetectedItem } = await import('@tinhchuan/database');

  const pendingItems = await db.query.crawlDetectedItem.findMany({
    where: eq(crawlDetectedItem.aiClassification, 'pending'),
  });

  if (pendingItems.length === 0) {
    console.log('✅ Không có văn bản nào ở trạng thái aiClassification = "pending".');
    return;
  }

  console.log(`📋 Tìm thấy ${pendingItems.length} văn bản cần phân loại.\n`);

  let successCount = 0;
  let relevantCount = 0;
  let notRelevantCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    console.log(`[${i + 1}/${pendingItems.length}] Đang phân loại: "${item.title}"`);

    const result = await classifyTitleWithAi(item.title);

    if (!result) {
      console.error(
        `   ❌ BỎ QUA văn bản (ID: ${item.id}): phân loại thất bại sau 2 lần thử.\n`
      );
      skippedCount++;
      continue;
    }

    const updates: {
      aiClassification: 'relevant' | 'not_relevant';
      aiClassificationReason: string;
      status?: 'rejected';
      updatedAt: Date;
    } = {
      aiClassification: result.classification,
      aiClassificationReason: result.reason,
      updatedAt: new Date(),
    };

    if (result.classification === 'not_relevant') {
      updates.status = 'rejected';
      notRelevantCount++;
    } else {
      relevantCount++;
    }

    await db
      .update(crawlDetectedItem)
      .set(updates)
      .where(eq(crawlDetectedItem.id, item.id));

    console.log(
      `   -> KẾT QUẢ: [${result.classification.toUpperCase()}] | Status: ${
        updates.status || item.status
      }`
    );
    console.log(`      Lý do: ${result.reason}\n`);
    successCount++;
  }

  console.log('================ HOÀN TẤT JOB PHÂN LOẠI AI ================');
  console.log(`- Tổng số văn bản đã xử lý thành công: ${successCount}/${pendingItems.length}`);
  console.log(`- Số văn bản RELEVANT (phù hợp TinhChuan.vn): ${relevantCount}`);
  console.log(`- Số văn bản NOT_RELEVANT (đã đổi status -> rejected): ${notRelevantCount}`);
  console.log(`- Số văn bản BỎ QUA (giữ pending để thử lại sau): ${skippedCount}`);
}

if (require.main === module) {
  classifyDetectedItems()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Lỗi nghiêm trọng khi chạy job phân loại AI:', err);
      process.exit(1);
    });
}
