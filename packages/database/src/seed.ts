import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from './client';
import {
  users,
  legalSource,
  taxRuleCategory,
  taxRuleVersion,
} from './schema';

// Tải biến môi trường từ file .env ở gốc dự án
if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu ban đầu...');

  // 1. Seed tài khoản Admin ban đầu
  // Mật khẩu lấy từ biến môi trường ADMIN_INITIAL_PASSWORD
  let adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ ADMIN_INITIAL_PASSWORD chưa được set trong biến môi trường! Vui lòng set ADMIN_INITIAL_PASSWORD trước khi seed trong production.'
      );
    }
    adminPassword = 'DevAdminPasswordTemp123!';
    console.warn(
      '⚠️ CẢNH BÁO: Đang dùng mật khẩu admin tạm thời cho dev (DevAdminPasswordTemp123!).'
    );
  }
  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, 'admin@tinhchuan.vn'),
  });

  if (!adminUser) {
    const [insertedUser] = await db
      .insert(users)
      .values({
        email: 'admin@tinhchuan.vn',
        passwordHash,
        name: 'Admin',
        status: 'active',
      })
      .returning();
    adminUser = insertedUser;
    console.log('✅ Đã tạo tài khoản admin:', adminUser.email);
  } else {
    console.log('ℹ️ Tài khoản admin đã tồn tại:', adminUser.email);
  }

  // 2. Seed văn bản pháp luật ban đầu (legal_source)
  const docNumber = '141/2026/NĐ-CP';
  let legalDoc = await db.query.legalSource.findFirst({
    where: eq(legalSource.documentNumber, docNumber),
  });

  if (!legalDoc) {
    const [insertedDoc] = await db
      .insert(legalSource)
      .values({
        documentNumber: docNumber,
        documentType: 'Nghị định',
        title:
          'Nghị định số 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định số 68/2026/NĐ-CP quy định về chính sách thuế đối với hộ kinh doanh, cá nhân kinh doanh',
        issuingBody: 'Chính phủ',
        issuedDate: '2026-04-29',
        effectiveDate: '2026-01-01',
        sourceUrl:
          'https://vanban.chinhphu.vn/?pageid=27160&docid=217960',
      })
      .returning();
    legalDoc = insertedDoc;
    console.log('✅ Đã tạo legal_source:', legalDoc.documentNumber);
  } else {
    const [updatedDoc] = await db
      .update(legalSource)
      .set({
        title:
          'Nghị định số 141/2026/NĐ-CP sửa đổi, bổ sung một số điều của Nghị định số 68/2026/NĐ-CP quy định về chính sách thuế đối với hộ kinh doanh, cá nhân kinh doanh',
        sourceUrl:
          'https://vanban.chinhphu.vn/?pageid=27160&docid=217960',
      })
      .where(eq(legalSource.id, legalDoc.id))
      .returning();
    legalDoc = updatedDoc;
    console.log('ℹ️ Đã cập nhật legal_source:', legalDoc.documentNumber);
  }

  // 3. Seed danh mục quy tắc thuế (tax_rule_category)
  const categoryCode = 'revenue_threshold_individual_business';
  let category = await db.query.taxRuleCategory.findFirst({
    where: eq(taxRuleCategory.code, categoryCode),
  });

  if (!category) {
    const [insertedCategory] = await db
      .insert(taxRuleCategory)
      .values({
        code: categoryCode,
        name: 'Ngưỡng doanh thu chịu thuế hộ kinh doanh cá thể',
        description:
          'Quy định về ngưỡng doanh thu miễn thuế GTGT, TNCN và mức thuế suất áp dụng cho hộ, cá nhân kinh doanh',
      })
      .returning();
    category = insertedCategory;
    console.log('✅ Đã tạo tax_rule_category:', category.code);
  } else {
    console.log('ℹ️ tax_rule_category đã tồn tại:', category.code);
  }

  // 4. Seed phiên bản quy tắc thuế (tax_rule_version)
  const existingVersion = await db.query.taxRuleVersion.findFirst({
    where: and(
      eq(taxRuleVersion.categoryId, category.id),
      eq(taxRuleVersion.legalSourceId, legalDoc.id),
      eq(taxRuleVersion.effectiveFrom, '2026-01-01')
    ),
  });

  if (!existingVersion) {
    const [insertedVersion] = await db
      .insert(taxRuleVersion)
      .values({
        categoryId: category.id,
        legalSourceId: legalDoc.id,
        ruleValue: {
          threshold: 1000000000,
          vatRate: 0.01,
          pitRate: 0.005,
        },
        effectiveFrom: '2026-01-01',
        effectiveTo: null,
        status: 'approved',
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      })
      .returning();
    console.log('✅ Đã tạo tax_rule_version ID:', insertedVersion.id);
  } else {
    console.log('ℹ️ tax_rule_version đã tồn tại ID:', existingVersion.id);
  }

  console.log('🎉 Seed dữ liệu thành công!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
