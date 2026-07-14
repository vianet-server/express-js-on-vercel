// db.ts
import pg from 'pg'

const { Pool } = pg

const neonUrl = process.env.POSTGRES_URL
const prismaUrl = process.env.POSTGRES_PRISMA_URL

if (!neonUrl) {
  throw new Error('POSTGRES_NEON_URL not set')
}

if (!prismaUrl) {
  throw new Error('POSTGRES_PRISMA_URL not set')
}

export const neonPool = new Pool({
  connectionString: neonUrl,
  max: 1,
  idleTimeoutMillis: 5000,
})

export const neonDb = neonPool;

export const prismaPool = new Pool({
  connectionString: prismaUrl,
  max: 1,
  idleTimeoutMillis: 5000,
})