import fs from 'fs';
import path from 'path';

const pages = [
  'home-mobile',
  'tool-thue-ban-hang-online-mobile',
  'kien-thuc-cach-tinh-thue-shopee-tiktok-mobile',
  'kien-thuc-nghi-dinh-141-2026-mobile',
  'kien-thuc-nguong-doanh-thu-2026-mobile'
];

for (const p of pages) {
  const filePath = path.join(process.cwd(), 'lighthouse-reports', `${p}.report.json`);
  if (!fs.existsSync(filePath)) continue;
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('\n==============================================');
  console.log('TRANG:', p);
  console.log('Performance Score:', d.categories.performance.score * 100);
  
  console.log('\n--- CORE METRICS ---');
  ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'interactive'].forEach(k => {
    const a = d.audits[k];
    if (a) console.log(`  ${a.title} (${k}): ${a.displayValue} (score: ${a.score})`);
  });

  console.log('\n--- RENDER BLOCKING RESOURCES ---');
  const rb = d.audits['render-blocking-resources'];
  if (rb) {
    console.log(`  Score: ${rb.score}, Savings: ${rb.details?.overallSavingsMs || 0}ms`);
    if (rb.details?.items) {
      rb.details.items.forEach((i: any) => console.log(`    - ${i.url} (${Math.round(i.wastedBytes/1024)}KB, ${i.wastedMs}ms)`));
    }
  }

  console.log('\n--- UNUSED JAVASCRIPT ---');
  const ujs = d.audits['unused-javascript'];
  if (ujs) {
    console.log(`  Score: ${ujs.score}, Est Savings: ${ujs.displayValue}, WastedBytes: ${Math.round((ujs.details?.overallSavingsBytes||0)/1024)}KB`);
    if (ujs.details?.items) {
      ujs.details.items.forEach((i: any) => console.log(`    - ${i.url}: wasted ${Math.round(i.wastedBytes/1024)}KB of ${Math.round(i.totalBytes/1024)}KB (${i.wastedPercent ? i.wastedPercent.toFixed(1) : 0}%)`));
    }
  }

  console.log('\n--- UNUSED CSS ---');
  const ucss = d.audits['unused-css-rules'];
  if (ucss) {
    console.log(`  Score: ${ucss.score}, Est Savings: ${ucss.displayValue}`);
    if (ucss.details?.items) {
      ucss.details.items.forEach((i: any) => console.log(`    - ${i.url}: wasted ${Math.round(i.wastedBytes/1024)}KB of ${Math.round(i.totalBytes/1024)}KB`));
    }
  }

  console.log('\n--- IMAGES AUDITS ---');
  ['uses-optimized-images', 'proper-size-images', 'modern-image-formats', 'lcp-lazy-loaded'].forEach(k => {
    const a = d.audits[k];
    if (a) console.log(`  ${a.title}: score=${a.score}, value=${a.displayValue||'N/A'}`);
  });

  console.log('\n--- FONT DISPLAY AUDIT ---');
  const fd = d.audits['font-display'];
  if (fd) {
    console.log(`  Score: ${fd.score}, Value: ${fd.displayValue||'OK'}`);
    if (fd.details?.items) {
      fd.details.items.forEach((i: any) => console.log(`    - ${i.url} (wastedMs: ${i.wastedMs})`));
    }
  }

  console.log('\n--- LCP ELEMENT & BREAKDOWN ---');
  const lcpElem = d.audits['largest-contentful-paint-element'];
  if (lcpElem && lcpElem.details?.items) {
    lcpElem.details.items.forEach((i: any) => console.log(`    - Element: ${i.node?.snippet} | Selector: ${i.node?.selector}`));
  }
}
