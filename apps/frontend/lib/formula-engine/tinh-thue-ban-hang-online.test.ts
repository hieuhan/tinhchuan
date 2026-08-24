/**
 * Unit test cho Formula Engine Tool 1 - calculateOnlineTax()
 *
 * Chạy: npx ts-node --transpile-only apps/frontend/lib/formula-engine/tinh-thue-ban-hang-online.test.ts
 *
 * Test cases:
 *   1. Doanh thu dưới ngưỡng → miễn thuế hoàn toàn
 *   2. Doanh thu 1.8 tỷ → kiểm chứng số liệu product-spec.md
 *   3. Doanh thu đúng bằng ngưỡng (edge case) → miễn thuế
 *   4. Kết quả không có số thập phân (làm tròn đồng nguyên VND)
 *   5. Doanh thu > 3 tỷ → throw Error (không trả số sai)
 */

import {
  calculateOnlineTax,
  type OnlineTaxRuleValue,
} from './tinh-thue-ban-hang-online';

// Rule chuẩn theo seed.ts (Nghị định 141/2026/NĐ-CP)
const RULE: OnlineTaxRuleValue = {
  threshold: 1_000_000_000, // 1 tỷ đồng
  vatRate: 0.01,            // 1%
  pitRate: 0.005,           // 0.5%
};

let passed = 0;
let failed = 0;

function assert(description: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ ${description}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertThrows(description: string, fn: () => unknown, expectedMsg?: string) {
  try {
    fn();
    console.error(`  ❌ ${description}`);
    console.error(`     Expected function to throw, but it did not.`);
    failed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (expectedMsg && !msg.includes(expectedMsg)) {
      console.error(`  ❌ ${description}`);
      console.error(`     Expected error message to include: "${expectedMsg}"`);
      console.error(`     Actual message: "${msg}"`);
      failed++;
    } else {
      console.log(`  ✅ ${description} → throws: "${msg}"`);
      passed++;
    }
  }
}

// ─────────────────────────────────────────────
// TEST 1: Doanh thu dưới ngưỡng (500 triệu)
// → Miễn thuế hoàn toàn
// ─────────────────────────────────────────────
console.log('\nTest 1: Doanh thu dưới ngưỡng (500,000,000 VND)');
{
  const result = calculateOnlineTax({ revenue: 500_000_000, ruleValue: RULE });
  assert('isTaxable = false', result.isTaxable, false);
  assert('vatTax = 0', result.vatTax, 0);
  assert('pitTax = 0', result.pitTax, 0);
  assert('totalTax = 0', result.totalTax, 0);
}

// ─────────────────────────────────────────────
// TEST 2: Doanh thu trên ngưỡng (1,800,000,000 VND = 1.8 tỷ)
// Ví dụ kiểm chứng từ product-spec.md mục 3.1:
//   vatTax = 1,800,000,000 × 1% = 18,000,000đ
//   pitTax = 800,000,000 × 0.5% = 4,000,000đ
// ─────────────────────────────────────────────
console.log('\nTest 2: Doanh thu 1.8 tỷ (ví dụ kiểm chứng product-spec.md)');
{
  const result = calculateOnlineTax({ revenue: 1_800_000_000, ruleValue: RULE });
  assert('isTaxable = true', result.isTaxable, true);
  assert('vatTax = 18,000,000', result.vatTax, 18_000_000);
  assert('pitTax = 4,000,000', result.pitTax, 4_000_000);
  assert('totalTax = 22,000,000', result.totalTax, 22_000_000);
}

// ─────────────────────────────────────────────
// TEST 3: Doanh thu đúng bằng ngưỡng (1,000,000,000 VND - edge case)
// → Điều kiện `revenue <= threshold` → Miễn thuế
// ─────────────────────────────────────────────
console.log('\nTest 3: Doanh thu đúng bằng ngưỡng (1,000,000,000 VND) - edge case');
{
  const result = calculateOnlineTax({ revenue: 1_000_000_000, ruleValue: RULE });
  assert('isTaxable = false', result.isTaxable, false);
  assert('vatTax = 0', result.vatTax, 0);
  assert('pitTax = 0', result.pitTax, 0);
  assert('totalTax = 0', result.totalTax, 0);
}

// ─────────────────────────────────────────────
// TEST 4: Làm tròn đồng nguyên VND (không có số thập phân)
// Doanh thu 1,000,000,003 VND:
//   vatTax = round(1,000,000,003 × 0.01) = round(10,000,000.03) = 10,000,000
//   pitTax = round(3 × 0.005) = round(0.015) = 0
// ─────────────────────────────────────────────
console.log('\nTest 4: Làm tròn đồng nguyên VND (không được có số thập phân)');
{
  const result = calculateOnlineTax({ revenue: 1_000_000_003, ruleValue: RULE });
  assert('isTaxable = true', result.isTaxable, true);
  // Kiểm tra số nguyên (không có phần thập phân)
  assert('vatTax là số nguyên', Number.isInteger(result.vatTax), true);
  assert('pitTax là số nguyên', Number.isInteger(result.pitTax), true);
  assert('totalTax là số nguyên', Number.isInteger(result.totalTax), true);
  // Kiểm tra giá trị cụ thể sau làm tròn
  assert('vatTax = 10,000,000 (đã làm tròn)', result.vatTax, 10_000_000);
  assert('pitTax = 0 (round(0.015) = 0)', result.pitTax, 0);
}

// ─────────────────────────────────────────────
// TEST 5: Doanh thu > 3 tỷ → phải throw Error
// (Phase 1 chưa hỗ trợ, không được trả số sai)
// ─────────────────────────────────────────────
console.log('\nTest 5: Doanh thu > 3 tỷ (10,000,000,000 VND) → phải throw Error');
assertThrows(
  'revenue 10 tỷ phải throw',
  () => calculateOnlineTax({ revenue: 10_000_000_000, ruleValue: RULE }),
  'Phase 1 chỉ tính đến 3 tỷ'
);

console.log('\nTest 5b: Doanh thu đúng bằng 3 tỷ → KHÔNG throw (biên trên hợp lệ)');
{
  const result = calculateOnlineTax({ revenue: 3_000_000_000, ruleValue: RULE });
  assert('isTaxable = true', result.isTaxable, true);
  assert('vatTax = 30,000,000', result.vatTax, 30_000_000);
  assert('pitTax = 10,000,000', result.pitTax, 10_000_000);
  assert('totalTax = 40,000,000', result.totalTax, 40_000_000);
}

// ─────────────────────────────────────────────
// Tổng kết
// ─────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Kết quả: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 Tất cả test đều đúng!');
  process.exit(0);
}
