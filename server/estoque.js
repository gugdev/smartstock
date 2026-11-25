import { randomUUID } from 'node:crypto'
import { pool, transacao } from './db.js'
import { falha } from './validacao.js'

const camposProduto = 'id, nome, categoria, descricao, quantidade, minimo, preco, ativo, criado_em AS "criadoEm"'
const camposMovimento = 'id, produto_id AS "produtoId", produto_nome AS "produtoNome", tipo, quantidade, data, observacao, responsavel'
export async function listarProdutos({ busca = '', categoria = '', status = 'todos' } = {}, db = pool) {
  return (await db.query(`SELECT ${camposProduto} FROM produtos WHERE
    strpos(lower(nome), lower($1)) > 0 AND ($2 = '' OR categoria = $2)
    AND ($3 = 'todos' OR ($3 = 'inativos' AND NOT ativo) OR ($3 = 'ativos' AND ativo) OR ($3 = 'baixo' AND ativo AND quantidade <= minimo))
    ORDER BY criado_em, id`, [busca, categoria, status])).rows
}
export async function listarMovimentos({ inicio = null, fim = null, produtoId = null, tipo = null } = {}, db = pool) {
  return (await db.query(`SELECT ${camposMovimento} FROM movimentacoes WHERE
    ($1::date IS NULL OR data >= $1) AND ($2::date IS NULL OR data <= $2)
    AND ($3::uuid IS NULL OR produto_id = $3) AND ($4::text IS NULL OR tipo = $4)
    ORDER BY criado_em DESC, id`, [inicio, fim, produtoId, tipo])).rows
}
export async function buscarProduto(id) {
  const produto = (await pool.query(`SELECT ${camposProduto} FROM produtos WHERE id=$1`, [id])).rows[0]
  if (!produto) throw falha(404, 'Produto não encontrado.')
  return produto
}
export async function criarProduto(dados) {
  return transacao(async db => {
    const produto = (await db.query(`INSERT INTO produtos(id,nome,categoria,descricao,quantidade,minimo,preco)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${camposProduto}`,
    [randomUUID(), dados.nome, dados.categoria, dados.descricao, dados.quantidade, dados.minimo, dados.preco])).rows[0]
    if (produto.quantidade > 0) await inserirMovimento(db, produto, {
      id: randomUUID(), tipo: 'entrada', quantidade: produto.quantidade,
      data: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), observacao: 'Saldo inicial do cadastro',
    })
    return produto
  })
}
export async function editarProduto(id, dados) {
  const resultado = await pool.query(`UPDATE produtos SET nome=$2,categoria=$3,descricao=$4,minimo=$5,preco=$6 WHERE id=$1 RETURNING ${camposProduto}`,
    [id, dados.nome, dados.categoria, dados.descricao, dados.minimo, dados.preco])
  if (!resultado.rowCount) throw falha(404, 'Produto não encontrado.')
  return resultado.rows[0]
}
export async function alterarStatus(id, ativo) {
  const resultado = await pool.query(`UPDATE produtos SET ativo=$2 WHERE id=$1 RETURNING ${camposProduto}`, [id, ativo])
  if (!resultado.rowCount) throw falha(404, 'Produto não encontrado.')
  return resultado.rows[0]
}
async function inserirMovimento(db, produto, dados) {
  return (await db.query(`INSERT INTO movimentacoes(id,produto_id,produto_nome,tipo,quantidade,data,observacao,responsavel)
    VALUES($1,$2,$3,$4,$5,$6,$7,(SELECT nome FROM perfil WHERE id=1)) RETURNING ${camposMovimento}`,
  [dados.id, produto.id, produto.nome, dados.tipo, dados.quantidade, dados.data, dados.observacao])).rows[0]
}
export async function registrarMovimento(dados) {
  return transacao(async db => {
    const identificador = dados.id || randomUUID()
    // Serializa tentativas com a mesma chave, inclusive para produtos diferentes.
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [identificador])
    const anterior = (await db.query(`SELECT ${camposMovimento} FROM movimentacoes WHERE id=$1`, [identificador])).rows[0]
    if (anterior) {
      if (['produtoId','tipo','quantidade','data','observacao'].some(campo => anterior[campo] !== dados[campo])) throw falha(409, 'Identificador já utilizado em outra movimentação.')
      return anterior
    }
    // O bloqueio da linha impede duas saídas simultâneas de consumirem o mesmo saldo.
    const produto = (await db.query('SELECT * FROM produtos WHERE id=$1 FOR UPDATE', [dados.produtoId])).rows[0]
    if (!produto) throw falha(404, 'Produto não encontrado.')
    if (!produto.ativo) throw falha(409, 'Selecione um produto ativo.')
    const saldo = produto.quantidade + (dados.tipo === 'entrada' ? dados.quantidade : -dados.quantidade)
    if (saldo < 0) throw falha(409, `Saldo insuficiente. Disponível: ${produto.quantidade} un.`)
    if (saldo > 2147483647) throw falha(409, 'O saldo excede o limite suportado.')
    await db.query('UPDATE produtos SET quantidade=$2 WHERE id=$1', [produto.id, saldo])
    return inserirMovimento(db, produto, { ...dados, id: identificador })
  })
}
export async function carregarEstoque() {
  return transacao(async db => {
    await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    return { produtos: await listarProdutos({}, db), movimentos: await listarMovimentos({}, db), perfil: (await db.query('SELECT nome,alertas FROM perfil WHERE id=1')).rows[0] }
  })
}
export async function dashboard() {
  return transacao(async db => {
    await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const totais = (await db.query(`SELECT count(*)::int AS "totalProdutos", coalesce(sum(quantidade),0)::float8 AS "totalUnidades",
      count(*) FILTER (WHERE quantidade<=minimo)::int AS "estoqueBaixo" FROM produtos WHERE ativo`)).rows[0]
    return { ...totais, recentes: (await db.query(`SELECT ${camposMovimento} FROM movimentacoes ORDER BY criado_em DESC, id LIMIT 5`)).rows }
  })
}
