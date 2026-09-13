import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Agent } from 'undici';

// Load environment variables từ .env tại root project
if (!process.env.DATABASE_URL || !process.env.MINIO_ROOT_USER) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

// Job này chạy trực tiếp trên host qua launchd/tsx,
// nên kết nối Postgres/MinIO qua 127.0.0.1 thay vì hostname container
if (process.env.DATABASE_URL?.includes('@postgres:')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    '@postgres:',
    '@127.0.0.1:'
  );
}

import * as cheerio from 'cheerio';
import { eq, and, isNull } from 'drizzle-orm';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { sendTelegramNotification } from '../lib/telegram';

function escapeTelegramHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

// Lý do dùng undici Agent scoped cho CDN chính phủ:
// Đã kiểm tra qua `curl -v`: Trình duyệt & OS verify thành công chứng chỉ GlobalSign của g7.cdnchinhphu.vn/xdcs.cdnchinhphu.vn.
// Tuy nhiên Node.js mặc định dùng kho CA nội bộ riêng nên bị thiếu intermediate CA cert cho các domain này.
const cdnAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

// Kho lưu trữ MinIO
const BUCKET_NAME = 'legal-documents';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://127.0.0.1:9000';

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'minio_admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || '',
  },
  forcePathStyle: true,
});

export interface DetailPageParseResult {
  docxUrl?: string;
  pdfUrl?: string;
  htmlBodyText?: string;
}

/**
 * Parser trang chi tiết: Công báo Chính phủ
 */
function parseCongBaoDetailPage(html: string, pageUrl: string): DetailPageParseResult {
  const $ = cheerio.load(html);
  let docxUrl: string | undefined;
  let pdfUrl: string | undefined;

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    if (
      href.includes('.docx') ||
      (href.includes('file_name=') && href.includes('.docx'))
    ) {
      docxUrl = href.startsWith('http') ? href : new URL(href, pageUrl).href;
    } else if (
      href.includes('.pdf') ||
      (href.includes('file_name=') && href.includes('.pdf'))
    ) {
      if (!pdfUrl) {
        pdfUrl = href.startsWith('http') ? href : new URL(href, pageUrl).href;
      }
    }
  });

  return { docxUrl, pdfUrl };
}

/**
 * Parser trang chi tiết: Hệ thống văn bản Chính phủ (vanban.chinhphu.vn)
 */
function parseVanBanDetailPage(html: string, pageUrl: string): DetailPageParseResult {
  const $ = cheerio.load(html);
  let docxUrl: string | undefined;
  let pdfUrl: string | undefined;
  const allAttachedFiles: string[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    if (
      href.includes('.docx') ||
      (href.includes('file_name=') && href.includes('.docx'))
    ) {
      const fullUrl = href.startsWith('http') ? href : new URL(href, pageUrl).href;
      docxUrl = fullUrl;
      allAttachedFiles.push(fullUrl);
    } else if (
      href.includes('.pdf') ||
      (href.includes('file_name=') && href.includes('.pdf')) ||
      href.includes('datafiles.chinhphu.vn')
    ) {
      const fullUrl = href.startsWith('http') ? href : new URL(href, pageUrl).href;
      if (!pdfUrl) {
        pdfUrl = fullUrl;
      }
      allAttachedFiles.push(fullUrl);
    }
  });

  if (allAttachedFiles.length > 1) {
    console.log(
      `   📌 [GHI CHÚ] Phát hiện ${allAttachedFiles.length} file đính kèm trên trang chi tiết:`,
      allAttachedFiles
    );
  }

  const $clean = cheerio.load(html);
  $clean('script, style, noscript').remove();

  const rawBodyText =
    $clean('.MainContent, .Detail, .content-detail, .doc-detail, #content, .fulltext, .detail-content').text() ||
    $clean('body').text();
  const htmlBodyText = rawBodyText ? rawBodyText.replace(/\s+/g, ' ').trim() : undefined;

  return { docxUrl, pdfUrl, htmlBodyText };
}


export const detailPageParsers: Record<
  string,
  (html: string, pageUrl: string) => DetailPageParseResult
> = {
  congbao_chinhphu: parseCongBaoDetailPage,
  vanban_chinhphu: parseVanBanDetailPage,
};

export interface ExtractedMetadata {
  documentNumber?: string;
  documentType?: string;
  issuingBody?: string;
  issuedDate?: string;
  effectiveDate?: string;
}

function parseDateStringToIso(raw: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.trim().match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!match) return undefined;
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function parseCongBaoMetadata(html: string): ExtractedMetadata {
  const $ = cheerio.load(html);
  let documentNumber: string | undefined;
  let documentType: string | undefined;
  let issuingBody: string | undefined;
  let issuedDate: string | undefined;
  let effectiveDate: string | undefined;

  $('.document--focus .row, .table .row').each((_, el) => {
    const name = $(el).find('.name').text().trim().toLowerCase();
    const val = $(el).find('.value').text().trim();
    if (!val) return;

    if (name.includes('số') && name.includes('ký hiệu')) {
      documentNumber = val;
    } else if (name.includes('loại văn bản')) {
      documentType = val;
    } else if (name.includes('cơ quan ban hành')) {
      issuingBody = val;
    } else if (name.includes('ngày ban hành')) {
      issuedDate = parseDateStringToIso(val);
    } else if (name.includes('ngày hiệu lực')) {
      effectiveDate = parseDateStringToIso(val);
    }
  });

  return { documentNumber, documentType, issuingBody, issuedDate, effectiveDate };
}

function parseVanBanMetadata(html: string): ExtractedMetadata {
  const $ = cheerio.load(html);
  let documentNumber: string | undefined;
  let documentType: string | undefined;
  let issuingBody: string | undefined;
  let issuedDate: string | undefined;
  let effectiveDate: string | undefined;

  $('table tr').each((_, el) => {
    const tds = $(el).find('td');
    if (tds.length < 2) return;

    const label = $(tds[0]).text().trim().toLowerCase();
    const val = $(tds[1]).text().trim();
    if (!val) return;

    if (label.includes('số ký hiệu')) {
      documentNumber = val;
    } else if (label.includes('loại văn bản')) {
      documentType = val;
    } else if (label.includes('cơ quan ban hành')) {
      issuingBody = val;
    } else if (label.includes('ngày ban hành')) {
      issuedDate = parseDateStringToIso(val);
    } else if (label.includes('ngày có hiệu lực') || label.includes('ngày hiệu lực')) {
      effectiveDate = parseDateStringToIso(val);
    }
  });

  return { documentNumber, documentType, issuingBody, issuedDate, effectiveDate };
}

export const metadataParsers: Record<string, (html: string) => ExtractedMetadata> = {
  congbao_chinhphu: parseCongBaoMetadata,
  vanban_chinhphu: parseVanBanMetadata,
};


/**
 * Đảm bảo bucket MinIO tồn tại
 */
async function ensureBucketExists(bucketName: string) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`🔨 Đang tạo bucket MinIO "${bucketName}"...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    } else {
      throw err;
    }
  }
}

/**
 * Upload buffer file lên MinIO và trả về object key tương đối
 */
async function uploadToMinio(
  bucketName: string,
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

/**
 * Trích xuất text layer từ Buffer PDF
 */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const pdfModule = require('pdf-parse');
  const PDFParse = pdfModule.PDFParse || pdfModule.default || pdfModule;

  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse(uint8Array);
  await parser.load();
  const textResult = await parser.getText();
  return (textResult.text || textResult || '').trim();
}

/**
 * Chuẩn hóa các đường dẫn ZIP entry trong file .docx từ backslash ("\") sang forward slash ("/")
 */
async function normalizeDocxZipBuffer(buffer: Buffer): Promise<Buffer> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const normalizedZip = new JSZip();
    let hasBackslash = false;

    for (const [key, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        if (key.includes('\\')) {
          hasBackslash = true;
        }
        const normalizedKey = key.replace(/\\/g, '/');
        const content = await file.async('nodebuffer');
        normalizedZip.file(normalizedKey, content);
      }
    }

    if (hasBackslash) {
      console.log(
        '   🔧 Đã tự động chuẩn hóa phân cách đường dẫn ZIP (\\ -> /) cho file .docx.'
      );
      return await normalizedZip.generateAsync({ type: 'nodebuffer' });
    }
  } catch (err) {
    // Nếu giải nén ZIP thất bại, giữ nguyên buffer ban đầu
  }
  return buffer;
}

/**
 * Trích xuất text layer từ Buffer DOCX (tự động chuẩn hóa đường dẫn ZIP nếu cần)
 */
async function extractTextFromDocxBuffer(
  buffer: Buffer
): Promise<{ text: string; normalizedBuffer: Buffer }> {
  const normalizedBuffer = await normalizeDocxZipBuffer(buffer);
  const result = await mammoth.extractRawText({ buffer: normalizedBuffer });
  return {
    text: (result.value || '').trim(),
    normalizedBuffer,
  };
}

/**
 * Main execution function for extracting content from relevant detected items
 */
export async function extractDetectedItemContent() {
  console.log(
    `[${new Date().toISOString()}] 🚀 Bắt đầu job trích xuất nội dung văn bản (Stage 3)...`
  );

  await ensureBucketExists(BUCKET_NAME);

  // Dynamic import để đảm bảo DATABASE_URL đã được override 127.0.0.1
  const { db, crawlDetectedItem } = await import('@tinhchuan/database');

  // Query các văn bản relevant, đang chờ phân loại/trích xuất (status = pending_classification, aiClassification = relevant, extractedText IS NULL)
  const items = await db.query.crawlDetectedItem.findMany({
    where: and(
      eq(crawlDetectedItem.aiClassification, 'relevant'),
      eq(crawlDetectedItem.status, 'pending_classification'),
      isNull(crawlDetectedItem.extractedText)
    ),
    with: {
      watchSource: true,
    },
  });

  if (items.length === 0) {
    console.log(
      '✅ Không có văn bản relevant nào cần trích xuất nội dung.'
    );
    return;
  }

  console.log(
    `📋 Tìm thấy ${items.length} văn bản RELEVANT cần tải file & trích xuất nội dung.\n`
  );

  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const parserKey = item.watchSource?.parserKey || 'congbao_chinhphu';
    console.log(
      `[${i + 1}/${items.length}] Đang xử lý: "${item.title}" [parserKey: ${parserKey}]`
    );
    console.log(`   - Link chi tiết: ${item.detectUrl}`);

    try {
      // 1. Fetch trang chi tiết
      const isCdn = item.detectUrl.includes('chinhphu.vn');
      const pageRes = await fetch(item.detectUrl, {
        ...(isCdn ? { dispatcher: cdnAgent } : {}),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      } as any);

      if (!pageRes.ok) {
        throw new Error(
          `Không thể tải trang chi tiết (HTTP ${pageRes.status})`
        );
      }

      const html = await pageRes.text();
      const detailParser = detailPageParsers[parserKey] || detailPageParsers['congbao_chinhphu'];
      const { docxUrl, pdfUrl, htmlBodyText } = detailParser(html, item.detectUrl);

      // Parse metadata thuộc tính (nếu có parser phù hợp)
      let metadata: ExtractedMetadata = {};
      try {
        const metadataParser = metadataParsers[parserKey];
        if (metadataParser) {
          metadata = metadataParser(html);
          console.log(`   - Trích xuất metadata thành công:`, metadata);
        }
      } catch (metaErr: any) {
        console.warn(`   ⚠️ Lỗi trích xuất metadata (không ảnh hưởng nội dung chính):`, metaErr.message || metaErr);
      }

      console.log(`   - Tìm thấy link .docx: ${docxUrl || 'Không có'}`);
      console.log(`   - Tìm thấy link .pdf: ${pdfUrl || 'Không có'}`);

      let extractedText = '';
      let fileBuffer: Buffer | null = null;
      let fileExtension = '';
      let mimeType = '';

      // 2. Thử tải & trích xuất .docx trước (nếu có)
      if (docxUrl) {
        try {
          console.log(`   - Đang tải file .docx (dùng scoped cdnAgent)...`);
          const docxRes = await fetch(docxUrl, {
            ...(docxUrl.includes('chinhphu.vn') ? { dispatcher: cdnAgent } : {}),
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: item.detectUrl,
            },
          } as any);

          if (docxRes.ok) {
            const arrBuf = await docxRes.arrayBuffer();
            const buf = Buffer.from(arrBuf);
            const { text, normalizedBuffer } = await extractTextFromDocxBuffer(buf);
            if (text.length >= 200) {
              extractedText = text;
              fileBuffer = normalizedBuffer;
              fileExtension = 'docx';
              mimeType =
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              console.log(
                `   - Trích xuất thành công từ .docx (${extractedText.length} ký tự).`
              );
            } else {
              console.warn(
                `   ⚠️ File .docx chỉ trích được ${text.length} ký tự (< 200), chuyển sang thử .pdf...`
              );
            }
          }
        } catch (docxErr: any) {
          console.warn(
            `   ⚠️ Lỗi đọc .docx (${docxErr.message}), chuyển sang thử .pdf...`
          );
        }
      }

      // 3. Nếu chưa trích được từ .docx, thử tải & trích từ .pdf
      if (!extractedText && pdfUrl) {
        try {
          console.log(`   - Đang tải file .pdf (dùng scoped cdnAgent)...`);
          const pdfRes = await fetch(pdfUrl, {
            ...(pdfUrl.includes('chinhphu.vn') ? { dispatcher: cdnAgent } : {}),
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: item.detectUrl,
            },
          } as any);

          if (pdfRes.ok) {
            const arrBuf = await pdfRes.arrayBuffer();
            const buf = Buffer.from(arrBuf);
            const text = await extractTextFromPdfBuffer(buf);

            fileBuffer = buf;
            fileExtension = 'pdf';
            mimeType = 'application/pdf';

            if (text.length >= 200) {
              extractedText = text;
              console.log(
                `   - Trích xuất thành công từ .pdf (${extractedText.length} ký tự).`
              );
            } else {
              console.warn(
                `   ⚠️ File .pdf chỉ trích được ${text.length} ký tự (< 200 - có thể là file scan ảnh).`
              );
            }
          }
        } catch (pdfErr: any) {
          console.warn(`   ⚠️ Lỗi đọc .pdf: ${pdfErr.message}`);
        }
      }

      // 4. Nếu PDF bị scan ảnh (< 200 ký tự) nhưng trang HTML có chứa nội dung bài viết htmlBodyText >= 200 ký tự
      if (!extractedText && htmlBodyText && htmlBodyText.length >= 200) {
        extractedText = htmlBodyText;
        console.log(
          `   ✨ Trích xuất nội dung từ HTML body trang chi tiết thành công (${extractedText.length} ký tự).`
        );
        if (!fileBuffer) {
          fileBuffer = Buffer.from(htmlBodyText, 'utf-8');
          fileExtension = 'html';
          mimeType = 'text/html; charset=utf-8';
        }
      }

      // 5. Đánh giá kết quả trích xuất
      if (!extractedText || extractedText.length < 200 || !fileBuffer) {
        console.warn(
          `   ⚠️ CẢNH BÁO ADMIN: Văn bản ID ${item.id} ("${item.title}") không trích xuất đủ nội dung (dưới 200 ký tự). Giữ nguyên status="pending_classification" để kiểm tra thủ công.\n`
        );
        skippedCount++;
        continue;
      }

      // 6. Upload file lên MinIO
      const minioKey = `detected-items/${item.id}.${fileExtension}`;
      const sourceFileUrl = await uploadToMinio(
        BUCKET_NAME,
        minioKey,
        fileBuffer,
        mimeType
      );
      console.log(`   - Đã lưu file lên MinIO: ${sourceFileUrl}`);

      // 7. Cập nhật DB
      await db
        .update(crawlDetectedItem)
        .set({
          sourceFileUrl,
          extractionMethod: 'text_layer',
          extractedText,
          status: 'pending_review',
          documentNumber: metadata.documentNumber || null,
          documentType: metadata.documentType || null,
          issuingBody: metadata.issuingBody || null,
          issuedDate: metadata.issuedDate || null,
          effectiveDate: metadata.effectiveDate || null,
          updatedAt: new Date(),
        })
        .where(eq(crawlDetectedItem.id, item.id));

      console.log(`   - Cập nhật DB: status -> "pending_review"\n`);

      // 8. Gửi thông báo Telegram cho Admin (lỗi gửi Telegram không throw gãy job)
      const reviewUrl = `https://admin.tinhchuan.vn/review/${item.id}`;
      await sendTelegramNotification(
        `📄 <b>Văn bản mới cần duyệt</b>\n\n` +
        `${escapeTelegramHtml(item.title)}\n\n` +
        `Lý do AI đánh giá relevant: ${escapeTelegramHtml(item.aiClassificationReason || 'Không có')}\n\n` +
        `👉 Duyệt tại: ${reviewUrl}`
      );

      successCount++;
    } catch (itemErr: any) {
      console.error(
        `   ❌ Lỗi xử lý văn bản ID ${item.id}: ${itemErr.message}\n`
      );
      skippedCount++;
    }
  }

  console.log('================ HOÀN TẤT JOB TRÍCH XUẤT NỘI DUNG ================');
  console.log(`- Xử lý thành công (chuyển status -> pending_review): ${successCount}/${items.length}`);
  console.log(`- Cần kiểm tra thủ công / bỏ qua: ${skippedCount}`);
}

if (require.main === module) {
  extractDetectedItemContent()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('💥 Lỗi nghiêm trọng khi chạy job trích xuất nội dung:', err);
      process.exit(1);
    });
}
