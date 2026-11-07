# ATUALIZACAO V1.1.0 — CATALOGO DO CLAUDIO

Este pacote contem os arquivos COMPLETOS do projeto, para substituir os arquivos existentes no repositorio GitHub (enviar o CONTEUDO da pasta, mantendo `functions/api/[[path]].js`).

**Importante: o commit GitHub nao executa SQL no D1.** O banco `crm-conveniencia-db` que ja existe **nao deve ser apagado**. O painel de cadastro e as vendas so enxergarao os novos produtos depois de executar os scripts no D1 de producao.

## Atualizar o banco existente (nao executar schema.sql de novo)

Na Cloudflare > D1 > crm-conveniencia-db > Console:

1. Copiar o CONTEUDO INTEIRO de `atualizar_d1_produtos.sql` e executar. Sao **45 produtos novos**: 6 cervejas, 5 refrigerantes, 5 destilados, 4 salgadinhos, 5 doces, 4 cigarros, 6 lanches, 5 porcoes e 5 de tabacaria. Cada item com quantidade 10 (destilados: 9.000 ml) e custo 0 ainda nao informado. O nome/categoria determina se ja existe; reexecutar nao duplica.
2. Copiar `atualizar_d1_doses.sql` e executar. Cria 9 apresentacoes: 5 garrafas de 900 ml e 4 doses de 50 ml. O preco da dose de Dreher ainda nao foi informado.
3. Opcionalmente executar `arquivar_modelos_opcional.sql` para OCULTAR, sem excluir, os 10 produtos provisórios nao utilizados.
4. Conferir com `SELECT category, COUNT(*) quantidade FROM products WHERE active=1 GROUP BY category ORDER BY category;`.

**Se o Console nao executar um bloco WITH/INSERT, use o Wrangler CLI com `wrangler d1 execute crm-conveniencia-db --remote --file=atualizar_d1_produtos.sql` e depois o de doses. O comando deve ser rodado na pasta do projeto em uma instalacao Node/Wrangler configurada.**

## Regras

- `REFRIGERANTES` e nova categoria no PDV e no estoque.
- Doses e garrafas do mesmo destilado consomem o mesmo saldo em ml. A unidade de estoque de 900 ml e um frasco; 9.000 ml representam 10 frascos.
- Preco de venda esta em CENTAVOS no SQL: R$ 10,00 = `1000`.
- `Seda unidade` e `Seda caixa` foram cadastrados como itens independentes (10 cada) pois nao foi informada a quantidade de sedas por caixa.
- Snacks sem gramagem informada foram cadastrados sem tamanho e podem ser editados depois.
- Lanches e porcoes estao como produtos simples com 10 unidades provisórias; para baixa por ingredientes sera necessario configurar fichas tecnicas futuramente.
- Produtos com precos reais, mas custo 0, nao fornecem margem de lucro confiavel ate registrar os custos.
- Como o site apresentou erro **523**, confirme em Cloudflare Pages > Deployments se o deploy foi realmente bem-sucedido. O D1 nao corrige sozinho o erro 523.
- **Nao usar clientes reais sem protecao de acesso**. Sem login, qualquer pessoa que encontre a URL podera acessar os dados se nao houver Cloudflare Access ou equivalente.

---

# CRM CONVENIÊNCIA · Versão inicial 1.0.0

ERP web para a conveniência/bar do Cláudio. Tema da **opção 10**: azul royal, azul escuro, prata e branco.

## O que está implementado

- **Painel geral**: caixa, fiados, comandas e alerta de estoque mínimo.
- **PDV / venda rápida**: busca por nome, botões por categoria, carrinho, dinheiro/PIX/débito/crédito; salva venda, movimento de caixa e baixa de estoque no D1.
- **Comandas individuais**: vínculo a clientes, adição/remoção de consumo, devolução de estoque ao remover, pagamento ou fiado com limite individual.
- **Estoque**: 10 produtos *provisórios*, um em cada categoria solicitada, com **10 unidades cada**. Botões Novo, Editar (quantidade/custo/venda), Excluir e Movimentar.
- **Apresentações**: vendas da mesma mercadoria por unidade, caixa, garrafa ou dose, com preço próprio e fator de conversão.
- **Fichas técnicas**: receitas de lanches/drinks com insumos em un/ml/g e baixa automática dos componentes.
- **Clientes / fiado**: cadastro, limite de crédito, extrato, pagamentos parciais e saldos devedores.
- **Fornecedores**: cadastrar, editar, excluir, dados de contato e campo de fornecedor em contas a pagar.
- **Contas a pagar**: cadastro, fornecedor, vencimento, pagamento parcial e status.
- **Caixa único**: entradas/saídas consolidadas, forma de pagamento preservada no registro.
- **Fechamento do mês**: faturamento, ranking por volume e faturamento, custos, estimativa de margem bruta, fiados e caixa; impressão e **Salvar como PDF** pelo navegador; compartilhar resumo via navegador.

## 1. Publicar os arquivos no GitHub

1. Extraia o ZIP. Abra a pasta `crm-conveniencia`.
2. Envie **o conteúdo da pasta** para a raiz do seu repositório no GitHub, preservando `functions/api/[[path]].js`.
3. Faça o commit.

Importante: **não** arraste o ZIP diretamente para o repositório esperando que o GitHub o descompacte. Faça upload dos arquivos/pastas extraídos.

## 2. Criar o banco de dados D1 (apenas instalacao nova)

1. Acesse Cloudflare > **Storage & databases** > **D1** > **Create database**.
2. Nome sugerido: `crm-conveniencia-db`.
3. Abra o banco > **Console**. Execute o conteúdo completo de `schema.sql`.
4. Em instalacoes novas, execute `atualizar_d1_produtos.sql` e `atualizar_d1_doses.sql`. `seed.sql` e apenas informativo nesta versao.
5. O schema contém a tabela `suppliers`: fornecedores já fazem parte desta versão.

O banco deve ser criado e preenchido no ambiente **remoto de produção** vinculado ao Pages. Criar o D1 não executa automaticamente os arquivos `.sql`.

## 3. Criar Cloudflare Pages

1. Entre em **Compute / Workers & Pages** e crie um projeto **Pages** conectado ao repositório GitHub correspondente.
2. Selecione sua branch principal (normalmente `main`).
3. Framework preset: **None**; Build command: **deixe em branco**; Build output directory: **`/`** (raiz do repositório; se a UI rejeitar `/`, use `.`).
4. Em **Settings** > **Bindings** > **D1 database**, adicione binding com o nome exato **`DB`**, selecionando `crm-conveniencia-db`.
5. Confirme o binding para o **ambiente Production**. Refaça o deploy para que as Pages Functions recebam o binding.
6. Abra o endereço `*.pages.dev`. O topo deve mostrar **D1 conectado** e os produtos iniciais devem aparecer em **Estoque / Produtos**.

Se surgir “D1 não conectado” ou “no such table”, revise o binding **DB**, o ambiente e a execução do `schema.sql`/`seed.sql`.

## 4. Primeiro cadastro

Os itens `Produto inicial — CERVEJAS`, etc. são apenas modelos para as dez categorias, com estoque 10 e **custo/venda zero** para não inventar preços. Use **Editar** para colocar o nome real, custo, preço e quantidade. Um produto com preço zero fica indisponível no PDV. Pode também excluir o modelo e cadastrar produtos reais com **Adicionar produto**.

Para uma caixa de 12 cervejas, cadastre a lata como produto e use **Caixas / doses** para adicionar apresentação `Caixa 12`, quantidade `12` e seu preço. Para garrafas de 700 ml vendidas em doses de 50 ml, cadastre o insumo em `ml`, por exemplo estoque `700` (uma garrafa) ou `7000` (dez garrafas), e a apresentação `Dose 50 ml`, quantidade `50`. Para drinks, use um produto do tipo **Receita** e cadastre seus ingredientes em **Fichas técnicas**. Não use o produto inicial `DRINKS` para esse fim sem antes substituí-lo por um produto de tipo receita.

## Notas importantes

- **Sem login, por solicitação**. Isso significa que **qualquer pessoa com acesso ao endereço pode ver e alterar dados**. **Não coloque dados reais de clientes ou financeiros em uma instância pública desprotegida**; habilite Cloudflare Access ou outro mecanismo de autenticação antes do uso real. A estrutura permite evoluir para acesso por usuário mais tarde.
- É uma **versão inicial para validação operacional**, não um sistema fiscal homologado: sem NFC-e, emissão fiscal ou integração bancária/cartão.
- Os cartões são registrados na forma selecionada, mas não existe conciliação de taxas e prazos das operadoras nesta versão.
- Exportação PDF usa o comando nativo **Imprimir > Salvar como PDF**. O compartilhamento nativo compartilha **resumo textual**, não um arquivo PDF gerado diretamente.
- Inventário e vendas exigem acesso à internet e D1; não existe operação offline.
- Não trate saldo do caixa único como saldo bancário nem como lucro contábil.
- Recomenda-se testar uma venda, uma comanda, um fiado, um recebimento e uma conta paga usando dados fictícios antes de iniciar operações reais.
