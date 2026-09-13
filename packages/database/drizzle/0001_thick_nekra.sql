CREATE TYPE "public"."crawl_detected_item_ai_classification" AS ENUM('pending', 'relevant', 'not_relevant');--> statement-breakpoint
CREATE TYPE "public"."crawl_detected_item_extraction_method" AS ENUM('text_layer', 'vision_ocr');--> statement-breakpoint
CREATE TYPE "public"."crawl_detected_item_status" AS ENUM('pending_classification', 'pending_review', 'confirmed', 'rejected', 'content_generated');--> statement-breakpoint
CREATE TYPE "public"."crawl_watch_source_last_check_status" AS ENUM('success', 'failed', 'never_run');--> statement-breakpoint
CREATE TYPE "public"."crawl_watch_source_type" AS ENUM('government_portal', 'news', 'other');--> statement-breakpoint
CREATE TABLE "crawl_detected_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"watch_source_id" uuid NOT NULL,
	"title" text NOT NULL,
	"detect_url" text NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"ai_classification" "crawl_detected_item_ai_classification" DEFAULT 'pending' NOT NULL,
	"ai_classification_reason" text,
	"pdf_file_url" text,
	"extraction_method" "crawl_detected_item_extraction_method",
	"extracted_text" text,
	"status" "crawl_detected_item_status" DEFAULT 'pending_classification' NOT NULL,
	"legal_source_id" integer,
	"telegram_message_id" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crawl_detected_item_detect_url_unique" UNIQUE("detect_url")
);
--> statement-breakpoint
CREATE TABLE "crawl_watch_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"listing_url" text NOT NULL,
	"source_type" "crawl_watch_source_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_checked_at" timestamp,
	"last_check_status" "crawl_watch_source_last_check_status" DEFAULT 'never_run' NOT NULL,
	"last_check_error" text,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_source" ADD COLUMN "source_file_url" text;--> statement-breakpoint
ALTER TABLE "crawl_detected_item" ADD CONSTRAINT "crawl_detected_item_watch_source_id_crawl_watch_source_id_fk" FOREIGN KEY ("watch_source_id") REFERENCES "public"."crawl_watch_source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_detected_item" ADD CONSTRAINT "crawl_detected_item_legal_source_id_legal_source_id_fk" FOREIGN KEY ("legal_source_id") REFERENCES "public"."legal_source"("id") ON DELETE no action ON UPDATE no action;