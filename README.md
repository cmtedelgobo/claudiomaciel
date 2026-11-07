## Correção V1.2.1

Corrigida a inserção de produtos avulsos no PDV: salvar um item fora de estoque não reinicializa o carrinho; a venda pode ser confirmada mesmo sem outros produtos cadastrados. **Não exige migração nova** além das tabelas V1.2.0 já instaladas.

# CRM CONVENIÊNCIA · v1.2.1

Projeto para **Cloudflare Pages Functions + Cloudflare D1**. Não publique o cadastro de clientes em produção sem proteger a aplicação com autenticação (ex.: Cloudflare Access). O link sozinho não oferece segurança.

## Atualização de v1.1.0 para v1.2.1 (não apagar dados)

1. **Faça backup do D1** antes de alterações. No D1, use exportação/backup pelo painel, se disponível. A ferramenta de backup JSON do sistema é complementar.
2. No banco `crm-conveniencia-db` abra o **Console** e execute **`migracao_v1_2.sql`** (cria tabelas de pagamentos parciais e itens avulsos). Se a interface do console recusar múltiplos comandos, execute cada `CREATE TABLE` e `CREATE INDEX` individualmente.
3. Se os produtos reais ainda não aparecem, execute **`atualizar_d1_produtos.sql`** e, depois, **`atualizar_d1_doses.sql`** no mesmo Console. Esses scripts não duplicam registros existentes.
4. Execute **`atualizar_d1_custos_v1_2.sql`** para custos provisórios. Só altera produtos com custo igual a zero. Atenção: destilados usam custo por ml arredondado.
5. Opcional: `arquivar_modelos_opcional.sql` desativa os 10 modelos fictícios (não apaga histórico).
6. Extraia o ZIP e envie **o conteúdo**, não a pasta externa, à raiz do repositório GitHub `claudiomaciel`; confirme substituição de arquivos existentes e faça commit.
7. Cloudflare Pages deve manter o binding D1 com nome **`DB`** apontando a `crm-conveniencia-db`. Verifique `https://crm-conveniencia.pages.dev/api/health` e abra o sistema após novo deploy.

## Funcionalidades novas
- Venda rápida permite produto avulso sem estoque, registrado em `manual_sale_items` (não mexe no inventário).
- Estoque em submenu por categoria; doses usam apresentações, com baixa em ml no destilado.
- Comanda mostra valores pagos, saldo; pagamentos parciais registrados em `order_payments`, `cash_entries`. Fechamento com fiado lança somente saldo restante.
- Comandas abertas e saldo devedor aparecem no contas a receber. Comandas antigas ficam consultáveis e PDF é gerado no dispositivo para download/compartilhamento.
- Caixa: **Alterar valores em caixa** grava ajuste compensatório justificado, sem editar operações antigas.
- Backup geral JSON exporta todas as tabelas de negócio da versão, não restaura automaticamente.
- Interface Android: menu responsivo, ícones SVG, azul royal/prata, assinatura Stratéchne.

**Observações:** PDF é exportado de forma simples, sem depender de bibliotecas externas. O caixa único é um resumo de movimentos, não uma conciliação bancária. Operações ainda exigem conexão à internet e a importação SQL é manual; commit GitHub não executa migrações de D1.
