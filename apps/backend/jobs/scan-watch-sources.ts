import path from 'node:path';
import { config as loadEnv } from 'dotenv';

// Load environment variables from .env in project root
if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

// Job này chạy trực tiếp trên host qua launchd (không trong container),
// nên cần nối tới Postgres qua 127.0.0.1 thay vì hostname "postgres"
if (process.env.DATABASE_URL?.includes('@postgres:')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    '@postgres:',
    '@127.0.0.1:'
  );
}

import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';

export interface ScrapedItem {
  detectUrl: string;
  title: string;
  issuedDate?: string;
}

/**
 * Parser 1: Công báo Chính phủ (congbao.chinhphu.vn)
 */
function parseCongBaoListing(html: string, listingUrl: string): ScrapedItem[] {
  const $ = cheerio.load(html);
  const items: ScrapedItem[] = [];

  $('.item--vb').each((_, el) => {
    const $item = $(el);
    const $link = $item.find('.middle a[href*="/van-ban/"]').first();
    const rawHref = $link.attr('href');

    if (!rawHref) return;

    const cleanHref = rawHref.split('#')[0];
    const detectUrl = new URL(cleanHref, listingUrl).href;
    const title = ($link.attr('title') || $link.text())
      .replace(/\s+/g, ' ')
      .trim();

    if (!title || !detectUrl) return;

    let issuedDate: string | undefined;
    $item.find('.document--focus .row').each((_, row) => {
      const name = $(row).find('.name').text().trim();
      if (name.includes('Ngày ban hành')) {
        issuedDate =
          $(row).find('.value .child-value').text().trim() || undefined;
      }
    });

    items.push({ detectUrl, title, issuedDate });
  });

  return items;
}

/**
 * Parser 2: Hệ thống văn bản Chính phủ (vanban.chinhphu.vn)
 */
function parseVanBanListing(
  html: string,
  listingUrl: string
): ScrapedItem[] {
  const $ = cheerio.load(html);
  const items: ScrapedItem[] = [];
  const baseUrl = 'https://vanban.chinhphu.vn';

  const table = $('table[id*="grvDocument"]');
  const rows = table.find('tr').filter((_, el) => $(el).find('td').length >= 2);

  rows.each((_, el) => {
    const tds = $(el).find('td');
    const linkElem = $(tds[0]).find('a').first();
    const rawHref = linkElem.attr('href');
    if (!rawHref) return;

    const docIdMatch = rawHref.match(/docid=(\d+)/i);
    if (!docIdMatch) return;
    const docId = docIdMatch[1];
    const detectUrl = `https://vanban.chinhphu.vn/?pageid=27160&docid=${docId}`;

    const col0Text = linkElem.text().replace(/\s+/g, ' ').trim();
    const dateText = $(tds[1]).text().trim();
    const summaryLink = $(tds[2]).find('a').first();
    const summaryText = summaryLink.text().replace(/\s+/g, ' ').trim();

    let docNo = col0Text;
    if (dateText && docNo.endsWith(dateText)) {
      docNo = docNo.replace(dateText, '').trim();
    }

    let title = summaryText;
    if (docNo && !summaryText.toLowerCase().includes(docNo.toLowerCase())) {
      title = `${docNo}: ${summaryText}`;
    }

    if (title && detectUrl) {
      items.push({
        detectUrl,
        title,
        issuedDate: dateText || undefined,
      });
    }
  });

  return items;
}

/**
 * Registry chứa tất cả parser chiến lược theo parserKey
 */
export const listingParsers: Record<
  string,
  (html: string, listingUrl: string) => ScrapedItem[]
> = {
  congbao_chinhphu: parseCongBaoListing,
  vanban_chinhphu: parseVanBanListing,
};


/**
 * Main execution function for scanning all active watch sources
 */
export async function scanWatchSources() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(
    `[${new Date().toISOString()}] 🚀 Bắt đầu scan văn bản pháp luật mới${
      isDryRun ? ' [CHẾ ĐỘ DRY-RUN]' : ''
    }...`
  );

  // Dynamic import để đảm bảo process.env.DATABASE_URL đã được override 127.0.0.1 trước khi db client khởi tạo pool
  const { db, crawlWatchSource, crawlDetectedItem } = await import(
    '@tinhchuan/database'
  );

  const sources = await db.query.crawlWatchSource.findMany({
    where: eq(crawlWatchSource.isActive, true),
  });

  if (sources.length === 0) {
    console.log('ℹ️ Không có watch source nào đang hoạt động (isActive = true).');
    process.exit(0);
  }

  console.log(`📌 Tìm thấy ${sources.length} nguồn theo dõi cần scan.`);

  for (const source of sources) {
    console.log(
      `\n🔍 Đang scan nguồn: [${source.name}] (${source.listingUrl}) [parserKey: ${source.parserKey}]...`
    );

    try {
      const parserFn = listingParsers[source.parserKey];
      if (!parserFn) {
        console.warn(
          `⚠️ Không tìm thấy parser key "${source.parserKey}" cho nguồn [${source.name}]. Bỏ qua nguồn này.`
        );
        continue;
      }

      const response = await fetch(source.listingUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP Error ${response.status} ${response.statusText} khi tải ${source.listingUrl}`
        );
      }

      const html = await response.text();
      const items = parserFn(html, source.listingUrl);

      if (items.length === 0) {
        throw new Error(
          `Không tìm thấy văn bản nào từ ${source.listingUrl}. Có thể cấu trúc HTML đã thay đổi.`
        );
      }

      console.log(`📄 Tìm thấy ${items.length} văn bản trên trang danh sách.`);

      // CHẾ ĐỘ DRY-RUN: In toàn bộ danh sách, không check URL cũ, không ghi DB
      if (isDryRun) {
        console.log(
          `\n📋 [DRY-RUN MODE] Danh sách tất cả ${items.length} văn bản tìm thấy cho nguồn [${source.name}]:`
        );
        items.forEach((item, idx) => {
          console.log(`[${idx + 1}] Title : ${item.title}`);
          console.log(`     URL   : ${item.detectUrl}`);
          console.log(`     Ngày  : ${item.issuedDate || 'Không rõ ngày'}`);
        });
        console.log(
          `\n✅ [DRY-RUN MODE] Hoàn tất xem trước nguồn [${source.name}]. Không có dữ liệu nào bị thay đổi trong DB.`
        );
        continue;
      }

      // CHẾ ĐỘ THƯỜNG (LIVE RECORDING):
      let insertedCount = 0;
      let stoppedByExisting = false;

      for (const item of items) {
        // Kiểm tra xem detectUrl đã tồn tại trong DB chưa
        const existingItem = await db.query.crawlDetectedItem.findFirst({
          where: eq(crawlDetectedItem.detectUrl, item.detectUrl),
        });

        if (existingItem) {
          console.log(
            `🛑 Phát hiện URL đã tồn tại trong DB: ${item.detectUrl}. Dừng quét tiếp nguồn này.`
          );
          stoppedByExisting = true;
          break; // ĐIỀU KIỆN DỪNG: gặp URL đã quét ở lần trước
        }

        // Insert văn bản mới
        await db.insert(crawlDetectedItem).values({
          watchSourceId: source.id,
          title: item.title,
          detectUrl: item.detectUrl,
          status: 'pending_classification',
          aiClassification: 'pending',
          detectedAt: new Date(),
        });

        insertedCount++;
        console.log(
          `  ✨ [NEW] Đã thêm văn bản mới (${item.issuedDate || 'Không rõ ngày'}): ${item.title}`
        );
      }

      // Cập nhật crawl_watch_source thành công
      await db
        .update(crawlWatchSource)
        .set({
          lastCheckedAt: new Date(),
          lastCheckStatus: 'success',
          consecutiveFailures: 0,
          lastCheckError: null,
          updatedAt: new Date(),
        })
        .where(eq(crawlWatchSource.id, source.id));

      console.log(
        `✅ Hoàn tất scan nguồn [${source.name}]. Thêm mới: ${insertedCount} văn bản. (Dừng do gặp URL cũ: ${stoppedByExisting})`
      );
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error(`❌ Lỗi khi scan nguồn [${source.name}]:`, errorMessage);

      if (!isDryRun) {
        await db
          .update(crawlWatchSource)
          .set({
            lastCheckStatus: 'failed',
            lastCheckError: errorMessage,
            consecutiveFailures: source.consecutiveFailures + 1,
            updatedAt: new Date(),
          })
          .where(eq(crawlWatchSource.id, source.id));
      }
    }
  }

  console.log(
    `\n[${new Date().toISOString()}] 🎉 Đã hoàn thành toàn bộ công việc scan.`
  );
}

if (require.main === module) {
  scanWatchSources()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Lỗi không xác định trong scan job:', err);
      process.exit(1);
    });
}
