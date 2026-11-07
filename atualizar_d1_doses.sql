-- CRM CONVENIENCIA v1.1.0 | 9 apresentacoes de 5 destilados
-- Cada destilado foi armazenado em MILILITROS: 10 garrafas x 900 ml = 9000 ml.
-- Doses de 50 ml e garrafa inteira de 900 ml compartilham o MESMO saldo.
-- Conhaque Dreher: so garrafa; o preco da dose ainda nao foi informado.
WITH incoming(product_name,name,quantity,price) AS (
 VALUES
    ('Velho Barreiro 900 ml', 'Garrafa 900 ml', 900, 3990),
    ('Velho Barreiro 900 ml', 'Dose 50 ml', 50, 350),
    ('Vermute tinto Fiorini 900 ml', 'Garrafa 900 ml', 900, 4990),
    ('Vermute tinto Fiorini 900 ml', 'Dose 50 ml', 50, 400),
    ('Campari Bitter 900 ml', 'Garrafa 900 ml', 900, 8990),
    ('Campari Bitter 900 ml', 'Dose 50 ml', 50, 900),
    ('Conhaque São João da Barra 900 ml', 'Garrafa 900 ml', 900, 5990),
    ('Conhaque São João da Barra 900 ml', 'Dose 50 ml', 50, 400),
    ('Conhaque Dreher 900 ml', 'Garrafa 900 ml', 900, 5990)
)
INSERT INTO presentations(product_id,name,quantity,price)
SELECT p.id, i.name, i.quantity, i.price
FROM incoming i JOIN products p ON p.name=i.product_name AND p.category='DESTILADOS'
WHERE NOT EXISTS (
 SELECT 1 FROM presentations pr WHERE pr.product_id=p.id AND pr.name=i.name
);
