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

## 2. Criar o banco de dados D1

1. Acesse Cloudflare > **Storage & databases** > **D1** > **Create database**.
2. Nome sugerido: `crm-conveniencia-db`.
3. Abra o banco > **Console**. Execute o conteúdo completo de `schema.sql`.
4. Depois execute o conteúdo completo de `seed.sql`, **uma vez** (ele usa `WHERE NOT EXISTS` para evitar duplicatas dos modelos iniciais).
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
