CREATE TYPE "public"."product_category" AS ENUM('standard', 'proprietary', 'reduced', 'membership', 'service');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "product_category" "product_category";--> statement-breakpoint
CREATE TABLE "pool_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category" "product_category",
	"amount" numeric(12, 2) NOT NULL,
	"quarter" varchar(7) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
