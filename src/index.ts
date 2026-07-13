import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const root = process.cwd()
const vianetDist = path.join(root, 'vianet', 'dist')

// Serve vianet frontend static assets
app.use('/assets', express.static(path.join(vianetDist, 'assets')))
app.use('/favicon.svg', express.static(path.join(vianetDist, 'favicon.svg')))

// Admin frontend
app.get('/admin', (_, res) => {
  res.sendFile(path.join(vianetDist, 'admin.html'))
})

// Employee frontend
app.get('/employ', (_, res) => {
  res.sendFile(path.join(vianetDist, 'employ.html'))
})

// App frontend
app.get('/app', (_, res) => {
  res.sendFile(path.join(vianetDist, 'app.html'))
})

// Redirect / to /app
app.get('/', (_, res) => {
  res.redirect('/app')
})

app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'))
})

// Example API endpoint - JSON
app.get('/api-data', (req, res) => {
  res.json({
    message: 'Here is some sample API data',
    items: ['apple', 'banana', 'cherry'],
  })
})

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
