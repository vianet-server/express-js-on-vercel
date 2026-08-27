/**
 * admin.ts
 *
 * DB query helpers for every /api/admin/* router. Includes the shared helpers
 * (stock/ledger/voucher/godown/inventory CRUD, user + access-group helpers) plus
 * all admin-specific queries (login, access control, inventory/SKU, API keys,
 * dashboard, analytics, reports, market, partner/employee management, settings).
 *
 * Every function returns the raw DB result (row / rows / aggregate object);
 * response shaping stays in the route handlers.
 */
const { neonDb } = require('../db');
const shared = require('./shared');

// ===========================================================================
// Admin login
// ===========================================================================

/**
 * Look up a user for admin login (returns any registered user; role is enforced by
 * the frontend and the adminAuth middleware on other routes).
 * @param {string} email - login email
 * @returns {Promise<object|undefined>} full app.users row, or undefined
 * @route Used by POST /api/admin/login
 */
async function loginUser(email) {
  const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0];
}

// ===========================================================================
// Access control (app users management)
// ===========================================================================

/**
 * Create an app user from the admin access-control page.
 * @param {object} input
 * @param {string} input.email
 * @param {string} input.password_hash - bcrypt hash
 * @param {string} [input.user_type] - defaults to 'user'
 * @param {number|null} [input.access_group_id]
 * @returns {Promise<object>} inserted row { id, email, user_type, access_group_id }
 * @route Used by POST /api/admin/accesscontrol
 */
async function createAccessControlUser({ email, password_hash, user_type, access_group_id }) {
  const result = await neonDb.query(
    'INSERT INTO app.users (email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, user_type, access_group_id',
    [email, password_hash, user_type || 'user', access_group_id || null]
  );
  return result.rows[0];
}

/**
 * Best-effort ALTER TABLE that adds the newer columns to app.users.
 * @returns {Promise<void>} never throws (warnings swallowed)
 * @route Used by GET /api/admin/accesscontrol, PUT /api/admin/accesscontrol
 */
async function ensureUserColumns() {
  try {
    await neonDb.query(`
      ALTER TABLE app.users
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false
    `);
  } catch (err) {
    console.warn('[accesscontroll] ensureUserColumns warning:', err.message);
  }
}

/**
 * Paginated, filterable list of app users joined with their access-group name.
 * @param {object} input
 * @param {string} [input.email] - email filter (ILIKE contains)
 * @param {string} [input.user_type] - exact user_type filter
 * @param {number} input.limit - page size (already clamped by the route)
 * @param {number} input.offset - page offset
 * @returns {Promise<{rows: object[], total: number}>} rows ordered by created_at DESC
 * @route Used by GET /api/admin/accesscontrol
 */
async function listAccessControlUsers({ email, user_type, limit, offset }) {
  const filters: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (email) { filters.push(`u.email ILIKE $${idx++}`); params.push(`%${email}%`); }
  if (user_type) { filters.push(`u.user_type = $${idx++}`); params.push(user_type); }

  const where = filters.length ? ' WHERE ' + filters.join(' AND ') : '';

  const countResult = await neonDb.query('SELECT COUNT(*) FROM app.users u' + where, [...params]);
  const total = parseInt(countResult.rows[0].count);

  const dataQuery = `SELECT u.id, u.email, u.user_type, u.is_active, u.created_at, u.updated_at, u.access_group_id, g.name AS access_group_name FROM app.users u LEFT JOIN app.access_groups g ON g.id = u.access_group_id${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  const result = await neonDb.query(dataQuery, params);
  return { rows: result.rows, total };
}

/**
 * Update an app user (email, role, access group, active flag).
 * @param {object} input
 * @param {number} input.id - app.users.id
 * @param {string} [input.email]
 * @param {string} [input.user_type]
 * @param {number|null} [input.access_group_id]
 * @param {boolean} [input.is_active]
 * @returns {Promise<object|undefined>} updated row { id, email, user_type, access_group_id, is_active }, or undefined
 * @route Used by PUT /api/admin/accesscontrol
 */
async function updateAccessControlUser({ id, email, user_type, access_group_id, is_active }) {
  const result = await neonDb.query(
    'UPDATE app.users SET email = $1, user_type = $2, access_group_id = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING id, email, user_type, access_group_id, is_active',
    [email, user_type, access_group_id || null, is_active, id]
  );
  return result.rows[0];
}

/**
 * Delete an app user by id.
 * @param {number} id - app.users.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined
 * @route Used by DELETE /api/admin/accesscontrol
 */
async function deleteAccessControlUser(id) {
  const result = await neonDb.query('DELETE FROM app.users WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
}

// ===========================================================================
// Admin stock items (/api/admin/stock/* and /api/admin/stockitem)
// ===========================================================================

/**
 * Paginated stock item list with optional name search (legacy admin list endpoint).
 * @param {object} input
 * @param {string} [input.name] - name filter (ILIKE contains)
 * @param {number} input.limit - page size
 * @param {number} input.offset - page offset
 * @returns {Promise<{rows: object[], total: number}>} app.inventory rows ordered by id DESC
 * @route Used by GET /api/admin/stock-item
 */
async function listStockItemsAdmin({ name, limit, offset }) {
  let countQuery = 'SELECT COUNT(*) FROM app.inventory WHERE 1=1 AND isblocked IS NOT TRUE';
  let dataQuery = 'SELECT * FROM app.inventory WHERE 1=1 AND isblocked IS NOT TRUE';
  const params: any[] = [];
  let idx = 1;

  if (name) {
    const clause = ` AND COALESCE(fullname, stockname) ILIKE $${idx++}`;
    countQuery += clause;
    dataQuery += clause;
    params.push(`%${name}%`);
  }

  const countResult = await neonDb.query(countQuery, [...params]);
  const total = parseInt(countResult.rows[0].count);

  dataQuery += ` ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  const result = await neonDb.query(dataQuery, params);
  return { rows: result.rows, total };
}

/**
 * Create a stock item WITHOUT a guid (legacy /stockitem endpoint).
 * @param {object} input
 * @param {string} input.name - item name
 * @param {number} [input.quantity]
 * @param {number} [input.price]
 * @returns {Promise<object>} created app.inventory row
 * @route Used by POST /api/admin/stockitem
 */
async function createStockItemLegacy({ name, quantity, price }) {
  const result = await neonDb.query(
    'INSERT INTO app.inventory (fullname, stockname, quantity, price, created_at, updated_at) VALUES ($1, $1, $2, $3, NOW(), NOW()) RETURNING *',
    [name, quantity, price]
  );
  return result.rows[0];
}

/**
 * List stock items with optional filters (legacy /stockitem endpoint).
 * @param {object} [input]
 * @param {string} [input.name] - name filter (contains)
 * @param {string} [input.sku] - id filter (exact)
 * @returns {Promise<object[]>} app.inventory rows
 * @route Used by GET /api/admin/stockitem
 */
async function listStockItemsLegacy({ name, sku }: any = {}) {
  let query = 'SELECT * FROM app.inventory WHERE 1=1 AND isblocked IS NOT TRUE';
  const params: any[] = [];
  let idx = 1;
  if (name) { query += ` AND COALESCE(fullname, stockname) ILIKE $${idx++}`; params.push(`%${name}%`); }
  if (sku) { query += ` AND id = $${idx++}`; params.push(isNaN(Number(sku)) ? sku : Number(sku)); }
  const result = await neonDb.query(query, params);
  return result.rows;
}

// ===========================================================================
// Inventory / SKU (/api/admin/inventory/*)
// ===========================================================================

/**
 * Distinct brand names from app.inventory.
 * @returns {Promise<string[]>} brand strings, ordered alphabetically
 * @route Used by GET /api/admin/inventory/brands
 */
async function listDistinctBrands() {
  const result = await neonDb.query('SELECT DISTINCT brand FROM app.inventory WHERE brand IS NOT NULL AND brand != \'\' AND isblocked IS NOT TRUE ORDER BY brand');
  return result.rows.map(r => r.brand);
}

/**
 * Fetch list of distinct Tally Stock Groups (category_level_1)
 */
async function listDistinctGroups() {
  const result = await neonDb.query('SELECT DISTINCT category_level_1 AS "group" FROM app.inventory WHERE category_level_1 IS NOT NULL AND category_level_1 != \'\' AND isblocked IS NOT TRUE ORDER BY category_level_1');
  return result.rows.map(r => r.group);
}

/**
 * Paginated inventory list (the admin inventory table source). Reads
 * app.inventory directly; column aliases preserve the legacy stock-join shape.
 * @param {object} input
 * @param {string} [input.search] - matches stockname/brand/model/fullname/category (ILIKE)
 * @param {string} [input.brand] - brand filter; 'all' disables the filter
 * @param {number} input.limit - page size
 * @param {number} input.offset - page offset
 * @returns {Promise<{rows: object[], total: number}>} rows with inventory columns
 *   (stockname, fullname, brand, model, varient, color, gst, price, inv_price) ordered
 *   alphabetically by display name (fullname, falling back to stockname)
 * @route Used by GET /api/admin/inventory/stock
 */
async function listInventoryStock({ search, brand, group, limit, offset }) {
  let countQuery = 'SELECT COUNT(*) FROM app.inventory inv WHERE 1=1 AND inv.isblocked IS NOT TRUE';
  let dataQuery = `SELECT inv.*, COALESCE(inv.fullname, inv.stockname) AS display_name, COALESCE(inv.price, 0) AS inv_price FROM app.inventory inv WHERE 1=1 AND inv.isblocked IS NOT TRUE`;
  const params: any[] = [];
  let idx = 1;

  if (search) {
    const clause = ` AND (inv.stockname ILIKE $${idx} OR inv.brand ILIKE $${idx} OR inv.model ILIKE $${idx} OR inv.fullname ILIKE $${idx} OR inv.category_level_1 ILIKE $${idx})`;
    countQuery += clause;
    dataQuery += clause;
    params.push(`%${search}%`);
    idx++;
  }

  if (brand && brand !== 'all') {
    const clause = ` AND inv.brand ILIKE $${idx}`;
    countQuery += clause;
    dataQuery += clause;
    params.push(brand);
    idx++;
  }

  if (group && group !== 'all') {
    const clause = ` AND inv.category_level_1 ILIKE $${idx}`;
    countQuery += clause;
    dataQuery += clause;
    params.push(group);
    idx++;
  }

  const countResult = await neonDb.query(countQuery, [...params]);
  const total = parseInt(countResult.rows[0].count);

  dataQuery += ` ORDER BY COALESCE(NULLIF(inv.fullname, ''), inv.stockname) ASC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  const result = await neonDb.query(dataQuery, params);
  return { rows: result.rows, total };
}

/**
 * SKU listing with per-access-group pricing aggregated as a JSON array per item.
 * @param {object} [input]
 * @param {string} [input.brand] - brand filter (ILIKE contains)
 * @returns {Promise<object[]>} rows [{ id, name, sku, qty, price, brand, model, accessGroups }]
 * @route Used by GET /api/admin/inventory/sku
 */
async function listInventorySku({ brand }: any = {}) {
  const params: any[] = [];
  let whereClause = 'WHERE s.isblocked IS NOT TRUE';
  if (brand && brand !== 'all') {
    whereClause += ' AND s.brand ILIKE $1';
    params.push(`%${brand}%`);
  }
  const sql = `
      SELECT s.id,
             COALESCE(s.fullname, s.stockname) AS name,
             CAST(s.id AS TEXT) AS sku,
             (COALESCE(s.quantity,0) + COALESCE(s.vquantity,0)) AS qty,
             s.price,
             COALESCE(s.brand,'') AS brand,
             COALESCE(s.model,'') AS model,
             COALESCE(
               json_agg(
                 json_build_object('group', g.name, 'qty', COALESCE(iag.quantity,0) + COALESCE(s.quantity,0), 'price', iag.oprice, 'partnerSkuName', iag.partner_sku_name)
                 ORDER BY g.name
               ) FILTER (WHERE g.id IS NOT NULL),
               '[]'
             ) AS accessGroups
      FROM app.inventory s
      LEFT JOIN app.inventory_access_group iag ON iag.inventoryid = s.id
      LEFT JOIN app.access_groups g ON g.id = iag.accessgroupid
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.id
    `;
  const result = await neonDb.query(sql, params);
  return result.rows;
}

/**
 * One-off migration: add partner_sku_name column to app.inventory_access_group.
 * @returns {Promise<void>}
 * @route Used by GET /api/admin/migrate-partner-sku
 */
async function migratePartnerSku() {
  await neonDb.query(
    'ALTER TABLE app.inventory_access_group ADD COLUMN IF NOT EXISTS partner_sku_name VARCHAR(255);'
  );
}

/**
 * Inventory unification (Option B): makes app.inventory the single source of
 * truth for item data. Idempotent — extends app.inventory with the columns that
 * previously only existed on app.stock, and backfills missing rows/fields from
 * app.stock (id-to-id 1:1). app.stock stays untouched as the Tally-sync target.
 * Runs automatically at server startup.
 * @returns {Promise<void>}
 * @route Called by src/index.ts at startup; also in migrations/unify_inventory.sql
 */
async function ensureInventoryUnification() {
  await neonDb.query(`
    ALTER TABLE app.inventory
      ADD COLUMN IF NOT EXISTS stockname        TEXT,
      ADD COLUMN IF NOT EXISTS guid             TEXT,
      ADD COLUMN IF NOT EXISTS masterid         BIGINT,
      ADD COLUMN IF NOT EXISTS costing_meth     TEXT,
      ADD COLUMN IF NOT EXISTS unit             TEXT,
      ADD COLUMN IF NOT EXISTS data             JSONB,
      ADD COLUMN IF NOT EXISTS category_level_1 TEXT,
      ADD COLUMN IF NOT EXISTS category_level_2 TEXT
  `);
  await neonDb.query(`
    INSERT INTO app.inventory (
      id, fullname, quantity, price,
      stockname, guid, masterid, costing_meth, unit, data,
      category_level_1, category_level_2, updated_at
    )
    OVERRIDING SYSTEM VALUE
    SELECT
      s.id,
      COALESCE(s.stockname, '') AS fullname,
      s.quantity,
      s.price,
      s.stockname,
      s.guid,
      s.masterid,
      s.costing_meth,
      s.unit,
      s.data,
      s.category_level_1,
      s.category_level_2,
      NOW()
    FROM app.stock s
    ON CONFLICT (id) DO UPDATE SET
      fullname          = COALESCE(NULLIF(app.inventory.fullname, ''), EXCLUDED.fullname),
      stockname         = COALESCE(app.inventory.stockname, EXCLUDED.stockname),
      guid              = COALESCE(app.inventory.guid, EXCLUDED.guid),
      masterid          = COALESCE(app.inventory.masterid, EXCLUDED.masterid),
      costing_meth      = COALESCE(app.inventory.costing_meth, EXCLUDED.costing_meth),
      unit              = COALESCE(app.inventory.unit, EXCLUDED.unit),
      data              = COALESCE(app.inventory.data, EXCLUDED.data),
      category_level_1  = COALESCE(app.inventory.category_level_1, EXCLUDED.category_level_1),
      category_level_2  = COALESCE(app.inventory.category_level_2, EXCLUDED.category_level_2)
  `);
  await neonDb.query('CREATE INDEX IF NOT EXISTS idx_inventory_id ON app.inventory (id)').catch(() => {});
}

/**
 * Inventory control overview: total stock items + all access groups.
 * @returns {Promise<{totalItems: number, accessGroups: object[]}>}
 *   accessGroups rows [{ id, name, created_at }]
 * @route Used by GET /api/admin/inventory/control
 */
async function getInventoryControl() {
  const countResult = await neonDb.query('SELECT COUNT(*) AS items FROM app.inventory WHERE isblocked IS NOT TRUE');
  const groupsResult = await neonDb.query('SELECT id, name, created_at FROM app.access_groups ORDER BY name');
  return {
    totalItems: parseInt(countResult.rows[0].items),
    accessGroups: groupsResult.rows,
  };
}

/**
 * Single stock detail. Reads app.inventory (the unified item table).
 * @param {number} id - app.inventory.id
 * @returns {Promise<object|undefined>} merged row, or undefined
 * @route Used by GET /api/admin/inventory/stock/:id
 */
async function getStockDetail(id) {
  const result = await neonDb.query(
    `SELECT id, stockname,
            COALESCE(fullname, stockname) AS name,
            fullname, brand, model, varient, color, gst,
            quantity AS qty, quantity AS inv_quantity,
            price, price AS inv_price
     FROM app.inventory
     WHERE id = $1 AND isblocked IS NOT TRUE`,
    [id]
  );
  return result.rows[0];
}

/**
 * Save stock detail — upserts the app.inventory row for the given id.
 * @param {object} input
 * @param {number} input.id - inventory item id
 * @param {string} [input.name]
 * @param {string} [input.brand]
 * @param {string} [input.model]
 * @param {string} [input.variant]
 * @param {string} [input.color]
 * @param {number} [input.qty]
 * @param {number} [input.price]
 * @param {number} [input.gst]
 * @returns {Promise<object>} upserted app.inventory row
 * @route Used by POST /api/admin/inventory/stock/:id
 */
async function saveStockDetail({ id, name, brand, model, variant, color, qty, price, gst }) {
  const inventoryResult = await neonDb.query(
    `UPDATE app.inventory
     SET   fullname = $1, brand = $2, model = $3, varient = $4, color = $5,
           quantity = $6, price = $7, gst = $8, updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [name, brand, model, variant, color, qty, price, gst, id]
  );

  return inventoryResult.rows[0];
}

// ===========================================================================
// Access-group / stock mappings (/api/admin/inventory/sku/:sku/access-group/:group)
// ===========================================================================

/**
 * Access-group detail for one SKU: stock row, group lookup, optional group mapping,
 * all groups the stock belongs to, and all stocks the group sees.
 * @param {object} input
 * @param {string|number} input.sku - app.stock.id (numeric or string)
 * @param {string} input.group - access group name
 * @returns {Promise<{item: object, groupRow: object|undefined, iaRow: object|undefined, allAgRows: object[], groupStocksRows: object[]}>}
 * @route Used by GET /api/admin/inventory/sku/:sku/access-group/:group
 */
async function getAccessGroupDetail({ sku, group }) {
  const stockId = isNaN(Number(sku)) ? sku : Number(sku);

  const itemResult = await neonDb.query(
    "SELECT id, COALESCE(fullname, stockname) AS name, CAST(id AS TEXT) AS sku, (COALESCE(quantity,0) + COALESCE(vquantity,0)) AS qty, price FROM app.inventory WHERE id = $1 AND isblocked IS NOT TRUE",
    [stockId]
  );
  const item = itemResult.rows[0];
  if (!item) return { item: null, groupRow: null, iaRow: null, allAgRows: [], groupStocksRows: [] };

  const groupResult = await neonDb.query('SELECT id, name FROM app.access_groups WHERE name = $1', [group]);
  const groupRow = groupResult.rows[0];

  let iaRow = null;
  if (groupRow) {
    const ia = await neonDb.query(
      'SELECT quantity, oprice FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2',
      [item.id, groupRow.id]
    );
    iaRow = ia.rows[0];
  }

  const allAg = await neonDb.query(`
    SELECT g.name AS group, iag.quantity AS qty, iag.oprice AS price
    FROM app.inventory_access_group iag
    JOIN app.access_groups g ON g.id = iag.accessgroupid
    WHERE iag.inventoryid = $1 ORDER BY g.name
  `, [item.id]);

  const groupStocks = await neonDb.query(`
    SELECT inv.id, COALESCE(inv.fullname, inv.stockname) AS name,
           COALESCE(inv.brand,'') AS brand, COALESCE(inv.model,'') AS model,
           iag.quantity AS qty, iag.oprice AS price
    FROM app.inventory inv
    JOIN app.inventory_access_group iag ON iag.inventoryid = inv.id
    WHERE iag.accessgroupid = $1 AND inv.isblocked IS NOT TRUE
    ORDER BY COALESCE(inv.fullname, inv.stockname)
  `, [groupRow ? groupRow.id : 0]);

  return { item, groupRow, iaRow, allAgRows: allAg.rows, groupStocksRows: groupStocks.rows };
}

/**
 * Find a stock row by numeric id (or sku string) — used by group mapping helpers.
 * @param {string|number} sku - app.stock.id
 * @returns {Promise<object|undefined>} row { id }, or undefined
 * @route Used by POST/PUT/DELETE /api/admin/inventory/sku/:sku/access-group/:group, POST /api/admin/inventory/access/upload
 */
async function findStockId(sku) {
  const result = await neonDb.query('SELECT id FROM app.inventory WHERE id = $1 AND isblocked IS NOT TRUE', [isNaN(Number(sku)) ? sku : Number(sku)]);
  return result.rows[0];
}

/**
 * Find an access group by exact name.
 * @param {string} name - access group name
 * @returns {Promise<object|undefined>} row { id }, or undefined
 * @route Used by group-mapping helpers and bulk upload
 */
async function findAccessGroupId(name) {
  const result = await neonDb.query('SELECT id FROM app.access_groups WHERE name = $1', [name]);
  return result.rows[0];
}

/**
 * Upsert a stock -> access-group mapping (insert if missing, else update).
 * @param {object} input
 * @param {number} input.stockId - app.stock.id
 * @param {number} input.groupId - app.access_groups.id
 * @param {number} [input.qty] - quantity, clamped to >= 0
 * @param {number} [input.price] - group price
 * @param {string|null} [input.partnerSkuName]
 * @returns {Promise<'assigned'|'updated'>} whether a row was inserted or updated
 * @route Used by POST /api/admin/inventory/sku/:sku/access-group/:group, POST /api/admin/inventory/access/upload
 */
async function upsertStockGroupMapping({ stockId, groupId, qty, price, partnerSkuName }) {
  const existing = await neonDb.query(
    'SELECT id FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2',
    [stockId, groupId]
  );

  if (existing.rows.length > 0) {
    await neonDb.query(
      'UPDATE app.inventory_access_group SET quantity = GREATEST(0, $1), oprice = $2, partner_sku_name = $3 WHERE inventoryid = $4 AND accessgroupid = $5',
      [qty ?? 0, price ?? 0, partnerSkuName || null, stockId, groupId]
    );
    return 'updated';
  }
  await neonDb.query(
    'INSERT INTO app.inventory_access_group (inventoryid, accessgroupid, quantity, oprice, partner_sku_name) VALUES ($1, $2, GREATEST(0, $3), $4, $5)',
    [stockId, groupId, qty ?? 0, price ?? 0, partnerSkuName || null]
  );
  return 'assigned';
}

/**
 * Update an existing stock -> access-group mapping.
 * @param {object} input
 * @param {number} input.stockId
 * @param {number} input.groupId
 * @param {number} [input.qty] - clamped to >= 0
 * @param {number} [input.price]
 * @param {string|null} [input.partnerSkuName]
 * @returns {Promise<object|undefined>} updated row, or undefined when mapping missing
 * @route Used by PUT /api/admin/inventory/sku/:sku/access-group/:group
 */
async function updateStockGroupMapping({ stockId, groupId, qty, price, partnerSkuName }) {
  const result = await neonDb.query(
    'UPDATE app.inventory_access_group SET quantity = GREATEST(0, $1), oprice = $2, partner_sku_name = $3 WHERE inventoryid = $4 AND accessgroupid = $5 RETURNING *',
    [qty ?? 0, price ?? 0, partnerSkuName || null, stockId, groupId]
  );
  return result.rows[0];
}

/**
 * Update a stock's GST in app.inventory (used with group mapping updates).
 * @param {object} input
 * @param {number} input.stockId - app.stock.id
 * @param {number} input.gst
 * @returns {Promise<void>}
 * @route Used by PUT /api/admin/inventory/sku/:sku/access-group/:group (when gst provided)
 */
async function updateStockGst({ stockId, gst }) {
  await neonDb.query('UPDATE app.inventory SET gst = $1 WHERE id = $2', [gst, stockId]);
}

/**
 * Remove a stock -> access-group mapping.
 * @param {object} input
 * @param {number} input.stockId
 * @param {number} input.groupId
 * @returns {Promise<object|undefined>} deleted row, or undefined when mapping missing
 * @route Used by DELETE /api/admin/inventory/sku/:sku/access-group/:group
 */
async function removeStockGroupMapping({ stockId, groupId }) {
  const result = await neonDb.query(
    'DELETE FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2 RETURNING *',
    [stockId, groupId]
  );
  return result.rows[0];
}

/**
 * All stocks visible to an access group (by case-insensitive name) with the
 * group price and combined quantity.
 * @param {string} name - access group name
 * @returns {Promise<{group: object, rows: object[]}>} group { id, name } and stock rows
 * @route Used by GET /api/admin/inventory/access-group/:name
 */
async function getAccessGroupStocks(name) {
  const groupResult = await neonDb.query('SELECT id, name FROM app.access_groups WHERE TRIM(name) ILIKE TRIM($1)', [name]);
  const group = groupResult.rows[0];
  if (!group) return { group: null, rows: [] };

  const rows = await neonDb.query(`
    SELECT
      inv.id,
      CAST(inv.id AS TEXT) AS sku,
      COALESCE(inv.fullname, inv.stockname) AS name,
      COALESCE(inv.brand, '') AS brand,
      COALESCE(inv.model, '') AS model,
      COALESCE(inv.varient, '') AS variant,
      COALESCE(inv.color, '') AS color,
      COALESCE(inv.quantity, 0) + COALESCE(inv.vquantity, 0) + COALESCE(iag.quantity, 0) AS qty,
      iag.oprice AS price,
      inv.gst,
      '' AS hsn
    FROM app.inventory inv
    JOIN app.inventory_access_group iag ON iag.inventoryid = inv.id
    WHERE iag.accessgroupid = $1 AND inv.isblocked IS NOT TRUE
    ORDER BY COALESCE(inv.fullname, inv.stockname)
  `, [group.id]);

  return { group, rows: rows.rows };
}

// ===========================================================================
// API key management (/api/admin/api)
// ===========================================================================

/**
 * Best-effort ALTER TABLE that adds the newer columns to app.api.
 * @returns {Promise<void>} never throws (warnings swallowed)
 * @route Used by POST /api/admin/api
 */
async function ensureApiColumns() {
  try {
    await neonDb.query(`
      ALTER TABLE app.api
        ADD COLUMN IF NOT EXISTS key_name TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS access_group_id INTEGER,
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT 'never',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ
    `);
  } catch (err) {
    console.warn('[api] ensureColumns warning:', err.message);
  }
}

/**
 * Find an access group by exact name.
 * @param {string} name
 * @returns {Promise<object|undefined>} row { id }, or undefined
 * @route Used by POST /api/admin/api
 */
async function findAccessGroupByName(name) {
  const result = await neonDb.query('SELECT id FROM app.access_groups WHERE name = $1', [name]);
  return result.rows[0];
}

/**
 * Access group name for a given id.
 * @param {number} id - app.access_groups.id
 * @returns {Promise<object|undefined>} row { name }, or undefined
 * @route Used by POST /api/admin/api (response enrichment)
 */
async function getAccessGroupName(id) {
  const result = await neonDb.query('SELECT name FROM app.access_groups WHERE id = $1', [id]);
  return result.rows[0];
}

/**
 * Create an API key bound to an access group.
 * @param {object} input
 * @param {string} input.keyid - UUID
 * @param {string} input.key_name
 * @param {string} input.apiKey - `via.<hex>` secret
 * @param {number} input.accessGroupId
 * @param {number|null} input.userId - creator (admin user id)
 * @param {string[]} input.permissions
 * @param {string} input.duration - e.g. '1h' | '7d' | 'never'
 * @returns {Promise<object>} inserted row
 * @route Used by POST /api/admin/api
 */
async function createApiKey({ keyid, key_name, apiKey, accessGroupId, userId, permissions, duration }) {
  const result = await neonDb.query(
    `INSERT INTO app.api (keyid, key_name, key, access_group_id, user_id, permissions, duration, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, true, NOW(), NOW())
     RETURNING keyid, key_name, key, access_group_id, permissions, duration, is_active, created_at, last_used`,
    [keyid, key_name, apiKey, accessGroupId, userId, JSON.stringify(permissions || []), duration || 'never']
  );
  return result.rows[0];
}

/**
 * List API keys with optional filters, joined with access-group name.
 * @param {object} [input]
 * @param {number} [input.user_id] - owner filter (exact)
 * @param {string} [input.key_name] - name filter (ILIKE contains)
 * @returns {Promise<object[]>} keys ordered by created_at DESC
 * @route Used by GET /api/admin/api
 */
async function listApiKeys({ user_id, key_name }: any = {}) {
  let query = `SELECT k.keyid, k.key_name, k.key, k.access_group_id, k.permissions, k.duration,
                      k.is_active, k.created_at, k.last_used, g.name AS group_name
               FROM app.api k
               LEFT JOIN app.access_groups g ON g.id = k.access_group_id
               WHERE 1=1`;
  const params: any[] = [];
  let idx = 1;
  if (user_id) { query += ` AND k.user_id = $${idx++}`; params.push(user_id); }
  if (key_name) { query += ` AND k.key_name ILIKE $${idx++}`; params.push(`%${key_name}%`); }
  query += ' ORDER BY k.created_at DESC';
  const result = await neonDb.query(query, params);
  return result.rows;
}

/**
 * Update an API key's name and/or active status (used to revoke keys).
 * @param {object} input
 * @param {string} input.id - app.api.keyid
 * @param {string} [input.key_name]
 * @param {boolean} [input.is_active]
 * @returns {Promise<object|undefined>} row { keyid }, or undefined when not found
 * @route Used by PUT /api/admin/api
 */
async function updateApiKey({ id, key_name, is_active }) {
  const result = await neonDb.query(
    'UPDATE app.api SET key_name = COALESCE($1, key_name), is_active = COALESCE($2, is_active), updated_at = NOW() WHERE keyid = $3 RETURNING keyid',
    [key_name ?? null, is_active ?? null, id]
  );
  return result.rows[0];
}

/**
 * Delete an API key.
 * @param {string} id - app.api.keyid
 * @returns {Promise<object|undefined>} deleted row { keyid }, or undefined
 * @route Used by DELETE /api/admin/api
 */
async function deleteApiKey(id) {
  const result = await neonDb.query('DELETE FROM app.api WHERE keyid = $1 RETURNING keyid', [id]);
  return result.rows[0];
}

/**
 * All access groups (id + name) for dropdowns.
 * @returns {Promise<object[]>} rows [{ id, name }] ordered by name
 * @route Used by GET /api/admin/access-groups
 */
async function listAccessGroupOptions() {
  const result = await neonDb.query('SELECT id, name FROM app.access_groups ORDER BY name');
  return result.rows;
}

/**
 * Create an access group.
 * @param {string} name - trimmed group name
 * @returns {Promise<object>} inserted row { id, name }
 * @route Used by POST /api/admin/access-group
 */
async function createAccessGroup(name) {
  const result = await neonDb.query(
    'INSERT INTO app.access_groups (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id, name',
    [name]
  );
  return result.rows[0];
}

/**
 * Delete an access group plus cleanup of dependent rows (mappings, api keys, users).
 * @param {number} id - app.access_groups.id
 * @returns {Promise<void>} individual cleanup errors are swallowed
 * @route Used by DELETE /api/admin/access-group/:id
 */
async function deleteAccessGroup(id) {
  try { await neonDb.query('DELETE FROM app.inventory_access_group WHERE accessgroupid = $1', [id]); } catch (e) {
    console.warn('[api] cleanup inventory_access_group:', e.message);
  }
  try { await neonDb.query('UPDATE app.api SET access_group_id = NULL WHERE access_group_id = $1', [id]); } catch (e) {
    console.warn('[api] cleanup api:', e.message);
  }
  try { await neonDb.query('UPDATE app.users SET access_group_id = NULL WHERE access_group_id = $1', [id]); } catch (e) {
    console.warn('[api] cleanup users:', e.message);
  }
  await neonDb.query('DELETE FROM app.access_groups WHERE id = $1', [id]);
}

/**
 * API key usage counts from api_key_log.
 * @returns {Promise<{todayRequests: number, monthRequests: number}>}
 * @route Used by GET /api/admin/api/usage
 */
async function getApiUsage() {
  const todayResult = await neonDb.query(
    'SELECT COUNT(*)::int AS count FROM api_key_log WHERE created_at >= CURRENT_DATE'
  );
  const monthResult = await neonDb.query(
    "SELECT COUNT(*)::int AS count FROM api_key_log WHERE created_at >= date_trunc('month', CURRENT_DATE)"
  );
  return {
    todayRequests: todayResult.rows[0]?.count ?? 0,
    monthRequests: monthResult.rows[0]?.count ?? 0,
  };
}

// ===========================================================================
// Dashboard (/api/admin/dashboard)
// ===========================================================================

/**
 * Dashboard KPIs: today's sales/orders, yesterday's sales, top salesman, total stock value.
 * @returns {Promise<{today: object, yesterday: object, topSalesman: object|null, stockValue: number}>}
 * @route Used by GET /api/admin/dashboard/stats
 */
async function getDashboardStats() {
  const ts = await neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS total, COUNT(*) AS orders FROM app.sales_records WHERE sales_date = CURRENT_DATE");
  const ys = await neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS total FROM app.sales_records WHERE sales_date = CURRENT_DATE - 1");
  const sm = await neonDb.query("SELECT salesman AS name, SUM(bill_amt) AS amount FROM app.sales_records WHERE sales_date = CURRENT_DATE AND salesman IS NOT NULL AND salesman != '' GROUP BY salesman ORDER BY amount DESC LIMIT 1");
  const sv = await neonDb.query("SELECT COALESCE(SUM(quantity * price),0) AS total FROM app.inventory WHERE isblocked IS NOT TRUE");
  return {
    today: ts.rows[0],
    yesterday: ys.rows[0],
    topSalesman: sm.rows[0] || null,
    stockValue: parseFloat(sv.rows[0].total),
  };
}

/**
 * Top 5 salesmen by total bill amount.
 * @returns {Promise<object[]>} rows [{ name, sales }] ordered by sales DESC
 * @route Used by GET /api/admin/dashboard/top-salesmen
 */
async function getTopSalesmen() {
  const result = await neonDb.query("SELECT salesman AS name, SUM(bill_amt) AS sales FROM app.sales_records WHERE salesman IS NOT NULL AND salesman != '' GROUP BY salesman ORDER BY sales DESC LIMIT 5");
  return result.rows;
}

/**
 * Monthly sales for the last 12 months.
 * @returns {Promise<object[]>} rows [{ month, sales }] ordered by month
 * @route Used by GET /api/admin/dashboard/monthly-trend
 */
async function getDashboardMonthlyTrend() {
  const result = await neonDb.query("SELECT TO_CHAR(DATE_TRUNC('month', sales_date), 'Mon YYYY') AS month, SUM(bill_amt) AS sales FROM app.sales_records WHERE sales_date >= CURRENT_DATE - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', sales_date) ORDER BY DATE_TRUNC('month', sales_date)");
  return result.rows;
}

/**
 * Top 10 products by stock quantity (share chart data).
 * @returns {Promise<object[]>} rows [{ name, value }] ordered by quantity DESC
 * @route Used by GET /api/admin/dashboard/product-share
 */
async function getProductShare() {
  const result = await neonDb.query("SELECT COALESCE(fullname, stockname) AS name, COALESCE(quantity, 0) AS value FROM app.inventory WHERE isblocked IS NOT TRUE ORDER BY quantity DESC LIMIT 10");
  return result.rows;
}

// ===========================================================================
// Analytics (/api/admin/analytics)
// ===========================================================================

/**
 * Analytics KPIs from sales-type vouchers: all-time / current (2026) / previous (2025) rows.
 * @returns {Promise<{all: object, current: object, prev: object}>}
 * @route Used by GET /api/admin/analytics/stats
 */
async function getAnalyticsStats() {
  const all = await neonDb.query(
    `SELECT COUNT(*) AS total_orders,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS total_revenue
     FROM app.vouchers WHERE voucher_type ILIKE 'sales%'`
  );
  const current = await neonDb.query(
    `SELECT COUNT(*) AS orders,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS revenue
     FROM app.vouchers WHERE voucher_type ILIKE 'sales%' AND "date" >= '2026-01-01'`
  );
  const prev = await neonDb.query(
    `SELECT COUNT(*) AS orders,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS revenue
     FROM app.vouchers WHERE voucher_type ILIKE 'sales%'
      AND "date" >= '2025-01-01' AND "date" < '2026-01-01'`
  );
  return { all: all.rows[0], current: current.rows[0], prev: prev.rows[0] };
}

/**
 * Monthly sales voucher revenue for 2026.
 * @returns {Promise<object[]>} rows [{ month, sales, profit }] ordered by month
 * @route Used by GET /api/admin/analytics/monthly-trend
 */
async function getAnalyticsMonthlyTrend() {
  const result = await neonDb.query(
    `SELECT date_trunc('month', v."date") as month,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(v.ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS sales,
            COUNT(*) AS profit
     FROM app.vouchers v
     WHERE v.voucher_type ILIKE 'sales%' AND v."date" >= '2026-01-01'
     GROUP BY date_trunc('month', v."date")
     ORDER BY date_trunc('month', v."date")`
  );
  return result.rows;
}

/**
 * Top 10 sales voucher types by revenue.
 * @returns {Promise<object[]>} rows [{ name, count, total }] ordered by total DESC
 * @route Used by GET /api/admin/analytics/category-data
 */
async function getAnalyticsCategoryData() {
  const result = await neonDb.query(
    `SELECT v.voucher_type AS name,
            COUNT(*) AS count,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(v.ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS total
     FROM app.vouchers v
     WHERE v.voucher_type ILIKE 'sales%'
     GROUP BY v.voucher_type
     ORDER BY total DESC
     LIMIT 10`
  );
  return result.rows;
}

/**
 * Top 10 customers by spend on sales vouchers.
 * @returns {Promise<object[]>} rows [{ name, orders, spent }] ordered by spent DESC
 * @route Used by GET /api/admin/analytics/top-customers
 */
async function getAnalyticsTopCustomers() {
  const result = await neonDb.query(
    `SELECT v.party_ledger_name AS name,
            COUNT(*) AS orders,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(v.ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS spent
     FROM app.vouchers v
     WHERE v.voucher_type ILIKE 'sales%'
       AND v.party_ledger_name IS NOT NULL AND v.party_ledger_name != ''
     GROUP BY v.party_ledger_name
     ORDER BY spent DESC
     LIMIT 10`
  );
  return result.rows;
}

/**
 * Daily sales from sales vouchers over the last 90 days (Asia/Kolkata date).
 * @returns {Promise<object[]>} rows [{ day, sales, orders }] ordered by day
 * @route Used by GET /api/admin/analytics/daily-sales
 */
async function getAnalyticsDailySales() {
  const result = await neonDb.query(
    `SELECT (v."date" AT TIME ZONE 'Asia/Kolkata')::date as day,
            COALESCE(SUM((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(v.ledgerentries) e
                          WHERE (e->>'isDeemedPositive') = 'No')), 0) AS sales,
            COUNT(*) AS orders
     FROM app.vouchers v
     WHERE v.voucher_type ILIKE 'sales%'
       AND v."date" >= CURRENT_DATE - INTERVAL '90 days'
     GROUP BY (v."date" AT TIME ZONE 'Asia/Kolkata')::date
     ORDER BY (v."date" AT TIME ZONE 'Asia/Kolkata')::date`
  );
  return result.rows;
}

/**
 * Top 10 regions by sales since 2026-01-01 (region = parent, or 'Other').
 * @returns {Promise<object[]>} rows [{ region, sales }] ordered by sales DESC
 * @route Used by GET /api/admin/analytics/sales-by-region
 */
async function getAnalyticsSalesByRegion() {
  const result = await neonDb.query(
    `SELECT COALESCE(NULLIF(s.parent, ''), 'Other') AS region,
            SUM(s.bill_amt) AS sales
     FROM app.sales_records s
     WHERE s.sales_date >= '2026-01-01'
     GROUP BY region
     ORDER BY sales DESC
     LIMIT 10`
  );
  return result.rows;
}

/**
 * Monthly order counts split by voucher-type buckets since 2026-01-01.
 * @returns {Promise<object[]>} rows [{ month, direct, online, phone }] ordered by month
 * @route Used by GET /api/admin/analytics/orders-by-channel
 */
async function getAnalyticsOrdersByChannel() {
  const result = await neonDb.query(
    `SELECT date_trunc('month', v."date") as month,
            COUNT(*) FILTER (WHERE v.voucher_type ILIKE 'sales%') AS retail,
            COUNT(*) FILTER (WHERE v.voucher_type ILIKE 'receipt%') AS "direct",
            COUNT(*) FILTER (WHERE v.voucher_type ILIKE 'payment%') AS "online",
            COUNT(*) FILTER (WHERE v.voucher_type ILIKE 'purchase%') AS phone
     FROM app.vouchers v
     WHERE v."date" >= '2026-01-01'
     GROUP BY date_trunc('month', v."date")
     ORDER BY date_trunc('month', v."date")`
  );
  return result.rows;
}

// ===========================================================================
// Reports (/api/admin/reports)
// ===========================================================================

/**
 * Latest pre-computed P&L JSON data.
 * @returns {Promise<object|null>} app.profitloss.data row, or null when empty
 * @route Used by GET /api/admin/reports/pnl
 */
async function getPnlData() {
  const result = await neonDb.query('SELECT data FROM app.profitloss ORDER BY id DESC LIMIT 1');
  return result.rows[0]?.data ?? null;
}

/**
 * Save P&L data
 * @param {object} data - JSON payload of P&L
 */
async function savePnlData(data) {
  const result = await neonDb.query(
    'INSERT INTO app.profitloss (data) VALUES ($1) RETURNING *',
    [data]
  );
  return result.rows[0];
}

/**
 * Save monthly P&L data
 * @param {string} month - YYYY-MM
 * @param {object} data - JSON payload of P&L
 */
async function saveMonthlyPnlData(month, data) {
  await neonDb.query(
    `INSERT INTO app.profitloss_monthly (month, data) 
     VALUES ($1, $2) 
     ON CONFLICT (month) 
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [month, data]
  );
  return { month, data };
}

/**
 * Get historical monthly P&L data
 * @param {number} limit - number of months to fetch
 */
async function getMonthlyPnlData(limit = 12) {
  const result = await neonDb.query(
    'SELECT month, data FROM app.profitloss_monthly ORDER BY month DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

/**
 * Latest 200 vouchers for the outstanding (receivables/payables) report.
 * @returns {Promise<object[]>} voucher rows ordered by date DESC
 * @route Used by GET /api/admin/reports/outstanding
 */
async function getOutstandingVouchers() {
  const result = await neonDb.query(
    `SELECT id, date, voucher_type, voucher_number, narration, party_ledger_name,
            COALESCE((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
WHERE (e->>'isDeemedPositive') = 'No'), 0) AS amount
      FROM app.vouchers ORDER BY date DESC LIMIT 200`
  );
  return result.rows;
}

/**
 * Latest pre-computed balance sheet JSON data.
 * @returns {Promise<object|null>} app.balancesheet.data row, or null when empty
 * @route Used by GET /api/admin/reports/balance-sheet
 */
async function getBalanceSheetData() {
  const result = await neonDb.query('SELECT data FROM app.balancesheet ORDER BY id DESC LIMIT 1');
  return result.rows[0]?.data ?? null;
}

/**
 * Save pre-computed balance sheet JSON data.
 * @param {object} data
 * @returns {Promise<object>} inserted row
 * @route Used by POST /api/admin/reports/balance-sheet
 */
async function saveBalanceSheetData(data) {
  const result = await neonDb.query(
    'INSERT INTO app.balancesheet (data) VALUES ($1) RETURNING *',
    [data]
  );
  return result.rows[0];
}

/**
 * Daybook: vouchers in a date range plus their inventory entries and ledger entries.
 * @param {object} input
 * @param {string} input.from_date - YYYY-MM-DD (inclusive)
 * @param {string} input.to_date - YYYY-MM-DD (inclusive)
 * @returns {Promise<{voucherRows: object[], invMap: Record<string, object[]>, ledMap: Record<string, object[]>}>}
 *   invMap/ledMap keyed by voucher id string
 * @route Used by GET /api/admin/reports/daybook
 */
async function getDaybook({ from_date, to_date }) {
  const vouchers = await neonDb.query(
    `SELECT id, date, voucher_type, voucher_number, narration, party_ledger_name,
            billagentname,
            COALESCE((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                      WHERE (e->>'isDeemedPositive') = 'No'), 0) AS amount
     FROM app.vouchers
     WHERE date >= $1 AND date <= $2
     ORDER BY date DESC`,
    [from_date, to_date]
  );

  const invQuery = await neonDb.query(
    `SELECT v.id::int AS vid,
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'item', e->>'stockItemName',
                  'qty', CAST(SPLIT_PART(COALESCE(e->>'billedQty', '0'), ' ', 1) AS numeric),
                  'unit', COALESCE(NULLIF(SPLIT_PART(COALESCE(e->>'billedQty', ''), ' ', 2), ''), ''),
                  'rate', CAST(SPLIT_PART(COALESCE(e->>'rate', '0'), '/', 1) AS numeric),
                  'amount', CAST(COALESCE(e->>'amount', '0') AS numeric),
                  'description', e->>'description',
                  'serialNo', COALESCE(e->>'serialNo', '[]')
                )
              ) FILTER (WHERE e->>'stockItemName' IS NOT NULL), '[]'::jsonb
            ) AS invEntries
     FROM app.vouchers v
     LEFT JOIN LATERAL jsonb_array_elements(v.inventoryentries) e ON true
     WHERE v.date >= $1 AND v.date <= $2
     GROUP BY v.id`,
    [from_date, to_date]
  );

  const invMap = {};
  for (const row of invQuery.rows) {
    invMap[String(row.vid)] = row.inventries || [];
  }

  const ledQuery = await neonDb.query(
    `SELECT v.id::int AS vid,
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'ledgerName', e->>'ledgerName',
                  'amount', CAST(COALESCE(e->>'amount', '0') AS numeric),
                  'isDeemedPositive', e->>'isDeemedPositive',
                  'description', e->>'description'
                )
              ), '[]'::jsonb
            ) AS ledEntries
     FROM app.vouchers v
     LEFT JOIN LATERAL jsonb_array_elements(v.ledgerentries) e ON true
     WHERE v.date >= $1 AND v.date <= $2
     GROUP BY v.id`,
    [from_date, to_date]
  );

  const ledMap = {};
  for (const row of ledQuery.rows) {
    ledMap[String(row.vid)] = row.ledentries || [];
  }

  return { voucherRows: vouchers.rows, invMap, ledMap };
}

// ===========================================================================
// Market (/api/admin/market)
// ===========================================================================

/**
 * Market overview aggregates: 30/60-day sales, today/yesterday volume, top products,
 * stock count, region data.
 * @returns {Promise<object>} raw aggregates from six queries
 * @route Used by GET /api/admin/market
 */
async function getMarketOverview() {
  const [now30, prev30, todaySales, yesterdaySales, topProducts, stockCount, regionData] = await Promise.all([
    neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS total, COUNT(*) AS orders FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 30"),
    neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS total FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 60 AND sales_date < CURRENT_DATE - 30"),
    neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS vol FROM app.sales_records WHERE sales_date = CURRENT_DATE"),
    neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS vol FROM app.sales_records WHERE sales_date = CURRENT_DATE - 1"),
    neonDb.query("SELECT COALESCE(fullname, stockname) AS stockname, quantity, price, (COALESCE(quantity,0) * COALESCE(price,0)) AS total_value FROM app.inventory WHERE isblocked IS NOT TRUE ORDER BY total_value DESC LIMIT 10"),
    neonDb.query("SELECT COUNT(*) AS cnt FROM app.inventory WHERE isblocked IS NOT TRUE"),
    neonDb.query("SELECT COALESCE(NULLIF(parent, ''), 'Other') AS region, SUM(bill_amt) AS sales FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 30 GROUP BY region ORDER BY sales DESC LIMIT 5"),
  ]);
  return { now30, prev30, todaySales, yesterdaySales, topProducts, stockCount, regionData };
}

/**
 * Daily sales for the last 30 days.
 * @returns {Promise<object[]>} rows [{ day, sales, orders }] ordered by day
 * @route Used by GET /api/admin/market/sales-trend
 */
async function getMarketSalesTrend() {
  const result = await neonDb.query(
    "SELECT sales_date::text AS day, SUM(bill_amt) AS sales, COUNT(*) AS orders FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 30 GROUP BY sales_date ORDER BY sales_date"
  );
  return result.rows;
}

/**
 * Top 10 products by stock value (share chart data).
 * @returns {Promise<object[]>} rows [{ name, quantity, price, total }] ordered by total DESC
 * @route Used by GET /api/admin/market/category-data
 */
async function getMarketCategoryData() {
  const result = await neonDb.query(
    "SELECT COALESCE(fullname, stockname) AS stockname, quantity, price, (COALESCE(quantity,0) * COALESCE(price,0)) AS total FROM app.inventory WHERE isblocked IS NOT TRUE ORDER BY total DESC LIMIT 10"
  );
  return result.rows;
}

/**
 * Daily sales for the last 84 days (raw input for weekly candlesticks).
 * @returns {Promise<object[]>} rows [{ date, sales }] ordered by date
 * @route Used by GET /api/admin/market/candlestick
 */
async function getMarketCandlestick() {
  const result = await neonDb.query(
    "SELECT sales_date, SUM(bill_amt) AS sales FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 84 GROUP BY sales_date ORDER BY sales_date"
  );
  return result.rows;
}

// ===========================================================================
// Partner management (/api/admin/partner)
// ===========================================================================

/**
 * List all partner users.
 * @returns {Promise<object[]>} rows [{ id, email, user_type, created_at, updated_at }]
 * @route Used by GET /api/admin/partner
 */
async function listPartners() {
  const result = await neonDb.query(
    'SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE user_type = $1',
    ['partner']
  );
  return result.rows;
}

/**
 * Partner user + profile by id.
 * @param {number} id - app.users.id
 * @returns {Promise<{user: object, profile: object|undefined}>}
 * @route Used by GET /api/admin/partner/:id
 */
async function getPartnerById(id) {
  const result = await neonDb.query(
    'SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1 AND user_type = $2',
    [id, 'partner']
  );
  const profile = await shared.findPartnerProfile(id);
  return { user: result.rows[0], profile };
}

/**
 * Update a partner's email.
 * @param {object} input
 * @param {number} input.id - app.users.id
 * @param {string} input.email
 * @returns {Promise<object|undefined>} updated row { id, email, user_type }, or undefined
 * @route Used by PUT /api/admin/partner/:id
 */
async function updatePartnerUserEmail({ id, email }) {
  const result = await neonDb.query(
    'UPDATE app.users SET email = $1, updated_at = NOW() WHERE id = $2 AND user_type = $3 RETURNING id, email, user_type',
    [email, id, 'partner']
  );
  return result.rows[0];
}

/**
 * Delete a partner user.
 * @param {number} id - app.users.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined
 * @route Used by DELETE /api/admin/partner/:id
 */
async function deletePartnerById(id) {
  const result = await neonDb.query(
    'DELETE FROM app.users WHERE id = $1 AND user_type = $2 RETURNING id',
    [id, 'partner']
  );
  return result.rows[0];
}

// ===========================================================================
// Employee management (/api/admin/employee)
// ===========================================================================

/**
 * List all employee users.
 * @returns {Promise<object[]>} rows [{ id, email, user_type, created_at, updated_at }]
 * @route Used by GET /api/admin/employee
 */
async function listEmployees() {
  const result = await neonDb.query(
    'SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE user_type = $1',
    ['employee']
  );
  return result.rows;
}

/**
 * Employee user + profile by id.
 * @param {number} id - app.users.id
 * @returns {Promise<{user: object, profile: object|undefined}>}
 * @route Used by GET /api/admin/employee/:id
 */
async function getEmployeeById(id) {
  const result = await neonDb.query(
    'SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1 AND user_type = $2',
    [id, 'employee']
  );
  const profile = await shared.findEmployeeProfile(id);
  return { user: result.rows[0], profile };
}

/**
 * Update an employee's email.
 * @param {object} input
 * @param {number} input.id - app.users.id
 * @param {string} input.email
 * @returns {Promise<object|undefined>} updated row { id, email, user_type }, or undefined
 * @route Used by PUT /api/admin/employee/:id
 */
async function updateEmployeeUserEmail({ id, email }) {
  const result = await neonDb.query(
    'UPDATE app.users SET email = $1, updated_at = NOW() WHERE id = $2 AND user_type = $3 RETURNING id, email, user_type',
    [email, id, 'employee']
  );
  return result.rows[0];
}

/**
 * Delete an employee user.
 * @param {number} id - app.users.id
 * @returns {Promise<object|undefined>} deleted row { id }, or undefined
 * @route Used by DELETE /api/admin/employee/:id
 */
async function deleteEmployeeById(id) {
  const result = await neonDb.query(
    'DELETE FROM app.users WHERE id = $1 AND user_type = $2 RETURNING id',
    [id, 'employee']
  );
  return result.rows[0];
}

// ===========================================================================
// Settings (/api/admin/settings)
// ===========================================================================

/**
 * Recent users (up to 10) for the settings page.
 * @returns {Promise<object[]>} rows [{ id, email, user_type, created_at }]
 * @route Used by GET /api/admin/settings/settings
 */
async function listRecentUsers() {
  const result = await neonDb.query('SELECT id, email, user_type, created_at FROM app.users ORDER BY created_at DESC LIMIT 10');
  return result.rows;
}

/**
 * User counts grouped by user_type (settings controls).
 * @returns {Promise<object[]>} rows [{ category, items }]
 * @route Used by GET /api/admin/settings/controls
 */
async function countUsersByType() {
  const result = await neonDb.query('SELECT user_type AS category, COUNT(*) AS items FROM app.users GROUP BY user_type');
  return result.rows;
}

/**
 * A single user's profile row.
 * @param {number} id - app.users.id (the authenticated admin)
 * @returns {Promise<object|undefined>} row { id, email, user_type, created_at, updated_at }
 * @route Used by GET /api/admin/settings/profile
 */
async function getUserProfileById(id) {
  const result = await neonDb.query('SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1', [id]);
  return result.rows[0];
}

/**
 * Public-schema table names (sync history source).
 * @returns {Promise<object[]>} rows [{ tablename }]
 * @route Used by GET /api/admin/settings/sync
 */
async function listPublicTables() {
  const result = await neonDb.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  return result.rows;
}

// ===========================================================================
// Masters & salesman (/api/admin/masters, /api/admin/salesman, /salesman-chart)
// ===========================================================================

/**
 * Record counts per master table (stock, ledger, voucher, godown).
 * @returns {Promise<object[]>} rows [{ id, name, records }]
 * @route Used by GET /api/admin/masters
 */
async function getMasterCounts() {
  const [stock, ledger, voucher, godown] = await Promise.all([
    neonDb.query("SELECT COUNT(*) FROM app.inventory WHERE isblocked IS NOT TRUE"),
    neonDb.query("SELECT COUNT(*) FROM app.ledger"),
    neonDb.query("SELECT COUNT(*) FROM app.vouchers"),
    neonDb.query("SELECT COUNT(*) FROM godowns"),
  ]);
  return [
    { id: 'stock', name: 'Stock Items', records: parseInt(stock.rows[0].count) },
    { id: 'ledger', name: 'Ledgers', records: parseInt(ledger.rows[0].count) },
    { id: 'voucher', name: 'Vouchers', records: parseInt(voucher.rows[0].count) },
    { id: 'godown', name: 'Godowns', records: parseInt(godown.rows[0].count) },
  ];
}

/**
 * Salesman leaderboard: order count + total sales per salesman.
 * @returns {Promise<object[]>} rows [{ id, name, orders, sales }] ordered by order count DESC
 * @route Used by GET /api/admin/salesman
 */
async function listSalesmen() {
  const result = await neonDb.query(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS id,
      salesman AS name,
      COUNT(*)::integer AS orders,
      COALESCE(SUM(bill_amt), 0) AS sales
    FROM app.sales_records
    WHERE salesman IS NOT NULL AND salesman != ''
    GROUP BY salesman
    ORDER BY COUNT(*) DESC
  `);
  return result.rows;
}

/**
 * Daily sales per salesman (for charting).
 * @returns {Promise<object[]>} rows [{ date, name, sales }] ordered by date
 * @route Used by GET /api/admin/salesman-chart
 */
async function listSalesmanChart() {
  const result = await neonDb.query(`
    SELECT sales_date, salesman, SUM(bill_amt) AS sales
    FROM app.sales_records
    WHERE salesman IS NOT NULL AND salesman != ''
    GROUP BY sales_date, salesman
    ORDER BY sales_date
  `);
  return result.rows;
}

module.exports = {
  ...shared,
  loginUser,
  createAccessControlUser,
  ensureUserColumns,
  listAccessControlUsers,
  updateAccessControlUser,
  deleteAccessControlUser,
  listStockItemsAdmin,
  createStockItemLegacy,
  listStockItemsLegacy,
  listDistinctBrands,
  listDistinctGroups,
  listInventoryStock,
  listInventorySku,
  migratePartnerSku,
  ensureInventoryUnification,
  getInventoryControl,
  getStockDetail,
  saveStockDetail,
  getAccessGroupDetail,
  findStockId,
  findAccessGroupId,
  upsertStockGroupMapping,
  updateStockGroupMapping,
  updateStockGst,
  removeStockGroupMapping,
  getAccessGroupStocks,
  ensureApiColumns,
  findAccessGroupByName,
  getAccessGroupName,
  createApiKey,
  listApiKeys,
  updateApiKey,
  deleteApiKey,
  listAccessGroupOptions,
  createAccessGroup,
  deleteAccessGroup,
  getApiUsage,
  getDashboardStats,
  getTopSalesmen,
  getDashboardMonthlyTrend,
  getProductShare,
  getAnalyticsStats,
  getAnalyticsMonthlyTrend,
  getAnalyticsCategoryData,
  getAnalyticsTopCustomers,
  getAnalyticsDailySales,
  getAnalyticsSalesByRegion,
  getAnalyticsOrdersByChannel,
  getPnlData,
  savePnlData,
  saveMonthlyPnlData,
  getMonthlyPnlData,
  getBalanceSheetData,
  saveBalanceSheetData,
  getOutstandingVouchers,
  getDaybook,
  getMarketOverview,
  getMarketSalesTrend,
  getMarketCategoryData,
  getMarketCandlestick,
  listPartners,
  getPartnerById,
  updatePartnerUserEmail,
  deletePartnerById,
  listEmployees,
  getEmployeeById,
  updateEmployeeUserEmail,
  deleteEmployeeById,
  listRecentUsers,
  countUsersByType,
  getUserProfileById,
  listPublicTables,
  getMasterCounts,
  listSalesmen,
  listSalesmanChart,
};
