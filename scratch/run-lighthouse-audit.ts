import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const targets = [
  { name: 'Trang chủ', slug: 'home', url: 'https://tinhchuan.vn/' },
  { name: 'Tool tính thuế bán hàng online', slug: 'tool-thue-ban-hang-online', url: 'https://tinhchuan.vn/tool/thue-ban-hang-online' },
  { name: 'Bài viết 1 (Cách tính thuế Shopee/TikTok)', slug: 'kien-thuc-cach-tinh-thue-shopee-tiktok', url: 'https://tinhchuan.vn/kien-thuc/cach-tinh-thue-ban-hang-tren-shopee-tiktok' },
  { name: 'Bài viết 2 (Nghị định 141/2026)', slug: 'kien-thuc-nghi-dinh-141-2026', url: 'https://tinhchuan.vn/kien-thuc/nghi-dinh-141-2026-thay-doi-gi' },
  { name: 'Bài viết 3 (Ngưỡng doanh thu 2026)', slug: 'kien-thuc-nguong-doanh-thu-2026', url: 'https://tinhchuan.vn/kien-thuc/nguong-doanh-thu-chiu-thue-ban-hang-online-2026' },
];

async function runAudits() {
  console.log('🚀 Bắt đầu chạy Lighthouse audit cho 5 URL (10 lượt: Mobile & Desktop)...');

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    console.log(`\n================ [${i + 1}/5] ${target.name} ================`);
    console.log(`URL: ${target.url}`);

    // 1. Mobile
    const mobileOutPath = `./lighthouse-reports/${target.slug}-mobile`;
    console.log(`📱 [Mobile] Đang audit...`);
    const mobileCmd = `npx lighthouse "${target.url}" --output=json --output=html --output-path="${mobileOutPath}" --chrome-flags="--headless"`;
    try {
      execSync(mobileCmd, { stdio: 'inherit' });
      console.log(`   ✅ Hoàn tất Mobile: ${mobileOutPath}`);
    } catch (err: any) {
      console.error(`   ❌ Lỗi audit Mobile:`, err.message);
    }

    // 2. Desktop
    const desktopOutPath = `./lighthouse-reports/${target.slug}-desktop`;
    console.log(`💻 [Desktop] Đang audit...`);
    const desktopCmd = `npx lighthouse "${target.url}" --preset=desktop --output=json --output=html --output-path="${desktopOutPath}" --chrome-flags="--headless"`;
    try {
      execSync(desktopCmd, { stdio: 'inherit' });
      console.log(`   ✅ Hoàn tất Desktop: ${desktopOutPath}`);
    } catch (err: any) {
      console.error(`   ❌ Lỗi audit Desktop:`, err.message);
    }
  }

  console.log('\n🎉 Đã hoàn tất 10 lượt Lighthouse audit!');
}

runAudits().catch(console.error);
