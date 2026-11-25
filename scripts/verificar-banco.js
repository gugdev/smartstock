import { pool } from '../server/db.js'
try {
  const sql = `SELECT p.id, p.nome, p.quantidade AS saldo,
    coalesce(sum(CASE WHEN m.tipo='entrada' THEN m.quantidade ELSE -m.quantidade END),0)::int AS "saldoHistorico",
    p.quantidade = coalesce(sum(CASE WHEN m.tipo='entrada' THEN m.quantidade ELSE -m.quantidade END),0) AS coerente
    FROM produtos p LEFT JOIN movimentacoes m ON m.produto_id=p.id GROUP BY p.id ORDER BY p.nome`
  const { rows } = await pool.query(sql)
  console.log('Consulta direta ao PostgreSQL: saldo cadastrado x histórico completo (ativos e inativos).')
  console.table(rows)
  if (rows.some(linha => !linha.coerente)) { console.error('Há divergência de saldo.'); process.exitCode = 1 }
  else console.log('Todos os saldos conferem com o histórico.')
} finally { await pool.end() }
