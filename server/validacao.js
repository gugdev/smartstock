import { z } from 'zod'

const texto = limite => z.string().trim().min(1).max(limite)
const inteiro = z.number().int().min(0).max(2147483647)
export const id = z.uuid()
export const produto = z.object({
  nome: texto(120), categoria: texto(80), descricao: z.string().trim().max(1000).default(''),
  minimo: inteiro, preco: z.number().min(0).max(99999999.99).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001, 'Use até duas casas decimais.'),
}).strict()
export const novoProduto = produto.extend({ quantidade: inteiro.default(0) })
export const movimento = z.object({
  id: id.optional(), produtoId: id, tipo: z.enum(['entrada', 'saida']),
  quantidade: inteiro.refine(n => n > 0, 'A quantidade precisa ser maior que zero.'),
  data: z.iso.date().refine(dia => dia >= '1900-01-01' && dia <= new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), 'Use uma data válida entre 1900 e hoje.'),
  observacao: z.string().trim().max(255).default(''),
}).strict()
export const perfil = z.object({ nome: texto(120), alertas: z.boolean() }).strict()
export function falha(status, mensagem) { return Object.assign(new Error(mensagem), { status }) }
