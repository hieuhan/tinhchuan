CREATE TYPE "public"."content_page_status" AS ENUM('draft', 'pending_review', 'approved', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_page_type" AS ENUM('tool', 'knowledge', 'faq');--> statement-breakpoint
CREATE TYPE "public"."source_conflict_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."tax_rule_version_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."users_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "content_page" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"page_type" "content_page_type" NOT NULL,
	"title" text NOT NULL,
	"meta_description" text NOT NULL,
	"content" text NOT NULL,
	"faq_items" jsonb,
	"status" "content_page_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_page_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_page_tax_rule" (
	"content_page_id" integer NOT NULL,
	"tax_rule_version_id" integer NOT NULL,
	CONSTRAINT "content_page_tax_rule_content_page_id_tax_rule_version_id_pk" PRIMARY KEY("content_page_id","tax_rule_version_id")
);
--> statement-breakpoint
CREATE TABLE "legal_source" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_number" text NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"issuing_body" text NOT NULL,
	"issued_date" date NOT NULL,
	"effective_date" date NOT NULL,
	"source_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_conflict" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"conflicting_sources" jsonb NOT NULL,
	"description" text NOT NULL,
	"status" "source_conflict_status" DEFAULT 'open' NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rule_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rule_category_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tax_rule_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"legal_source_id" integer NOT NULL,
	"rule_value" jsonb NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" "tax_rule_version_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"status" "users_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "content_page_tax_rule" ADD CONSTRAINT "content_page_tax_rule_content_page_id_content_page_id_fk" FOREIGN KEY ("content_page_id") REFERENCES "public"."content_page"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_page_tax_rule" ADD CONSTRAINT "content_page_tax_rule_tax_rule_version_id_tax_rule_version_id_fk" FOREIGN KEY ("tax_rule_version_id") REFERENCES "public"."tax_rule_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_conflict" ADD CONSTRAINT "source_conflict_category_id_tax_rule_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tax_rule_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_conflict" ADD CONSTRAINT "source_conflict_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_version" ADD CONSTRAINT "tax_rule_version_category_id_tax_rule_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tax_rule_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_version" ADD CONSTRAINT "tax_rule_version_legal_source_id_legal_source_id_fk" FOREIGN KEY ("legal_source_id") REFERENCES "public"."legal_source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rule_version" ADD CONSTRAINT "tax_rule_version_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;