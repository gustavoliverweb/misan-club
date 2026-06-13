CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID,
  store_order_id UUID,
  concepto TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW()
);
