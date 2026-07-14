import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const root = process.cwd()
const vianetDist = path.join(root, 'vianet', 'dist')

// Serve vianet frontend static assets
app.use('/assets', express.static(path.join(vianetDist, 'assets')))
app.use('/favicon.svg', express.static(path.join(vianetDist, 'favicon.svg')))

app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'))
})

// SPA fallback — serve index.html for all frontend routes
// Note: Register API routes BEFORE this if they share a prefix (e.g. /admin/api/*)
const spaIndex = path.join(vianetDist, 'index.html')
const spaPaths = ['/auth', '/app', '/employ', '/admin']
for (const p of spaPaths) {
  app.get(p, (_, res) => res.sendFile(spaIndex))
  app.get(`${p}/*`, (_, res) => res.sendFile(spaIndex))
}

// Redirect / to /app
app.get('/', (_, res) => {
  res.redirect('/app')
})

// Example API endpoint - JSON
app.get('/api-data', (req, res) => {
  res.json({
    message: 'Here is some sample API data',
    items: ['apple', 'banana', 'cherry'],
  })
})

// Check Neon connection
app.get('/check-neon', async (_, res) => {
  const url = process.env.DATABASE_URL
  if (!url) return res.status(500).json({ ok: false, error: 'DATABASE_URL not set' })
  try {
    const pool = new pg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 5000 })
    const result = await pool.query('SELECT 1 AS ok')
    await pool.end()
    res.json({ ok: true, db: 'neon', rows: result.rows })
  } catch (error: any) {
    res.status(500).json({ ok: false, db: 'neon', error: error.message })
  }
})

// Check Prisma connection (using POSTGRES_PRISMA_URL)
app.get('/check-prisma', async (_, res) => {
  const url = process.env.POSTGRES_PRISMA_URL
  if (!url) return res.status(500).json({ ok: false, error: 'POSTGRES_PRISMA_URL not set' })
  try {
    const pool = new pg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 5000 })
    const result = await pool.query('SELECT 1 AS ok')
    await pool.end()
    res.json({ ok: true, db: 'prisma', rows: result.rows })
  } catch (error: any) {
    res.status(500).json({ ok: false, db: 'prisma', error: error.message })
  }
})

// Check Supabase connection
app.get('/check-supabase', async (_, res) => {
  const url = process.env.vianetinternaldatabase_POSTGRES_URL
  if (!url) return res.status(500).json({ ok: false, error: 'vianetinternaldatabase_POSTGRES_URL not set' })
  try {
    const pool = new pg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 5000 })
    const result = await pool.query('SELECT 1 AS ok')
    await pool.end()
    res.json({ ok: true, db: 'supabase', rows: result.rows })
  } catch (error: any) {
    res.status(500).json({ ok: false, db: 'supabase', error: error.message })
  }
})

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
