-- CRM Conveniência v1.4.0: executar UMA VEZ no D1 de produção APÓS BACKUP.
-- Preserva produtos, vendas, estoque e lançamentos existentes.
ALTER TABLE products ADD COLUMN bottle_volume INTEGER NOT NULL DEFAULT 0;
-- Não converte saldos automaticamente: edite cada destilado e informe o volume real
-- e a quantidade física de garrafas antes de vender doses.
