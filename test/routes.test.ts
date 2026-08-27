/**
 * routes.test.ts
 *
 * Hermetic integration tests over the Express app (src/index.ts) backed by a
 * mocked neonDb and a stubbed email service. No real DB / Resend calls happen.
 *
 * Covers the auth guard matrix (401/403) and representative happy/error paths
 * across the public /api, /employee, /partner and /api/admin routers.
 */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import request from 'supertest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');

// `mock`-prefixed names so the hoisted jest.mock factories can reference them.
const mockNeonDb = {
  query: jest.fn(async (_text: string, _params?: any[]) => ({ rows: [] as any[] })),
};
const mockSendWelcomeEmail = jest.fn(async () => ({}));
jest.mock('../src/config/db', () => ({ neonDb: mockNeonDb }));
jest.mock('../src/services/email', () => ({ sendWelcomeEmail: mockSendWelcomeEmail }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/index');

// ---------------------------------------------------------------------------
// neonDb.query rule engine
// ---------------------------------------------------------------------------

interface Rule { pattern: RegExp; result: any; }
const rules: Rule[] = [];

/** Register a SQL-fragment rule: the first matching pattern wins. */
function when(pattern: RegExp, result: { rows: any[] }) {
  rules.push({ pattern, result });
}

mockNeonDb.query.mockImplementation(
  async (text: string, _params?: any[]) => {
    for (const r of rules) {
      if (r.pattern.test(text)) return r.result;
    }
    return { rows: [] };
  }
);

const row = (r: any) => ({ rows: [r] });
const rows = (...rs: any[]) => ({ rows: rs });

function tokenFor(user_type: string, id: string = '1') {
  return jwt.sign({ id, email: `${user_type}@x.io`, user_type }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
const adminBearer = () => ({ Authorization: `Bearer ${tokenFor('admin')}` });
const userBearer = () => ({ Authorization: `Bearer ${tokenFor('user')}` });
const employeeBearer = () => ({ Authorization: `Bearer ${tokenFor('employee')}` });
const partnerBearer = () => ({ Authorization: `Bearer ${tokenFor('partner')}` });

const DATETIME = '2026-01-01T00:00:00.000Z';
const ADMIN_USER = { id: '1', email: 'admin@x.io', user_type: 'admin', password: bcrypt.hashSync('secret', 10) };

beforeEach(() => {
  rules.length = 0;
  mockNeonDb.query.mockClear();
  mockSendWelcomeEmail.mockClear();
  mockSendWelcomeEmail.mockResolvedValue({ data: null, error: null });
});

// =============================================================================
// public ping + sample endpoints
// =============================================================================

describe('public API endpoints', () => {
  it('GET / returns hello text', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.text).toBe('hi');
  });

  it('GET /api/users returns the sample user list', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  });
});

// =============================================================================
// admin login
// =============================================================================

describe('POST /api/admin/login', () => {
  it('returns 400 when credentials are missing', async () => {
    const res = await request(app).post('/api/admin/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.token).toBeNull();
  });

  it('returns 401 for an unknown user', async () => {
    const res = await request(app).post('/api/admin/login').send({ email: 'nobody@x.io', password: 'secret' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeNull();
  });

  it('returns 401 for a wrong password', async () => {
    when(/SELECT \* FROM app\.users WHERE email = \$1 LIMIT 1/, row(ADMIN_USER));
    const res = await request(app).post('/api/admin/login').send({ email: 'admin@x.io', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeNull();
  });

  it('returns a valid admin JWT on success', async () => {
    when(/SELECT \* FROM app\.users WHERE email = \$1 LIMIT 1/, row(ADMIN_USER));
    const res = await request(app).post('/api/admin/login').send({ email: 'admin@x.io', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('login successful');
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.user_type).toBe('admin');
    expect(res.body.user.email).toBe('admin@x.io');
  });
});

// =============================================================================
// adminAuth guard matrix
// =============================================================================

describe('adminAuth guard', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Access denied. No token provided.');
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats').set({ Authorization: 'Bearer not.a.jwt' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin token', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats').set(userBearer());
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('User is not an admin');
  });

  it('allows an admin on a protected route', async () => {
    when(/FROM app\.sales_records WHERE sales_date = CURRENT_DATE AND salesman IS NOT NULL/, row({ name: 'Sales', amount: '100' }));
    when(/FROM app\.sales_records WHERE sales_date = CURRENT_DATE$/, row({ total: '100', orders: '2' }));
    when(/FROM app\.sales_records WHERE sales_date = CURRENT_DATE - 1$/, row({ total: '50' }));
    when(/FROM app\.inventory WHERE isblocked IS NOT TRUE/, row({ total: '25.5' }));
    const res = await request(app).get('/api/admin/dashboard/stats').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body.todaySale).toBe(100);
    expect(res.body.totalOrders).toBe(2);
    expect(res.body.topSalesman.name).toBe('Sales');
  });
});

// =============================================================================
// admin endpoints (happy + error paths)
// =============================================================================

describe('admin accesscontrol endpoints', () => {
  it('POST returns 400 when email/password missing', async () => {
    const res = await request(app).post('/api/admin/accesscontrol').set(adminBearer()).send({ email: 'x@y.z' });
    expect(res.status).toBe(400);
  });

  it('POST creates a user and returns 201', async () => {
    when(/INSERT INTO app\.users \(email, password, user_type, access_group_id/, row({ id: '3', email: 'x@y.z', user_type: 'user', access_group_id: 1 }));
    const res = await request(app).post('/api/admin/accesscontrol').set(adminBearer()).send({ email: 'x@y.z', password: 'secret' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created');
    expect(res.body.data.email).toBe('x@y.z');
  });

  it('GET returns a paginated user list', async () => {
    when(/ALTER TABLE app\.users/, { rows: [] });
    when(/SELECT COUNT\(\*\) FROM app\.users u/, row({ count: '2' }));
    when(/SELECT u\.id, u\.email/, rows({ id: 1, email: 'a@x.io', user_type: 'admin' }, { id: 2, email: 'b@x.io', user_type: 'user' }));
    const res = await request(app).get('/api/admin/accesscontrol?limit=10').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.rows).toHaveLength(2);
    expect(res.body.limit).toBe(10);
  });
});

describe('admin api-key endpoints', () => {
  it('POST /api/admin/api returns 201 with a generated key', async () => {
    when(/ALTER TABLE app\.api/, { rows: [] });
    when(/SELECT id FROM app\.access_groups WHERE name = \$1/, row({ id: 3 }));
    when(/VALUES \(\$1, \$2, \$3, \$4, \$5, \$6::jsonb/, row({ keyid: 'kid', key_name: 'My Key', key: 'via.x', access_group_id: 3, permissions: ['products_read'], duration: '7d', created_at: DATETIME, last_used: null, is_active: true }));
    when(/SELECT name FROM app\.access_groups WHERE id = \$1/, row({ name: 'Retail' }));
    const res = await request(app).post('/api/admin/api').set(adminBearer()).send({ key_name: 'My Key', group: 'Retail', permissions: ['products_read'], duration: '7d' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Key');
    expect(res.body.group).toBe('Retail');
  });

  it('POST /api/admin/api returns 400 when group/key_name missing', async () => {
    const res = await request(app).post('/api/admin/api').set(adminBearer()).send({ key_name: 'K' });
    expect(res.status).toBe(400);
  });

  it('GET /api/admin/api/usage returns today/month + quota', async () => {
    when(/FROM api_key_log WHERE created_at >= CURRENT_DATE/, row({ count: 3 }));
    when(/date_trunc\('month', CURRENT_DATE\)/, row({ count: 7 }));
    const res = await request(app).get('/api/admin/api/usage').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ todayRequests: 3, monthRequests: 7, quotaRemaining: 9993 });
  });

  it('GET /api/admin/access-groups lists options', async () => {
    when(/SELECT id, name FROM app\.access_groups ORDER BY name/, rows({ id: 1, name: 'Retail' }));
    const res = await request(app).get('/api/admin/access-groups').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Retail' }]);
  });

  it('GET /api/admin/api/permissions returns the static permission list', async () => {
    const res = await request(app).get('/api/admin/api/permissions').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body.map((p: any) => p.id)).toContain('products_read');
  });
});

// =============================================================================
// auth() guard (employee/partner/app)
// =============================================================================

describe('auth() guard', () => {
  it('returns 401 without a token on /api/stock/stock-item', async () => {
    const res = await request(app).get('/api/stock/stock-item');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a wrong role', async () => {
    // /employee uses auth('employee'); a partner token is rejected.
    const res = await request(app).get('/employee/profile').set(partnerBearer());
    expect(res.status).toBe(403);
  });

  it('GET /employee/profile allows an admin', async () => {
    when(/SELECT id, email, user_type FROM app\.users WHERE id = \$1/, row({ id: '1', email: 'admin@x.io', user_type: 'admin' }));
    when(/SELECT \* FROM employee_profiles WHERE user_id = \$1/, row({ user_id: '1', first_name: 'A' }));
    const res = await request(app).get('/employee/profile').set(employeeBearer());
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Employee profile fetched');
    expect(res.body.data.profile.first_name).toBe('A');
  });

  it('GET /partner/profile returns null profile when none exists', async () => {
    when(/SELECT id, email, user_type FROM app\.users WHERE id = \$1/, row({ id: '1', email: 'p@x.io', user_type: 'partner' }));
    when(/SELECT \* FROM partner_profiles WHERE user_id = \$1/, { rows: [] });
    const res = await request(app).get('/partner/profile').set(partnerBearer());
    expect(res.status).toBe(200);
    expect(res.body.data.profile).toBeNull();
  });
});

// =============================================================================
// /api/stock happy path
// =============================================================================

describe('GET /api/stock/stock-item', () => {
  it('returns a non-admin list with computed gst', async () => {
    when(/FROM app\.inventory inv\s+INNER JOIN app\.inventory_access_group iag/, rows({ id: 1, name: 'N', gst: '18', })
    );
    const res = await request(app).get('/api/stock/stock-item').set(userBearer());
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Stock items fetched');
    expect(res.body.data[0].sgst).toBe(9);
    expect(res.body.data[0].cgst).toBe(9);
  });

  it('marks noAccess when a non-admin has no stock', async () => {
    const res = await request(app).get('/api/stock/stock-item').set(userBearer());
    expect(res.status).toBe(200);
    expect(res.body.noAccess).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('lets an admin list stock even when no access-group rows exist', async () => {
    when(/FROM app\.inventory inv WHERE 1=1/, rows({ id: 1, stockname: 'X', gst: '18' }));
    const res = await request(app).get('/api/stock/stock-item').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body.noAccess).toBeUndefined();
    expect(res.body.data).toHaveLength(1);
  });
});

// =============================================================================
// /api/auth and portals
// =============================================================================

describe('/api/auth/register', () => {
  it('returns 400 when email/password missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.z' });
    expect(res.status).toBe(400);
  });

  it('returns 409 when the email already exists', async () => {
    when(/SELECT \* FROM app\.users WHERE email = \$1/, row({ id: 1 }));
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.z', password: 'secret' });
    expect(res.status).toBe(409);
  });

  it('creates a user and sends a welcome email', async () => {
    when(/SELECT MIN\(id\) as id FROM app\.access_groups/, row({ id: 3 }));
    when(/INSERT INTO app\.users \(name, email, password, user_type/, row({ id: 9, email: 'x@y.z', user_type: 'user' }));
    when(/SELECT \* FROM app\.users WHERE email = \$1/, { rows: [] });
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.z7', password: 'secret' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered');
    expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
  });
});

describe('/employee/auth/login', () => {
  it('returns 401 on invalid credentials', async () => {
    const res = await request(app).post('/employee/auth/login').send({ email: 'e@x.io', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeNull();
  });

  it('logs in an employee and returns a JWT', async () => {
    when(/SELECT \* FROM app\.users WHERE email = \$1 AND \(user_type = \$2 OR user_type = \$3\)/, row({ id: '2', email: 'e@x.io', user_type: 'employee', password: bcrypt.hashSync('secret', 10) }));
    const res = await request(app).post('/employee/auth/login').send({ email: 'e@x.io', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.user_type).toBe('employee');
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});

describe('/partner/auth/login', () => {
  it('logs in a partner and returns a JWT', async () => {
    when(/SELECT \* FROM app\.users WHERE email = \$1 AND user_type = \$2/, row({ id: '3', email: 'p@x.io', user_type: 'partner', password: bcrypt.hashSync('secret', 10) }));
    const res = await request(app).post('/partner/auth/login').send({ email: 'p@x.io', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.user_type).toBe('partner');
    expect(res.body.token.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// apiKeyAuth + /api/v1
// =============================================================================

describe('apiKeyAuth guard', () => {
  it('returns 401 without an API key', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('API key is required. Use Authorization: Bearer <your_api_key>');
  });

  it('returns 401 for an unknown key', async () => {
    const res = await request(app).get('/api/v1/products').set({ Authorization: 'Bearer via.unknown' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid API key');
  });

  it('returns 403 for a revoked key', async () => {
    when(/FROM app\.api k/, row({ keyid: 'k', key_name: 'K', key: 'via.x', access_group_id: null, permissions: ['products_read'], duration: 'never', is_active: false, created_at: DATETIME, group_name: null }));
    const res = await request(app).get('/api/v1/products').set({ Authorization: 'Bearer via.x' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('API key has been revoked');
  });

  it('returns 403 when the permission is missing', async () => {
    when(/FROM app\.api k/, row({ id: 'k1', key_name: 'K', key: 'via.x', access_group_id: null, is_active: true, permissions: [], duration: 'never', created_at: DATETIME, group_name: null }));
    const res = await request(app).get('/api/v1/products').set({ Authorization: 'Bearer via.x' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('products_read');
  });

  it('returns an expired-key 403', async () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    when(/FROM app\.api k/, row({ key: 'via.x', is_active: true, permissions: ['products_read'], duration: '1h', created_at: past, access_group_id: null, group_name: null }));
    const res = await request(app).get('/api/v1/products').set({ Authorization: 'Bearer via.x' });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('API key has expired');
  });

  it('returns products for a valid key', async () => {
    when(/FROM app\.api k/, row({ keyid: 'k1', key_name: 'K', key: 'via.x', access_group_id: 2, is_active: true, permissions: ['products_read'], duration: 'never', created_at: DATETIME, group_name: 'Retail' }));
    when(/SELECT COUNT\(\*\)::int AS total/, row({ total: 1 }));
    when(/AS name, CAST/, rows({ id: 1, name: 'N', sku: '1', qty: 2, price: 3 }));
    const res = await request(app).get('/api/v1/products').set({ Authorization: 'Bearer via.x' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('GET /api/v1/analytics/sales sums ledger amounts', async () => {
    when(/FROM app\.api k/, row({ keyid: 'k1', key_name: 'K', key: 'via.x', access_group_id: null, is_active: true, permissions: ['analytics_read'], duration: 'never', created_at: DATETIME, group_name: null }));
    when(/FROM api_key_log/, { rows: [] });
    when(/SELECT v\.id, v\.date/, rows({ id: 1, voucher_type: 'Sales', voucher_number: 'S1', ledgerentries: [{ amount: '10' }, { amount: '5' }], inventoryentries: [] }));
    const res = await request(app).get('/api/v1/analytics/sales').set({ Authorization: 'Bearer via.x' });
    expect(res.status).toBe(200);
    expect(res.body.data[0].amount).toBe(15);
    expect(res.body.data[0].type).toBe('Sales');
  });
});

// =============================================================================
// balance-sheet normalisation
// =============================================================================

describe('GET /api/admin/reports/balance-sheet', () => {
  it('normalises the raw nested Tally snapshot from app.balancesheet', async () => {
    when(/FROM app\.balancesheet/, row({
      data: {
        balancesheet: {
          included: [
            {
              AccName: 'Capital Account',
              Amount: '3874350.99',
              Children: [
                {
                  AccName: 'Reserves & Surplus',
                  Amount: '8447737.43',
                  Children: [
                    { AccName: 'Personal Expenses', Amount: '-43416.00' },
                    { AccName: 'Primery', Amount: {} },
                  ],
                },
              ],
            },
            {
              AccName: 'Fixed Assets',
              Amount: '-7139698.29',
              Children: [{ AccName: 'Computer', Amount: '-197436.00' }],
            },
          ],
        },
      },
    }));
    const res = await request(app).get('/api/admin/reports/balance-sheet').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const capital = res.body[0];
    expect(capital).toMatchObject({ label: 'Capital Account', amount: 3874350.99, type: 'liability' });
    expect(capital.subs).toHaveLength(3); // Reserves & Surplus + its 2 children
    expect(capital.subs[0]).toMatchObject({ label: expect.stringContaining('Reserves & Surplus'), amount: 8447737.43 });
    expect(capital.subs[1].label).toContain('Personal Expenses');
    expect(capital.subs[1].amount).toBe(43416);
    expect(capital.subs[2].label).toContain('Primery');
    expect(capital.subs[2].amount).toBe(0);

    expect(res.body[1]).toMatchObject({ label: 'Fixed Assets', amount: 7139698.29, type: 'asset' });
    expect(res.body[1].subs[0].amount).toBe(197436);
  });

  it('still supports the legacy { rows: [...] } shape', async () => {
    when(/FROM app\.balancesheet/, row({
      data: { rows: [{ name: 'Sundry Creditors', amount: '30978938.18' }, { name: 'Closing Stock', amount: '-51154310.00' }] },
    }));
    const res = await request(app).get('/api/admin/reports/balance-sheet').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ label: 'Sundry Creditors', type: 'liability', subs: [] });
    expect(res.body[1]).toMatchObject({ label: 'Closing Stock', type: 'asset' });
  });

  it('returns [] when nothing has ever been synced', async () => {
    when(/FROM app\.balancesheet/, { rows: [] });
    const res = await request(app).get('/api/admin/reports/balance-sheet').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// =============================================================================
// pnl-monthly normalisation (children -> subs)
// =============================================================================

describe('GET /api/admin/reports/pnl-monthly', () => {
  it('maps row children into signed subs, dropping zero-amount sub-ledgers', async () => {
    when(/FROM app\.profitloss_monthly/, rows(
      {
        month: '2026-01',
        data: {
          rows: [
            { name: 'Sales Accounts', amount: '195418003.99', children: [{ name: 'Sales', amount: '192973332.99' }, { name: 'SAMPLE', amount: '0' }] },
            { name: 'Indirect Expenses', amount: '-8072236.53', children: [{ name: 'Salary', amount: '-2897109.00' }] },
            { name: 'Cost of Sales :', amount: '-184177679.34' }, // no children key
          ],
        },
      },
    ));
    const res = await request(app).get('/api/admin/reports/pnl-monthly').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].month).toBe('2026-01');

    const sales = res.body[0].data[0];
    expect(sales).toMatchObject({ label: 'Sales Accounts', amount: 195418003.99, type: 'income' });
    // "SAMPLE" (amount 0) must not be returned at all
    expect(sales.subs).toEqual([
      { label: 'Sales', amount: 192973332.99 },
    ]);

    const indirect = res.body[0].data.find((d: any) => d.label === 'Indirect Expenses');
    expect(indirect).toMatchObject({ type: 'expense' });
    expect(indirect.subs[0]).toEqual({ label: 'Salary', amount: -2897109 });

    const cos = res.body[0].data.find((d: any) => d.label === 'Cost of Sales :');
    expect(cos.subs).toEqual([]);
  });

  it('unwraps the double-wrapped sync payload stored in the DB', async () => {
    when(/FROM app\.profitloss_monthly/, rows(
      {
        month: '2026-01',
        // Sync tool stores { month, data } as the whole JSONB value
        data: {
          month: '2026-01',
          data: { rows: [{ name: 'Sales Accounts', amount: '18276224.43', children: [{ name: 'Sales', amount: '18276224.43' }] }] },
        },
      },
    ));
    const res = await request(app).get('/api/admin/reports/pnl-monthly').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body[0].month).toBe('2026-01');
    expect(res.body[0].data[0]).toMatchObject({ label: 'Sales Accounts', amount: 18276224.43, type: 'income' });
    expect(res.body[0].data[0].subs).toEqual([{ label: 'Sales', amount: 18276224.43 }]);
  });
});

// =============================================================================
// inventory/stock qty = quantity + vquantity (live Tally adjustments)
// =============================================================================

describe('GET /api/admin/inventory/stock', () => {
  it('returns qty as quantity + vquantity, matching the SKU/app definition', async () => {
    when(/FROM app\.inventory inv/, rows({
      id: 1, stockname: 'Widget', fullname: 'Widget', brand: 'Acme', category_level_1: 'Gadgets',
      model: 'M1', varient: 'V1', color: 'Red', quantity: 10, vquantity: 3, inv_price: 100, gst: 18,
      min_stock: 2, max_stock: 50, count: 1,
    }));
    const res = await request(app).get('/api/admin/inventory/stock?limit=500&offset=0&brand=all&group=all').set(adminBearer());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.rows[0]).toMatchObject({ id: 1, name: 'Widget', qty: 13 });
    expect(res.body.rows[0].qty).toBe(13);
  });
});