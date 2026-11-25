import { app } from './app.js'
import { pool } from './db.js'

const porta = Number(process.env.PORT || 3001)
await pool.query('SELECT 1')
const servidor = app.listen(porta, '127.0.0.1', () => console.log(`SmartStock API: http://127.0.0.1:${porta}/api/docs/`))
for (const sinal of ['SIGINT','SIGTERM']) process.on(sinal, () => servidor.close(async () => { await pool.end(); process.exit(0) }))
