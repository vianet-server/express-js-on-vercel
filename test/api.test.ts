import { describe, expect, it } from '@jest/globals';
import request from 'supertest';

// The codebase uses CommonJS `require` (see src/index.ts), so follow the same
// convention here to avoid ESM/CJS type-resolution issues.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/index');

// TODO: fill in real admin credentials (or export ADMIN_EMAIL / ADMIN_PASSWORD).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'deepsehgal@vianet.co.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vianet@adminserver';

describe('admin login', () => {
  it('logs in, returns a valid JWT, and logs it', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);

    const { token, message, user } = res.body;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(message).toBe('login successful');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('id');
    expect(decoded).toHaveProperty('email');
    expect(decoded.user_type).toBe('admin');

    expect(decoded.user_type).toBe('admin');
    expect(decoded.id).toBe('1');
    expect(decoded.email).toBe('deepsehgal@vianet.co.in');
  });
});
