CREATE TABLE IF NOT EXISTS "store_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "seller_id" uuid NOT NULL REFERENCES "users"("id"),
  "buyer_email" varchar(255) NOT NULL DEFAULT '',
  "stripe_session_id" varchar(255) UNIQUE,
  "status" "order_status" NOT NULL DEFAULT 'pending',
  "total_amount" numeric(10, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "store_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "store_orders"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "quantity" integer NOT NULL,
  "unit_price" numeric(10, 2) NOT NULL,
  "commission_base" numeric(10, 2) NOT NULL,
  "commission_category" "product_category" NOT NULL,
  "porcentaje_n1" numeric(5, 4) NOT NULL,
  "porcentaje_n2" numeric(5, 4) NOT NULL,
  "porcentaje_n3" numeric(5, 4) NOT NULL,
  "porcentaje_n4" numeric(5, 4) NOT NULL,
  "porcentaje_n5" numeric(5, 4) NOT NULL,
  "porcentaje_pool" numeric(5, 4) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
