-- Execute no Console do D1 existente ANTES de utilizar VENDA FORA DE ESTOQUE. Seguro para repetir.
CREATE TABLE IF NOT EXISTS manual_sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity>0),
  unit_price INTEGER NOT NULL CHECK(unit_price>0),
  unit_cost INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_manual_sale_items_sale ON manual_sale_items(sale_id);

CREATE TABLE IF NOT EXISTS order_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id), amount INTEGER NOT NULL CHECK(amount>0), method TEXT NOT NULL, note TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS ix_order_payments_order ON order_payments(order_id);
