/**
 * api.ts
 *
 * DB query helpers for the public /api/* router: user auth, the public
 * stock/ledger/voucher/godown/inventory CRUD, user-owned API keys, the v1
 * product/analytics endpoints, and the API-key resolution + usage logging used
 * by src/middleware/apiKeyAuth. Re-exports every shared helper.
 *
 * Every function returns the raw DB result (row / rows / aggregate object);
 * response shaping stays in the route handlers / middleware.
 */
const { neonDb } = require('../db');
const shared = require('./shared');

// ===========================================================================
// Public stock item list (group-scoped for non-admin users)
// ===========================================================================

/**
 * Build the optional inventory_access_group INNER JOIN used to scope v1 queries
 * to the API key's access group.
 * @param {number|null} accessGroupId - app.access_groups.id (null = unscoped)
 * @param {string} baseQuery - the SELECT ... FROM app.inventory s text
 * @param {any[]} [params] - existing query params
 * @returns {{ text: string, params: any[] }} final query text + params
 */
function scopedV1Query(accessGroupId, baseQuery, params: any[] = []) {
  let idx = params.length + 1;
  let text = baseQuery;
  if (accessGroupId) {
    text += ` INNER JOIN app.inventory_access_group iag ON iag.inventoryid = s.id AND iag.accessgroupid = $${idx++}`;
  }
  text += ' WHERE s.isblocked IS NOT TRUE';
  return {
    text,
    params: accessGroupId ? [...params, accessGroupId] : params,
  };
}

/**
 * List stock items for the public app catalog. Admins see all rows; other users
 * only see inventory mapped to their access group (via inventory_access_group),
 * enriched with brand/model/varient/color/gst and group price/qty.
 * @param {object} input
 * @param {boolean} input.isAdmin - true when the caller is an admin
 * @param {number} input.userId - caller's app.users.id (unused for admin)
 * @param {string} [input.name] - name filter (case-insensitive contains)
 * @returns {Promise<object[]>} inventory rows (shape differs for admin vs user)
 * @route Used by GET /api/stock/stock-item
 */
async function listStockItemsForUser({ isAdmin, userId, name }) {
  const params: any[] = [];
  let idx = 1;
  let query;
  if (isAdmin) {
    query = 'SELECT inv.*, COALESCE(inv.fullname, inv.stockname) AS name FROM app.inventory inv WHERE 1=1 AND inv.isblocked IS NOT TRUE';
  } else {
    query = `SELECT inv.id, inv.guid, inv.stockname, inv.data, inv.costing_meth, inv.unit, inv.masterid,
                    COALESCE(inv.fullname, inv.stockname) AS name, inv.brand, inv.model, inv.varient, inv.color, inv.gst,
                    iag.oprice AS price,
                    (COALESCE(inv.quantity, 0) + COALESCE(inv.vquantity, 0) + COALESCE(iag.quantity, 0)) AS quantity
             FROM app.inventory inv
             INNER JOIN app.inventory_access_group iag ON iag.inventoryid = inv.id
             INNER JOIN app.users u ON u.id = $${idx++} AND u.access_group_id = iag.accessgroupid
             WHERE 1=1 AND inv.isblocked IS NOT TRUE`;
    params.push(userId);
  }
  if (name) { query += ` AND COALESCE(inv.fullname, inv.stockname) ILIKE $${idx++}`; params.push(`%${name}%`); }
  const result = await neonDb.query(query, params);
  return result.rows;
}

// ===========================================================================
// User-owned API keys (/api/keys)
// ===========================================================================

/**
 * Create an API key owned by an app user.
 * @param {object} input
 * @param {string} input.keyid - UUID keyid
 * @param {string} input.key_name - display name
 * @param {string} input.key - the 'via.<hex>' secret
 * @param {number} input.user_id - owner app.users.id
 * @returns {Promise<object>} { keyid, key_name, key, is_active, created_at }
 * @route Used by POST /api/keys
 */
async function createOwnApiKey({ keyid, key_name, key, user_id }) {
  const result = await neonDb.query(
    `INSERT INTO app.api (keyid, key_name, key, user_id, is_active, created_at)
     VALUES ($1, $2, $3, $4, true, NOW()) RETURNING keyid, key_name, key, is_active, created_at`,
    [keyid, key_name, key, user_id]
  );
  return result.rows[0];
}

/**
 * List a user's own API keys.
 * @param {number} user_id - owner app.users.id
 * @returns {Promise<object[]>} [{ keyid, key_name, key, is_active, created_at, last_used }]
 * @route Used by GET /api/keys
 */
async function listOwnApiKeys(user_id) {
  const result = await neonDb.query(
    'SELECT keyid, key_name, key, is_active, created_at, last_used FROM app.api WHERE user_id = $1',
    [user_id]
  );
  return result.rows;
}

/**
 * Update a user's own API key (name and/or active status). NULL fields keep their
 * current values via COALESCE.
 * @param {object} input
 * @param {string} input.id - keyid
 * @param {string|null} [input.key_name]
 * @param {boolean|null} [input.is_active]
 * @returns {Promise<object|undefined>} { keyid, key_name, key, is_active }, or undefined
 * @route Used by PUT /api/keys
 */
async function updateOwnApiKey({ id, key_name, is_active }) {
  const result = await neonDb.query(
    'UPDATE app.api SET key_name = COALESCE($1, key_name), is_active = COALESCE($2, is_active), updated_at = NOW() WHERE keyid = $3 RETURNING keyid, key_name, key, is_active',
    [key_name ?? null, is_active ?? null, id]
  );
  return result.rows[0];
}

/**
 * Delete a user's own API key.
 * @param {string} id - keyid
 * @returns {Promise<object|undefined>} { keyid }, or undefined when not found
 * @route Used by DELETE /api/keys
 */
async function deleteOwnApiKey(id) {
  const result = await neonDb.query('DELETE FROM app.api WHERE keyid = $1 RETURNING keyid', [id]);
  return result.rows[0];
}

// ===========================================================================
// v1 product endpoints (/api/v1)
// ===========================================================================

/**
 * Paginated product catalog, optionally scoped to an access group. Counts rows
 * and fetches the page in one call.
 * @param {object} input
 * @param {number|null} input.accessGroupId - API key's access group (null = all)
 * @param {string} [input.search] - stockname/id filter (ILIKE)
 * @param {number} input.page - 1-based page number
 * @param {number} input.limit - page size
 * @returns {Promise<{ rows: object[], total: number }>}
 * @route Used by GET /api/v1/products
 */
async function listProductsV1({ accessGroupId, search, page, limit }) {
  const offset = (page - 1) * limit;
  const selectCols = 'SELECT s.id, COALESCE(s.fullname, s.stockname) AS name, CAST(s.id AS TEXT) AS sku, (COALESCE(s.quantity, 0) + COALESCE(s.vquantity, 0)) AS qty, s.price, s.category_level_1, s.category_level_2, s.created_at, s.updated_at FROM app.inventory s';
  let { text, params } = scopedV1Query(accessGroupId, selectCols);
  let idx = params.length + 1;
  if (search) {
    text += ` AND (COALESCE(s.fullname, s.stockname) ILIKE $${idx} OR CAST(s.id AS TEXT) ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  const countResult = await neonDb.query(
    `SELECT COUNT(*)::int AS total FROM app.inventory s ${text.replace(selectCols, '')}`,
    [...params]
  );
  const total = countResult.rows[0]?.total || 0;
  const dataResult = await neonDb.query(
    `${text} ORDER BY COALESCE(s.fullname, s.stockname) LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  return { rows: dataResult.rows, total };
}

/**
 * Single product by id, scoped to the API key's access group when present.
 * @param {object} input
 * @param {number|null} input.accessGroupId - API key's access group (null = all)
 * @param {number|string} input.id - app.stock.id
 * @returns {Promise<object|undefined>} product row, or undefined
 * @route Used by GET /api/v1/products/:id
 */
async function getProductV1({ accessGroupId, id }) {
  const selectCols = 'SELECT s.id, COALESCE(s.fullname, s.stockname) AS name, CAST(s.id AS TEXT) AS sku, (COALESCE(s.quantity, 0) + COALESCE(s.vquantity, 0)) AS qty, s.price, s.category_level_1, s.category_level_2, s.created_at, s.updated_at FROM app.inventory s';
  const { text, params } = scopedV1Query(accessGroupId, selectCols);
  const result = await neonDb.query(
    `${text} AND s.id = $${params.length + 1}`,
    [...params, id]
  );
  return result.rows[0];
}

/**
 * Create a product. When the key has an access group, the product is also mapped
 * to that group via inventory_access_group.
 * @param {object} input
 * @param {string} input.name - product name
 * @param {number} [input.quantity]
 * @param {number} [input.price]
 * @param {string} [input.category_level_1]
 * @param {string} [input.category_level_2]
 * @param {number|null} [input.accessGroupId] - access group to map the product to
 * @returns {Promise<object>} created product row { id, name, qty, price, ... }
 * @route Used by POST /api/v1/products
 */
async function createProductV1({ name, quantity, price, category_level_1, category_level_2, accessGroupId }) {
  const result = await neonDb.query(
    `INSERT INTO app.inventory (fullname, stockname, quantity, price, category_level_1, category_level_2, created_at, updated_at)
     VALUES ($1, $1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, COALESCE(fullname, stockname) AS name, quantity AS qty, price, category_level_1, category_level_2, created_at, updated_at`,
    [name, quantity || 0, price || 0, category_level_1, category_level_2]
  );
  const product = result.rows[0];
  if (accessGroupId) {
    await neonDb.query(
      'INSERT INTO app.inventory_access_group (inventoryid, accessgroupid, quantity, oprice) VALUES ($1, $2, $3, $4)',
      [product.id, accessGroupId, quantity || 0, price || 0]
    );
  }
  return product;
}

/**
 * Partially update a product. When the key has an access group, qty/price changes
 * are mirrored into the group's inventory_access_group mapping.
 * @param {object} input
 * @param {number} input.id - app.stock.id
 * @param {string|null} [input.name]
 * @param {number|null} [input.quantity]
 * @param {number|null} [input.price]
 * @param {string|null} [input.category_level_1]
 * @param {string|null} [input.category_level_2]
 * @param {number|null} [input.accessGroupId]
 * @returns {Promise<object|undefined>} updated product row, or undefined
 * @route Used by PUT /api/v1/products/:id
 */
async function updateProductV1({ id, name, quantity, price, category_level_1, category_level_2, accessGroupId }) {
  const result = await neonDb.query(
    `UPDATE app.inventory
     SET fullname = COALESCE($1, fullname), stockname = COALESCE($1, stockname),
         quantity = COALESCE($2, quantity), price = COALESCE($3, price),
         category_level_1 = COALESCE($4, category_level_1), category_level_2 = COALESCE($5, category_level_2),
         updated_at = NOW()
     WHERE id = $6
     RETURNING id, COALESCE(fullname, stockname) AS name, quantity AS qty, price, category_level_1, category_level_2, created_at, updated_at`,
    [name ?? null, quantity ?? null, price ?? null, category_level_1 ?? null, category_level_2 ?? null, id]
  );
  const product = result.rows[0];
  if (product && accessGroupId && (quantity != null || price != null)) {
    await neonDb.query(
      'UPDATE app.inventory_access_group SET quantity = COALESCE($1, quantity), oprice = COALESCE($2, oprice) WHERE inventoryid = $3 AND accessgroupid = $4',
      [quantity ?? null, price ?? null, id, accessGroupId]
    );
  }
  return product;
}

/**
 * List sales vouchers (max 200, newest first), optionally scoped to an access
 * group and filtered by date range.
 * @param {object} input
 * @param {number|null} [input.accessGroupId] - API key's access group (null = all)
 * @param {string} [input.from_date] - date >= from_date
 * @param {string} [input.to_date] - date <= to_date
 * @returns {Promise<object[]>} voucher rows (type/number/amount derived in handler)
 * @route Used by GET /api/v1/analytics/sales
 */
async function listSalesVouchersV1({ accessGroupId, from_date, to_date }) {
  let baseQuery = `SELECT v.id, v.date, v.voucher_type, v.voucher_number, v.party_ledger_name,
                          v.narration, v.ledgerentries, v.inventoryentries, v.created_at
                   FROM app.vouchers v`;
  const params: any[] = [];
  let idx = 1;
  const conditions: string[] = [];
  if (accessGroupId) {
    baseQuery += ` INNER JOIN app.inventory_access_group iag ON iag.accessgroupid = $${idx}`;
    params.push(accessGroupId);
    conditions.push('v.inventoryentries IS NOT NULL');
    idx++;
  }
  if (from_date) { conditions.push(`v.date >= $${idx++}`); params.push(from_date); }
  if (to_date) { conditions.push(`v.date <= $${idx++}`); params.push(to_date); }
  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }
  baseQuery += ' ORDER BY v.date DESC LIMIT 200';
  const result = await neonDb.query(baseQuery, params);
  return result.rows;
}

// ===========================================================================
// API-key resolution + usage logging (used by src/middleware/apiKeyAuth)
// ===========================================================================

/**
 * Ensure the api_key_log table exists (idempotent). Alters api_key_id to TEXT.
 * @returns {Promise<void>}
 * @route Used by apiKeyAuth middleware (module init)
 */
async function ensureLogTable() {
  await neonDb.query(`
    CREATE TABLE IF NOT EXISTS api_key_log (
      id SERIAL PRIMARY KEY,
      api_key_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await neonDb.query(`ALTER TABLE api_key_log ALTER COLUMN api_key_id TYPE TEXT`).catch(() => {});
}

/**
 * Resolve an API key (joined with its access group) by its secret value.
 * @param {string} key - the 'via.<hex>' secret
 * @returns {Promise<object|undefined>} app.api row + group_name, or undefined
 * @route Used by apiKeyAuth middleware
 */
async function findApiKey(key) {
  const result = await neonDb.query(
    `SELECT k.keyid, k.key_name, k.key, k.access_group_id, k.permissions, k.duration,
            k.is_active, k.created_at, g.name AS group_name
     FROM app.api k
     LEFT JOIN app.access_groups g ON g.id = k.access_group_id
     WHERE k.key = $1`,
    [key]
  );
  return result.rows[0];
}

/**
 * Stamp last_used = NOW() on an API key.
 * @param {string} keyid - app.api.keyid
 * @returns {Promise<void>}
 * @route Used by apiKeyAuth middleware
 */
async function touchApiKey(keyid) {
  await neonDb.query('UPDATE app.api SET last_used = NOW() WHERE keyid = $1', [keyid]);
}

/**
 * Insert an api_key_log usage row.
 * @param {object} input
 * @param {string} input.keyid - app.api.keyid
 * @param {string} input.endpoint - requested path
 * @param {string} input.method - HTTP method
 * @param {number|null} input.status - response status (null until known)
 * @returns {Promise<void>}
 * @route Used by apiKeyAuth middleware
 */
async function logApiUsage({ keyid, endpoint, method, status }) {
  await neonDb.query(
    'INSERT INTO api_key_log (api_key_id, endpoint, method, status) VALUES ($1, $2, $3, $4)',
    [keyid, endpoint, method, status]
  );
}

module.exports = {
  ...shared,
  listStockItemsForUser,
  createOwnApiKey,
  listOwnApiKeys,
  updateOwnApiKey,
  deleteOwnApiKey,
  listProductsV1,
  getProductV1,
  createProductV1,
  updateProductV1,
  listSalesVouchersV1,
  ensureLogTable,
  findApiKey,
  touchApiKey,
  logApiUsage,
};
