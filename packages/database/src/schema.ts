// TODO: Định nghĩa các bảng (pgTable) tại đây theo data_engine_schema.sql
// Ví dụ mẫu (xoá khi bắt đầu định nghĩa bảng thật):
//
// import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
//
// export const taxRuleVersion = pgTable('tax_rule_version', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   effectiveFrom: timestamp('effective_from').notNull(),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
// });

// Export rỗng bắt buộc để file được nhận diện là module hợp lệ khi chưa có
// bảng nào - xoá dòng dưới ngay khi thêm bảng thật đầu tiên ở trên.
export {};
