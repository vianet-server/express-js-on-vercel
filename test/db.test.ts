/**
 * db.test.ts
 *
 * Hermetic unit tests for every DB query helper in src/config/dbqueries.
 *
 * Strategy:
 *   - jest.mock('../src/config/db') so `neonDb` is a fake whose .query() records
 *     each call and returns caller-controlled hermetic rows.
 *   - The dbquery modules all `require('../db')` at load time, so the mock fully
 *     replaces the pg pool; no real connection is ever made.
 *   - Each test asserts the exact SQL text + params a helper sends and the exact
 *     row/aggregate shape it returns.
 */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';

// `mock`-prefixed name so the hoisted jest.mock factory can reference it.
const mockNeonDb = {
  query: jest.fn(async (_text: string, _params?: any[]) => ({ rows: [] as any[] })),
};
jest.mock('../src/config/db', () => ({ neonDb: mockNeonDb }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbq = require('../src/config/dbqueries/index');
const { shared, admin, api, employee, partner } = dbq;

const row = (r: any) => ({ rows: [r] });
const rows = (...rs: any[]) => ({ rows: rs });

/** Read back the SQL text for a recorded neonDb.query call. */
function sqlAt(index: number): string {
  return mockNeonDb.query.mock.calls[index][0];
}

/** Read back the params for a recorded neonDb.query call. */
function paramsAt(index: number): any[] {
  return mockNeonDb.query.mock.calls[index][1] ?? [];
}

beforeEach(() => {
  mockNeonDb.query.mockReset();
});

// =============================================================================
// shared
// =============================================================================

describe('shared query helpers', () => {
  it('findUserByEmail selects the full user row by email', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 7, email: 'a@b.c' }));
    const out = await shared.findUserByEmail('a@b.c');
    expect(sqlAt(0)).toBe('SELECT * FROM app.users WHERE email = $1');
    expect(paramsAt(0)).toEqual(['a@b.c']);
    expect(out).toEqual({ id: 7, email: 'a@b.c' });
  });

  it('getUserBriefById selects a brief projection', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 3, email: 'e@x.y', user_type: 'employee' }));
    const out = await shared.getUserBriefById(3);
    expect(sqlAt(0)).toBe('SELECT id, email, user_type FROM app.users WHERE id = $1');
    expect(paramsAt(0)).toEqual([3]);
    expect(out.user_type).toBe('employee');
  });

  it('getMinAccessGroupId returns the min group id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 3 }));
    await expect(shared.getMinAccessGroupId()).resolves.toBe(3);
    expect(sqlAt(0)).toBe('SELECT MIN(id) as id FROM app.access_groups');
  });

  it('getMinAccessGroupId returns null when no groups exist', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await expect(shared.getMinAccessGroupId()).resolves.toBeNull();
  });

  it('createUser inserts a named user', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 9, email: 'e@x.y', user_type: 'user' }));
    const out = await shared.createUser({
      name: 'Full Name',
      email: 'e@x.y',
      password_hash: 'hash',
      user_type: 'user',
      access_group_id: 4,
    });
    expect(sqlAt(0)).toContain('INSERT INTO app.users (name, email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())');
    expect(paramsAt(0)).toEqual(['Full Name', 'e@x.y', 'hash', 'user', 4]);
    expect(out).toEqual({ id: 9, email: 'e@x.y', user_type: 'user' });
  });

  it('createUser falls back to email when name is missing', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 9 }));
    await shared.createUser({ name: null, email: 'e@x.y', password_hash: 'h', user_type: 'user', access_group_id: null });
    expect(paramsAt(0)[0]).toBe('e@x.y');
  });

  it('createUserNoName inserts without a name column', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5, email: 'p@x.y', user_type: 'partner' }));
    const out = await shared.createUserNoName({ email: 'p@x.y', password_hash: 'h', user_type: 'partner', access_group_id: 1 });
    expect(sqlAt(0)).toContain('INSERT INTO app.users (email, password, user_type, access_group_id, created_at, updated_at)');
    expect(paramsAt(0)).toEqual(['p@x.y', 'h', 'partner', 1]);
    expect(out).toEqual({ id: 5, email: 'p@x.y', user_type: 'partner' });
  });

  it('findPartnerProfile selects by user_id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ user_id: 5, company_name: 'ACME' }));
    await expect(shared.findPartnerProfile(5)).resolves.toEqual({ user_id: 5, company_name: 'ACME' });
    expect(sqlAt(0)).toBe('SELECT * FROM partner_profiles WHERE user_id = $1');
  });

  it('createPartnerProfile inserts a profile row', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.createPartnerProfile({ user_id: 5, company_name: 'ACME', phone: '123', address: 'Ave' });
    expect(sqlAt(0)).toContain('INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at)');
    expect(paramsAt(0)).toEqual([5, 'ACME', '123', 'Ave']);
  });

  it('updatePartnerProfileByUserId updates by user_id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.updatePartnerProfileByUserId({ user_id: 5, company_name: 'ACME2', phone: null, address: 'St' });
    expect(sqlAt(0)).toContain('UPDATE partner_profiles SET company_name = $1, phone = $2, address = $3');
    expect(paramsAt(0)).toEqual(['ACME2', null, 'St', 5]);
  });

  it('findEmployeeProfile selects by user_id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ user_id: 2, first_name: 'A' }));
    await expect(shared.findEmployeeProfile(2)).resolves.toEqual({ user_id: 2, first_name: 'A' });
    expect(sqlAt(0)).toBe('SELECT * FROM employee_profiles WHERE user_id = $1');
  });

  it('createEmployeeProfile inserts a profile row', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.createEmployeeProfile({ user_id: 2, employee_id: 'E1', first_name: 'A', last_name: 'B', phone: '1', designation: 'Dev' });
    expect(sqlAt(0)).toContain('INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at)');
    expect(paramsAt(0)).toEqual([2, 'E1', 'A', 'B', '1', 'Dev']);
  });

  it('updateEmployeeProfileByUserId updates by user_id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.updateEmployeeProfileByUserId({ user_id: 2, employee_id: 'E2', first_name: 'A', last_name: null, phone: null, designation: null });
    expect(sqlAt(0)).toContain('UPDATE employee_profiles SET employee_id = $1, first_name = $2');
    expect(paramsAt(0)).toEqual(['E2', 'A', null, null, null, 2]);
  });

  it('createStockItemGuid inserts with guid and masterid 0', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1, stockname: 'N' }));
    const out = await shared.createStockItemGuid({ name: 'N', guid: 'g', quantity: 5, price: 10 });
    expect(sqlAt(0)).toContain('INSERT INTO app.stock (stockname, guid, quantity, price, masterid, created_at, updated_at)');
    expect(paramsAt(0)).toEqual(['N', 'g', 5, 10]);
    expect(out.id).toBe(1);
  });

  it('updateStockItemById updates by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1, stockname: 'N' }));
    await shared.updateStockItemById({ id: 1, name: 'N', quantity: 2, price: 3 });
    expect(sqlAt(0)).toBe('UPDATE app.stock SET stockname = $1, quantity = $2, price = $3, updated_at = NOW() WHERE id = $4 RETURNING *');
    expect(paramsAt(0)).toEqual(['N', 2, 3, 1]);
  });

  it('deleteStockItemById deletes by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.deleteStockItemById(1);
    expect(sqlAt(0)).toBe('DELETE FROM app.stock WHERE id = $1 RETURNING id');
    expect(paramsAt(0)).toEqual([1]);
  });

  it('createLedger wraps address/mobile in arrays', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.createLedger({ guid: 'g', name: 'P', address: 'A', mobile: 'M' });
    expect(sqlAt(0)).toContain('INSERT INTO app.ledger (guid, name, address, mobile)');
    expect(paramsAt(0)).toEqual(['g', 'P', ['A'], ['M']]);
  });

  it('createLedger passes null for missing address/mobile', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.createLedger({ guid: 'g', name: 'P' });
    expect(paramsAt(0)).toEqual(['g', 'P', null, null]);
  });

  it('listLedgers lists all when no filter', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1, name: 'P' }));
    const out = await shared.listLedgers({});
    expect(sqlAt(0)).toBe('SELECT id, guid, name, address, mobile, ledgername FROM app.ledger WHERE 1=1 ORDER BY name');
    expect(paramsAt(0)).toEqual([]);
    expect(out).toHaveLength(1);
  });

  it('listLedgers filters by name', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.listLedgers({ name: 'P' });
    expect(sqlAt(0)).toContain('AND name ILIKE $1');
    expect(paramsAt(0)).toEqual(['%P%']);
  });

  it('updateLedger updates and wraps arrays', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.updateLedger({ id: 1, name: 'P', address: 'A', mobile: 'M' });
    expect(sqlAt(0)).toBe('UPDATE app.ledger SET name = $1, address = $2, mobile = $3 WHERE id = $4 RETURNING *');
    expect(paramsAt(0)).toEqual(['P', ['A'], ['M'], 1]);
  });

  it('deleteLedger deletes by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.deleteLedger(1);
    expect(sqlAt(0)).toBe('DELETE FROM app.ledger WHERE id = $1 RETURNING id');
  });

  it('createVoucher inserts all fields', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.createVoucher({ guid: 'g', date: '2026-01-01', voucher_type: 'Sales', voucher_number: 'S1', party_ledger_name: 'P', narration: 'n' });
    expect(sqlAt(0)).toContain('INSERT INTO app.vouchers (guid, date, voucher_type, voucher_number, party_ledger_name, narration)');
    expect(paramsAt(0)).toEqual(['g', '2026-01-01', 'Sales', 'S1', 'P', 'n']);
  });

  it('listVouchers applies filters and limit', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.listVouchers({ voucher_type: 'Sales', voucher_number: 'S1', from_date: '2026-01-01', to_date: '2026-01-31' });
    expect(sqlAt(0)).toContain('AND voucher_type = $1');
    expect(sqlAt(0)).toContain('AND voucher_number = $2');
    expect(sqlAt(0)).toContain('AND date >= $3');
    expect(sqlAt(0)).toContain('AND date <= $4');
    expect(sqlAt(0)).toContain('ORDER BY date DESC LIMIT 200');
    expect(paramsAt(0)).toEqual(['Sales', 'S1', '2026-01-01', '2026-01-31']);
  });

  it('updateVoucher updates by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.updateVoucher({ id: 1, voucher_type: 'Sales', voucher_number: 'S2', date: '2026-01-02', narration: 'n', party_ledger_name: 'P' });
    expect(sqlAt(0)).toContain('UPDATE app.vouchers SET voucher_type = $1');
    expect(paramsAt(0)).toEqual(['Sales', 'S2', '2026-01-02', 'n', 'P', 1]);
  });

  it('deleteVoucher deletes by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.deleteVoucher(1);
    expect(sqlAt(0)).toBe('DELETE FROM app.vouchers WHERE id = $1 RETURNING id');
  });

  it('createGodown inserts with timestamps', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1, name: 'W' }));
    const out = await shared.createGodown({ name: 'W', address: 'A' });
    expect(sqlAt(0)).toBe('INSERT INTO godowns (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *');
    expect(paramsAt(0)).toEqual(['W', 'A']);
    expect(out).toEqual({ id: 1, name: 'W' });
  });

  it('listGodowns filters by name when given', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.listGodowns({ name: 'W' });
    expect(sqlAt(0)).toBe('SELECT * FROM godowns WHERE 1=1 AND name ILIKE $1');
    expect(paramsAt(0)).toEqual(['%W%']);
  });

  it('updateGodown updates by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.updateGodown({ id: 1, name: 'W', address: 'A' });
    expect(sqlAt(0)).toBe('UPDATE godowns SET name = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING *');
    expect(paramsAt(0)).toEqual(['W', 'A', 1]);
  });

  it('deleteGodown deletes by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.deleteGodown(1);
    expect(sqlAt(0)).toBe('DELETE FROM godowns WHERE id = $1 RETURNING id');
  });

  it('createInventoryRecord inserts stock/godown/quantity', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.createInventoryRecord({ stockitem_id: 1, godown_id: 2, quantity: 5 });
    expect(sqlAt(0)).toBe('INSERT INTO inventory (stockitem_id, godown_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *');
    expect(paramsAt(0)).toEqual([1, 2, 5]);
  });

  it('listInventoryRecords applies filters', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await shared.listInventoryRecords({ stockitem_id: 1, godown_id: 2 });
    expect(sqlAt(0)).toBe('SELECT * FROM inventory WHERE 1=1 AND stockitem_id = $1 AND godown_id = $2');
    expect(paramsAt(0)).toEqual([1, 2]);
  });

  it('updateInventoryRecord updates by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.updateInventoryRecord({ id: 1, stockitem_id: 1, godown_id: 2, quantity: 5 });
    expect(sqlAt(0)).toBe('UPDATE inventory SET stockitem_id = $1, godown_id = $2, quantity = $3, updated_at = NOW() WHERE id = $4 RETURNING *');
    expect(paramsAt(0)).toEqual([1, 2, 5, 1]);
  });

  it('deleteInventoryRecord deletes by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await shared.deleteInventoryRecord(1);
    expect(sqlAt(0)).toBe('DELETE FROM inventory WHERE id = $1 RETURNING id');
  });

  it('getFirstUser returns the oldest user', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await expect(shared.getFirstUser()).resolves.toEqual({ id: 1 });
    expect(sqlAt(0)).toBe('SELECT * FROM app.users ORDER BY id LIMIT 1');
  });
});

// =============================================================================
// admin: login + access control
// =============================================================================

describe('admin login & access control helpers', () => {
  it('loginUser selects the full user with LIMIT 1', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1, email: 'a@b.c' }));
    const out = await admin.loginUser('a@b.c');
    expect(sqlAt(0)).toBe('SELECT * FROM app.users WHERE email = $1 LIMIT 1');
    expect(paramsAt(0)).toEqual(['a@b.c']);
    expect(out.id).toBe(1);
  });

  it('createAccessControlUser defaults user_type to "user" and access_group_id to null', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 2 }));
    await admin.createAccessControlUser({ email: 'x@y.z', password_hash: 'h' });
    expect(sqlAt(0)).toContain('INSERT INTO app.users (email, password, user_type, access_group_id');
    expect(paramsAt(0)).toEqual(['x@y.z', 'h', 'user', null]);
  });

  it('createAccessControlUser keeps provided user_type/access_group_id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 2 }));
    await admin.createAccessControlUser({ email: 'x@y.z', password_hash: 'h', user_type: 'admin', access_group_id: 4 });
    expect(paramsAt(0)).toEqual(['x@y.z', 'h', 'admin', 4]);
  });

  it('listAccessControlUsers counts and lists with filters', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ count: '5' }))
      .mockResolvedValueOnce(rows({ id: 1, email: 'a@b.c' }, { id: 2, email: 'd@e.f' }));
    const out = await admin.listAccessControlUsers({ email: 'a', user_type: 'user', limit: 10, offset: 20 });
    expect(sqlAt(0)).toBe('SELECT COUNT(*) FROM app.users u WHERE u.email ILIKE $1 AND u.user_type = $2');
    expect(paramsAt(0)).toEqual(['%a%', 'user']);
    expect(sqlAt(1)).toContain('ORDER BY u.created_at DESC LIMIT $3 OFFSET $4');
    expect(paramsAt(1)).toEqual(['%a%', 'user', 10, 20]);
    expect(out.total).toBe(5);
    expect(out.rows).toHaveLength(2);
  });

  it('updateAccessControlUser updates all fields', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 2 }));
    await admin.updateAccessControlUser({ id: 2, email: 'x@y.z', user_type: 'user', access_group_id: 4, is_active: true });
    expect(sqlAt(0)).toContain('UPDATE app.users SET email = $1, user_type = $2, access_group_id = $3, is_active = $4');
    expect(paramsAt(0)).toEqual(['x@y.z', 'user', 4, true, 2]);
  });

  it('deleteAccessControlUser deletes by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 2 }));
    await admin.deleteAccessControlUser(2);
    expect(sqlAt(0)).toBe('DELETE FROM app.users WHERE id = $1 RETURNING id');
    expect(paramsAt(0)).toEqual([2]);
  });

  it('ensureUserColumns runs the ALTER and swallows errors', async () => {
    mockNeonDb.query.mockRejectedValueOnce(new Error('boom'));
    await expect(admin.ensureUserColumns()).resolves.toBeUndefined();
    expect(sqlAt(0)).toContain('ALTER TABLE app.users');
  });
});

// =============================================================================
// admin: stock / inventory / SKU
// =============================================================================

describe('admin stock & inventory helpers', () => {
  it('listStockItemsAdmin counts and lists with name filter', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ count: '3' }))
      .mockResolvedValueOnce(rows({ id: 9, stockname: 'X' }));
    const out = await admin.listStockItemsAdmin({ name: 'X', limit: 10, offset: 0 });
    expect(sqlAt(0)).toBe('SELECT COUNT(*) FROM app.stock WHERE 1=1 AND stockname ILIKE $1');
    expect(paramsAt(0)).toEqual(['%X%']);
    expect(sqlAt(1)).toContain('ORDER BY id DESC LIMIT $2 OFFSET $3');
    expect(paramsAt(1)).toEqual(['%X%', 10, 0]);
    expect(out.total).toBe(3);
  });

  it('createStockItemLegacy inserts without guid', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1, stockname: 'N' }));
    await admin.createStockItemLegacy({ name: 'N', quantity: 2, price: 3 });
    expect(sqlAt(0)).toContain('INSERT INTO app.stock (stockname, quantity, price, created_at, updated_at)');
    expect(paramsAt(0)).toEqual(['N', 2, 3]);
  });

  it('listStockItemsLegacy applies name and sku filters', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await admin.listStockItemsLegacy({ name: 'N', sku: 's' });
    expect(sqlAt(0)).toBe('SELECT * FROM app.stock WHERE 1=1 AND name ILIKE $1 AND sku = $2');
    expect(paramsAt(0)).toEqual(['%N%', 's']);
  });

  it('listDistinctBrands maps rows to brand strings', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ brand: 'A' }, { brand: 'B' }));
    const out = await admin.listDistinctBrands();
    expect(sqlAt(0)).toContain('SELECT DISTINCT brand FROM app.inventory');
    expect(out).toEqual(['A', 'B']);
  });

  it('listInventoryStock counts and lists with search + brand filters', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ count: '2' }))
      .mockResolvedValueOnce(rows({ id: 1, stockname: 'X', brand: 'B' }));
    const out = await admin.listInventoryStock({ search: 'X', brand: 'B', limit: 10, offset: 0 });
    expect(sqlAt(0)).toContain('SELECT COUNT(*) FROM app.stock s');
    expect(sqlAt(0)).toContain('(s.stockname ILIKE $1 OR inv.brand ILIKE $1 OR inv.model ILIKE $1 OR inv.fullname ILIKE $1 OR s.category_level_1 ILIKE $1)');
    expect(sqlAt(0)).toContain('AND inv.brand ILIKE $2');
    expect(paramsAt(0)).toEqual(['%X%', 'B']);
    expect(sqlAt(1)).toContain('ORDER BY COALESCE(NULLIF(inv.fullname, \'\'), s.stockname) ASC LIMIT $3 OFFSET $4');
    expect(paramsAt(1)).toEqual(['%X%', 'B', 10, 0]);
    expect(out.total).toBe(2);
    expect(out.rows[0].brand).toBe('B');
  });

  it('listInventorySku uses the joined query when schema has brand/model columns', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ column_name: 'brand' }, { column_name: 'model' }))
      .mockResolvedValueOnce(rows({ id: 1, name: 'X' }));
    const out = await admin.listInventorySku({ brand: 'B' });
    expect(sqlAt(0)).toContain('information_schema.columns');
    expect(sqlAt(1)).toContain('json_agg');
    expect(sqlAt(1)).toContain('WHERE inv.brand ILIKE $1');
    expect(paramsAt(1)).toEqual(['%B%']);
    expect(out[0].name).toBe('X');
  });

  it('listInventorySku falls back to the plain query when schema lacks columns', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows())
      .mockResolvedValueOnce(rows({ id: 1, name: 'X' }));
    const out = await admin.listInventorySku({});
    expect(sqlAt(1)).not.toContain('json_agg');
    expect(out).toHaveLength(1);
  });

  it('migratePartnerSku runs the ALTER', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await admin.migratePartnerSku();
    expect(sqlAt(0)).toContain('ALTER TABLE app.inventory_access_group ADD COLUMN IF NOT EXISTS partner_sku_name');
  });

  it('getInventoryControl aggregates stock count and groups', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ items: '42' }))
      .mockResolvedValueOnce(rows({ id: 1, name: 'G' }));
    const out = await admin.getInventoryControl();
    expect(out).toEqual({ totalItems: 42, accessGroups: [{ id: 1, name: 'G' }] });
  });

  it('getStockDetail joins stock with inventory so stock-only items resolve', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5, stockname: 'X' }));
    await admin.getStockDetail(5);
    expect(sqlAt(0)).toContain('FROM app.stock s LEFT JOIN app.inventory inv ON inv.id = s.id');
    expect(sqlAt(0)).toContain('WHERE s.id = $1');
    expect(paramsAt(0)).toEqual([5]);
  });

  it('saveStockDetail rejects unknown stock ids', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    const out = await admin.saveStockDetail({ id: 999, name: 'N' });
    expect(out).toBeUndefined();
    expect(mockNeonDb.query).toHaveBeenCalledTimes(1);
  });

  it('saveStockDetail upserts inventory then updates stock and returns the inventory row', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ id: 5 }))
      .mockResolvedValueOnce(row({ id: 5, fullname: 'N' }))
      .mockResolvedValueOnce(rows());
    const out = await admin.saveStockDetail({ id: 5, name: 'N', brand: 'B', model: 'M', variant: 'V', color: 'C', qty: 2, price: 3, gst: 18 });
    expect(sqlAt(1)).toContain('INSERT INTO app.inventory');
    expect(sqlAt(1)).toContain('ON CONFLICT (id) DO UPDATE');
    expect(paramsAt(1)).toEqual(['N', 'B', 'M', 'V', 'C', 2, 3, 18, 5]);
    expect(sqlAt(2)).toContain('UPDATE app.stock');
    expect(paramsAt(2)).toEqual(['N', 2, 3, 5]);
    expect(out).toEqual({ id: 5, fullname: 'N' });
  });
});

// =============================================================================
// admin: access-group mappings
// =============================================================================

describe('admin access-group mapping helpers', () => {
  it('getAccessGroupDetail resolves item, group, ia row and both lists', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ id: 7, name: 'N', sku: '7', qty: 2, price: 3 }))
      .mockResolvedValueOnce(row({ id: 1, name: 'Retail' }))
      .mockResolvedValueOnce(row({ quantity: 2, oprice: 3 }))
      .mockResolvedValueOnce(rows({ group: 'Retail', qty: 2, price: 3 }))
      .mockResolvedValueOnce(rows({ id: 7, name: 'N' }));
    const out = await admin.getAccessGroupDetail({ sku: '7', group: 'Retail' });
    expect(sqlAt(0)).toContain('FROM app.stock WHERE id = $1');
    expect(paramsAt(0)).toEqual([7]);
    expect(sqlAt(1)).toBe('SELECT id, name FROM app.access_groups WHERE name = $1');
    expect(out.item).toEqual({ id: 7, name: 'N', sku: '7', qty: 2, price: 3 });
    expect(out.groupRow.id).toBe(1);
    expect(out.iaRow).toEqual({ quantity: 2, oprice: 3 });
    expect(out.allAgRows).toHaveLength(1);
    expect(out.groupStocksRows).toHaveLength(1);
  });

  it('getAccessGroupDetail returns empty defaults when item missing', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    const out = await admin.getAccessGroupDetail({ sku: '999', group: 'G' });
    expect(out).toEqual({ item: null, groupRow: null, iaRow: null, allAgRows: [], groupStocksRows: [] });
    expect(mockNeonDb.query).toHaveBeenCalledTimes(1);
  });

  it('findStockId coerces numeric sku', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 }));
    await admin.findStockId('5');
    expect(sqlAt(0)).toBe('SELECT id FROM app.stock WHERE id = $1');
    expect(paramsAt(0)).toEqual([5]);
  });

  it('findStockId keeps non-numeric sku as string', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 }));
    await admin.findStockId('abc');
    expect(paramsAt(0)).toEqual(['abc']);
  });

  it('findAccessGroupId selects by name', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 3 }));
    await admin.findAccessGroupId('Retail');
    expect(sqlAt(0)).toBe('SELECT id FROM app.access_groups WHERE name = $1');
  });

  it('upsertStockGroupMapping updates when a mapping exists', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ id: 9 }))
      .mockResolvedValueOnce(rows());
    const out = await admin.upsertStockGroupMapping({ stockId: 1, groupId: 2, qty: 5, price: 10, partnerSkuName: 'PSN' });
    expect(sqlAt(0)).toBe('SELECT id FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2');
    expect(sqlAt(1)).toContain('UPDATE app.inventory_access_group');
    expect(paramsAt(1)).toEqual([5, 10, 'PSN', 1, 2]);
    expect(out).toBe('updated');
  });

  it('upsertStockGroupMapping inserts when no mapping exists', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows())
      .mockResolvedValueOnce(rows());
    const out = await admin.upsertStockGroupMapping({ stockId: 1, groupId: 2 });
    expect(sqlAt(1)).toContain('INSERT INTO app.inventory_access_group');
    expect(paramsAt(1)).toEqual([1, 2, 0, 0, null]);
    expect(out).toBe('assigned');
  });

  it('updateStockGroupMapping updates and returns the row', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 9 }));
    await admin.updateStockGroupMapping({ stockId: 1, groupId: 2, qty: 5, price: 10, partnerSkuName: 'P' });
    expect(sqlAt(0)).toContain('UPDATE app.inventory_access_group SET quantity = GREATEST(0, $1)');
    expect(paramsAt(0)).toEqual([5, 10, 'P', 1, 2]);
  });

  it('updateStockGst updates inventory gst', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await admin.updateStockGst({ stockId: 1, gst: 18 });
    expect(sqlAt(0)).toBe('UPDATE app.inventory SET gst = $1 WHERE id = $2');
    expect(paramsAt(0)).toEqual([18, 1]);
  });

  it('removeStockGroupMapping deletes and returns the row', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 9 }));
    await admin.removeStockGroupMapping({ stockId: 1, groupId: 2 });
    expect(sqlAt(0)).toBe('DELETE FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2 RETURNING *');
    expect(paramsAt(0)).toEqual([1, 2]);
  });

  it('getAccessGroupStocks resolves the group then its stocks', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ id: 1, name: 'Retail' }))
      .mockResolvedValueOnce(rows({ id: 3, name: 'N' }));
    const out = await admin.getAccessGroupStocks('retail');
    expect(sqlAt(0)).toBe('SELECT id, name FROM app.access_groups WHERE TRIM(name) ILIKE TRIM($1)');
    expect(paramsAt(0)).toEqual(['retail']);
    expect(sqlAt(1)).toContain('WHERE iag.accessgroupid = $1');
    expect(paramsAt(1)).toEqual([1]);
    expect(out.group.name).toBe('Retail');
    expect(out.rows).toHaveLength(1);
  });

  it('getAccessGroupStocks returns empty when group missing', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    const out = await admin.getAccessGroupStocks('nope');
    expect(out).toEqual({ group: null, rows: [] });
  });
});

// =============================================================================
// admin: api keys
// =============================================================================

describe('admin API key helpers', () => {
  it('ensureApiColumns runs the ALTER and swallows errors', async () => {
    mockNeonDb.query.mockRejectedValueOnce(new Error('boom'));
    await expect(admin.ensureApiColumns()).resolves.toBeUndefined();
    expect(sqlAt(0)).toContain('ALTER TABLE app.api');
  });

  it('findAccessGroupByName selects id by name', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 3 }));
    await admin.findAccessGroupByName('Retail');
    expect(sqlAt(0)).toBe('SELECT id FROM app.access_groups WHERE name = $1');
  });

  it('getAccessGroupName selects name by id', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ name: 'Retail' }));
    await admin.getAccessGroupName(3);
    expect(sqlAt(0)).toBe('SELECT name FROM app.access_groups WHERE id = $1');
  });

  it('createApiKey inserts a key with JSON-encoded permissions', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'kid', key: 'via.x' }));
    const out = await admin.createApiKey({
      keyid: 'kid',
      key_name: 'My Key',
      apiKey: 'via.x',
      accessGroupId: 3,
      userId: 1,
      permissions: ['read', 'write'],
      duration: '7d',
    });
    expect(sqlAt(0)).toContain('VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, true, NOW(), NOW())');
    expect(paramsAt(0)).toEqual(['kid', 'My Key', 'via.x', 3, 1, '["read","write"]', '7d']);
    expect(out.key).toBe('via.x');
  });

  it('listApiKeys applies user_id and key_name filters', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ keyid: 'k' }));
    await admin.listApiKeys({ user_id: 5, key_name: 'n' });
    expect(sqlAt(0)).toContain('FROM app.api k');
    expect(sqlAt(0)).toContain('AND k.user_id = $1');
    expect(sqlAt(0)).toContain('AND k.key_name ILIKE $2');
    expect(sqlAt(0)).toContain('ORDER BY k.created_at DESC');
    expect(paramsAt(0)).toEqual([5, '%n%']);
  });

  it('updateApiKey uses COALESCE with null defaults', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'k' }));
    await admin.updateApiKey({ id: 'k' });
    expect(sqlAt(0)).toContain('SET key_name = COALESCE($1, key_name), is_active = COALESCE($2, is_active)');
    expect(paramsAt(0)).toEqual([null, null, 'k']);
  });

  it('deleteApiKey deletes by keyid', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'k' }));
    await admin.deleteApiKey('k');
    expect(sqlAt(0)).toBe('DELETE FROM app.api WHERE keyid = $1 RETURNING keyid');
  });

  it('listAccessGroupOptions lists id/name ordered', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1, name: 'A' }));
    await admin.listAccessGroupOptions();
    expect(sqlAt(0)).toBe('SELECT id, name FROM app.access_groups ORDER BY name');
  });

  it('createAccessGroup inserts a group', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 4, name: 'Retail' }));
    const out = await admin.createAccessGroup('Retail');
    expect(sqlAt(0)).toContain('INSERT INTO app.access_groups (name, created_at, updated_at)');
    expect(paramsAt(0)).toEqual(['Retail']);
    expect(out).toEqual({ id: 4, name: 'Retail' });
  });

  it('deleteAccessGroup cleans up dependents then deletes the group', async () => {
    mockNeonDb.query.mockResolvedValue(rows());
    await admin.deleteAccessGroup(4);
    expect(mockNeonDb.query).toHaveBeenCalledTimes(4);
    expect(sqlAt(0)).toContain('DELETE FROM app.inventory_access_group WHERE accessgroupid = $1');
    expect(sqlAt(1)).toContain('UPDATE app.api SET access_group_id = NULL');
    expect(sqlAt(2)).toContain('UPDATE app.users SET access_group_id = NULL');
    expect(sqlAt(3)).toBe('DELETE FROM app.access_groups WHERE id = $1');
    expect(paramsAt(3)).toEqual([4]);
  });

  it('getApiUsage aggregates today and month counts', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ count: 12 }))
      .mockResolvedValueOnce(row({ count: 99 }));
    const out = await admin.getApiUsage();
    expect(sqlAt(0)).toContain('WHERE created_at >= CURRENT_DATE');
    expect(sqlAt(1)).toContain("date_trunc('month', CURRENT_DATE)");
    expect(out).toEqual({ todayRequests: 12, monthRequests: 99 });
  });
});

// =============================================================================
// admin: dashboard + analytics
// =============================================================================

describe('admin dashboard & analytics helpers', () => {
  it('getDashboardStats aggregates KPIs', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ total: '100', orders: '2' }))
      .mockResolvedValueOnce(row({ total: '50' }))
      .mockResolvedValueOnce(row({ name: 'X', amount: '100' }))
      .mockResolvedValueOnce(row({ total: '25.5' }));
    const out = await admin.getDashboardStats();
    expect(sqlAt(0)).toContain('FROM app.sales_records WHERE sales_date = CURRENT_DATE');
    expect(sqlAt(3)).toContain('FROM app.stock');
    expect(out).toEqual({
      today: { total: '100', orders: '2' },
      yesterday: { total: '50' },
      topSalesman: { name: 'X', amount: '100' },
      stockValue: 25.5,
    });
  });

  it('getTopSalesmen returns the top 5', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ name: 'X', sales: '100' }));
    const out = await admin.getTopSalesmen();
    expect(sqlAt(0)).toContain('GROUP BY salesman ORDER BY sales DESC LIMIT 5');
    expect(out).toHaveLength(1);
  });

  it('getDashboardMonthlyTrend groups by month', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ month: 'Jan 2026', sales: '10' }));
    await admin.getDashboardMonthlyTrend();
    expect(sqlAt(0)).toContain("TO_CHAR(DATE_TRUNC('month', sales_date)");
  });

  it('getProductShare returns top 10 by quantity', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ name: 'X', value: 5 }));
    await admin.getProductShare();
    expect(sqlAt(0)).toContain('ORDER BY quantity DESC LIMIT 10');
  });

  it('getAnalyticsStats aggregates all/current/prev', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ total_orders: '5', total_revenue: '100' }))
      .mockResolvedValueOnce(row({ orders: '3', revenue: '60' }))
      .mockResolvedValueOnce(row({ orders: '2', revenue: '40' }));
    const out = await admin.getAnalyticsStats();
    expect(sqlAt(0)).toContain('WHERE voucher_type ILIKE \'sales%\'');
    expect(sqlAt(1)).toContain("AND \"date\" >= '2026-01-01'");
    expect(out).toEqual({
      all: { total_orders: '5', total_revenue: '100' },
      current: { orders: '3', revenue: '60' },
      prev: { orders: '2', revenue: '40' },
    });
  });

  it('getAnalyticsMonthlyTrend groups 2026 sales by month', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ month: 'Jan', sales: '10', profit: 3 }));
    await admin.getAnalyticsMonthlyTrend();
    expect(sqlAt(0)).toContain("date_trunc('month', v.\"date\") as month");
  });

  it('getAnalyticsCategoryData returns top 10 types', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ name: 'Sales', count: 3, total: '30' }));
    await admin.getAnalyticsCategoryData();
    expect(sqlAt(0)).toContain('GROUP BY v.voucher_type');
  });

  it('getAnalyticsTopCustomers filters named parties', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ name: 'P', orders: 2, spent: '20' }));
    await admin.getAnalyticsTopCustomers();
    expect(sqlAt(0)).toContain("v.party_ledger_name != ''");
  });

  it('getAnalyticsDailySales filters to 90 days', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ day: '2026-01-01', sales: '10', orders: 1 }));
    await admin.getAnalyticsDailySales();
    expect(sqlAt(0)).toContain("INTERVAL '90 days'");
  });

  it('getAnalyticsSalesByRegion buckets by region', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ region: 'N', sales: '10' }));
    await admin.getAnalyticsSalesByRegion();
    expect(sqlAt(0)).toContain("COALESCE(NULLIF(s.parent, ''), 'Other') AS region");
  });

  it('getAnalyticsOrdersByChannel splits by voucher-type buckets', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ month: 'Jan', retail: 1 }));
    await admin.getAnalyticsOrdersByChannel();
    expect(sqlAt(0)).toContain("COUNT(*) FILTER (WHERE v.voucher_type ILIKE 'sales%') AS retail");
  });
});

// =============================================================================
// admin: reports
// =============================================================================

describe('admin reports helpers', () => {
  it('getPnlData returns latest data row value', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ data: { gross: 100 } }));
    await expect(admin.getPnlData()).resolves.toEqual({ gross: 100 });
    expect(sqlAt(0)).toBe('SELECT data FROM app.profitloss ORDER BY id DESC LIMIT 1');
  });

  it('getPnlData returns null when no rows', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await expect(admin.getPnlData()).resolves.toBeNull();
  });

  it('getOutstandingVouchers lists latest 200', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1, voucher_type: 'Sales' }));
    await admin.getOutstandingVouchers();
    expect(sqlAt(0)).toContain('FROM app.vouchers ORDER BY date DESC LIMIT 200');
  });

  it('getBalanceSheetData returns latest data row value', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ data: { assets: 1 } }));
    await expect(admin.getBalanceSheetData()).resolves.toEqual({ assets: 1 });
    expect(sqlAt(0)).toBe('SELECT data FROM app.balancesheet ORDER BY id DESC LIMIT 1');
  });

  it('getDaybook builds voucher/inv/ledger maps keyed by vid', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ id: 1, date: '2026-01-01' }))
      .mockResolvedValueOnce(rows({ vid: 1 }))
      .mockResolvedValueOnce(rows({ vid: 1, ledentries: [{ ledgerName: 'P', amount: '5' }] }));
    const out = await admin.getDaybook({ from_date: '2026-01-01', to_date: '2026-01-31' });
    expect(sqlAt(0)).toContain('WHERE date >= $1 AND date <= $2');
    expect(paramsAt(0)).toEqual(['2026-01-01', '2026-01-31']);
    expect(sqlAt(1)).toContain('jsonb_build_object');
    expect(sqlAt(2)).toContain('ledgerName');
    expect(out.voucherRows).toHaveLength(1);
    expect(out.invMap['1']).toEqual([]);
    expect(out.ledMap['1']).toEqual([{ ledgerName: 'P', amount: '5' }]);
  });
});

// =============================================================================
// admin: market
// =============================================================================

describe('admin market helpers', () => {
  it('getMarketOverview runs all seven queries in parallel', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ total: '1', orders: 1 }))
      .mockResolvedValueOnce(row({ total: '2' }))
      .mockResolvedValueOnce(row({ vol: '3' }))
      .mockResolvedValueOnce(row({ vol: '4' }))
      .mockResolvedValueOnce(rows({ stockname: 'X', quantity: 1 }))
      .mockResolvedValueOnce(row({ cnt: '5' }))
      .mockResolvedValueOnce(rows({ region: 'N', sales: '10' }));
    const out = await admin.getMarketOverview();
    expect(mockNeonDb.query).toHaveBeenCalledTimes(7);
    expect(out).toHaveProperty('now30');
    expect(out).toHaveProperty('prev30');
    expect(out).toHaveProperty('todaySales');
    expect(out).toHaveProperty('yesterdaySales');
    expect(out).toHaveProperty('topProducts');
    expect(out).toHaveProperty('stockCount');
    expect(out).toHaveProperty('regionData');
    expect(out.now30.orders).toBe(1);
  });

  it('getMarketSalesTrend groups by sales_date', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ day: '2026-01-01', sales: '10' }));
    await admin.getMarketSalesTrend();
    expect(sqlAt(0)).toContain('GROUP BY sales_date ORDER BY sales_date');
  });

  it('getMarketCategoryData computes total value', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ stockname: 'X', quantity: 2, price: 3, total: 6 }));
    await admin.getMarketCategoryData();
    expect(sqlAt(0)).toContain('(COALESCE(quantity,0) * COALESCE(price,0)) AS total');
  });

  it('getMarketCandlestick filters to 84 days', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ date: '2026-01-01', sales: '10' }));
    await admin.getMarketCandlestick();
    expect(sqlAt(0)).toContain('CURRENT_DATE - 84');
  });
});

// =============================================================================
// admin: partner + employee management
// =============================================================================

describe('admin partner & employee management helpers', () => {
  it('listPartners lists users of type partner', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1 }));
    await admin.listPartners();
    expect(sqlAt(0)).toContain('WHERE user_type = $1');
    expect(paramsAt(0)).toEqual(['partner']);
  });

  it('getPartnerById joins the profile lookup', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 })).mockResolvedValueOnce(row({ user_id: 5 }));
    const out = await admin.getPartnerById(5);
    expect(sqlAt(0)).toContain('AND user_type = $2');
    expect(paramsAt(0)).toEqual([5, 'partner']);
    expect(sqlAt(1)).toBe('SELECT * FROM partner_profiles WHERE user_id = $1');
    expect(out.user.id).toBe(5);
    expect(out.profile).toEqual({ user_id: 5 });
  });

  it('updatePartnerUserEmail updates with partner type guard', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 }));
    await admin.updatePartnerUserEmail({ id: 5, email: 'x@y.z' });
    expect(paramsAt(0)).toEqual(['x@y.z', 5, 'partner']);
  });

  it('deletePartnerById deletes with partner type guard', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 }));
    await admin.deletePartnerById(5);
    expect(paramsAt(0)).toEqual([5, 'partner']);
  });

  it('listEmployees lists users of type employee', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1 }));
    await admin.listEmployees();
    expect(paramsAt(0)).toEqual(['employee']);
  });

  it('getEmployeeById joins the profile lookup', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 })).mockResolvedValueOnce(row({ user_id: 5 }));
    const out = await admin.getEmployeeById(5);
    expect(paramsAt(0)).toEqual([5, 'employee']);
    expect(out.user.id).toBe(5);
  });

  it('updateEmployeeUserEmail updates with employee type guard', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 }));
    await admin.updateEmployeeUserEmail({ id: 5, email: 'x@y.z' });
    expect(paramsAt(0)).toEqual(['x@y.z', 5, 'employee']);
  });

  it('deleteEmployeeById deletes with employee type guard', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 5 }));
    await admin.deleteEmployeeById(5);
    expect(paramsAt(0)).toEqual([5, 'employee']);
  });
});

// =============================================================================
// admin: settings / masters / salesmen
// =============================================================================

describe('admin settings, masters & salesman helpers', () => {
  it('listRecentUsers returns latest 10 users', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1 }));
    await admin.listRecentUsers();
    expect(sqlAt(0)).toBe('SELECT id, email, user_type, created_at FROM app.users ORDER BY created_at DESC LIMIT 10');
  });

  it('countUsersByType groups by user_type', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ category: 'user', items: '5' }));
    await admin.countUsersByType();
    expect(sqlAt(0)).toBe('SELECT user_type AS category, COUNT(*) AS items FROM app.users GROUP BY user_type');
  });

  it('getUserProfileById selects a single user', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await admin.getUserProfileById(1);
    expect(sqlAt(0)).toBe('SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1');
  });

  it('listPublicTables lists public-schema tables', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ tablename: 'foo' }));
    await admin.listPublicTables();
    expect(sqlAt(0)).toContain("schemaname = 'public'");
  });

  it('getMasterCounts aggregates four tables', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(rows({ count: '10' }))
      .mockResolvedValueOnce(rows({ count: '20' }))
      .mockResolvedValueOnce(rows({ count: '30' }))
      .mockResolvedValueOnce(rows({ count: '40' }));
    const out = await admin.getMasterCounts();
    expect(out).toEqual([
      { id: 'stock', name: 'Stock Items', records: 10 },
      { id: 'ledger', name: 'Ledgers', records: 20 },
      { id: 'voucher', name: 'Vouchers', records: 30 },
      { id: 'godown', name: 'Godowns', records: 40 },
    ]);
  });

  it('listSalesmen ranks salesmen by order count', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1, name: 'X', orders: 5, sales: '100' }));
    await admin.listSalesmen();
    expect(sqlAt(0)).toContain('ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS id');
  });

  it('listSalesmanChart groups daily sales per salesman', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ sales_date: '2026-01-01', salesman: 'X' }));
    await admin.listSalesmanChart();
    expect(sqlAt(0)).toContain('GROUP BY sales_date, salesman');
  });
});

// =============================================================================
// employee / partner login helpers
// =============================================================================

describe('employee & partner login helpers', () => {
  it('findEmployeeLoginUser allows employee OR admin', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await employee.findEmployeeLoginUser('a@b.c');
    expect(sqlAt(0)).toBe('SELECT * FROM app.users WHERE email = $1 AND (user_type = $2 OR user_type = $3)');
    expect(paramsAt(0)).toEqual(['a@b.c', 'employee', 'admin']);
  });

  it('findPartnerLoginUser requires partner type', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    await partner.findPartnerLoginUser('a@b.c');
    expect(sqlAt(0)).toBe('SELECT * FROM app.users WHERE email = $1 AND user_type = $2');
    expect(paramsAt(0)).toEqual(['a@b.c', 'partner']);
  });
});

// =============================================================================
// public api helpers
// =============================================================================

describe('public api query helpers', () => {
  it('listStockItemsForUser uses the admin query for admins', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1 }));
    const out = await api.listStockItemsForUser({ isAdmin: true, userId: 1, name: 'X' });
    expect(sqlAt(0)).toBe('SELECT s.* FROM app.stock s WHERE 1=1 AND s.stockname ILIKE $1');
    expect(paramsAt(0)).toEqual(['%X%']);
    expect(out).toHaveLength(1);
  });

  it('listStockItemsForUser joins access groups for non-admins', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1 }));
    const out = await api.listStockItemsForUser({ isAdmin: false, userId: 7, name: 'X' });
    expect(sqlAt(0)).toContain('FROM app.stock s INNER JOIN app.inventory_access_group iag');
    expect(sqlAt(0)).toContain('u.id = $1');
    expect(sqlAt(0)).toContain('s.stockname ILIKE $2');
    expect(paramsAt(0)).toEqual([7, '%X%']);
    expect(out).toHaveLength(1);
  });

  it('createOwnApiKey inserts a user-owned key', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'k', key: 'via.x' }));
    await api.createOwnApiKey({ keyid: 'k', key_name: 'N', key: 'via.x', user_id: 7 });
    expect(sqlAt(0)).toContain('INSERT INTO app.api (keyid, key_name, key, user_id, is_active, created_at)');
    expect(paramsAt(0)).toEqual(['k', 'N', 'via.x', 7]);
  });

  it('listOwnApiKeys lists a user keys', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ keyid: 'k' }));
    await api.listOwnApiKeys(7);
    expect(sqlAt(0)).toBe('SELECT keyid, key_name, key, is_active, created_at, last_used FROM app.api WHERE user_id = $1');
    expect(paramsAt(0)).toEqual([7]);
  });

  it('updateOwnApiKey updates with COALESCE defaults', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'k' }));
    await api.updateOwnApiKey({ id: 'k', key_name: 'N', is_active: false });
    expect(paramsAt(0)).toEqual(['N', false, 'k']);
  });

  it('deleteOwnApiKey deletes by keyid', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'k' }));
    await api.deleteOwnApiKey('k');
    expect(sqlAt(0)).toBe('DELETE FROM app.api WHERE keyid = $1 RETURNING keyid');
  });

  it('listProductsV1 scopes, searches and paginates', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ total: 3 }))
      .mockResolvedValueOnce(rows({ id: 1, name: 'X' }));
    const out = await api.listProductsV1({ accessGroupId: 2, search: 'X', page: 2, limit: 10 });
    expect(sqlAt(0)).toContain('SELECT COUNT(*)::int AS total FROM app.stock s');
    expect(sqlAt(0)).toContain('INNER JOIN app.inventory_access_group iag ON iag.inventoryid = s.id AND iag.accessgroupid = $1');
    expect(paramsAt(0)).toEqual([2]);
    expect(sqlAt(1)).toContain('(s.stockname ILIKE $2 OR CAST(s.id AS TEXT) ILIKE $2)');
    expect(sqlAt(1)).toContain('ORDER BY s.stockname LIMIT $3 OFFSET $4');
    expect(paramsAt(1)).toEqual([2, '%X%', 10, 10]);
    expect(out.total).toBe(3);
    expect(out.rows).toHaveLength(1);
  });

  it('getProductV1 scopes the single product query', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ id: 1 }));
    const out = await api.getProductV1({ accessGroupId: 2, id: 5 });
    expect(sqlAt(0)).toContain('iag.accessgroupid = $1');
    expect(sqlAt(0)).toContain('AND s.id = $2');
    expect(paramsAt(0)).toEqual([2, 5]);
    expect(out.id).toBe(1);
  });

  it('createProductV1 maps the product to the key access group', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ id: 1, name: 'X', qty: 2, price: 3 }))
      .mockResolvedValueOnce(rows());
    const out = await api.createProductV1({ name: 'X', quantity: 2, price: 3, accessGroupId: 2 });
    expect(sqlAt(0)).toContain('INSERT INTO app.stock (stockname, quantity, price, created_at, updated_at)');
    expect(paramsAt(0)).toEqual(['X', 2, 3]);
    expect(sqlAt(1)).toContain('INSERT INTO app.inventory_access_group');
    expect(paramsAt(1)).toEqual([1, 2, 2, 3]);
    expect(out.id).toBe(1);
  });

  it('updateProductV1 mirrors qty/price into the group mapping', async () => {
    mockNeonDb.query
      .mockResolvedValueOnce(row({ id: 1 }))
      .mockResolvedValueOnce(rows());
    await api.updateProductV1({ id: 1, name: 'X', quantity: 5, price: 6, accessGroupId: 2 });
    expect(sqlAt(0)).toContain('UPDATE app.stock SET stockname = COALESCE($1, stockname)');
    expect(paramsAt(0)).toEqual(['X', 5, 6, 1]);
    expect(sqlAt(1)).toContain('UPDATE app.inventory_access_group');
    expect(paramsAt(1)).toEqual([5, 6, 1, 2]);
  });

  it('listSalesVouchersV1 applies group scope and date range', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows({ id: 1 }));
    const out = await api.listSalesVouchersV1({ accessGroupId: 2, from_date: '2026-01-01', to_date: '2026-01-31' });
    expect(sqlAt(0)).toContain('FROM app.vouchers v');
    expect(sqlAt(0)).toContain('INNER JOIN app.inventory_access_group iag ON iag.accessgroupid = $1');
    expect(sqlAt(0)).toContain('v.inventoryentries IS NOT NULL');
    expect(sqlAt(0)).toContain('ORDER BY v.date DESC LIMIT 200');
    expect(paramsAt(0)).toEqual([2, '2026-01-01', '2026-01-31']);
    expect(out).toHaveLength(1);
  });

  it('ensureLogTable creates the log table and coerces api_key_id', async () => {
    mockNeonDb.query.mockResolvedValue(rows());
    await expect(api.ensureLogTable()).resolves.toBeUndefined();
    expect(sqlAt(0)).toContain('CREATE TABLE IF NOT EXISTS api_key_log');
    expect(sqlAt(1)).toContain('ALTER TABLE api_key_log ALTER COLUMN api_key_id TYPE TEXT');
  });

  it('findApiKey joins the access group', async () => {
    mockNeonDb.query.mockResolvedValueOnce(row({ keyid: 'k', is_active: true, group_name: 'G' }));
    const out = await api.findApiKey('via.x');
    expect(sqlAt(0)).toContain('FROM app.api k');
    expect(sqlAt(0)).toContain('WHERE k.key = $1');
    expect(paramsAt(0)).toEqual(['via.x']);
    expect(out.group_name).toBe('G');
  });

  it('touchApiKey stamps last_used', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await api.touchApiKey('k');
    expect(sqlAt(0)).toBe('UPDATE app.api SET last_used = NOW() WHERE keyid = $1');
  });

  it('logApiUsage inserts a usage row', async () => {
    mockNeonDb.query.mockResolvedValueOnce(rows());
    await api.logApiUsage({ keyid: 'k', endpoint: '/api/v1/products', method: 'GET', status: 200 });
    expect(sqlAt(0)).toBe('INSERT INTO api_key_log (api_key_id, endpoint, method, status) VALUES ($1, $2, $3, $4)');
    expect(paramsAt(0)).toEqual(['k', '/api/v1/products', 'GET', 200]);
  });
});
