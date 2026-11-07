-- Pré-estoque: um produto modelo (10 unidades) em cada categoria; preços a preencher.
-- Execute SOMENTE UMA VEZ em uma base vazia.
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — CERVEJAS','CERVEJAS','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — CERVEJAS');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — DESTILADOS','DESTILADOS','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — DESTILADOS');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — DRINKS','DRINKS','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — DRINKS');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — SALGADINHOS','SALGADINHOS','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — SALGADINHOS');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — DOCES','DOCES','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — DOCES');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — LANCHES','LANCHES','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — LANCHES');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — PORÇÕES','PORÇÕES','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — PORÇÕES');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — CIGARROS','CIGARROS','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — CIGARROS');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — TABACARIA','TABACARIA','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — TABACARIA');
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price) SELECT 'Produto inicial — OUTROS','OUTROS','simple','un',10,0,0,0 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Produto inicial — OUTROS');
