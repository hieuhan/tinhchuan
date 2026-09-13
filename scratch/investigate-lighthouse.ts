import fs from 'fs';
import path from 'path';

const reportsDir = path.join(process.cwd(), 'lighthouse-reports');

// Task 1: Console errors in Article 1 Desktop
console.log('=== VIỆC 1: LỖI CONSOLE BÀI VIẾT 1 (DESKTOP) ===');
const art1DesktopPath = path.join(reportsDir, 'kien-thuc-cach-tinh-thue-shopee-tiktok-desktop.report.json');
if (fs.existsSync(art1DesktopPath)) {
  const art1Data = JSON.parse(fs.readFileSync(art1DesktopPath, 'utf8'));
  const consoleAudit = art1Data.audits['errors-in-console'];
  console.log('Console Audit Details:');
  console.log('Title:', consoleAudit?.title);
  console.log('Score:', consoleAudit?.score);
  console.log('Description:', consoleAudit?.description);
  console.log('Details Items:', JSON.stringify(consoleAudit?.details?.items, null, 2));
}

// Task 2: Color Contrast Failures across pages
console.log('\n=== VIỆC 2: CÁC PHẦN TỬ LỖI TƯƠNG PHẢN MÀU (COLOR CONTRAST) ===');
const filesToInspect = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));

const contrastIssuesMap = new Map<string, {
  selector: string;
  snippet: string;
  explanation: string;
  fontSize: string;
  fontWeight: string;
  pages: string[];
}>();

for (const file of filesToInspect) {
  const filePath = path.join(reportsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const contrastAudit = data.audits['color-contrast'];
  if (contrastAudit && contrastAudit.details && contrastAudit.details.items) {
    for (const item of contrastAudit.details.items) {
      const node = item.node;
      const key = `${node.selector} || ${item.explanation}`;
      if (!contrastIssuesMap.has(key)) {
        contrastIssuesMap.set(key, {
          selector: node.selector || '',
          snippet: node.snippet || '',
          explanation: item.explanation || '',
          fontSize: node.fontSize || '',
          fontWeight: node.fontWeight || '',
          pages: [file.replace('.report.json', '')]
        });
      } else {
        contrastIssuesMap.get(key)!.pages.push(file.replace('.report.json', ''));
      }
    }
  }
}

for (const [key, issue] of contrastIssuesMap.entries()) {
  console.log(`\n- Selector: \`${issue.selector}\``);
  console.log(`  Snippet: \`${issue.snippet}\``);
  console.log(`  Chi tiết: ${issue.explanation}`);
  if (issue.fontSize) console.log(`  Font size: ${issue.fontSize}, Weight: ${issue.fontWeight}`);
  console.log(`  Xuất hiện trên (${issue.pages.length} báo cáo): ${issue.pages.join(', ')}`);
}

// Task 3: Mobile Performance Opportunities & Diagnostics
console.log('\n=== VIỆC 3: NGUYÊN NHÂN PERFORMANCE MOBILE CHẬM ===');

const mobileFiles = [
  'home-mobile.report.json',
  'tool-thue-ban-hang-online-mobile.report.json',
  'kien-thuc-cach-tinh-thue-shopee-tiktok-mobile.report.json',
  'kien-thuc-nghi-dinh-141-2026-mobile.report.json',
  'kien-thuc-nguong-doanh-thu-2026-mobile.report.json'
];

for (const mFile of mobileFiles) {
  const filePath = path.join(reportsDir, mFile);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n--- TRANG: ${mFile.replace('.report.json', '')} ---`);
  
  // Audits of interest
  const relevantAudits = [
    'render-blocking-resources',
    'unused-javascript',
    'unused-css-rules',
    'uses-optimized-images',
    'proper-size-images',
    'modern-image-formats',
    'font-display',
    'efficient-animated-content',
    'total-byte-weight',
    'dom-size',
    'lcp-lazy-loaded'
  ];

  for (const auditKey of relevantAudits) {
    const audit = data.audits[auditKey];
    if (!audit) continue;
    
    // Only display if score < 1 or has savings / items
    const hasDetails = audit.details && audit.details.items && audit.details.items.length > 0;
    const hasSavings = audit.numericValue > 0 || (audit.details && audit.details.overallSavingsMs > 0) || (audit.details && audit.details.overallSavingsBytes > 0);
    
    if (audit.score !== 1 || hasSavings || hasDetails) {
      console.log(`\n* Audit: ${audit.title} (${auditKey})`);
      console.log(`  Score: ${audit.score}, Value: ${audit.displayValue || audit.numericValue}`);
      if (audit.details?.overallSavingsMs) console.log(`  Savings: ${audit.details.overallSavingsMs} ms`);
      if (audit.details?.overallSavingsBytes) console.log(`  Savings: ${Math.round(audit.details.overallSavingsBytes / 1024)} KiB`);
      
      if (audit.details?.items) {
        for (const item of audit.details.items.slice(0, 10)) {
          const url = item.url || item.node?.snippet || item.source?.url || '';
          const savings = item.wastedBytes ? `${Math.round(item.wastedBytes / 1024)} KiB` : item.wastedMs ? `${item.wastedMs} ms` : '';
          console.log(`    - Item: ${url} | ${savings} | ${item.totalBytes ? Math.round(item.totalBytes / 1024) + ' KiB total' : ''}`);
        }
      }
    }
  }
}
