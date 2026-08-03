/**
 * Admin Stock Item Routes
 *
 * Handles CRUD operations for stock items
 * All routes require admin authentication via adminAuth middleware
 */

const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

// Create a new stock item
router.post('/stockitem', async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const result = await neonDb.query(
      'INSERT INTO app.stock (stockname, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [name, quantity, price]
    );
    res.status(201).json({ message: 'Stock item created', data: result.rows[0] });
  } catch (err) {
    console.error('[stockitem] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all stock items with optional filtering
router.get('/stockitem', async (req, res) => {
  try {
    const { name, sku } = req.query;
    let query = 'SELECT * FROM app.stock WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    if (sku) { query += ` AND sku = $${idx++}`; params.push(sku); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Stock items fetched', data: result.rows });
  } catch (err) {
    console.error('[stockitem] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a stock item by ID
router.put('/stockitem', async (req, res) => {
  try {
    const { id, name, quantity, price } = req.body;
    const result = await neonDb.query(
      'UPDATE app.stock SET stockname = $1, quantity = $2, price = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, quantity, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item updated', data: result.rows[0] });
  } catch (err) {
    console.error('[stockitem] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a stock item by ID
router.delete('/stockitem', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.stock WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[stockitem] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Fetch all distinct brands
router.get('/inventory/brands', async (req, res) => {
  try {
    const result = await neonDb.query('SELECT DISTINCT brand FROM app.inventory WHERE brand IS NOT NULL AND brand != \'\' ORDER BY brand');
    const brands = result.rows.map(r => r.brand);
    res.json({ data: brands });
  } catch (err) {
    console.error('[stockitem] GET /inventory/brands error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Paginated stock endpoint for admin/inventory/stock
router.get('/inventory/stock', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search || '';
    const brand = req.query.brand || '';

    const joinClause = 'LEFT JOIN app.inventory inv ON inv.id = s.id';

    let countQuery = `SELECT COUNT(*) FROM app.stock s ${joinClause} WHERE 1=1`;
    let dataQuery = `SELECT s.*, inv.fullname, inv.brand, inv.model, inv.varient, inv.color, inv.gst,inv.price AS inv_price FROM app.stock s ${joinClause} WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (search) {
      const clause = ` AND (s.stockname ILIKE $${idx} OR inv.brand ILIKE $${idx} OR inv.model ILIKE $${idx} OR inv.fullname ILIKE $${idx})`;
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

    const countResult = await neonDb.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ` ORDER BY s.id DESC LIMIT $${idx} OFFSET $${idx + 1}`;

    params.push(limit, offset);

    const dataResult = await neonDb.query(dataQuery, params);

    const rows = dataResult.rows.map(r => ({
      id: r.id,
      name: r.fullname || r.stockname,
      brand: r.brand || '',
      model: r.model || '',
      variant: r.varient || '',
      color: r.color || '',
      qty: r.quantity || 0,
      price: parseFloat(r.inv_price) || 0,
      gst: r.gst || 0,
      min: r.min_stock || r.min || 0,
      max: r.max_stock || r.max || 0,
    }));

    res.json({ rows, total, limit, offset });
  } catch (err) {
    console.error('[stockitem] GET /inventory/stock error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// SKU listing endpoint for inventory management
router.get('/inventory/sku', async (req, res) => {
  try {
    const brandFilter = req.query.brand as string;
    let hasInvTable = false;
    try {
      const schemaCheck = await neonDb.query("SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='inventory' AND column_name IN ('brand','model')");
      hasInvTable = schemaCheck.rows.length === 2;
    } catch {}
    
    let sql = '';
    let params: any[] = [];
    
    if (hasInvTable) {
      let whereClause = '';
      if (brandFilter && brandFilter !== 'all') {
        whereClause = 'WHERE inv.brand ILIKE $1';
        params.push(`%${brandFilter}%`);
      }
      sql = `
          SELECT s.id, s.stockname AS name, CAST(s.id AS TEXT) AS sku, s.quantity AS qty, s.price,
                 COALESCE(inv.brand,'') AS brand,
                 COALESCE(inv.model,'') AS model,
                 COALESCE(
                   json_agg(
                     json_build_object('group', g.name, 'qty', iag.quantity, 'price', iag.oprice, 'partnerSkuName', iag.partner_sku_name)
                     ORDER BY g.name
                   ) FILTER (WHERE g.id IS NOT NULL),
                   '[]'
                 ) AS accessGroups
          FROM app.stock s
          LEFT JOIN app.inventory inv ON inv.id = s.id
          LEFT JOIN app.inventory_access_group iag ON iag.inventoryid = s.id
          LEFT JOIN app.access_groups g ON g.id = iag.accessgroupid
          ${whereClause}
          GROUP BY s.id, s.stockname, s.quantity, s.price, inv.brand, inv.model
          ORDER BY s.id DESC
        `;
    } else {
      sql = `
          SELECT s.id, s.stockname AS name, CAST(s.id AS TEXT) AS sku, s.quantity AS qty, s.price,
                 '' AS brand,
                 '' AS model,
                 COALESCE(
                   json_agg(
                     json_build_object('group', g.name, 'qty', iag.quantity, 'price', iag.oprice, 'partnerSkuName', iag.partner_sku_name)
                     ORDER BY g.name
                   ) FILTER (WHERE g.id IS NOT NULL),
                   '[]'
                 ) AS accessGroups
          FROM app.stock s
          LEFT JOIN app.inventory_access_group iag ON iag.inventoryid = s.id
          LEFT JOIN app.access_groups g ON g.id = iag.accessgroupid
          GROUP BY s.id, s.stockname, s.quantity, s.price
          ORDER BY s.id DESC
        `;
    }
    const result = await neonDb.query(sql, params);
    res.json(result.rows.map(r => ({ ...r, status: 'active' })));
  } catch (err) {
    console.error('[stockitem] GET /inventory/sku error:', err);
    res.json([]);
  }
});

router.get('/migrate-partner-sku', async (req, res) => {
  try {
    await neonDb.query(`
      ALTER TABLE app.inventory_access_group 
      ADD COLUMN IF NOT EXISTS partner_sku_name VARCHAR(255);
    `);
    res.json({ message: 'Migration successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Control settings overview
router.get('/inventory/control', async (req, res) => {
  try {
    const countResult = await neonDb.query("SELECT COUNT(*) AS items FROM app.stock");
    const groupsResult = await neonDb.query('SELECT id, name, created_at FROM app.access_groups ORDER BY name');
    const totalItems = parseInt(countResult.rows[0].items);
    const accessGroups = groupsResult.rows.map(r => ({
      id: r.id,
      name: r.name,
      group_key: `grp_${r.id}`,
      permissions: ['view', 'edit', 'order'],
      status: 'Active',
    }));
    res.json({
      totalItems,
      categories: [],
      controlSettings: [],
      groupSettings: accessGroups.map(g => ({
        group: g.name,
        maxQty: 0,
        allowDiscount: true,
        autoApprove: false,
        active: true,
        accessibleStockCount: 0,
      })),
      accessGroups,
    });
  } catch {
    res.json({ totalItems: 0, categories: [], controlSettings: [], groupSettings: [], accessGroups: [] });
  }
});

// Single stock item detail
router.get('/inventory/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query('SELECT * FROM app.inventory WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    const r = result.rows[0];
    res.json({
      id: r.id, name: r.fullname || r.stockname || '', brand: r.brand || '', model: r.model || '', variant: r.varient || '', color: r.color || '',
      qty: r.quantity || 0, price: parseFloat(r.price) || 0, gst: r.gst || 0,
      min: r.min_stock || r.min || 0, max: r.max_stock || r.max || 0, description: '', details: '', tags: '', url: '', id_no: '',
    });
  } catch (err) {
    console.error('[stockitem] GET /inventory/stock/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Save stock item detail (used by admin/inventory/stock/:id save form)
router.post('/inventory/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, model, variant, color, qty, price, gst, min, max, description, details, tags, url, id_no } = req.body;

    const inventoryResult = await neonDb.query(
      `UPDATE app.inventory
       SET fullname = $1, brand = $2, model = $3, varient = $4, color = $5,
           quantity = $6, price = $7, gst = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, brand, model, variant, color, qty, price, gst, id]
    );

    await neonDb.query(
      `UPDATE app.stock
       SET stockname = $1, quantity = $2, price = $3, updated_at = NOW()
       WHERE id = $4`,
      [name, qty, price, id]
    );

    const r = inventoryResult.rows[0];
    if (!r) return res.status(404).json({ message: 'Stock item not found' });

    res.json({
      id: r.id, name: r.fullname, brand: r.brand || '', model: r.model || '', variant: r.varient || '', color: r.color || '',
      qty: r.quantity || 0, price: parseFloat(r.price) || 0, gst: r.gst || 0,
      min: min || 0, max: max || 0, description: description || '', details: details || '', tags: tags || '', url: url || '', id_no: id_no || '',
    });
  } catch (err) {
    console.error('[stockitem] POST /inventory/stock/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Access group detail — returns stock info, group pricing, all group stocks, all stock groups
router.get('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const stockId = isNaN(Number(sku)) ? sku : Number(sku);
    const item = await neonDb.query("SELECT id, stockname AS name, CAST(id AS TEXT) AS sku, quantity AS qty, price FROM app.stock WHERE id = $1", [stockId]);
    if (item.rows.length === 0) return res.status(404).json({ message: 'SKU not found' });
    const r = item.rows[0];

    const groupRow = await neonDb.query('SELECT id, name FROM app.access_groups WHERE name = $1', [group]);
    let accessGroupData = { group, qty: r.qty || 0, price: parseFloat(r.price) || 0 };

    if (groupRow.rows.length > 0) {
      const ag = groupRow.rows[0];
      const ia = await neonDb.query(
        'SELECT quantity, oprice FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2',
        [r.id, ag.id]
      );
      if (ia.rows.length > 0) {
        accessGroupData = {
          group,
          qty: parseInt(ia.rows[0].quantity) || 0,
          price: parseFloat(ia.rows[0].oprice) || 0,
        };
      }
    }

    // All access groups for this stock
    const allAg = await neonDb.query(`
      SELECT g.name AS group, iag.quantity AS qty, iag.oprice AS price
      FROM app.inventory_access_group iag
      JOIN app.access_groups g ON g.id = iag.accessgroupid
      WHERE iag.inventoryid = $1 ORDER BY g.name
    `, [r.id]);

    // All stocks this access group sees
    const groupStocks = await neonDb.query(`
      SELECT s.id, s.stockname AS name, COALESCE(inv.brand,'') AS brand, COALESCE(inv.model,'') AS model,
             iag.quantity AS qty, iag.oprice AS price
      FROM app.stock s
      JOIN app.inventory_access_group iag ON iag.inventoryid = s.id
      LEFT JOIN app.inventory inv ON inv.id = iag.inventoryid
      WHERE iag.accessgroupid = $1
      ORDER BY s.stockname
    `, [groupRow.rows.length > 0 ? groupRow.rows[0].id : 0]);

    res.json({
      item: {
        sku: r.sku || String(r.id),
        name: r.name,
        brand: '',
        status: 'active',
        accessGroups: allAg.rows.map(a => ({ group: a.group, qty: parseInt(a.qty) || 0, price: parseFloat(a.price) || 0 })),
      },
      accessGroup: accessGroupData,
      privileges: ['view', 'order'],
      groupStocks: groupStocks.rows.map(s => ({ sku: String(s.id), name: s.name, brand: s.brand, qty: parseInt(s.qty) || 0, price: parseFloat(s.price) || 0 })),
      stockConfig: { maxQty: 100, allowDiscount: true, autoApprove: false, notes: '' },
    });
  } catch (err) {
    console.error('[stockitem] GET access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /inventory/sku/:sku/access-group/:group — Assign stock to access group (upsert)
router.post('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const { qty, price, partnerSkuName } = req.body;

    const stock = await neonDb.query('SELECT id FROM app.stock WHERE id = $1', [isNaN(Number(sku)) ? sku : Number(sku)]);
    if (stock.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    const stockId = stock.rows[0].id;

    const groupRow = await neonDb.query('SELECT id FROM app.access_groups WHERE name = $1', [group]);
    if (groupRow.rows.length === 0) return res.status(404).json({ message: 'Access group not found' });
    const groupId = groupRow.rows[0].id;

    const existing = await neonDb.query(
      'SELECT id FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2',
      [stockId, groupId]
    );

    if (existing.rows.length > 0) {
      await neonDb.query(
        'UPDATE app.inventory_access_group SET quantity = GREATEST(0, $1), oprice = $2, partner_sku_name = $3 WHERE inventoryid = $4 AND accessgroupid = $5',
        [qty ?? 0, price ?? 0, partnerSkuName || null, stockId, groupId]
      );
      res.json({ message: 'Stock access updated' });
    } else {
      await neonDb.query(
        'INSERT INTO app.inventory_access_group (inventoryid, accessgroupid, quantity, oprice, partner_sku_name) VALUES ($1, $2, GREATEST(0, $3), $4, $5)',
        [stockId, groupId, qty ?? 0, price ?? 0, partnerSkuName || null]
      );
      res.status(201).json({ message: 'Stock assigned to access group' });
    }
  } catch (err) {
    console.error('[stockitem] POST access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /inventory/sku/:sku/access-group/:group — Update stock access qty/price/gst
router.put('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const { qty, price, gst, partnerSkuName } = req.body;

    const stock = await neonDb.query('SELECT id FROM app.stock WHERE id = $1', [isNaN(Number(sku)) ? sku : Number(sku)]);
    if (stock.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    const stockId = stock.rows[0].id;

    const groupRow = await neonDb.query('SELECT id FROM app.access_groups WHERE name = $1', [group]);
    if (groupRow.rows.length === 0) return res.status(404).json({ message: 'Access group not found' });
    const groupId = groupRow.rows[0].id;

    const result = await neonDb.query(
      'UPDATE app.inventory_access_group SET quantity = GREATEST(0, $1), oprice = $2, partner_sku_name = $3 WHERE inventoryid = $4 AND accessgroupid = $5 RETURNING *',
      [qty ?? 0, price ?? 0, partnerSkuName || null, stockId, groupId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Mapping not found' });

    if (gst !== undefined) {
      await neonDb.query('UPDATE app.inventory SET gst = $1 WHERE id = $2', [gst, stockId]);
    }

    res.json({ message: 'Stock access updated' });
  } catch (err) {
    console.error('[stockitem] PUT access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /inventory/sku/:sku/access-group/:group — Remove stock from access group
router.delete('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;

    const stock = await neonDb.query('SELECT id FROM app.stock WHERE id = $1', [isNaN(Number(sku)) ? sku : Number(sku)]);
    if (stock.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    const stockId = stock.rows[0].id;

    const groupRow = await neonDb.query('SELECT id FROM app.access_groups WHERE name = $1', [group]);
    if (groupRow.rows.length === 0) return res.status(404).json({ message: 'Access group not found' });
    const groupId = groupRow.rows[0].id;

    const result = await neonDb.query(
      'DELETE FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2 RETURNING *',
      [stockId, groupId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Mapping not found' });
    res.json({ message: 'Stock access removed' });
  } catch (err) {
    console.error('[stockitem] DELETE access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /inventory/access-group/:name — All stocks with group-specific price/qty
router.get('/inventory/access-group/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const groupRow = await neonDb.query('SELECT id, name FROM app.access_groups WHERE TRIM(name) ILIKE TRIM($1)', [name]);
    if (groupRow.rows.length === 0) {
      console.warn('[stockitem] access-group not found for:', JSON.stringify(name));
      return res.status(404).json({ message: `Access group "${name}" not found` });
    }
    const group = groupRow.rows[0];

    const rows = await neonDb.query(`
      SELECT
        s.id,
        CAST(s.id AS TEXT) AS sku,
        s.stockname AS name,
        COALESCE(inv.brand, '') AS brand,
        COALESCE(inv.model, '') AS model,
        COALESCE(inv.varient, '') AS variant,
        COALESCE(inv.color, '') AS color,
        COALESCE(inv.quantity, 0) + COALESCE(inv.vquantity, 0) + COALESCE(iag.quantity, 0) AS qty,
        iag.oprice AS price,
        inv.gst,
        '' AS hsn
      FROM app.stock s
      JOIN app.inventory_access_group iag ON iag.inventoryid = s.id
      LEFT JOIN app.inventory inv ON inv.id = iag.inventoryid
      WHERE iag.accessgroupid = $1
      ORDER BY s.stockname
    `, [group.id]);

    res.json({ group, items: rows.rows });
  } catch (err) {
    console.error('[stockitem] GET access-group stocks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /inventory/access/upload — Bulk upload access group mappings (Excel/CSV)
router.post('/inventory/access/upload', async (req, res) => {
  try {
    const { rows } = req.body; // Expects an array of { skuId, accessGroup, partnerSkuName, qty, price }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty rows array provided' });
    }

    let successCount = 0;
    const errors = [];

    for (const row of rows) {
      try {
        const stock = await neonDb.query('SELECT id FROM app.stock WHERE id = $1', [isNaN(Number(row.skuId)) ? row.skuId : Number(row.skuId)]);
        if (stock.rows.length === 0) {
          errors.push(\`Row SKU \${row.skuId}: Stock item not found\`);
          continue;
        }
        const stockId = stock.rows[0].id;

        const groupRow = await neonDb.query('SELECT id FROM app.access_groups WHERE name = $1', [row.accessGroup]);
        if (groupRow.rows.length === 0) {
          errors.push(\`Row SKU \${row.skuId}: Access group '\${row.accessGroup}' not found\`);
          continue;
        }
        const groupId = groupRow.rows[0].id;

        const existing = await neonDb.query(
          'SELECT id FROM app.inventory_access_group WHERE inventoryid = $1 AND accessgroupid = $2',
          [stockId, groupId]
        );

        if (existing.rows.length > 0) {
          await neonDb.query(
            'UPDATE app.inventory_access_group SET quantity = GREATEST(0, $1), oprice = $2, partner_sku_name = $3 WHERE inventoryid = $4 AND accessgroupid = $5',
            [row.qty ?? 0, row.price ?? 0, row.partnerSkuName || null, stockId, groupId]
          );
        } else {
          await neonDb.query(
            'INSERT INTO app.inventory_access_group (inventoryid, accessgroupid, quantity, oprice, partner_sku_name) VALUES ($1, $2, GREATEST(0, $3), $4, $5)',
            [stockId, groupId, row.qty ?? 0, row.price ?? 0, row.partnerSkuName || null]
          );
        }
        successCount++;
      } catch (err) {
        errors.push(\`Row SKU \${row.skuId}: \${err.message}\`);
      }
    }

    res.json({ message: \`Successfully processed \${successCount} rows\`, errors });
  } catch (err) {
    console.error('[stockitem] POST /inventory/access/upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
