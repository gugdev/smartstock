import 'dotenv/config'
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

// Schema descartável: nenhum teste apaga ou altera o catálogo da demonstração.
const administrador = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const schema = `teste_${randomUUID().replaceAll('-', '')}`
await administrador.query(`CREATE SCHEMA ${schema}`)
process.env.PGOPTIONS = `-c search_path=${schema}`
const { pool } = await import('../db.js')
const { app } = await import('../app.js')
await pool.query(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'))
const servidor = app.listen(0, '127.0.0.1')
await new Promise(resolve => servidor.once('listening', resolve))
const base = `http://127.0.0.1:${servidor.address().port}/api`
async function pedir(caminho, method = 'GET', dados) {
  const resposta = await fetch(base + caminho, { method, headers: { 'Content-Type':'application/json' }, body: dados === undefined ? undefined : JSON.stringify(dados) })
  return { status: resposta.status, dados: await resposta.json() }
}
const cadastro = { nome:'Caixa teste', categoria:'Organização', descricao:'Produto de teste', quantidade:5, minimo:3, preco:19.90 }
const data = new Date().toLocaleDateString('en-CA', { timeZone:'America/Sao_Paulo' })
let produto
after(async () => {
  await new Promise(resolve => servidor.close(resolve))
  await pool.end()
  await administrador.query(`DROP SCHEMA ${schema} CASCADE`)
  await administrador.end()
})

test('cadastro persiste todos os campos e gera um saldo inicial com histórico', async () => {
  const resposta = await pedir('/produtos', 'POST', cadastro)
  assert.equal(resposta.status, 201)
  produto = resposta.dados
  assert.equal(produto.descricao, cadastro.descricao)
  assert.ok(produto.criadoEm)
  const historico = await pedir(`/movimentacoes?produtoId=${produto.id}`)
  assert.equal(historico.dados.length, 1)
  assert.equal(historico.dados[0].quantidade, 5)
})
test('busca, edição, detalhe e indicadores consultam o PostgreSQL', async () => {
  assert.equal((await pedir('/produtos?busca=caixa&status=ativos')).dados.length, 1)
  assert.equal((await pedir('/produtos?categoria=Outra')).dados.length, 0)
  const { quantidade, ...edicao } = cadastro
  assert.equal((await pedir(`/produtos/${produto.id}`, 'PUT', { ...edicao, nome:'Caixa grande' })).status, 200)
  assert.equal((await pedir(`/produtos/${produto.id}`)).dados.nome, 'Caixa grande')
  const painel = (await pedir('/dashboard')).dados
  assert.equal(painel.totalUnidades, 5)
  assert.equal(painel.totalProdutos, 1)
})
test('saída acima do saldo é rejeitada e não grava histórico', async () => {
  const resposta = await pedir('/movimentacoes', 'POST', { produtoId:produto.id,tipo:'saida',quantidade:6,data })
  assert.equal(resposta.status, 409)
  assert.equal((await pedir(`/produtos/${produto.id}`)).dados.quantidade, 5)
  assert.equal((await pedir('/movimentacoes')).dados.length, 1)
})
test('duas saídas concorrentes não conseguem gastar o mesmo saldo', async () => {
  const respostas = await Promise.all([1,2].map(() => pedir('/movimentacoes', 'POST', { produtoId:produto.id,tipo:'saida',quantidade:4,data })))
  assert.deepEqual(respostas.map(r => r.status).sort(), [201,409])
  assert.equal((await pedir(`/produtos/${produto.id}`)).dados.quantidade, 1)
})
test('mesma chave repetida em paralelo não duplica uma entrada', async () => {
  const movimento = { id:randomUUID(),produtoId:produto.id,tipo:'entrada',quantidade:2,data,observacao:'Reposição' }
  const respostas = await Promise.all([1,2].map(() => pedir('/movimentacoes','POST',movimento)))
  assert.deepEqual(respostas.map(r => r.status), [201,201])
  assert.equal(respostas[0].dados.id,respostas[1].dados.id)
  assert.equal((await pedir(`/produtos/${produto.id}`)).dados.quantidade, 3)
  assert.equal((await pedir('/movimentacoes','POST',{ ...movimento,quantidade:3 })).status,409)
})
test('falha ao inserir histórico desfaz a alteração de saldo (ROLLBACK)', async () => {
  await pool.query("ALTER TABLE movimentacoes ADD CONSTRAINT falha_teste CHECK (observacao <> 'simular falha')")
  try {
    const resposta = await pedir('/movimentacoes','POST',{ produtoId:produto.id,tipo:'entrada',quantidade:7,data,observacao:'simular falha' })
    assert.equal(resposta.status,500)
    assert.equal((await pedir(`/produtos/${produto.id}`)).dados.quantidade,3)
    assert.equal((await pedir('/movimentacoes')).dados.length,3)
  } finally { await pool.query('ALTER TABLE movimentacoes DROP CONSTRAINT falha_teste') }
})
test('inativação preserva histórico, bloqueia operação e permite reativação', async () => {
  assert.equal((await pedir(`/produtos/${produto.id}`, 'DELETE')).dados.ativo,false)
  assert.equal((await pedir('/produtos?status=ativos')).dados.length,0)
  assert.equal((await pedir('/dashboard')).dados.totalProdutos,0)
  assert.equal((await pedir('/movimentacoes','POST',{ produtoId:produto.id,tipo:'entrada',quantidade:1,data })).status,409)
  assert.equal((await pedir('/movimentacoes')).dados.length,3)
  assert.equal((await pedir(`/produtos/${produto.id}/reativar`, 'PATCH')).dados.ativo,true)
  assert.equal((await pedir('/dashboard')).dados.estoqueBaixo,1)
})
test('API valida campos, preço, data, filtros, UUID e JSON inválido', async () => {
  for (const alteracao of [{ quantidade:-1 }, { minimo:1.5 }, { preco:1.001 }, { nome:' ' }, { campoExtra:true }]) {
    assert.equal((await pedir('/produtos','POST',{ ...cadastro,...alteracao })).status,400)
  }
  assert.equal((await pedir(`/produtos/${produto.id}`,'PUT',cadastro)).status,400)
  assert.equal((await pedir('/produtos/id-invalido')).status,400)
  assert.equal((await pedir(`/produtos/${randomUUID()}`)).status,404)
  assert.equal((await pedir('/movimentacoes?inicio=2026-12-01&fim=2026-01-01')).status,400)
  for (const dia of ['2026-02-30','2099-01-01']) assert.equal((await pedir('/movimentacoes','POST',{produtoId:produto.id,tipo:'entrada',quantidade:1,data:dia})).status,400)
  const invalido = await fetch(base + '/produtos',{ method:'POST',headers:{'Content-Type':'application/json'},body:'{' })
  assert.equal(invalido.status,400)
  assert.equal((await pedir('/inexistente')).status,404)
})
test('perfil persiste e filtro de histórico funciona com documentação disponível', async () => {
  assert.equal((await pedir('/perfil','PUT',{nome:'Operador teste',alertas:false})).status,200)
  assert.equal((await pedir('/estoque')).dados.perfil.nome,'Operador teste')
  const filtrado = await pedir(`/movimentacoes?produtoId=${produto.id}&tipo=saida&inicio=${data}&fim=${data}`)
  assert.equal(filtrado.dados.length,1)
  assert.equal((await pedir('/saude')).dados.status,'ok')
  const documento = await pedir('/openapi.json')
  assert.equal(documento.dados.openapi,'3.1.0')
  assert.ok(documento.dados.paths['/api/movimentacoes'].post)
  assert.equal((await fetch(base + '/docs/')).status,200)
})
