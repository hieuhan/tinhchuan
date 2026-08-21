// Seed dữ liệu ban đầu - chạy bằng: npx tsx src/seed.ts (trong thư mục
// packages/database). Xem Checklist_Phase1.md Tuần 2: legal_source,
// tax_rule_category, tax_rule_version.
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

async function main() {
  // TODO: thêm dữ liệu seed cho tax_rule_version (ngưỡng 1 tỷ, hiệu lực 2026-01-01)
}

main();
