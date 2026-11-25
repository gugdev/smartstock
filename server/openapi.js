import { z } from 'zod'
import { novoProduto, produto, movimento, perfil } from './validacao.js'

const json = schema => ({ 'application/json': { schema } })
const ref = nome => ({ $ref: `#/components/schemas/${nome}` })
const erro = { description: 'Falha de validação, recurso ausente, conflito de estoque ou indisponibilidade.', content: json(ref('Erro')) }
const parametroId = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
const consulta = (name, schema = { type: 'string' }) => ({ name, in: 'query', schema })
function operacao(summary, saida, { entrada, parametros = [], status = '200', tag = 'Estoque' } = {}) {
  return { summary, tags: [tag], parameters: parametros,
    ...(entrada && { requestBody: { required: true, content: json(ref(entrada)) } }),
    responses: { [status]: { description: 'Operação concluída.', content: json(saida) }, '400': erro, '404': erro, '409': erro, '413': erro, '500': erro, '503': erro } }
}
const objeto = properties => ({ type: 'object', properties })
const lista = nome => ({ type: 'array', items: ref(nome) })
export const openapi = {
  openapi: '3.1.0', info: { title: 'SmartStock API', version: '0.3.0', description: 'Dia 3 / Aula 8. API local de demonstração, sem autenticação. DELETE inativa e preserva o histórico. Quantidades são inteiras. Movimentações são transacionais; repetir o mesmo id e conteúdo não duplica o lançamento.' },
  servers: [{ url: '/' }],
  paths: {
    '/api/saude': { get: operacao('Verificar conexão com PostgreSQL', objeto({ status: { type: 'string' } })) },
    '/api/estoque': { get: operacao('Ler catálogo, histórico e perfil em uma mesma fotografia do banco', objeto({ produtos: lista('Produto'), movimentos: lista('Movimento'), perfil: ref('Perfil') })) },
    '/api/dashboard': { get: operacao('Consultar indicadores e cinco movimentações recentes', objeto({ totalProdutos: { type: 'integer' }, totalUnidades: { type: 'integer' }, estoqueBaixo: { type: 'integer' }, recentes: lista('Movimento') })) },
    '/api/produtos': {
      get: operacao('Listar e buscar produtos', lista('Produto'), { parametros: [consulta('busca'), consulta('categoria'), consulta('status', { type: 'string', enum: ['todos','ativos','inativos','baixo'] })], tag: 'Produtos' }),
      post: operacao('Cadastrar produto e registrar saldo inicial no histórico', ref('Produto'), { entrada: 'NovoProduto', status: '201', tag: 'Produtos' }),
    },
    '/api/produtos/{id}': {
      get: operacao('Consultar um produto', ref('Produto'), { parametros: [parametroId], tag: 'Produtos' }),
      put: operacao('Editar cadastro sem alterar saldo', ref('Produto'), { entrada: 'EditarProduto', parametros: [parametroId], tag: 'Produtos' }),
      delete: operacao('Inativar produto preservando histórico (exclusão lógica)', ref('Produto'), { parametros: [parametroId], tag: 'Produtos' }),
    },
    '/api/produtos/{id}/reativar': { patch: operacao('Reativar produto', ref('Produto'), { parametros: [parametroId], tag: 'Produtos' }) },
    '/api/movimentacoes': {
      get: operacao('Consultar histórico por período, produto e tipo', lista('Movimento'), { parametros: [consulta('inicio',{type:'string',format:'date'}),consulta('fim',{type:'string',format:'date'}),consulta('produtoId',{type:'string',format:'uuid'}),consulta('tipo',{type:'string',enum:['entrada','saida']})], tag: 'Movimentações' }),
      post: operacao('Registrar entrada ou saída e atualizar saldo atomicamente', ref('Movimento'), { entrada: 'NovoMovimento', status: '201', tag: 'Movimentações' }),
    },
    '/api/perfil': {
      get: operacao('Consultar perfil compartilhado da demonstração', ref('Perfil'), { tag: 'Perfil' }),
      put: operacao('Salvar nome e preferência de alertas', ref('Perfil'), { entrada: 'Perfil', tag: 'Perfil' }),
    },
    '/api/openapi.json': { get: { summary: 'Obter especificação OpenAPI', responses: { 200: { description: 'Documento OpenAPI 3.1' } } } },
    '/api/docs/': { get: { summary: 'Abrir documentação interativa Swagger', responses: { 200: { description: 'Interface HTML do Swagger UI' } } } },
  },
  components: { schemas: {
    NovoProduto: { ...z.toJSONSchema(novoProduto), example: { nome:'Caixa organizadora',categoria:'Organização',descricao:'Caixa para materiais do escritório',quantidade:5,minimo:3,preco:19.90 } },
    EditarProduto: { ...z.toJSONSchema(produto), example: { nome:'Caixa organizadora grande',categoria:'Organização',descricao:'Caixa com tampa',minimo:3,preco:19.90 } },
    NovoMovimento: { ...z.toJSONSchema(movimento), description: 'Substitua produtoId pelo UUID obtido no cadastro ou na listagem. id é opcional e identifica uma tentativa para evitar duplicidade.', example: { produtoId:'00000000-0000-4000-8000-000000000001',tipo:'saida',quantidade:2,data:new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}),observacao:'Uso interno' } },
    Perfil: z.toJSONSchema(perfil),
    Produto: objeto({ ...z.toJSONSchema(novoProduto).properties, id: { type: 'string', format: 'uuid' }, ativo: { type: 'boolean' }, criadoEm: { type: 'string', format: 'date-time' } }),
    Movimento: objeto({ ...z.toJSONSchema(movimento).properties, produtoNome: { type: 'string' }, responsavel: { type: 'string' } }),
    Erro: objeto({ erro: { type: 'string' }, detalhes: { type: 'array', items: objeto({ campo: { type: 'string' }, mensagem: { type: 'string' } }) } }),
  } },
}
