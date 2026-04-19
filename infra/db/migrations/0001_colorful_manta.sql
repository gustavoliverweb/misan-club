CREATE TABLE "processed_external_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_order_id" varchar(255) NOT NULL,
	"member_id" uuid NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "processed_external_orders_external_order_id_unique" UNIQUE("external_order_id")
);
--> statement-breakpoint
ALTER TABLE "processed_external_orders" ADD CONSTRAINT "processed_external_orders_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;