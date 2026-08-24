/**
 * Formula Engine - Tính thuế bán hàng online (Tool 1)
 *
 * Căn cứ pháp lý:
 *   - Nghị quyết 198/2025/QH15 → Luật Thuế TNCN 2025 (Luật 109/2025/QH15)
 *   - Luật Thuế GTGT 2024 (Luật 48/2024/QH15)
 *   - Nghị định 68/2026/NĐ-CP (5/3/2026)
 *   - Nghị định 141/2026/NĐ-CP (29/4/2026, hiệu lực hồi tố từ 1/1/2026)
 *     → Sửa ngưỡng doanh thu miễn thuế từ 500 triệu lên 1 tỷ đồng/năm.
 *
 * Nhóm ngành Tool 1: Phân phối / cung cấp hàng hóa (TMĐT)
 *   - Thuế GTGT: 1% (KHÔNG trừ ngưỡng)
 *   - Thuế TNCN: 0,5% (CÓ trừ ngưỡng)
 *
 * QUAN TRỌNG: GTGT và TNCN có cách trừ ngưỡng KHÁC NHAU — đây là lỗi dễ mắc nhất.
 * Ví dụ kiểm chứng: doanh thu 1,8 tỷ →
 *   vatTax = 1.800.000.000 × 1% = 18.000.000đ  (tính trên TOÀN BỘ doanh thu)
 *   pitTax = 800.000.000 × 0,5% = 4.000.000đ   (tính trên phần VƯỢt ngưỡng)
 *
 * Phase 1 chỉ hỗ trợ dải doanh thu TRÊN NGƯỠNG ĐẾN 3 TỶ, không xác định chi phí.
 * Phase sau: dải 3-50 tỷ (17%), trên 50 tỷ (20%), và nhánh xác định chi phí đầu vào.
 */

// File này là module THUẦN — KHÔNG import DB, KHÔNG import Next.js.
// Nhận tham số đã được repository truyền vào, trả kết quả tính toán.

/** Giới hạn doanh thu Phase 1 hỗ trợ (đến 3 tỷ/năm) */
const PHASE1_MAX_REVENUE = 3_000_000_000;

/**
 * Cấu trúc ruleValue lưu trong tax_rule_version.rule_value (jsonb).
 * Tên field dùng tiếng Anh ngắn gọn để phù hợp lưu trong jsonb.
 * Không đổi sang camelCase dài vì sẽ break dữ liệu trong DB.
 */
export interface OnlineTaxRuleValue {
  threshold: number; // Ngưỡng doanh thu miễn thuế (VND/năm), hiện tại = 1_000_000_000
  vatRate: number;   // Thuế suất GTGT (decimal), hiện tại = 0.01
  pitRate: number;   // Thuế suất TNCN (decimal), hiện tại = 0.005
}

/** Tham số đầu vào hàm tính thuế */
export interface TaxCalculationInput {
  revenue: number;              // Doanh thu năm (VND)
  ruleValue: OnlineTaxRuleValue;
}

/** Kết quả tính thuế - tất cả số tiền đã làm tròn về đồng nguyên (VND) */
export interface TaxCalculationResult {
  vatTax: number;         // Thuế GTGT phải nộp (VND, số nguyên)
  pitTax: number;         // Thuế TNCN phải nộp (VND, số nguyên)
  totalTax: number;       // Tổng thuế = vatTax + pitTax (VND, số nguyên)
  isTaxable: boolean;     // true nếu revenue > threshold (thuộc diện chịu thuế)
}

/**
 * Tính thuế bán hàng online cho hộ/cá nhân kinh doanh trên sàn TMĐT.
 *
 * Công thức (Phase 1 - dải trên ngưỡng đến 3 tỷ, không xác định chi phí đầu vào):
 *   Nếu revenue ≤ threshold:
 *     → Miễn thuế hoàn toàn (vatTax = pitTax = 0)
 *   Nếu threshold < revenue ≤ 3 tỷ:
 *     vatTax = Math.round(revenue × vatRate)               // KHÔNG trừ ngưỡng
 *     pitTax = Math.round((revenue − threshold) × pitRate) // CÓ trừ ngưỡng
 *
 * @throws Error nếu revenue > 3 tỷ (Phase 1 chưa hỗ trợ, tránh trả số sai)
 */
export function calculateOnlineTax(input: TaxCalculationInput): TaxCalculationResult {
  const { revenue, ruleValue } = input;
  const { threshold, vatRate, pitRate } = ruleValue;

  // Chặn phạm vi doanh thu vượt ngoài Phase 1
  // Không trả số sai vì công thức 1%/0,5% không đúng với dải này
  if (revenue > PHASE1_MAX_REVENUE) {
    throw new Error(
      'Chưa hỗ trợ mức doanh thu này (Phase 1 chỉ tính đến 3 tỷ/năm). ' +
        'Vui lòng liên hệ để được hỗ trợ thêm.'
    );
  }

  // Trường hợp dưới ngưỡng (kể cả đúng bằng ngưỡng): miễn thuế hoàn toàn
  if (revenue <= threshold) {
    return {
      vatTax: 0,
      pitTax: 0,
      totalTax: 0,
      isTaxable: false,
    };
  }

  // Trường hợp trên ngưỡng (threshold < revenue ≤ 3 tỷ)
  // GTGT: áp trên TOÀN BỘ doanh thu (không trừ ngưỡng), làm tròn về đồng nguyên
  const vatTax = Math.round(revenue * vatRate);

  // TNCN: chỉ áp trên phần VƯỢt ngưỡng, làm tròn về đồng nguyên
  const amountAboveThreshold = revenue - threshold;
  const pitTax = Math.round(amountAboveThreshold * pitRate);

  // Tổng: cộng sau khi đã làm tròn từng khoản (không làm tròn lại tổng)
  const totalTax = vatTax + pitTax;

  return {
    vatTax,
    pitTax,
    totalTax,
    isTaxable: true,
  };
}
