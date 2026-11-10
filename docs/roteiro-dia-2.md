# SmartStock | Roteiro de apresentação do Dia 2

## Em um minuto

No Dia 1, que corresponde à Aula 6, definimos os requisitos, as regras de estoque, a arquitetura e as seis telas de referência. No Dia 2, que corresponde à Aula 7, transformamos esse planejamento em um front-end navegável em React. Dá para entrar no ambiente de demonstração, cadastrar e editar produtos, registrar entradas e saídas e consultar os resultados no dashboard e nos relatórios.

Hoje fechamos o fluxo navegável do Figma, organizamos as evidências no GitHub e no Drive e refinamos as seis telas. O login ganhou avisos em português. O dashboard mostra os indicadores e alertas de reposição. Em Produtos, o cadastro tem um botão próprio acima dos filtros. Em Movimentações, o saldo fica ao lado do formulário. Em Relatórios, o CSV segue os filtros aplicados. Em Configurações, o perfil e a preferência de alertas são salvos no navegador.

## Demonstração em três minutos

1. Abra o protótipo no Figma. Clique em **Entrar** e mostre o menu lateral. Explique que as seis telas vieram de SVGs e que as áreas clicáveis ligam os quadros.
2. No app, tente entrar com os campos vazios. Mostre o aviso no formulário e o foco no campo a corrigir. Use `demo@smartstock.test` e `estoque123` para entrar. A caixa rosa na aba é o favicon.
3. No dashboard, mostre os indicadores e o gráfico. Os cartões entram em sequência e as barras sobem a partir da base. Os indicadores usam os dados da demonstração.
4. Em **Produtos**, combine a busca com um filtro e use **Limpar filtros**. Cadastre um item com **5 unidades** e estoque mínimo de **3**.
5. Em **Movimentações**, selecione o item e clique em **Saída**. Tente retirar **6** e mostre a mensagem de saldo insuficiente. Depois retire **2**. O saldo vai a **3**, e a saída aparece no histórico.
6. Volte ao dashboard e mostre o alerta de reposição. O saldo de **3** já conta como estoque baixo porque atingiu o mínimo.
7. Em **Relatórios**, escolha o produto criado e o tipo **Saída**. Clique em **Aplicar filtros** e depois em **Exportar CSV**. Abra o arquivo e mostre a mesma saída de **2 unidades**. **Restaurar padrão** volta à consulta dos últimos 30 dias.
8. Em **Configurações**, altere o nome de exibição, mude a chave de alertas e clique em **Salvar preferências**. Recarregue a página para mostrar que as duas escolhas foram guardadas.

## Se perguntarem como funciona

- **Onde ficam os dados?** O estoque da demonstração fica no localStorage e reaparece ao recarregar a página. A sessão demo usa sessionStorage. A integração com API e banco está planejada para a Aula 8.
- **Como funciona o login?** O formulário valida o formato do e-mail e o mínimo de seis caracteres na senha fictícia. Os erros aparecem dentro do cartão e o foco vai para o primeiro campo inválido. A autenticação com contas reais está prevista para a Aula 8.
- **O que vai para o CSV?** O arquivo leva as movimentações dos filtros que foram aplicados. Alterações nos campos ainda precisam de **Aplicar filtros**. Quando a tabela está vazia, a exportação fica desativada.
- **A chave de alertas já envia notificações?** Ela salva a preferência neste navegador para a futura integração. O alerta de reposição do dashboard é calculado a partir do saldo e do mínimo do produto.
- **Como o saldo muda?** A entrada soma unidades. A saída subtrai depois de verificar se há saldo suficiente. Ao registrar uma operação válida, o app atualiza o saldo e acrescenta o registro ao histórico.
- **O que acontece ao inativar um produto?** Ele sai da lista de itens disponíveis para movimentar. O histórico das operações continua consultável.
- **Por que os números do Figma e do dashboard diferem?** O Figma preserva os exemplos desenhados na Aula 6. O app calcula os indicadores a partir do estoque e das movimentações da demonstração.
- **Como fizemos o reflexo nos botões?** O CSS desenha uma faixa de luz que cruza o botão ao passar o mouse ou ao chegar nele com Tab. A animação respeita a preferência de movimento reduzido do sistema.
- **Como a tela funciona no celular?** Os painéis se reorganizam em uma coluna. Se a tabela precisar de espaço extra, ela rola na horizontal dentro do próprio painel.

## Onde encontrar a entrega

- [Código, README e evidências no GitHub](https://github.com/gugdev/smartstock)
- [Capturas e vídeo do Dia 2](https://github.com/gugdev/smartstock/tree/main/evidencias/dia-2)
- [Protótipo navegável no Figma](https://www.figma.com/proto/sojvdu4i568LOE80M4EpzJ/SmartStock-%E2%80%94-Prot%C3%B3tipo?node-id=3-2&page-id=0%3A1&starting-point-node-id=3%3A2&scaling=scale-down&content-scaling=fixed)
- [Dia 1 no Drive](https://drive.google.com/drive/folders/1pJQsR94L1FCM4bPZbb5G1WI8UZ7Rw5Nl)
- [Dia 2 no Drive](https://drive.google.com/drive/folders/1OAdEekY5SRHekIC_qeBtf2lokSnqcdz9)
