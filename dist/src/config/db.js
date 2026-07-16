"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaPool = exports.neonDb = exports.neonPool = void 0;
// db.ts
const pg = require('pg');
const { Pool } = pg;
const neonUrl = process.env.POSTGRES_URL;
const prismaUrl = process.env.POSTGRES_PRISMA_URL;
if (!neonUrl) {
    throw new Error('POSTGRES_NEON_URL not set');
}
if (!prismaUrl) {
    throw new Error('POSTGRES_PRISMA_URL not set');
}
exports.neonPool = new Pool({
    connectionString: neonUrl,
    max: 1,
    idleTimeoutMillis: 5000,
});
exports.neonDb = exports.neonPool;
exports.prismaPool = new Pool({
    connectionString: prismaUrl,
    max: 1,
    idleTimeoutMillis: 5000,
});
