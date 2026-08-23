require('dotenv').config({ quiet: true });

// Silence pg's one-time "SSL modes 'prefer'/'require'..." warning emitted when
// the connection pool is created (src/config/db.ts). It's harmless noise for
// tests, so filter it out before it reaches the console.
const origEmitWarning = process.emitWarning;
process.emitWarning = (...args) => {
  if (String(args[0]).includes('SSL modes')) return;
  return origEmitWarning.apply(process, args);
};

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test-not-real';

// The app reads DB URLs at import time (src/config/db.ts throws if unset).
// Dummy values let tests import the app without a real database connection.
process.env.POSTGRES_URL = process.env.POSTGRES_URL || 'postgres://user:pass@localhost:5432/db';
process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || 'postgres://user:pass@localhost:5432/db?sslmode=require';

// Used to sign/verify test JWTs.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
