import {
  pgTable,
  serial,
  text,
  timestamp,
  date,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';

// Enums
export const usersStatusEnum = pgEnum('users_status', ['active', 'disabled']);

export const taxRuleVersionStatusEnum = pgEnum('tax_rule_version_status', [
  'draft',
  'pending_review',
  'approved',
  'rejected',
]);

export const sourceConflictStatusEnum = pgEnum('source_conflict_status', [
  'open',
  'resolved',
]);

export const contentPageTypeEnum = pgEnum('content_page_type', [
  'tool',
  'knowledge',
  'faq',
]);

export const contentPageStatusEnum = pgEnum('content_page_status', [
  'draft',
  'pending_review',
  'approved',
  'published',
]);

// 1. users: Tài khoản quản trị nội bộ
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  status: usersStatusEnum('status').default('active').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. legal_source: Văn bản pháp luật trích dẫn
export const legalSource = pgTable('legal_source', {
  id: serial('id').primaryKey(),
  documentNumber: text('document_number').notNull(),
  documentType: text('document_type').notNull(),
  title: text('title').notNull(),
  issuingBody: text('issuing_body').notNull(),
  issuedDate: date('issued_date').notNull(),
  effectiveDate: date('effective_date').notNull(),
  sourceUrl: text('source_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. tax_rule_category: Phân loại quy tắc thuế
export const taxRuleCategory = pgTable('tax_rule_category', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. tax_rule_version: Phiên bản quy tắc thuế (versioning, chỉ insert, không update)
export const taxRuleVersion = pgTable('tax_rule_version', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => taxRuleCategory.id)
    .notNull(),
  legalSourceId: integer('legal_source_id')
    .references(() => legalSource.id)
    .notNull(),
  ruleValue: jsonb('rule_value').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  status: taxRuleVersionStatusEnum('status').default('draft').notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. source_conflict: Theo dõi mâu thuẫn văn bản pháp luật
export const sourceConflict = pgTable('source_conflict', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => taxRuleCategory.id),
  conflictingSources: jsonb('conflicting_sources').notNull(),
  description: text('description').notNull(),
  status: sourceConflictStatusEnum('status').default('open').notNull(),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. content_page: Trang nội dung Tool / FAQ / Knowledge
export const contentPage = pgTable('content_page', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  pageType: contentPageTypeEnum('page_type').notNull(),
  title: text('title').notNull(),
  metaDescription: text('meta_description').notNull(),
  content: text('content').notNull(),
  faqItems: jsonb('faq_items'),
  status: contentPageStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. content_page_tax_rule: Bảng nối giữa trang nội dung và phiên bản quy tắc thuế
export const contentPageTaxRule = pgTable(
  'content_page_tax_rule',
  {
    contentPageId: integer('content_page_id')
      .references(() => contentPage.id)
      .notNull(),
    taxRuleVersionId: integer('tax_rule_version_id')
      .references(() => taxRuleVersion.id)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.contentPageId, table.taxRuleVersionId] }),
  ]
);
