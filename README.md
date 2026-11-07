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
