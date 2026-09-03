// db.ts
// Pure Postgres connection pool. All caching now lives in src/config/cache.ts.
const pg = require('pg');

const { Pool } = pg;

const neonUrl = process.env.POSTGRES_URL
const prismaUrl = process.env.POSTGRES_PRISMA_URL

if (!neonUrl) {
  throw new Error('POSTGRES_NEON_URL not set')
}

if (!prismaUrl) {
  throw new Error('POSTGRES_PRISMA_URL not set')
}

const neonPool = new Pool({
  connectionString: neonUrl,
  // Allow a handful of concurrent connections so parallel API calls from one
  // page (e.g. the SKU access-control page fires /sku + /control together) do
  // not serialize behind a single connection.
  max: 5,
  idleTimeoutMillis: 30000,
})

const prismaPool = new Pool({
  connectionString: prismaUrl,
  max: 1,
  idleTimeoutMillis: 5000,
})

// neonDb is just the raw pool: query() always hits Postgres. Caching is applied
// per-function in src/config/dbqueries/* via cache.wrapExports().
const neonDb = neonPool

module.exports = { neonPool, prismaPool, neonDb }
