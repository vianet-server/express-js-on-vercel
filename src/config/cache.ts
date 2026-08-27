// cache.ts
// Single, simple Redis cache for src/config/dbqueries/*.
//
// Public API (the 3 functions you asked for + the write-invalidation helper):
//   checkRedis()                       -> { enabled, status } (is Redis up?)
//   checkData(key, tables)            -> cached value or null
//   getData(key, fetchFn, tables, ttl) -> cache-aside: returns cached value, or
//                                         runs fetchFn(), caches it, returns it
//   invalidateTables(tables)          -> bumps the generation of each table so
//                                         cached reads that depend on it flush
//
// Invalidation is table-scoped and shares generation counters (dbcache:gen:{t}).
// A write bumps ONLY the tables it touches, so e.g. a sale (app.sales_records)
// does NOT flush the app.inventory cache, but an inventory edit does. Writes do
// this via invalidateTables(); reads do it transparently through getData().
//
// All Redis access is best-effort: if Redis is missing (no up_REDIS_URL, or under
// Jest) every getData()/checkData() falls back to the database and nothing throws.

const crypto = require('crypto');
const Redis = require('ioredis');

const CACHE_TTL = 7200; // 2 hours

const g = globalThis;
let redis: any = null;

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
  redis
    .ping()
    .then((r) => console.log('[redis] connected:', r))
    .catch((e) => console.log('[redis] ping failed:', e && e.message));
}

function sha(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function client() {
  return redis || null;
}

// Build the "generation part" of a cache key from the current generation of each
// table. When any of those tables is written, its generation increments, so the
// previously-built key will never match again -> the read is effectively flushed.
async function genPart(tables) {
  const r = client();
  if (!r || !tables || !tables.length) return 'nohint';
  try {
    const gens = await r.mget(...tables.map((t) => 'dbcache:gen:' + t));
    return tables.map((t, i) => t + ':' + (gens[i] || '0')).join('|');
  } catch (e) {
    return 'nohint';
  }
}

// Build the full cache key: fn:{key}:{genPart}. genPart is async (reads gens).
async function fullKey(key, tables) {
  return 'fn:' + key + ':' + (await genPart(tables));
}

// --- 3 public functions -----------------------------------------------------

// Is Redis configured & connected?
function checkRedis() {
  if (!redis) return { enabled: false, status: 'disabled' };
  return { enabled: true, status: redis.status || 'unknown' };
}

// Return the cached value for (key, tables) or null on miss / error.
async function checkData(key, tables) {
  const r = client();
  if (!r) return null;
  try {
    const v = await r.get(await fullKey(key, tables));
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

// Cache-aside read. If cached, return it; otherwise run fetchFn(), cache the
// result, and return it. Falls back to fetchFn() when Redis is unavailable.
async function getData(key, fetchFn, tables, ttl = CACHE_TTL) {
  const r = client();
  if (!r) return fetchFn();
  const fk = await fullKey(key, tables);
  try {
    const cached = await r.get(fk);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  const val = await fetchFn();
  try {
    await r.set(fk, JSON.stringify(val), 'EX', ttl);
  } catch (e) {}
  return val;
}

// Bump the generation of each table so any cached read depending on it is
// invalidated. Called by writers (and internally by wrapExports for role:'write').
async function invalidateTables(tables) {
  const r = client();
  if (!r || !tables || !tables.length) return;
  try {
    await Promise.all(tables.map((t) => r.incr('dbcache:gen:' + t)));
  } catch (e) {}
}

// --- wiring helper (reimplemented on top of the 3 functions) -----------------
// Each dbquery module calls cache.wrapExports({...fns}, META) so every function
// owns its cache: reads go through getData(), writes bump their tables' gens.
//   META[name] = { role: 'read' | 'write', tables: string[] }
function wrapExports(orig, meta) {
  const out = {};
  for (const [name, fn] of Object.entries(orig)) {
    if (typeof fn !== 'function') {
      out[name] = fn;
      continue;
    }
    const m = meta[name] || { role: 'read', tables: [] };
    if (m.role === 'write') {
      out[name] = async (...args) => {
        if (m.tables && m.tables.length) await invalidateTables(m.tables);
        return fn(...args);
      };
    } else {
      out[name] = (...args) =>
        getData(
          name + ':' + sha(JSON.stringify(args == null ? [] : args)),
          () => fn(...args),
          m.tables || [],
          m.ttl || CACHE_TTL
        );
    }
  }
  return out;
}

module.exports = { checkRedis, checkData, getData, invalidateTables, wrapExports, CACHE_TTL };
