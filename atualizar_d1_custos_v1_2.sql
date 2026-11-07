-- CUSTOS PROVISÓRIOS (70% do preço de venda). NÃO sobrescreve custos já informados.
UPDATE products SET cost=CAST(ROUND(price*0.70) AS INTEGER)
WHERE active=1 AND cost=0 AND price>0 AND category IN ('CERVEJAS','REFRIGERANTES','SALGADINHOS','DOCES','CIGARROS','LANCHES','PORÇÕES','TABACARIA');
-- Garrafas com estoque em ml: custo provisório por ml arredondado ao centavo.
-- Devido à precisão inteira em centavos, o custo por garrafa pode variar do valor exato de 70%.
UPDATE products SET cost=CASE name
WHEN 'Velho Barreiro 900 ml' THEN 3
WHEN 'Vermute tinto Fiorini 900 ml' THEN 4
WHEN 'Campari Bitter 900 ml' THEN 7
WHEN 'Conhaque São João da Barra 900 ml' THEN 5
WHEN 'Conhaque Dreher 900 ml' THEN 5 ELSE cost END
WHERE category='DESTILADOS' AND unit='ml' AND cost=0
AND name IN ('Velho Barreiro 900 ml','Vermute tinto Fiorini 900 ml','Campari Bitter 900 ml','Conhaque São João da Barra 900 ml','Conhaque Dreher 900 ml');
