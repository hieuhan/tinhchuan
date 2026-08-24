'use server';

import { getActiveTaxRule } from '@/lib/db/tax-rule-repository';
import {
  calculateOnlineTax,
  type TaxCalculationResult,
  type OnlineTaxRuleValue,
} from '@/lib/formula-engine/tinh-thue-ban-hang-online';

/** Dữ liệu đầu vào từ form UI */
export interface TaxFormInput {
  revenue: number; // Doanh thu năm (VND), do người dùng nhập
}

// Phân loại lỗi để UI hiển thị thông báo đúng
export type TaxCalculationErrorCode =
  | 'INVALID_INPUT'     // revenue không hợp lệ (âm, NaN...)
  | 'OVER_PHASE1_LIMIT' // revenue > 3 tỷ, Phase 1 chưa hỗ trợ
  | 'NO_ACTIVE_RULE'    // Không có rule status='approved' cho ngày hôm nay
  | 'DB_UNAVAILABLE'    // DB không kết nối được (ECONNREFUSED, timeout...)
  | 'UNKNOWN';          // Lỗi bất ngờ khác

/** Kết quả thành công */
export interface TaxActionSuccess {
  ok: true;
  result: TaxCalculationResult;
  ruleValue: OnlineTaxRuleValue;
  legalSource: {
    documentNumber: string;
    documentType: string;
    title: string;
    issuingBody: string;
    sourceUrl: string;
    effectiveDate: string;
  };
}

/** Kết quả lỗi — trả về object thay vì throw, vì Next.js Server Actions
 *  không truyền Error.message qua mạng về client component */
export interface TaxActionError {
  ok: false;
  errorCode: TaxCalculationErrorCode;
}

export type TaxActionResult = TaxActionSuccess | TaxActionError;

/**
 * Lấy dữ liệu thuế: ưu tiên DB thật, fallback sang mock CHỈ khi
 * ALLOW_MOCK_TAX_DATA=true được set tường minh trong môi trường.
 *
 * Trả về null nếu không có rule được duyệt (kể cả với mock).
 * Throw lỗi nếu DB không khả dụng và mock không được bật — để caller
 * phân biệt được "không có rule" với "DB bị lỗi".
 */
export async function resolveActiveTaxRule() {
  try {
    return await getActiveTaxRule();
  } catch (dbError) {
    // DB không kết nối được — kiểm tra có được phép dùng mock không
    if (process.env.ALLOW_MOCK_TAX_DATA === 'true') {
      // Dynamic import chỉ tách chunk/lazy-load lúc runtime (không loại code khỏi server build).
      // An toàn không lộ ra client vì action.ts là Server Action ('use server'), thực thi 100% trên server.
      const { MOCK_ACTIVE_TAX_RULE } = await import(
        '@/lib/formula-engine/mock-tax-data'
      );
      console.warn(
        '[calculateTax] CẢNH BÁO: Đang dùng MOCK_TAX_DATA thay vì DB thật.',
        'Set ALLOW_MOCK_TAX_DATA=true chỉ dùng trong môi trường dev cục bộ.'
      );
      return MOCK_ACTIVE_TAX_RULE;
    }

    // Không có mock → ném lỗi nguyên bản để caller xử lý đúng loại
    throw dbError;
  }
}

/**
 * Server Action: Tính thuế bán hàng online cho một mức doanh thu nhập vào.
 *
 * Luồng xử lý:
 *   1. Validate input: revenue phải là số không âm, không vượt 3 tỷ.
 *   2. Lấy quy tắc thuế đang có hiệu lực từ DB (CHỈ status='approved').
 *      - Nếu DB lỗi → trả DB_UNAVAILABLE (không dùng mock âm thầm).
 *      - Nếu không có rule được duyệt → trả NO_ACTIVE_RULE.
 *      - Ngoại lệ dev: ALLOW_MOCK_TAX_DATA=true trong .env.development.local
 *        → dùng mock-tax-data.ts thay vì báo lỗi (phải set tường minh).
 *   3. Gọi Formula Engine tính thuế.
 *   4. Trả kết quả kèm trích dẫn pháp lý từ DB.
 *
 * Trả về { ok: false, errorCode } thay vì throw — vì Next.js Server Actions
 * không forward Error.message qua mạng về client (security sandboxing).
 * Client dùng errorCode để chọn thông báo thân thiện phù hợp.
 */
export async function calculateTax(input: TaxFormInput): Promise<TaxActionResult> {
  // Validate đầu vào cơ bản
  if (typeof input.revenue !== 'number' || isNaN(input.revenue) || input.revenue < 0) {
    return { ok: false, errorCode: 'INVALID_INPUT' };
  }

  // Kiểm tra giới hạn Phase 1 trước khi truy vấn DB
  if (input.revenue > 3_000_000_000) {
    return { ok: false, errorCode: 'OVER_PHASE1_LIMIT' };
  }

  // Lấy quy tắc thuế đang có hiệu lực (chỉ status='approved')
  let activeRule;
  try {
    activeRule = await resolveActiveTaxRule();
  } catch (dbError) {
    // Log chi tiết kỹ thuật ra server để dễ debug trên Mac Mini
    console.error(
      '[calculateTax] Lỗi kết nối DB khi truy vấn tax_rule_version:',
      dbError instanceof Error
        ? { message: dbError.message, code: (dbError as NodeJS.ErrnoException).code }
        : dbError
    );
    return { ok: false, errorCode: 'DB_UNAVAILABLE' };
  }

  // Không có rule được duyệt cho ngày hôm nay
  if (!activeRule) {
    console.error(
      '[calculateTax] Không tìm thấy tax_rule_version status=approved cho ngày:',
      new Date().toISOString().slice(0, 10)
    );
    return { ok: false, errorCode: 'NO_ACTIVE_RULE' };
  }

  // Tính thuế qua Formula Engine (module thuần, không phụ thuộc DB/Next.js)
  try {
    const result = calculateOnlineTax({
      revenue: input.revenue,
      ruleValue: activeRule.ruleValue,
    });

    return {
      ok: true,
      result,
      ruleValue: activeRule.ruleValue,
      legalSource: {
        documentNumber: activeRule.legalSourceInfo.documentNumber,
        documentType: activeRule.legalSourceInfo.documentType,
        title: activeRule.legalSourceInfo.title,
        issuingBody: activeRule.legalSourceInfo.issuingBody,
        sourceUrl: activeRule.legalSourceInfo.sourceUrl,
        effectiveDate: activeRule.legalSourceInfo.effectiveDate,
      },
    };
  } catch (formulaError) {
    // Lỗi bất ngờ từ Formula Engine (không nên xảy ra do đã validate ở trên)
    console.error('[calculateTax] Lỗi từ Formula Engine:', formulaError);
    return { ok: false, errorCode: 'UNKNOWN' };
  }
}
