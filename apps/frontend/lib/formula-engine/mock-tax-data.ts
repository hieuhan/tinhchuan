/**
 * Mock data cho Formula Engine - CHỈ dùng khi phát triển cục bộ
 * KHÔNG BAO GIỜ import file này trong production.
 *
 * Kích hoạt bằng cách set ALLOW_MOCK_TAX_DATA=true trong
 * .env.development.local - KHÔNG tự động bật khi có lỗi kết nối DB.
 *
 * Giá trị mock phản ánh đúng seed.ts (Nghị định 141/2026/NĐ-CP)
 * để hành vi dev khớp production, dễ phát hiện sai lệch sớm.
 */

import type { TaxRuleWithSource } from '@/lib/db/tax-rule-repository';

/** Hằng số mock khớp dữ liệu seed.ts — cập nhật song song khi seed.ts thay đổi */
export const MOCK_ACTIVE_TAX_RULE: TaxRuleWithSource = {
  ruleValue: {
    threshold: 1_000_000_000, // ngưỡng miễn thuế: 1 tỷ đồng/năm
    vatRate: 0.01,            // thuế suất GTGT: 1%
    pitRate: 0.005,           // thuế suất TNCN: 0.5%
  },
  legalSourceInfo: {
    documentNumber: '141/2026/NĐ-CP',
    documentType: 'Nghị định',
    title:
      'Nghị định 141/2026/NĐ-CP quy định chi tiết ngưỡng doanh thu chịu thuế và biểu thuế đối với hộ, cá nhân kinh doanh',
    issuingBody: 'Chính phủ',
    issuedDate: '2026-04-29',
    effectiveDate: '2026-01-01',
    sourceUrl:
      'https://thuvienphapluat.vn/van-ban/Thuethiet-chu-the/Nghi-dinh-141-2026-ND-CP-placeholder',
  },
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
};
