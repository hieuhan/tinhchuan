import {
  db,
  legalSource,
  taxRuleVersion,
  crawlDetectedItem,
  contentPage,
} from '@tinhchuan/database';
import { eq } from 'drizzle-orm';

const MODEL_NAME = 'anthropic/claude-sonnet-5';

const SYSTEM_PROMPT = `Bạn là biên tập viên nội dung cho TinhChuan.vn - nền tảng tra cứu thuế cho người bán hàng online, freelancer, hộ kinh doanh tại Việt Nam.

QUY TẮC BẮT BUỘC - VI PHẠM LÀ LỖI NGHIÊM TRỌNG:
- CHỈ được dùng thông tin từ VĂN BẢN NGUỒN và DỮ LIỆU QUY TẮC THUẾ được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG tự thêm số liệu, ngày tháng, mức thuế, hay bất kỳ thông tin nào không có trong 2 nguồn này, kể cả khi bạn 'biết' hoặc 'nhớ' quy định liên quan từ kiến thức khác.
- Nếu văn bản nguồn không đề cập rõ 1 chi tiết, KHÔNG suy đoán - bỏ qua chi tiết đó hoặc ghi rõ 'cần tham khảo văn bản gốc'.
- Giọng văn: rõ ràng, thân thiện, dễ hiểu cho người không rành luật, nhưng chính xác tuyệt đối về số liệu.

Nhiệm vụ: viết 1 bài kiến thức + phần FAQ dựa trên văn bản pháp luật và quy tắc thuế được cung cấp. Trả lời DUY NHẤT bằng JSON đúng format:
{
  "title": "...",
  "slug": "..." (không dấu, chữ thường, gạch ngang),
  "metaDescription": "... (tối đa 160 ký tự)",
  "content": "... (markdown, theo đúng cấu trúc mẫu đính kèm)",
  "faqItems": [{"question": "...", "answer": "..."}, ...]
}`;

const SAMPLE_FORMAT = `
MẪU CẤU TRÚC BÀI VIẾT VÀ FAQ THAM KHẢO:

Title: Nghị định 141/2026 thay đổi gì về thuế hộ kinh doanh?
MetaDescription: Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 117/2025/NĐ-CP về quản lý thuế...

Content (Markdown):
Ngày 29/04/2026, Chính phủ ban hành Nghị định 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định 68/2026/NĐ-CP...

## Những thay đổi chính

- **Nâng ngưỡng doanh thu không chịu thuế từ 500 triệu lên 1 tỷ đồng/năm:** Hộ, cá nhân có doanh thu không vượt quá 1 tỷ đồng/năm thì không phải nộp thuế GTGT và TNCN.
- **Áp dụng hồi tố từ 01/01/2026:** Mức ngưỡng mới được áp dụng từ đầu năm 2026...

## Hướng dẫn thực hiện

...

FaqItems:
[
  { "question": "Nghị định có điểm gì mới nổi bật nhất?", "answer": "Thay đổi quan trọng nhất là..." },
  { "question": "Hiệu lực từ khi nào?", "answer": "Được áp dụng từ..." }
]
`;

export interface GeneratedContentResult {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  faqItems: Array<{ question: string; answer: string }>;
}

export async function generateContentPage(legalSourceId: number): Promise<GeneratedContentResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY không được tìm thấy trong môi trường!');
  }

  // 1. Query legal_source
  const doc = await db.query.legalSource.findFirst({
    where: eq(legalSource.id, legalSourceId),
  });

  if (!doc) {
    throw new Error(`Không tìm thấy legal_source với ID = ${legalSourceId}`);
  }

  // 2. Query tax_rule_version linked to this legalSourceId
  const rules = await db.query.taxRuleVersion.findMany({
    where: eq(taxRuleVersion.legalSourceId, legalSourceId),
  });

  // 3. Query crawl_detected_item for extractedText
  const item = await db.query.crawlDetectedItem.findFirst({
    where: eq(crawlDetectedItem.legalSourceId, legalSourceId),
  });

  const extractedText = item?.extractedText || 'Không có văn bản trích xuất.';

  const userPrompt = `
VĂN BẢN NGUỒN (LEGAL SOURCE METADATA):
- Số hiệu văn bản: ${doc.documentNumber}
- Loại văn bản: ${doc.documentType}
- Tiêu đề: ${doc.title}
- Cơ quan ban hành: ${doc.issuingBody}
- Ngày ban hành: ${doc.issuedDate}
- Ngày hiệu lực: ${doc.effectiveDate || 'Chưa xác định'}

DỮ LIỆU QUY TẮC THUẾ ĐÃ DUYỆT (TAX RULE VERSIONS):
${JSON.stringify(rules.map(r => ({
  effectiveFrom: r.effectiveFrom,
  effectiveTo: r.effectiveTo,
  ruleValue: r.ruleValue,
})), null, 2)}

NỘI DUNG VĂN BẢN TRÍCH XUẤT (EXTRACTED TEXT):
${extractedText}

${SAMPLE_FORMAT}

Hãy soạn thảo bài viết kiến thức và phần FAQ theo đúng format JSON yêu cầu.
`;

  // 4. Call OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://tinhchuan.vn',
      'X-Title': 'TinhChuan.vn AI Content Generator',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  const cleanedContent = rawContent
    .replace(/^\s*```json/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const parsed = JSON.parse(cleanedContent);

  if (!parsed.title || !parsed.slug || !parsed.content || !Array.isArray(parsed.faqItems)) {
    throw new Error('Kết quả từ AI không đúng cấu trúc JSON yêu cầu!');
  }

  // 5. Uniqueness check for slug
  let baseSlug = parsed.slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.contentPage.findFirst({
      where: eq(contentPage.slug, finalSlug),
    });
    if (!existing) break;
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }

  return {
    title: parsed.title,
    slug: finalSlug,
    metaDescription: parsed.metaDescription || '',
    content: parsed.content,
    faqItems: parsed.faqItems,
  };
}
