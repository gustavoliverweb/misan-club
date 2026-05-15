-- Cart and Order tables for the shop checkout flow

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed');

-- One cart per user; acts as the persistent shopping bag.
CREATE TABLE carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cart line items. One row per unique product per cart.
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

-- Snapshot of a checkout: created as "pending" when Stripe session is opened,
-- flipped to "paid" inside the webhook after successful payment.
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  stripe_session_id VARCHAR(255) UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Frozen snapshot of what was ordered and at what commission rates.
-- commission_base = precio_socio used as commission calculation base regardless of who bought.
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  commission_base NUMERIC(10, 2) NOT NULL,
  is_socio_price BOOLEAN NOT NULL DEFAULT FALSE,
  commission_category product_category NOT NULL,
  porcentaje_n1 NUMERIC(5, 4) NOT NULL,
  porcentaje_n2 NUMERIC(5, 4) NOT NULL,
  porcentaje_n3 NUMERIC(5, 4) NOT NULL,
  porcentaje_n4 NUMERIC(5, 4) NOT NULL,
  porcentaje_n5 NUMERIC(5, 4) NOT NULL,
  porcentaje_pool NUMERIC(5, 4) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
