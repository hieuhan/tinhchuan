import { db, taxRuleVersion, taxRuleCategory, legalSource } from '@tinhchuan/database';
import { eq, and, lte, or, isNull, gte } from 'drizzle-orm';
import type { OnlineTaxRuleValue } from '@/lib/formula-engine/tinh-thue-ban-hang-online';

// Mã danh mục quy tắc cho Tool 1 (phải khớp seed.ts)
const CATEGORY_CODE = 'revenue_threshold_individual_business';

/** Kết quả trả về từ repository, kèm thông tin trích dẫn pháp lý */
export interface TaxRuleWithSource {
  ruleValue: OnlineTaxRuleValue;
  legalSourceInfo: {
    documentNumber: string;
    documentType: string;
    title: string;
    issuingBody: string;
    issuedDate: string;
    effectiveDate: string;
    sourceUrl: string;
  };
  effectiveFrom: string;
  effectiveTo: string | null;
}

/**
 * Lấy quy tắc thuế bán hàng online đang có hiệu lực tại một ngày cụ thể.
 *
 * Điều kiện lọc bắt buộc (AGENTS.md mục 5):
 *   - status = 'approved'  (KHÔNG BAO GIỜ trả draft/pending)
 *   - effectiveFrom <= asOfDate
 *   - effectiveTo IS NULL HOẶC effectiveTo >= asOfDate
 *   - category.code = 'revenue_threshold_individual_business'
 *
 * @param asOfDate Ngày cần tra cứu, dạng 'YYYY-MM-DD'. Mặc định là ngày hôm nay.
 * @returns Quy tắc có hiệu lực, hoặc null nếu không tìm thấy.
 */
export async function getActiveTaxRule(
  asOfDate?: string
): Promise<TaxRuleWithSource | null> {
  // Định dạng ngày tra cứu về 'YYYY-MM-DD'
  const queryDate = asOfDate ?? new Date().toISOString().slice(0, 10);

  let rows;
  try {
    rows = await db
      .select({
        ruleValue: taxRuleVersion.ruleValue,
        effectiveFrom: taxRuleVersion.effectiveFrom,
        effectiveTo: taxRuleVersion.effectiveTo,
        documentNumber: legalSource.documentNumber,
        documentType: legalSource.documentType,
        title: legalSource.title,
        issuingBody: legalSource.issuingBody,
        issuedDate: legalSource.issuedDate,
        effectiveDate: legalSource.effectiveDate,
        sourceUrl: legalSource.sourceUrl,
      })
      .from(taxRuleVersion)
      .innerJoin(taxRuleCategory, eq(taxRuleVersion.categoryId, taxRuleCategory.id))
      .innerJoin(legalSource, eq(taxRuleVersion.legalSourceId, legalSource.id))
      .where(
        and(
          // CHỈ đọc dữ liệu đã được con người duyệt (AGENTS.md mục 5)
          eq(taxRuleVersion.status, 'approved'),
          // Khớp danh mục Tool 1
          eq(taxRuleCategory.code, CATEGORY_CODE),
          // Quy tắc đã có hiệu lực vào ngày tra cứu
          lte(taxRuleVersion.effectiveFrom, queryDate),
          // Quy tắc chưa hết hiệu lực (NULL = vô thời hạn)
          or(
            isNull(taxRuleVersion.effectiveTo),
            gte(taxRuleVersion.effectiveTo, queryDate)
          )
        )
      )
      .orderBy(taxRuleVersion.effectiveFrom)
      .limit(1);
  } catch (dbErr) {
    // Chuẩn hóa lỗi: bọc lại DrizzleQueryError/AggregateError để tránh pg-pool AggregateError (có errors=null) làm crash V8/Turbopack error inspector khi log
    const errorMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
    throw new Error(`DB connection/query error: ${errorMessage}`);
  }

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    // ruleValue là jsonb — cast về đúng kiểu, validate ở tầng formula-engine
    ruleValue: row.ruleValue as OnlineTaxRuleValue,
    legalSourceInfo: {
      documentNumber: row.documentNumber,
      documentType: row.documentType,
      title: row.title,
      issuingBody: row.issuingBody,
      issuedDate: row.issuedDate,
      effectiveDate: row.effectiveDate,
      sourceUrl: row.sourceUrl,
    },
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo ?? null,
  };
}
