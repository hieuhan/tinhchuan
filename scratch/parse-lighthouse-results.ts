import fs from 'node:fs';
import path from 'node:path';

const targets = [
  { name: 'Trang chủ (/)', slug: 'home', url: 'https://tinhchuan.vn/' },
  { name: 'Tool tính thuế (/tool/thue-ban-hang-online)', slug: 'tool-thue-ban-hang-online', url: 'https://tinhchuan.vn/tool/thue-ban-hang-online' },
  { name: 'Bài viết 1 (/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok)', slug: 'kien-thuc-cach-tinh-thue-shopee-tiktok', url: 'https://tinhchuan.vn/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok' },
  { name: 'Bài viết 2 (/kien-thuc/nghi-dinh-141-2026-thay-doi-gi)', slug: 'kien-thuc-nghi-dinh-141-2026', url: 'https://tinhchuan.vn/kien-thuc/nghi-dinh-141-2026-thay-doi-gi' },
  { name: 'Bài viết 3 (/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026)', slug: 'kien-thuc-nguong-doanh-thu-2026', url: 'https://tinhchuan.vn/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026' },
];

interface ScoreRow {
  page: string;
  mode: string;
  perf: number;
  a11y: number;
  bp: number;
  seo: number;
}

interface FailedAudit {
  id: string;
  title: string;
  description: string;
  category: string;
  score: number;
  pages: string[];
}

function parseResults() {
  const dir = path.resolve(process.cwd(), 'lighthouse-reports');
  const rows: ScoreRow[] = [];
  const issuesMap = new Map<string, FailedAudit>();

  for (const target of targets) {
    for (const mode of ['mobile', 'desktop']) {
      // Find JSON file
      const jsonFiles = [
        path.join(dir, `${target.slug}-${mode}.report.json`),
        path.join(dir, `${target.slug}-${mode}.json`),
      ];

      const jsonFile = jsonFiles.find((f) => fs.existsSync(f));
      if (!jsonFile) {
        console.error(`⚠️ File không tồn tại: ${target.slug}-${mode}`);
        continue;
      }

      const content = fs.readFileSync(jsonFile, 'utf-8');
      const data = JSON.parse(content);

      const perf = Math.round((data.categories.performance?.score || 0) * 100);
      const a11y = Math.round((data.categories.accessibility?.score || 0) * 100);
      const bp = Math.round((data.categories['best-practices']?.score || 0) * 100);
      const seo = Math.round((data.categories.seo?.score || 0) * 100);

      rows.push({
        page: target.name,
        mode: mode === 'mobile' ? 'Mobile' : 'Desktop',
        perf,
        a11y,
        bp,
        seo,
      });

      // Audit issues under 90 for categories with score < 90
      const categoriesToCheck: Record<string, number> = {
        Performance: perf,
        Accessibility: a11y,
        'Best Practices': bp,
        SEO: seo,
      };

      const audits = data.audits || {};
      for (const [auditId, audit] of Object.entries<any>(audits)) {
        if (
          audit.score !== null &&
          audit.score < 0.9 &&
          audit.scoreDisplayMode !== 'notApplicable' &&
          audit.scoreDisplayMode !== 'manual' &&
          audit.scoreDisplayMode !== 'informative'
        ) {
          // Identify category for this audit if possible
          let catName = 'Khác';
          for (const [catKey, catVal] of Object.entries<any>(data.categories)) {
            const auditRefs = catVal.auditRefs || [];
            if (auditRefs.some((ref: any) => ref.id === auditId)) {
              catName = catKey === 'best-practices' ? 'Best Practices' : catKey.charAt(0).toUpperCase() + catKey.slice(1);
              break;
            }
          }

          const pageLabel = `${target.name} (${mode === 'mobile' ? 'Mobile' : 'Desktop'})`;
          const key = auditId;

          if (!issuesMap.has(key)) {
            issuesMap.set(key, {
              id: auditId,
              title: audit.title,
              description: (audit.description || '').replace(/\[.*?\]\(.*?\)/g, '').trim(),
              category: catName,
              score: audit.score,
              pages: [pageLabel],
            });
          } else {
            const existing = issuesMap.get(key)!;
            if (!existing.pages.includes(pageLabel)) {
              existing.pages.push(pageLabel);
            }
          }
        }
      }
    }
  }

  console.log('=== BẢNG TỔNG HỢP ĐIỂM SỐ ===\n');
  console.log('| Trang | Chế độ | Performance | Accessibility | Best Practices | SEO |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.page} | ${r.mode} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} |`);
  }

  console.log('\n=== DANH SÁCH VẤN ĐỀ CHI TIẾT (ĐIỂM < 90) ===\n');
  let idx = 1;
  for (const [id, issue] of issuesMap.entries()) {
    console.log(`${idx++}. **${issue.title}** [${issue.category}]`);
    console.log(`   - Mô tả: ${issue.description}`);
    console.log(`   - Các trang gặp phải (${issue.pages.length}): ${issue.pages.join(', ')}\n`);
  }
}

parseResults();
