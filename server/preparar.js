import { readFile } from 'node:fs/promises'
import { pool, transacao } from './db.js'
import { criarProduto } from './estoque.js'

try {
  await transacao(db => readFile(new URL('./schema.sql', import.meta.url), 'utf8').then(sql => db.query(sql)))
  if (process.argv.includes('--demo')) {
    const { rows: [linha] } = await pool.query('SELECT count(*)::int AS total FROM produtos')
    if (linha.total) console.log('Catálogo já preenchido; demonstração não foi duplicada.')
    else {
      const produtos = [
        ['Papel A4','Papelaria',2,10,28.90], ['Toner impressora','Informática',1,5,189.90],
        ['Caneta azul','Papelaria',120,20,2.50], ['Mouse USB','Informática',35,8,39.90],
        ['Caderno 10 matérias','Papelaria',14,10,22], ['Teclado USB','Informática',9,5,59.90],
      ]
      for (const [nome,categoria,quantidade,minimo,preco] of produtos) await criarProduto({ nome,categoria,descricao: `Material de ${categoria.toLocaleLowerCase('pt-BR')}.`,quantidade,minimo,preco })
      console.log('Seis produtos de demonstração cadastrados com saldo inicial auditável.')
    }
  }
  console.log('Tabelas prontas.')
} finally { await pool.end() }
