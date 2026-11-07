-- CRM CONVENIENCIA v1.1.0 | Produtos reais (45 itens) | PRECO EM CENTAVOS
-- Script idempotente: nao duplica produtos de mesmo nome/categoria.
-- Por seguranca, nao modifica produtos ja existentes nem vendas.
-- Os 10 itens provisórios da v1.0 ficam desativados por outro script opcional.
WITH incoming(name,category,kind,unit,stock,cost,price) AS (
  VALUES
    ('Heineken lata 350 ml', 'CERVEJAS', 'simple', 'un', 10, 0, 950),
    ('Heineken long neck 330 ml', 'CERVEJAS', 'simple', 'un', 10, 0, 1050),
    ('Heineken 0% lata 350 ml', 'CERVEJAS', 'simple', 'un', 10, 0, 950),
    ('Amstel lata 350 ml', 'CERVEJAS', 'simple', 'un', 10, 0, 450),
    ('Antarctica lata 350 ml', 'CERVEJAS', 'simple', 'un', 10, 0, 450),
    ('Original lata 350 ml', 'CERVEJAS', 'simple', 'un', 10, 0, 600),
    ('Coca-Cola lata 350 ml', 'REFRIGERANTES', 'simple', 'un', 10, 0, 450),
    ('Fanta lata 350 ml', 'REFRIGERANTES', 'simple', 'un', 10, 0, 450),
    ('Sukita lata 350 ml', 'REFRIGERANTES', 'simple', 'un', 10, 0, 450),
    ('Guaraná lata 350 ml', 'REFRIGERANTES', 'simple', 'un', 10, 0, 450),
    ('Pepsi lata 350 ml', 'REFRIGERANTES', 'simple', 'un', 10, 0, 450),
    ('Velho Barreiro 900 ml', 'DESTILADOS', 'ingredient', 'ml', 9000, 0, 0),
    ('Vermute tinto Fiorini 900 ml', 'DESTILADOS', 'ingredient', 'ml', 9000, 0, 0),
    ('Campari Bitter 900 ml', 'DESTILADOS', 'ingredient', 'ml', 9000, 0, 0),
    ('Conhaque São João da Barra 900 ml', 'DESTILADOS', 'ingredient', 'ml', 9000, 0, 0),
    ('Conhaque Dreher 900 ml', 'DESTILADOS', 'ingredient', 'ml', 9000, 0, 0),
    ('Ruffles', 'SALGADINHOS', 'simple', 'un', 10, 0, 1000),
    ('Fandangos queijo', 'SALGADINHOS', 'simple', 'un', 10, 0, 1000),
    ('Fandangos presunto', 'SALGADINHOS', 'simple', 'un', 10, 0, 1000),
    ('Doritos', 'SALGADINHOS', 'simple', 'un', 10, 0, 1000),
    ('Doce de abóbora', 'DOCES', 'simple', 'un', 10, 0, 200),
    ('Maria Cachucha', 'DOCES', 'simple', 'un', 10, 0, 200),
    ('Doce de amendoim', 'DOCES', 'simple', 'un', 10, 0, 200),
    ('Pé de moleque', 'DOCES', 'simple', 'un', 10, 0, 200),
    ('Doce de leite', 'DOCES', 'simple', 'un', 10, 0, 200),
    ('Chesterfield', 'CIGARROS', 'simple', 'un', 10, 0, 1100),
    ('Classic', 'CIGARROS', 'simple', 'un', 10, 0, 800),
    ('Rothmans', 'CIGARROS', 'simple', 'un', 10, 0, 950),
    ('Camel', 'CIGARROS', 'simple', 'un', 10, 0, 1200),
    ('X-Burger', 'LANCHES', 'simple', 'un', 10, 0, 2000),
    ('X-Salada', 'LANCHES', 'simple', 'un', 10, 0, 2300),
    ('X-Bacon', 'LANCHES', 'simple', 'un', 10, 0, 2700),
    ('X-Frango', 'LANCHES', 'simple', 'un', 10, 0, 2500),
    ('X-Calabresa', 'LANCHES', 'simple', 'un', 10, 0, 2600),
    ('X-Tudo', 'LANCHES', 'simple', 'un', 10, 0, 3200),
    ('Batata 300 g', 'PORÇÕES', 'simple', 'un', 10, 0, 2990),
    ('Mandioca 300 g', 'PORÇÕES', 'simple', 'un', 10, 0, 2390),
    ('Polenta 300 g', 'PORÇÕES', 'simple', 'un', 10, 0, 1990),
    ('Lambari 400 g', 'PORÇÕES', 'simple', 'un', 10, 0, 5990),
    ('Coraçãozinho de frango 400 g', 'PORÇÕES', 'simple', 'un', 10, 0, 4990),
    ('Carvão para narguilé', 'TABACARIA', 'simple', 'un', 10, 0, 600),
    ('Essência para narguilé', 'TABACARIA', 'simple', 'un', 10, 0, 2900),
    ('Alumínio', 'TABACARIA', 'simple', 'un', 10, 0, 200),
    ('Seda unidade', 'TABACARIA', 'simple', 'un', 10, 0, 50),
    ('Seda caixa', 'TABACARIA', 'simple', 'un', 10, 0, 600)
)
INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price)
SELECT i.name, i.category, i.kind, i.unit, i.stock, 0, CASE WHEN i.kind='ingredient' THEN 0 ELSE CAST(ROUND(i.price * 0.70) AS INTEGER) END, i.price
FROM incoming AS i
WHERE NOT EXISTS (
 SELECT 1 FROM products AS p WHERE p.name=i.name AND p.category=i.category
);
