-- CRM CONVENIÊNCIA V1.3.0: executar UMA VEZ no D1 de produção
-- Não apaga nem modifica clientes, produtos ou vendas existentes.
CREATE TABLE IF NOT EXISTS business_settings (
 id INTEGER PRIMARY KEY CHECK (id=1),
 name TEXT NOT NULL DEFAULT 'CRM CONVENIÊNCIA',
 legal_name TEXT NOT NULL DEFAULT '',
 cnpj TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 address TEXT NOT NULL DEFAULT '',
 logo TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO business_settings (id,name,phone,address) VALUES (1,'CRM CONVENIÊNCIA','(42) 99999-4679','Rua Aderly Turek, 81 - Cará-Cará, Ponta Grossa - PR, 84033-101');
