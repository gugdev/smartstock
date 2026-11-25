# Validação da entrega — Dia 3 / Aula 8

Verificação executada em 25/11/2026, em Windows, com Node.js 24, Express 5 e PostgreSQL 17.7 local. As evidências são registros dessa execução, e não valores fixos esperados para qualquer banco.

## Conferência do enunciado

| Pedido da Aula 8 | Implementação / evidência |
| --- | --- |
| Node.js, Express e PostgreSQL | `server/`, `package.json`, `.env.example` e SQL das tabelas. |
| Cadastrar, listar, editar, excluir e pesquisar produtos | Rotas `/api/produtos`; DELETE usa exclusão lógica, preservando o histórico. Reativação disponível. |
| Campos mínimos do produto | Nome, categoria, descrição, quantidade, mínimo, preço e data de cadastro no banco e no contrato da API. |
| Entrada, saída, histórico e saldo automático | `/api/movimentacoes`, transação com bloqueio da linha do produto e saldo inicial registrado. |
| Dados do Dashboard | `/api/dashboard`, totais de produtos ativos e unidades, estoque baixo e cinco registros recentes. |
| Integração das telas | Cadastro, edição, movimentação e preferências fazem requisições reais à API; a recarga preserva os dados. |
| Tratamento básico de erros | Validação de JSON, campos, UUID, datas, preço, quantidade, saldo insuficiente e recursos inexistentes. |
| Swagger | `/api/docs/`, JSON OpenAPI e HTML de consulta; capturas `10-swagger.jpg` e `11-swagger-consulta.jpg`. |
| README e GitHub | README da raiz com execução, rotas, organização, limites e links de entrega. |
| DER | `modelo-de-dados.md`, `der.png` e `server/schema.sql`. |
| Vídeo | `evidencias/dia-3/integracao.mp4`, mostrando o fluxo integrado e a persistência após recarga. |

## Resultados

- **9 testes de integração passaram**, usando PostgreSQL real num schema temporário. Eles conferem CRUD lógico, busca, entrada/saída, concorrência, repetição da mesma chave, rollback, validações, perfil, filtros e documentação. Resultado em `evidencias/dia-3/testes-api.txt`.
- O teste de rollback provoca propositalmente uma violação de restrição. A linha `Falha interna na API: 23514` no console é esperada nesse teste; a verificação confirma que o saldo foi desfeito.
- Fluxo no Edge: login demo → cadastro com descrição → edição → tentativa de saída sem saldo → saída válida → entrada → filtros do relatório → CSV → preferências → inativação → recarga → histórico → menu móvel → sair. Nenhum erro JavaScript foi capturado.
- O CSV exportado foi lido e comparado com a linha da tabela: produto, tipo, quantidade, data, responsável e observação conferiram. Uma cópia exportada acompanha as evidências.
- Largura móvel de 390px conferida sem rolagem horizontal da página.
- **Consulta direta ao PostgreSQL:** todos os sete saldos conferiram com a soma do histórico, incluindo o produto inativado criado durante a demonstração. Resultado em `consulta-banco.txt`.
- **Reinício de API e PostgreSQL:** saldo 4 e inativação do produto da demonstração foram preservados. Resultado em `reinicio.txt`.
- `npm run build` concluiu; `npm audit` não apontou vulnerabilidades nas dependências instaladas. O Vite foi atualizado dentro da versão 7.

## Monitor automático no VS Code

Complemento de visualização: o **Banco ao vivo**, em `/monitor-banco`, foi aberto no navegador integrado do VS Code e conferido com os dados reais, incluindo a Gillete e seu ID completo. Busca por nome e ID, botão de copiar, pausa e atualização manual foram verificados. Em um schema temporário separado, a tabela passou de vazia para um produto com saldo 7 após cadastrar 5 unidades e lançar uma entrada de 2, sem recarregar a página. O schema de teste foi removido ao terminar. Os nove testes de integração também passaram após a inclusão do monitor. A captura `12-monitor-banco.png` registra a aba no VS Code.

O monitor faz consultas periódicas de leitura pela API a cada 2 segundos enquanto está visível. Não é uma assinatura de eventos do PostgreSQL. Ele exige API e banco ligados e mantém os últimos dados recebidos se a consulta falhar, sinalizando a indisponibilidade. A grade da extensão PostgreSQL é uma ferramenta separada e continua exigindo reexecução da consulta SQL.

## Limites comunicados na apresentação

O login permanece demonstrativo e não autentica chamadas à API. O servidor fica limitado a localhost. O perfil é compartilhado, e o nome do responsável não comprova identidade. O histórico e o catálogo são carregados integralmente; paginação e permissões ficam para evolução posterior. A preferência de alertas é persistida, mas não dispara notificações. IA e n8n não estão implementados nesta etapa.

Os dados locais do Dia 2 permanecem no navegador, sem importação automática. Os dados de demonstração do PostgreSQL começam com entradas iniciais completas. As evidências dos Dias 1 e 2 foram preservadas, e a versão anterior também está registrada no GitHub. A organização no Drive segue a pasta Desenvolvimento, com uma pasta própria para cada dia.

O Swagger interativo exige os serviços locais ligados. Para avaliação sem executar o projeto, baixe e abra `swagger.html` (carrega o Swagger UI pela internet) ou consulte `openapi.json`. Nenhum serviço público de API foi implantado.
