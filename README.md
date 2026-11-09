# CRM CONVENIÊNCIA V1.3.0 — GitHub / Cloudflare Pages / D1

## Atualização do projeto existente
1. Antes de atualizar, exporte um backup do D1.
2. No Cloudflare D1 `crm-conveniencia-db` execute `migracao_v1_3.sql` no Console SQL; ela cria `business_settings` e preserva todas as tabelas anteriores. Caso o console não aceite vários comandos, execute o CREATE TABLE e depois o INSERT OR IGNORE.
3. Extraia o ZIP e substitua o conteúdo na raiz do repositório do GitHub. Commit na branch main.
4. Aguarde o Cloudflare Pages publicar e faça Ctrl+F5 no notebook ou atualize o navegador Android.
5. Confira Configurações > Configurações do meu negócio e salve os dados.

## Novidades
- Menu lateral em seções expansíveis VENDAS, ESTOQUE, CADASTROS, FINANCEIRO, CONFIGURAÇÕES; as subseções deslocam os outros itens.
- Ícones SVG desenhados, área touch para Android e tablet.
- Configurações do negócio persistidas em D1: nome, razão social, CNPJ, telefone, endereço e logo compactada.
- Cabeçalhos de impressão/PDF com os dados configurados e layout azul royal/prata; comanda gerada como PDF com cabeçalho, rodapé e paginação.
- SAIR abre confirmação, exibe TEJE LIVRE! e mostra tela de saída com Voltar ao CRM. Não é logout de autenticação: o projeto não tem login e continua acessível pelo link.
- Operações de gravação já confirmadas permanecem no D1. Não é possível garantir salvar formulário que não foi submetido; esse caso é avisado ao sair.

## Segurança
⚠️ Esta versão ainda não tem autenticação. Não exponha dados pessoais e financeiros em produção sem restringir acesso (Cloudflare Access, por exemplo). O botão SAIR não protege os dados.

## Nota sobre PDFs
Os relatórios de tabelas e fechamento usam a impressão do navegador com estilo e logomarca, permitindo Salvar como PDF. O PDF compartilhável de comanda usa layout próprio, com nome/endereço/telefone em texto; a imagem da logomarca aparece nos relatórios impressos e a logomarca poderá ser adicionada ao PDF compartilhável numa melhoria futura.

## V1.4.0 — Doses em ml e fechamento diário/semanal
1. **Antes de publicar:** faça backup JSON pelo CRM e backup do banco D1.
2. Execute **migracao_v1_4.sql UMA ÚNICA VEZ no D1 de produção**. A migração acrescenta apenas a coluna `bottle_volume` e NÃO apaga dados. Não execute `schema.sql` no banco já existente.
3. Publique todos os arquivos do ZIP no GitHub/Cloudflare Pages; atualize a página com Ctrl+F5.
4. Em ESTOQUE > DESTILADOS, abra **Editar** em cada destilado, indique o volume exato da garrafa e **confira o estoque físico em garrafas** antes de salvar. Ao salvar, o estoque é gravado em ml e o custo por garrafa é convertido em custo unitário de ml. Nenhuma conversão automática é feita no D1 antes dessa conferência.
5. Confira ESTOQUE > DOSES > Caixas / doses: apresentação Dose 50 ml deve ter consumo **50** para cada venda. Para uma garrafa 900 ml a venda sem apresentação consome 900 ml. Evite cadastrar uma dose como outro produto independente.
6. No menu FINANCEIRO agora há Fechamento do dia, da semana (segunda a domingo) e do mês; qualquer período tem ranking, vendas, entradas, saídas e impressão/PDF. Saldo de fiado atual é acumulado geral, não somente do período. Contas a pagar são agrupadas pela data de vencimento.
7. **Atenção:** se os destilados já estavam cadastrados como `ml` e a quantidade aparece como 10, isso pode representar 10 ml, não 10 garrafas. Verifique a contagem física e corrija para a quantidade real em garrafas no formulário. As vendas históricas permanecem intactas.
8. Não execute a migração novamente: `ALTER TABLE ... ADD COLUMN` falharia por coluna existente.
