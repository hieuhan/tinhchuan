import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'lighthouse-reports');

const targets = [
  { name: 'Trang chủ', mode: 'Mobile', file: 'home-mobile.report.json', prev: { perf: 68, a11y: 85, bp: 100, seo: 100 } },
  { name: 'Trang chủ', mode: 'Desktop', file: 'home-desktop.report.json', prev: { perf: 99, a11y: 85, bp: 100, seo: 100 } },
  { name: 'Bài viết 1', mode: 'Desktop', file: 'kien-thuc-cach-tinh-thue-shopee-tiktok-desktop.report.json', prev: { perf: 99, a11y: 89, bp: 89, seo: 100 } },
  { name: 'Tool tính thuế', mode: 'Mobile', file: 'tool-thue-ban-hang-online-mobile.report.json', prev: { perf: 75, a11y: 96, bp: 100, seo: 100 } }
];

console.log('| Trang | Chế độ | Performance (Trước → Sau) | Accessibility (Trước → Sau) | Best Practices (Trước → Sau) | SEO (Trước → Sau) |');
console.log('|---|---|:---:|:---:|:---:|:---:|');

for (const t of targets) {
  const filePath = path.join(dir, t.file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const perf = Math.round((data.categories.performance?.score || 0) * 100);
  const a11y = Math.round((data.categories.accessibility?.score || 0) * 100);
  const bp = Math.round((data.categories['best-practices']?.score || 0) * 100);
  const seo = Math.round((data.categories.seo?.score || 0) * 100);
  
  const perfStr = t.prev.perf === perf ? `${perf}` : `${t.prev.perf} → **${perf}**`;
  const a11yStr = t.prev.a11y === a11y ? `${a11y}` : `${t.prev.a11y} → **${a11y}**`;
  const bpStr = t.prev.bp === bp ? `${bp}` : `${t.prev.bp} → **${bp}**`;
  const seoStr = t.prev.seo === seo ? `${seo}` : `${t.prev.seo} → **${seo}**`;
  
  console.log(`| **${t.name}** | ${t.mode} | ${perfStr} | ${a11yStr} | ${bpStr} | ${seoStr} |`);
}
