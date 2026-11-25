# Roteiro de apresentação — Dia 3 / Aula 8

## Abertura

“No Dia 1 eu planejei o sistema. No Dia 2 construí as telas em React e simulei os dados no navegador. No Dia 3 integrei essas telas a uma API em Node.js com Express e ao PostgreSQL. Agora os produtos, os movimentos e as preferências ficam gravados no banco.”

## Demonstração, em ordem

1. Abra o SmartStock e entre com `demo@smartstock.test` e `estoque123`. Explique que o acesso é demonstrativo: a validação do formulário não é autenticação real.
2. Mostre o Dashboard. Os dados vêm da API; `/api/dashboard` entrega total de produtos ativos, unidades, estoque baixo e cinco registros recentes.
3. Cadastre um produto com nome, categoria, descrição, 5 unidades, mínimo 3 e preço 19,90. Mostre que o cadastro foi salvo. Edite a descrição e mostre a data de cadastro. O saldo não pode ser alterado pela edição.
4. Em Movimentações, tente uma saída de 6 unidades. Ela deve falhar. Faça uma saída de 2: saldo 3. Depois uma entrada de 1: saldo 4. O histórico também inclui a entrada do saldo inicial.
5. Recarregue a página. O saldo e o histórico continuam no PostgreSQL; a tela não depende mais do `localStorage`.

   Como demonstração adicional, abra `http://127.0.0.1:3001/monitor-banco` no navegador integrado do VS Code. A aba **Banco ao vivo** consulta a API a cada 2 segundos, mostrando novos cadastros e alterações de saldo sem precisar reexecutar uma consulta SQL. Os IDs completos ficam visíveis e podem ser copiados para o Swagger. Use o filtro Todos / Ativos / Inativos e ordene por nome, menor saldo ou cadastro recente. A etiqueta Estoque baixo considera apenas produtos ativos com saldo menor ou igual ao mínimo. Os controles continuam selecionados quando chegam novos dados. O monitor só consulta; as alterações são realizadas pelo site ou pela API.
6. Em Relatórios, filtre o produto e o tipo Saída e exporte o CSV. Compare a linha exportada com a tabela.
7. Em Configurações, salve o nome de exibição e recarregue. O perfil desta demonstração é compartilhado, e a preferência de alertas fica guardada para a integração futura.
8. Abra [Swagger local](http://127.0.0.1:3001/api/docs/). Expanda `GET /api/produtos`, clique em **Try it out**, informe a busca e execute. Mostre o status 200 e o JSON. Mostre o esquema do `POST /api/movimentacoes` e a possibilidade de erro 409 por saldo insuficiente.
9. Mostre o [DER](modelo-de-dados.md) e o [SQL das tabelas](../../server/schema.sql). A relação é: um produto possui várias movimentações.
10. Finalize com StockAI. A interface está pronta; a conexão com a IA pertence à Aula 9 / Dia 4.

## Como explicar o caminho de uma operação

“Quando clico em Registrar, o React envia um JSON por HTTP. O Express recebe na rota, valida os campos e chama a regra de estoque. Ela abre uma transação no PostgreSQL, bloqueia o produto durante a alteração, confere o saldo e grava o movimento. Se tudo funcionar, confirma as duas alterações. A tela busca o estado confirmado e atualiza os indicadores.”

O [cliente da API](../../src/api.js) centraliza o `fetch`. As [rotas](../../server/app.js) recebem as requisições; a [validação](../../server/validacao.js) verifica os dados; o [serviço de estoque](../../server/estoque.js) executa as regras; o [acesso ao banco](../../server/db.js) gerencia conexões e transações. As telas continuam em [telas.jsx](../../src/telas.jsx).

## Perguntas prováveis

**Por que validar também no servidor?** Porque alguém pode chamar a API diretamente e ignorar os campos do navegador.

**Por que uma transação?** Para impedir que o saldo seja atualizado sem o histórico correspondente. Se uma gravação falha, as alterações daquela operação são desfeitas.

**E se duas pessoas retirarem o último item ao mesmo tempo?** O bloqueio `FOR UPDATE` serializa as alterações daquele produto. A segunda operação confere o saldo já atualizado.

**E se a requisição de movimento for repetida?** A interface envia um UUID. A API reconhece o mesmo UUID e o mesmo conteúdo e retorna o lançamento existente, sem duplicá-lo. Conteúdo diferente com o mesmo UUID retorna 409. Essa proteção vale enquanto a tentativa mantém seu identificador; não é uma deduplicação por nome ou data.

**Por que inativar em vez de apagar?** Para conservar o histórico e evitar referências quebradas. A rota DELETE é uma exclusão lógica, documentada no Swagger.

**O CSV vem diretamente do banco?** A interface carrega os dados da API, aplica os filtros e gera o CSV com as linhas exibidas. Não existe uma rota de exportação nesta versão.

**O login já protege as rotas?** Ainda não. Esta versão funciona em localhost e tem uma sessão demonstrativa na aba. Não deve ser apresentada como sistema com autenticação ou permissões prontas.

**O que ainda fica para depois?** IA e n8n no Dia 4, autenticação real, permissões, paginação e publicação com infraestrutura apropriada. O link local do Swagger só abre com o projeto em execução; o JSON OpenAPI também acompanha a entrega.

## Estudo rápido

REST organiza operações em recursos: GET consulta, POST cadastra, PUT atualiza e DELETE inativa no nosso caso. HTTP 200/201 indica sucesso, 400 dados inválidos, 404 recurso ausente, 409 conflito de estoque e 503 indisponibilidade do banco. SQL parametrizado envia valores separados da instrução, sem montar consultas por concatenação de texto do usuário.
