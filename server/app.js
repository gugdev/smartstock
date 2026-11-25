import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { z } from 'zod'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'
import * as v from './validacao.js'
import * as estoque from './estoque.js'
import { openapi } from './openapi.js'

export const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))
app.get('/api/saude', async (_req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok' }) })
app.get('/api/openapi.json', (_req, res) => res.json(openapi))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi))
app.get('/api/estoque', async (_req, res) => res.json(await estoque.carregarEstoque()))
app.get('/api/dashboard', async (_req, res) => res.json(await estoque.dashboard()))
app.get('/api/produtos', async (req, res) => {
  const filtros = z.object({ busca: z.string().max(120).optional(), categoria: z.string().max(80).optional(), status: z.enum(['todos','ativos','inativos','baixo']).optional() }).strict().parse(req.query)
  res.json(await estoque.listarProdutos(filtros))
})
app.get('/api/produtos/:id', async (req, res) => {
  const id = v.id.parse(req.params.id)
  res.json(await estoque.buscarProduto(id))
})
app.post('/api/produtos', async (req, res) => res.status(201).json(await estoque.criarProduto(v.novoProduto.parse(req.body))))
app.put('/api/produtos/:id', async (req, res) => res.json(await estoque.editarProduto(v.id.parse(req.params.id), v.produto.parse(req.body))))
app.delete('/api/produtos/:id', async (req, res) => res.json(await estoque.alterarStatus(v.id.parse(req.params.id), false)))
app.patch('/api/produtos/:id/reativar', async (req, res) => res.json(await estoque.alterarStatus(v.id.parse(req.params.id), true)))
app.get('/api/movimentacoes', async (req, res) => {
  const filtros = z.object({ inicio: z.iso.date().optional(), fim: z.iso.date().optional(), produtoId: v.id.optional(), tipo: z.enum(['entrada','saida']).optional() }).strict().parse(req.query)
  if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) throw v.falha(400, 'O início deve ser anterior ou igual ao fim.')
  res.json(await estoque.listarMovimentos(filtros))
})
app.post('/api/movimentacoes', async (req, res) => res.status(201).json(await estoque.registrarMovimento(v.movimento.parse(req.body))))
app.get('/api/perfil', async (_req, res) => res.json((await pool.query('SELECT nome,alertas FROM perfil WHERE id=1')).rows[0]))
app.put('/api/perfil', async (req, res) => {
  const dados = v.perfil.parse(req.body)
  res.json((await pool.query('UPDATE perfil SET nome=$1,alertas=$2 WHERE id=1 RETURNING nome,alertas', [dados.nome,dados.alertas])).rows[0])
})
app.use('/api', (_req, _res, next) => next(v.falha(404, 'Rota não encontrada.')))
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
if (existsSync(dist)) app.use(express.static(dist))
app.use((erro, _req, res, _next) => {
  if (erro instanceof z.ZodError) return res.status(400).json({ erro: 'Confira os campos enviados.', detalhes: erro.issues.map(item => ({ campo: item.path.join('.'), mensagem: item.message })) })
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'Envie um JSON válido.' })
  if (erro.type === 'entity.too.large') return res.status(413).json({ erro: 'Conteúdo acima do limite permitido.' })
  const status = erro.status || (['ECONNREFUSED','57P01','53300'].includes(erro.code) ? 503 : 500)
  if (status >= 500) console.error('Falha interna na API:', erro.code || erro.name)
  res.status(status).json({ erro: status >= 500 ? 'Não foi possível acessar o banco. Tente novamente.' : erro.message })
})
