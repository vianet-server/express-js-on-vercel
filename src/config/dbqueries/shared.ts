/**
 * shared.ts
 *
 * DB query helpers shared across the admin (/api/admin/*), employee (/employee/*),
 * partner (/partner/*) and public app (/api/*) routers.
 *
 * Every function executes on the shared neonDb pool from ../db and returns the raw
 * DB result (a row, an array of rows, or a small aggregate object). Response shaping
 * (status codes, JSON mapping) stays in the route handlers.
 */
const { neonDb } = require('../db');

// ===========================================================================
// App users & access groups (auth flows)
// ===========================================================================

/**
 * Look up a user by email.
 * @param {string} email - exact email address to search for
 * @returns {Promise<object|undefined>} the full app.users row, or undefined if not found
 * @route Used by POST /api/admin/login, POST /api/auth/register, POST /api/auth/login,
 *   POST /employee/auth/register, POST /employee/auth/login,
 *   POST /partner/auth/register, POST /partner/auth/login
 */
async function findUserByEmail(email) {
  const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1', [email]);
  return result.rows[0];
}

/**
 * Lowest access-group id, used as the default group for accounts created without one.
 * @returns {Promise<number|null>} min app.access_groups.id, or null when no groups exist
 * @route Used by user/employee/partner/API registration and admin create flows
 */
async function getMinAccessGroupId() {
  const result = await neonDb.query('SELECT MIN(id) as id FROM app.access_groups');
  return result.rows[0]?.id ?? null;
}

/**
 * Create an app user row (with name column). Falls back to email when name is null.
 * @param {object} input
 * @param {string|null} input.name - display name (email is used when null/undefined)
 * @param {string} input.email - login email
 * @param {string} input.password_hash - bcrypt hash of the password
 * @param {string} input.user_type - 'user' | 'employee' | 'partner' | 'admin'
 * @param {number|null} input.access_group_id - owning access group
 * @returns {Promise<object>} inserted row { id, email, user_type }
 * @route Used by POST /api/auth/register, POST /api/auth/signup-with-token,
 *   POST /employee/auth/register, POST /partner/auth/register
 */
async function createUser({ name, email, password_hash, user_type, access_group_id }) {
  const result = await neonDb.query(
    'INSERT INTO app.users (name, email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, email, user_type',
    [name || email, email, password_hash, user_type, access_group_id]
  );
  return result.rows[0];
}

/**
 * Create an app user row WITHOUT a name column (partner/admin-created accounts).
 * @param {object} input
 * @param {string} input.email - login email
 * @param {string} input.password_hash - bcrypt hash
 * @param {string} input.user_type - 'partner' | 'employee' | 'user' | 'admin'
 * @param {number|null} input.access_group_id - owning access group
 * @returns {Promise<object>} inserted row { id, email, user_type }
 * @route Used by POST /partner/auth/register, POST /api/admin/partner, POST /api/admin/employee
 */
async function createUserNoName({ email, password_hash, user_type, access_group_id }) {
  const result = await neonDb.query(
    'INSERT INTO app.users (email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, user_type',
    [email, password_hash, user_type, access_group_id]
  );
  return result.rows[0];
}

/**
 * Look up a user by id (brief id/email/user_type projection).
 * @param {number} id - app.users.id
 * @returns {Promise<object|undefined>} { id, email, user_type }, or undefined
 * @route Used by GET /employee/profile, GET /partner/profile
 */
async function getUserBriefById(id) {
  const result = await neonDb.query('SELECT id, email, user_type FROM app.users WHERE id = $1', [id]);
  return result.rows[0];
}

/**
 * Fetch a partner's profile row.
 * @param {number} user_id - app.users.id
 * @returns {Promise<object|undefined>} partner_profiles row, or undefined
 * @route Used by GET /partner/profile, GET /api/admin/partner/:id, PUT /partner/profile
 */
async function findPartnerProfile(user_id) {
  const result = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [user_id]);
  return result.rows[0];
}

/**
 * Insert a partner profile row.
 * @param {object} input
 * @param {number} input.user_id - app.users.id
 * @param {string} [input.company_name]
 * @param {string} [input.phone]
 * @param {string} [input.address]
 * @returns {Promise<void>}
 * @route Used by POST /partner/auth/register, POST /api/admin/partner, PUT /api/admin/partner/:id
 */
async function createPartnerProfile({ user_id, company_name, phone, address }) {
  await neonDb.query(
    'INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
    [user_id, company_name, phone, address]
  );
}

/**
 * Update a partner profile row by user id.
 * @param {object} input
 * @param {number} input.user_id - app.users.id
 * @param {string} [input.company_name]
 * @param {string} [input.phone]
 * @param {string} [input.address]
 * @returns {Promise<void>}
 * @route Used by PUT /partner/profile, PUT /api/admin/partner/:id
 */
async function updatePartnerProfileByUserId({ user_id, company_name, phone, address }) {
  await neonDb.query(
    'UPDATE partner_profiles SET company_name = $1, phone = $2, address = $3, updated_at = NOW() WHERE user_id = $4',
    [company_name, phone, address, user_id]
  );
}

/**
 * Fetch an employee's profile row.
 * @param {number} user_id - app.users.id
 * @returns {Promise<object|undefined>} employee_profiles row, or undefined
 * @route Used by GET /employee/profile, GET /api/admin/employee/:id, PUT /employee/profile
 */
async function findEmployeeProfile(user_id) {
  const result = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [user_id]);
  return result.rows[0];
}

/**
 * Insert an employee profile row.
 * @param {object} input
 * @param {number} input.user_id - app.users.id
 * @param {string} [input.employee_id]
 * @param {string} [input.first_name]
 * @param {string} [input.last_name]
 * @param {string} [input.phone]
 * @param {string} [input.designation]
 * @returns {Promise<void>}
 * @route Used by POST /employee/auth/register, POST /api/admin/employee, PUT /api/admin/employee/:id
 */
async function createEmployeeProfile({ user_id, employee_id, first_name, last_name, phone, designation }) {
  await neonDb.query(
    'INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
    [user_id, employee_id, first_name, last_name, phone, designation]
  );
}

/**
 * Update an employee profile row by user id.
 * @param {object} input
 * @param {number} input.user_id - app.users.id
 * @param {string} [input.employee_id]
 * @param {string} [input.first_name]
 * @param {string} [input.last_name]
 * @param {string} [input.phone]
 * @param {string} [input.designation]
 * @returns {Promise<void>}
 * @route Used by PUT /employee/profile, PUT /api/admin/employee/:id
 */
async function updateEmployeeProfileByUserId({ user_id, employee_id, first_name, last_name, phone, designation }) {
  await neonDb.query(
    'UPDATE employee_profiles SET employee_id = $1, first_name = $2, last_name = $3, phone = $4, designation = $5, updated_at = NOW() WHERE user_id = $6',
    [employee_id, first_name, last_name, phone, designation, user_id]
  );
}

// ===========================================================================
// Stock item CRUD (used by /api/admin/stock/* and /api/stock/*)
// ===========================================================================

/**
 * Create a stock item with an auto-generated guid and masterid 0.
 * @param {object} input
 * @param {string} input.name - stock display name
 * @param {string} input.guid - UUID
 * @param {number} [input.quantity] - stock quantity
 * @param {number} [input.price] - stock price
 * @returns {Promise<object>} created app.stock row (RETURNING *)
 * @route Used by POST /api/admin/stock-item, POST /api/stock/stock-item
 */
async function createStockItemGuid({ name, guid, quantity, price }) {
  const result = await neonDb.query(
    'INSERT INTO app.stock (stockname, guid, quantity, price, masterid, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, NOW(), NOW()) RETURNING *',
    [name, guid, quantity, price]
  );
  return result.rows[0];
}

/**
 * Update a stock item's name/quantity/price by id.
 * @param {object} input
 * @param {number} input.id - app.stock.id
 * @param {string} [input.name] - new stockname
 * @param {number} [input.quantity]
 * @param {number} [input.price]
 * @returns {Promise<object|undefined>} updated row, or undefined when id not found
 * @route Used by PUT /api/admin/stock-item, PUT /api/admin/stockitem, PUT /api/stock/stock-item
 */
async function updateStockItemById({ id, name, quantity, price }) {
  const result = await neonDb.query(
    'UPDATE app.stock SET stockname = $1, quantity = $2, price = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [name, quantity, price, id]
  );
  return result.rows[0];
}

/**
 * Delete a stock item by id.
 * @param {number} id - app.stock.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined when not found
 * @route Used by DELETE /api/admin/stock-item, DELETE /api/admin/stockitem, DELETE /api/stock/stock-item
 */
async function deleteStockItemById(id) {
  const result = await neonDb.query('DELETE FROM app.stock WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// ===========================================================================
// Ledger CRUD (used by /api/admin/stock/* and /api/stock/*)
// ===========================================================================

/**
 * Create a ledger. address/mobile are stored as single-element arrays (or null).
 * @param {object} input
 * @param {string} input.guid - UUID
 * @param {string} input.name - party name
 * @param {string} [input.address]
 * @param {string} [input.mobile]
 * @returns {Promise<object>} created app.ledger row
 * @route Used by POST /api/admin/ledger, POST /api/stock/ledger
 */
async function createLedger({ guid, name, address, mobile }) {
  const result = await neonDb.query(
    'INSERT INTO app.ledger (guid, name, address, mobile) VALUES ($1, $2, $3, $4) RETURNING *',
    [guid, name, address ? [address] : null, mobile ? [mobile] : null]
  );
  return result.rows[0];
}

/**
 * List ledgers, optionally filtered by name (case-insensitive contains).
 * @param {object} [input]
 * @param {string} [input.name] - name filter
 * @returns {Promise<object[]>} rows [{ id, guid, name, address, mobile, ledgername }] ordered by name
 * @route Used by GET /api/admin/ledger, GET /api/stock/ledger
 */
async function listLedgers({ name }: any = {}) {
  let query = 'SELECT id, guid, name, address, mobile, ledgername FROM app.ledger WHERE 1=1';
  const params: any[] = [];
  let idx = 1;
  if (name) {
    query += ` AND name ILIKE $${idx++}`;
    params.push(`%${name}%`);
  }
  query += ' ORDER BY name';
  const result = await neonDb.query(query, params);
  return result.rows;
}

/**
 * Update a ledger by id (address/mobile wrapped in arrays).
 * @param {object} input
 * @param {number} input.id - app.ledger.id
 * @param {string} [input.name]
 * @param {string} [input.address]
 * @param {string} [input.mobile]
 * @returns {Promise<object|undefined>} updated row, or undefined when not found
 * @route Used by PUT /api/admin/ledger, PUT /api/stock/ledger
 */
async function updateLedger({ id, name, address, mobile }) {
  const result = await neonDb.query(
    'UPDATE app.ledger SET name = $1, address = $2, mobile = $3 WHERE id = $4 RETURNING *',
    [name, address ? [address] : null, mobile ? [mobile] : null, id]
  );
  return result.rows[0];
}

/**
 * Delete a ledger by id.
 * @param {number} id - app.ledger.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined when not found
 * @route Used by DELETE /api/admin/ledger, DELETE /api/stock/ledger
 */
async function deleteLedger(id) {
  const result = await neonDb.query('DELETE FROM app.ledger WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// ===========================================================================
// Voucher CRUD (used by /api/admin/stock/* and /api/stock/*)
// ===========================================================================

/**
 * Create a voucher.
 * @param {object} input
 * @param {string} input.guid - UUID
 * @param {string} [input.date] - voucher date
 * @param {string} [input.voucher_type] - e.g. 'Sales', 'Receipt', 'Payment'
 * @param {string} [input.voucher_number]
 * @param {string} [input.party_ledger_name]
 * @param {string} [input.narration]
 * @returns {Promise<object>} created app.vouchers row
 * @route Used by POST /api/admin/voucher, POST /api/stock/voucher
 */
async function createVoucher({ guid, date, voucher_type, voucher_number, party_ledger_name, narration }) {
  const result = await neonDb.query(
    `INSERT INTO app.vouchers (guid, date, voucher_type, voucher_number, party_ledger_name, narration)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [guid, date, voucher_type, voucher_number, party_ledger_name, narration]
  );
  return result.rows[0];
}

/**
 * List vouchers with optional filters. Max 200 rows, newest first.
 * @param {object} [input]
 * @param {string} [input.voucher_type] - exact match
 * @param {string} [input.voucher_number] - exact match
 * @param {string} [input.from_date] - date >= from_date
 * @param {string} [input.to_date] - date <= to_date
 * @returns {Promise<object[]>} voucher rows (ledgerentries/inventoryentries included)
 * @route Used by GET /api/admin/voucher, GET /api/stock/voucher
 */
async function listVouchers({ voucher_type, voucher_number, from_date, to_date }: any = {}) {
  let query = `SELECT id, guid, date, voucher_type, voucher_number, party_ledger_name,
                      narration, ledgerentries, inventoryentries, created_at, billagentname
               FROM app.vouchers WHERE 1=1`;
  const params: any[] = [];
  let idx = 1;
  if (voucher_type) { query += ` AND voucher_type = $${idx++}`; params.push(voucher_type); }
  if (voucher_number) { query += ` AND voucher_number = $${idx++}`; params.push(voucher_number); }
  if (from_date) { query += ` AND date >= $${idx++}`; params.push(from_date); }
  if (to_date) { query += ` AND date <= $${idx++}`; params.push(to_date); }
  query += ' ORDER BY date DESC LIMIT 200';
  const result = await neonDb.query(query, params);
  return result.rows;
}

/**
 * Update a voucher by id.
 * @param {object} input
 * @param {number} input.id - app.vouchers.id
 * @param {string} [input.voucher_type]
 * @param {string} [input.voucher_number]
 * @param {string} [input.date]
 * @param {string} [input.narration]
 * @param {string} [input.party_ledger_name]
 * @returns {Promise<object|undefined>} updated row, or undefined when not found
 * @route Used by PUT /api/admin/voucher, PUT /api/stock/voucher
 */
async function updateVoucher({ id, voucher_type, voucher_number, date, narration, party_ledger_name }) {
  const result = await neonDb.query(
    `UPDATE app.vouchers SET voucher_type = $1, voucher_number = $2, date = $3,
     narration = $4, party_ledger_name = $5 WHERE id = $6 RETURNING *`,
    [voucher_type, voucher_number, date, narration, party_ledger_name, id]
  );
  return result.rows[0];
}

/**
 * Delete a voucher by id.
 * @param {number} id - app.vouchers.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined when not found
 * @route Used by DELETE /api/admin/voucher, DELETE /api/stock/voucher
 */
async function deleteVoucher(id) {
  const result = await neonDb.query('DELETE FROM app.vouchers WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// ===========================================================================
// Godown CRUD (used by /api/admin/stock/* and /api/stock/*)
// ===========================================================================

/**
 * Create a godown (warehouse).
 * @param {object} input
 * @param {string} input.name
 * @param {string} [input.address]
 * @returns {Promise<object>} created godowns row
 * @route Used by POST /api/admin/godown, POST /api/stock/godown
 */
async function createGodown({ name, address }) {
  const result = await neonDb.query(
    'INSERT INTO godowns (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
    [name, address]
  );
  return result.rows[0];
}

/**
 * List godowns, optionally filtered by name.
 * @param {object} [input]
 * @param {string} [input.name] - name filter (case-insensitive contains)
 * @returns {Promise<object[]>} godown rows
 * @route Used by GET /api/admin/godown, GET /api/stock/godown
 */
async function listGodowns({ name }: any = {}) {
  let query = 'SELECT * FROM godowns WHERE 1=1';
  const params: any[] = [];
  let idx = 1;
  if (name) {
    query += ` AND name ILIKE $${idx++}`;
    params.push(`%${name}%`);
  }
  const result = await neonDb.query(query, params);
  return result.rows;
}

/**
 * Update a godown by id.
 * @param {object} input
 * @param {number} input.id - godowns.id
 * @param {string} [input.name]
 * @param {string} [input.address]
 * @returns {Promise<object|undefined>} updated row, or undefined when not found
 * @route Used by PUT /api/admin/godown, PUT /api/stock/godown
 */
async function updateGodown({ id, name, address }) {
  const result = await neonDb.query(
    'UPDATE godowns SET name = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [name, address, id]
  );
  return result.rows[0];
}

/**
 * Delete a godown by id.
 * @param {number} id - godowns.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined when not found
 * @route Used by DELETE /api/admin/godown, DELETE /api/stock/godown
 */
async function deleteGodown(id) {
  const result = await neonDb.query('DELETE FROM godowns WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// ===========================================================================
// Inventory record CRUD (used by /api/admin/inventory and /api/inventory)
// ===========================================================================

/**
 * Create an inventory record (stock quantity per godown).
 * @param {object} input
 * @param {number} input.stockitem_id
 * @param {number} input.godown_id
 * @param {number} input.quantity
 * @returns {Promise<object>} created `inventory` row
 * @route Used by POST /api/admin/inventory, POST /api/inventory
 */
async function createInventoryRecord({ stockitem_id, godown_id, quantity }) {
  const result = await neonDb.query(
    'INSERT INTO inventory (stockitem_id, godown_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
    [stockitem_id, godown_id, quantity]
  );
  return result.rows[0];
}

/**
 * List inventory records, optionally filtered by stockitem_id and/or godown_id.
 * @param {object} [input]
 * @param {number} [input.stockitem_id]
 * @param {number} [input.godown_id]
 * @returns {Promise<object[]>} inventory rows
 * @route Used by GET /api/admin/inventory, GET /api/inventory
 */
async function listInventoryRecords({ stockitem_id, godown_id }: any = {}) {
  let query = 'SELECT * FROM inventory WHERE 1=1';
  const params: any[] = [];
  let idx = 1;
  if (stockitem_id) { query += ` AND stockitem_id = $${idx++}`; params.push(stockitem_id); }
  if (godown_id) { query += ` AND godown_id = $${idx++}`; params.push(godown_id); }
  const result = await neonDb.query(query, params);
  return result.rows;
}

/**
 * Update an inventory record by id.
 * @param {object} input
 * @param {number} input.id - `inventory`.id
 * @param {number} [input.stockitem_id]
 * @param {number} [input.godown_id]
 * @param {number} [input.quantity]
 * @returns {Promise<object|undefined>} updated row, or undefined when not found
 * @route Used by PUT /api/admin/inventory, PUT /api/inventory
 */
async function updateInventoryRecord({ id, stockitem_id, godown_id, quantity }) {
  const result = await neonDb.query(
    'UPDATE inventory SET stockitem_id = $1, godown_id = $2, quantity = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [stockitem_id, godown_id, quantity, id]
  );
  return result.rows[0];
}

/**
 * Delete an inventory record by id.
 * @param {number} id - `inventory`.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined when not found
 * @route Used by DELETE /api/admin/inventory, DELETE /api/inventory
 */
async function deleteInventoryRecord(id) {
  const result = await neonDb.query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// ===========================================================================
// Diagnostics
// ===========================================================================

/**
 * First app.users row (DB connectivity check).
 * @returns {Promise<object|undefined>} oldest app.users row by id, or undefined when table is empty
 * @route Used by dbCheck.ts (health check handler, not mounted)
 */
async function getFirstUser() {
  const result = await neonDb.query('SELECT * FROM app.users ORDER BY id LIMIT 1');
  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  getUserBriefById,
  getMinAccessGroupId,
  createUser,
  createUserNoName,
  findPartnerProfile,
  createPartnerProfile,
  updatePartnerProfileByUserId,
  findEmployeeProfile,
  createEmployeeProfile,
  updateEmployeeProfileByUserId,
  createStockItemGuid,
  updateStockItemById,
  deleteStockItemById,
  createLedger,
  listLedgers,
  updateLedger,
  deleteLedger,
  createVoucher,
  listVouchers,
  updateVoucher,
  deleteVoucher,
  createGodown,
  listGodowns,
  updateGodown,
  deleteGodown,
  createInventoryRecord,
  listInventoryRecords,
  updateInventoryRecord,
  deleteInventoryRecord,
  getFirstUser,
};
