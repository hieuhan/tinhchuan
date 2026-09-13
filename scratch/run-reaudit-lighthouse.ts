import { execSync } from 'child_process';
import path from 'path';

const reportsDir = path.join(process.cwd(), 'lighthouse-reports');

const tasks = [
  {
    name: 'home-mobile',
    url: 'https://tinhchuan.vn/',
    args: '--chrome-flags="--headless"'
  },
  {
    name: 'home-desktop',
    url: 'https://tinhchuan.vn/',
    args: '--preset=desktop --chrome-flags="--headless"'
  },
  {
    name: 'kien-thuc-cach-tinh-thue-shopee-tiktok-desktop',
    url: 'https://tinhchuan.vn/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok',
    args: '--preset=desktop --chrome-flags="--headless"'
  },
  {
    name: 'tool-thue-ban-hang-online-mobile',
    url: 'https://tinhchuan.vn/tool/thue-ban-hang-online',
    args: '--chrome-flags="--headless"'
  }
];

console.log('🚀 Bắt đầu chạy Re-audit Lighthouse cho 4 lượt chỉ định...\n');

for (const t of tasks) {
  const outputPath = path.join(reportsDir, t.name);
  const cmd = `npx lighthouse ${t.url} --output=json --output=html --output-path="${outputPath}" ${t.args}`;
  console.log(`▶️ Running: ${t.name}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Completed: ${t.name}\n`);
  } catch (err: any) {
    console.error(`❌ Failed: ${t.name}`, err.message);
  }
}

console.log('🎉 Re-audit hoàn tất!');
