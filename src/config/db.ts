// db.ts
const pg = require('pg');
const crypto = require('crypto');
const Redis = require('ioredis');

const { Pool } = pg;


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

export const prismaPool = new Pool({
  connectionString: prismaUrl,
  max: 1,
  idleTimeoutMillis: 5000,
})

// ---------------------------------------------------------------------------
// Redis read-through cache (Upstash, via ioredis over rediss://)
//
// Every SELECT through neonDb.query is cached for CACHE_TTL seconds, keyed by
// SQL text + params. On a miss we query Postgres and store the result. Any
// non-SELECT (write) bumps a generation counter so all cached reads are
// invalidated in O(1) (no key scanning). Redis is optional: if up_REDIS_URL is
// missing (or under Jest) the cache is a no-op and all queries hit Postgres.
// ---------------------------------------------------------------------------
const CACHE_TTL = 7200; // 2 hours
const GEN_KEY = 'dbcache:gen';

const g: any = globalThis;
let redis: any = null;
let localGen = '0';

if (process.env.up_REDIS_URL && !process.env.JEST_WORKER_ID) {
  if (!g.__redisClient) {
    const client = new Redis(process.env.up_REDIS_URL, {
      tls: {},
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 500)),
    });
    client.on('error', () => {});
    g.__redisClient = client;
  }
  redis = g.__redisClient;
  redis.get(GEN_KEY).then((v) => { if (v) localGen = v; }).catch(() => {});
}

function isSelect(text) {
  return String(text).trim().toUpperCase().indexOf('SELECT') === 0;
}

function cacheKey(text, params) {
  const hash = crypto.createHash('sha256').update(text + ' ' + JSON.stringify(params || [])).digest('hex');
  return 'dbcache:' + localGen + ':' + hash;
}

async function bumpGen() {
  if (!redis) return;
  localGen = String(Number(localGen) + 1);
  try { await redis.set(GEN_KEY, localGen); } catch (e) {}
}

const realQuery = neonPool.query.bind(neonPool);

(neonPool).query = async function cachedQuery(text, params) {
  if (!redis) return realQuery(text, params);
  if (!isSelect(text)) {
    const res = await realQuery(text, params);
    await bumpGen();
    return res;
  }
  const key = cacheKey(text, params || []);
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  const res = await realQuery(text, params);
  try { await redis.set(key, JSON.stringify(res), 'EX', CACHE_TTL); } catch (e) {}
  return res;
};

export const neonDb = neonPool;
