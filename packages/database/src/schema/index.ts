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
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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

export const crawlWatchSourceTypeEnum = pgEnum('crawl_watch_source_type', [
  'government_portal',
  'news',
  'other',
]);

export const crawlWatchSourceLastCheckStatusEnum = pgEnum(
  'crawl_watch_source_last_check_status',
  ['success', 'failed', 'never_run']
);

export const crawlDetectedItemAiClassificationEnum = pgEnum(
  'crawl_detected_item_ai_classification',
  ['pending', 'relevant', 'not_relevant']
);

export const crawlDetectedItemExtractionMethodEnum = pgEnum(
  'crawl_detected_item_extraction_method',
  ['text_layer', 'vision_ocr']
);

export const crawlDetectedItemStatusEnum = pgEnum(
  'crawl_detected_item_status',
  [
    'pending_classification',
    'pending_review',
    'confirmed',
    'rejected',
    'content_generated',
  ]
);

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
  sourceFileUrl: text('source_file_url'),
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

// 8. crawl_watch_source: Nguồn theo dõi scan văn bản pháp luật mới
export const crawlWatchSource = pgTable('crawl_watch_source', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  listingUrl: text('listing_url').notNull(),
  sourceType: crawlWatchSourceTypeEnum('source_type').notNull(),
  parserKey: text('parser_key').default('congbao_chinhphu').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastCheckedAt: timestamp('last_checked_at'),
  lastCheckStatus: crawlWatchSourceLastCheckStatusEnum('last_check_status')
    .default('never_run')
    .notNull(),
  lastCheckError: text('last_check_error'),
  consecutiveFailures: integer('consecutive_failures').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. crawl_detected_item: Văn bản mới phát hiện từ nguồn theo dõi
export const crawlDetectedItem = pgTable('crawl_detected_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  watchSourceId: uuid('watch_source_id')
    .references(() => crawlWatchSource.id)
    .notNull(),
  title: text('title').notNull(),
  detectUrl: text('detect_url').unique().notNull(),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  aiClassification: crawlDetectedItemAiClassificationEnum('ai_classification')
    .default('pending')
    .notNull(),
  aiClassificationReason: text('ai_classification_reason'),
  sourceFileUrl: text('source_file_url'), // Object key (đường dẫn tương đối) của file trong bucket MinIO (vd: detected-items/uuid.pdf)
  extractionMethod: crawlDetectedItemExtractionMethodEnum('extraction_method'),
  extractedText: text('extracted_text'),
  status: crawlDetectedItemStatusEnum('status')
    .default('pending_classification')
    .notNull(),
  legalSourceId: integer('legal_source_id').references(() => legalSource.id),
  telegramMessageId: text('telegram_message_id'),
  adminNotes: text('admin_notes'),
  // Metadata tham khảo trích xuất tự động từ trang nguồn, dùng để prefill form xác nhận cho admin - KHÔNG phải nguồn xác thực cuối cùng
  documentNumber: text('document_number'),
  documentType: text('document_type'),
  issuingBody: text('issuing_body'),
  issuedDate: date('issued_date'),
  effectiveDate: date('effective_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const crawlWatchSourceRelations = relations(
  crawlWatchSource,
  ({ many }) => ({
    detectedItems: many(crawlDetectedItem),
  })
);

export const crawlDetectedItemRelations = relations(
  crawlDetectedItem,
  ({ one }) => ({
    watchSource: one(crawlWatchSource, {
      fields: [crawlDetectedItem.watchSourceId],
      references: [crawlWatchSource.id],
    }),
    legalSource: one(legalSource, {
      fields: [crawlDetectedItem.legalSourceId],
      references: [legalSource.id],
    }),
  })
);

export const legalSourceRelations = relations(legalSource, ({ many }) => ({
  detectedItems: many(crawlDetectedItem),
}));

