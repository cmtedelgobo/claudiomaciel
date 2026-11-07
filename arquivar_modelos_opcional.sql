-- Opcional: desativar modelos PROVISORIOS sem vendas, receitas ou apresentacoes.
-- Nao apaga registros nem mexe em estoque de produtos reais.
UPDATE products
SET active=0
WHERE name LIKE 'Produto inicial%'
  AND cost=0 AND price=0 AND stock=10
  AND NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.product_id=products.id)
  AND NOT EXISTS (SELECT 1 FROM presentations pr WHERE pr.product_id=products.id)
  AND NOT EXISTS (SELECT 1 FROM recipes r WHERE r.product_id=products.id OR r.ingredient_id=products.id)
  AND NOT EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.product_id=products.id);
