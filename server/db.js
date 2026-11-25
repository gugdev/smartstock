import 'dotenv/config'
import pg from 'pg'

// Datas civis e preços têm representação estável no JSON da API.
pg.types.setTypeParser(1082, valor => valor)
pg.types.setTypeParser(1700, Number)
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no arquivo .env antes de iniciar.')
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 })

export async function transacao(executar) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const resultado = await executar(cliente)
    await cliente.query('COMMIT')
    return resultado
  } catch (erro) {
    await cliente.query('ROLLBACK')
    throw erro
  } finally {
    cliente.release()
  }
}
