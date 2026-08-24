/**
 * Admin Stock Item Routes
 *
 * Handles CRUD operations for stock items
 * All routes require admin authentication via adminAuth middleware
 */

const express = require('express');
const adminAuth = require('../../middleware/adminAuth');
const { admin: dbq } = require('../../config/dbqueries');

const router = express.Router();

router.use(adminAuth);

/**
 * POST /api/admin/stockitem
 *
 * Create a stock item.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { name, quantity?, price? }
 * Returns:
 *   201 { message: 'Stock item created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (stock CRUD goes through /api/admin/stock-item).
 */
router.post('/stockitem', async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const data = await dbq.createStockItemLegacy({ name, quantity, price });
    res.status(201).json({ message: 'Stock item created', data });
  } catch (err) {
    console.error('[stockitem] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/stockitem
 *
 * List stock items, optionally filtered by name (contains) or sku (exact).
 * NOTE: filters reference columns `name`/`sku` which do not exist on app.stock,
 * so only the unfiltered query works in practice.
 *
 * Auth: adminAuth.
 * Query params: { name?, sku? }
 * Returns:
 *   200 { message: 'Stock items fetched', data: [...rows] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (inventory list uses /api/admin/inventory/stock).
 */
router.get('/stockitem', async (req, res) => {
  try {
    const { name, sku } = req.query;
    const data = await dbq.listStockItemsLegacy({ name, sku });
    res.status(200).json({ message: 'Stock items fetched', data });
  } catch (err) {
    console.error('[stockitem] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/stockitem
 *
 * Update a stock item by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, name?, quantity?, price? }
 * Returns:
 *   200 { message: 'Stock item updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/stockitem', async (req, res) => {
  try {
    const { id, name, quantity, price } = req.body;
    const data = await dbq.updateStockItemById({ id, name, quantity, price });
    if (!data) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item updated', data });
  } catch (err) {
    console.error('[stockitem] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/stockitem
 *
 * Delete a stock item by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Stock item deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/stockitem', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await dbq.deleteStockItemById(id);
    if (!data) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[stockitem] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/inventory/brands
 *
 * Distinct brand names from app.inventory.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { data: string[] }
 *   500 { message, error }
 *
 * Called by:
 *   - vianet/src/adminPages/inventoryStock.tsx -> api.get('/api/admin/inventory/brands') (brand filter dropdown)
 *   - vianet/src/adminPages/inventorySku.tsx    -> api.get('/api/admin/inventory/brands') (brand filter dropdown)
 */
router.get('/inventory/brands', async (req, res) => {
  try {
    const brands = await dbq.listDistinctBrands();
    res.json({ data: brands });
  } catch (err) {
    console.error('[stockitem] GET /inventory/brands error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/inventory/groups
 *
 * Distinct stock groups (category_level_1) from app.stock.
 */
router.get('/inventory/groups', async (req, res) => {
  try {
    const groups = await dbq.listDistinctGroups();
    res.json({ data: groups });
  } catch (err) {
    console.error('[stockitem] GET /inventory/groups error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


/**
 * GET /api/admin/inventory/stock
 *
 * Paginated stock list joined with app.inventory for brand/model/variant/color/gst.
 * Supports full-text-ish search and brand filter. This is the admin inventory table source.
 *
 * Auth: adminAuth.
 * Query params: { limit? (default 50, max 500), offset? (default 0), search?, brand? }
 * Returns:
 *   200 { rows: [{ id, name, brand, model, variant, color, qty, price, gst, min, max }], total, limit, offset }
 *   500 { message, error }
 *
 * Called by:
 *   - vianet/src/adminPages/inventoryStock.tsx -> api.get('/api/admin/inventory/stock?limit=&offset=&brand=')
 *     Displays: paginated inventory stock table (name, brand, model, qty, price, gst).
 *   - vianet/src/adminPages/accessGroupStocks.tsx -> api.get('/api/admin/inventory/stock?search=&limit=500')
 *     Displays: searchable stock picker used to assign stocks to an access group.
 */
router.get('/inventory/stock', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search || '';
    const brand = req.query.brand || '';
    const group = req.query.group || '';

    const { rows: dataRows, total } = await dbq.listInventoryStock({ search, brand, group, limit, offset });

    // Coerce numerics: pg returns numeric columns as strings, and the
    // frontend sums qty/price — string + would concatenate, not add.
    const rows = dataRows.map((r: any) => ({
      id: r.id,
      name: r.fullname || r.stockname,
      brand: r.brand || '',
      group: r.category_level_1 || '',
      model: r.model || '',
      variant: r.varient || '',
      color: r.color || '',
      qty: parseFloat(r.quantity) || 0,
      price: parseFloat(r.inv_price) || 0,
      gst: parseFloat(r.gst) || 0,
      min: parseFloat(r.min_stock ?? r.min) || 0,
      max: parseFloat(r.max_stock ?? r.max) || 0,
    }));

    res.json({ rows, total, limit, offset });
  } catch (err) {
    console.error('[stockitem] GET /inventory/stock error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/inventory/sku
 *
 * SKU listing with per-access-group pricing (qty/price/partnerSkuName) aggregated
 * as a JSON array per stock. Adapts the query if app.inventory has brand/model columns.
 *
 * Auth: adminAuth.
 * Query params: { brand? }
 * Returns:
 *   200 [{ id, name, sku, qty, price, brand, model, accessGroups: [{ group, qty, price, partnerSkuName }], status: 'active' }]
 *   500 fallback []
 *
 * Called by:
 *   - vianet/src/adminPages/inventorySku.tsx -> api.get('/api/admin/inventory/sku')
 *     Displays: SKU table with per-group qty/price and an edit/assign UI (POST/PUT per group).
 *   - vianet/src/adminPages/inventorySku.tsx Excel upload flow (re-fetch after bulk upload).
 */
router.get('/inventory/sku', async (req, res) => {
  try {
    const brandFilter = req.query.brand as string;
    const result = await dbq.listInventorySku({ brand: brandFilter });
    res.json(result.map(r => ({ ...r, status: 'active' })));
  } catch (err) {
    console.error('[stockitem] GET /inventory/sku error:', err);
    res.json([]);
  }
});

/**
 * GET /api/admin/migrate-partner-sku
 *
 * One-off migration helper: adds partner_sku_name column to app.inventory_access_group.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { message: 'Migration successful' }
 *   500 { error }
 *
 * Called by: no frontend caller — manual/admin script.
 */
router.get('/migrate-partner-sku', async (req, res) => {
  try {
    await dbq.migratePartnerSku();
    res.json({ message: 'Migration successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/inventory/control
 *
 * Inventory control overview: total stock items + access groups with derived
 * control-settings/group-settings scaffolding for the control UI.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { totalItems, categories: [], controlSettings: [], groupSettings: [...], accessGroups: [{ id, name, group_key, permissions, status }] }
 *   500 fallback zeroed object
 *
 * Called by:
 *   - vianet/src/adminPages/inventoryControl.tsx -> api.get('/api/admin/inventory/control')
 *     Displays: total items + access group list with permissions/status.
 *   - vianet/src/adminPages/inventorySku.tsx -> api.get('/api/admin/inventory/control') (access group options)
 */
router.get('/inventory/control', async (req, res) => {
  try {
    const { totalItems, accessGroups: groupsResult } = await dbq.getInventoryControl();
    const accessGroups = groupsResult.map(r => ({
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

/**
 * GET /api/admin/inventory/stock/:id
 *
 * Single stock detail from app.inventory (plus placeholders for description/tags/etc).
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Returns:
 *   200 { id, name, brand, model, variant, color, qty, price, gst, min, max, description, details, tags, url, id_no }
 *   404 when not found
 *   500 on error
 *
 * Called by: vianet/src/adminPages/inventoryStockDetail.tsx -> api.get(`/api/admin/inventory/stock/${id}`)
 *   Displays: editable stock detail form (name, brand, model, variant, color, qty, price, gst, min, max).
 */
router.get('/inventory/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await dbq.getStockDetail(id);
    if (!r) return res.status(404).json({ message: 'Stock item not found' });
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

/**
 * POST /api/admin/inventory/stock/:id
 *
 * Save stock detail — updates both app.inventory (fullname/brand/model/varient/color/
 * quantity/price/gst) and app.stock (stockname/quantity/price) for the same id.
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Requires (JSON body): { name, brand?, model?, variant?, color?, qty?, price?, gst?, min?, max?, description?, details?, tags?, url?, id_no? }
 * Returns:
 *   200 { id, name, brand, model, variant, color, qty, price, gst, min, max, description, details, tags, url, id_no }
 *   404 when inventory row missing
 *   500 on error
 *
 * Called by: vianet/src/adminPages/inventoryStockDetail.tsx -> api.post(`/api/admin/inventory/stock/${id}`, form)
 *   Displays: saves the edited stock form and refreshes the detail view.
 */
router.post('/inventory/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, model, variant, color, qty, price, gst, min, max, description, details, tags, url, id_no } = req.body;

    const r = await dbq.saveStockDetail({ id, name, brand, model, variant, color, qty, price, gst });
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

/**
 * GET /api/admin/inventory/sku/:sku/access-group/:group
 *
 * Access-group detail for one SKU: the stock item, its group-specific qty/price
 * (or defaults), all access groups that stock belongs to, and all stocks the
 * group can see (groupStocks).
 *
 * Auth: adminAuth.
 * Path params: { sku, group } — sku may be numeric id or string; group is the group name.
 * Returns:
 *   200 {
 *     item: { sku, name, brand, status, accessGroups: [{ group, qty, price }] },
 *     accessGroup: { group, qty, price },
 *     privileges: ['view','order'],
 *     groupStocks: [{ sku, name, brand, qty, price }],
 *     stockConfig: { maxQty, allowDiscount, autoApprove, notes }
 *   }
 *   404 when SKU or group not found
 *   500 on error
 *
 * Called by: vianet/src/adminPages/accessGroupDetail.tsx -> api.get(`/api/admin/inventory/sku/${sku}/access-group/${group}`)
 *   Displays: stock info, group pricing card, and lists of stocks per group.
 */
router.get('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const { item, groupRow, iaRow, allAgRows, groupStocksRows } = await dbq.getAccessGroupDetail({ sku, group });
    if (!item) return res.status(404).json({ message: 'SKU not found' });
    const r = item;

    let accessGroupData = { group, qty: r.qty || 0, price: parseFloat(r.price) || 0 };

    if (groupRow && iaRow) {
      accessGroupData = {
        group,
        qty: parseInt(iaRow.quantity) || 0,
        price: parseFloat(iaRow.oprice) || 0,
      };
    }

    res.json({
      item: {
        sku: r.sku || String(r.id),
        name: r.name,
        brand: '',
        status: 'active',
        accessGroups: allAgRows.map(a => ({ group: a.group, qty: parseInt(a.qty) || 0, price: parseFloat(a.price) || 0 })),
      },
      accessGroup: accessGroupData,
      privileges: ['view', 'order'],
      groupStocks: groupStocksRows.map(s => ({ sku: String(s.id), name: s.name, brand: s.brand, qty: parseInt(s.qty) || 0, price: parseFloat(s.price) || 0 })),
      stockConfig: { maxQty: 100, allowDiscount: true, autoApprove: false, notes: '' },
    });
  } catch (err) {
    console.error('[stockitem] GET access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/admin/inventory/sku/:sku/access-group/:group
 *
 * Assign a stock to an access group (upsert: inserts if missing, updates otherwise).
 * qty is clamped to >= 0.
 *
 * Auth: adminAuth.
 * Path params: { sku, group }
 * Requires (JSON body): { qty?, price?, partnerSkuName? }
 * Returns:
 *   200 { message: 'Stock access updated' } (existing mapping)
 *   201 { message: 'Stock assigned to access group' } (new mapping)
 *   404 when stock or group not found
 *   500 on error
 *
 * Called by:
 *   - vianet/src/adminPages/accessGroupDetail.tsx -> api.post(`.../sku/${sku}/access-group/${group}`, { qty, price })
 *   - vianet/src/adminPages/inventorySku.tsx       -> api.post(`.../sku/${sku}/access-group/${group}`, { qty, price, partnerSkuName })
 *   - vianet/src/adminPages/accessGroupStocks.tsx  -> api.post(`.../sku/${stock.id}/access-group/${group}`, {...})
 *   Displays: assigns/updates the group price/qty; tables refresh.
 */
router.post('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const { qty, price, partnerSkuName } = req.body;

    const stock = await dbq.findStockId(sku);
    if (!stock) return res.status(404).json({ message: 'Stock item not found' });
    const stockId = stock.id;

    const groupRow = await dbq.findAccessGroupId(group);
    if (!groupRow) return res.status(404).json({ message: 'Access group not found' });
    const groupId = groupRow.id;

    const outcome = await dbq.upsertStockGroupMapping({ stockId, groupId, qty, price, partnerSkuName });
    if (outcome === 'assigned') {
      res.status(201).json({ message: 'Stock assigned to access group' });
    } else {
      res.json({ message: 'Stock access updated' });
    }
  } catch (err) {
    console.error('[stockitem] POST access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/inventory/sku/:sku/access-group/:group
 *
 * Update the qty/price/gst/partnerSkuName of an existing stock-to-group mapping.
 * When gst is provided it is also written to app.inventory.
 *
 * Auth: adminAuth.
 * Path params: { sku, group }
 * Requires (JSON body): { qty?, price?, gst?, partnerSkuName? }
 * Returns:
 *   200 { message: 'Stock access updated' }
 *   404 when stock, group, or mapping not found
 *   500 on error
 *
 * Called by:
 *   - vianet/src/adminPages/accessGroupDetail.tsx -> api.put(`.../sku/${sku}/access-group/${group}`, { qty, price })
 *   - vianet/src/adminPages/accessGroupStocks.tsx  -> api.put(`.../sku/${item.id}/access-group/${group}`, { qty, price, gst })
 *   Displays: inline-edits a group mapping's qty/price/gst.
 */
router.put('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const { qty, price, gst, partnerSkuName } = req.body;

    const stock = await dbq.findStockId(sku);
    if (!stock) return res.status(404).json({ message: 'Stock item not found' });
    const stockId = stock.id;

    const groupRow = await dbq.findAccessGroupId(group);
    if (!groupRow) return res.status(404).json({ message: 'Access group not found' });
    const groupId = groupRow.id;

    const result = await dbq.updateStockGroupMapping({ stockId, groupId, qty, price, partnerSkuName });
    if (!result) return res.status(404).json({ message: 'Mapping not found' });

    if (gst !== undefined) {
      await dbq.updateStockGst({ stockId, gst });
    }

    res.json({ message: 'Stock access updated' });
  } catch (err) {
    console.error('[stockitem] PUT access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/inventory/sku/:sku/access-group/:group
 *
 * Remove a stock's mapping to an access group.
 *
 * Auth: adminAuth.
 * Path params: { sku, group }
 * Returns:
 *   200 { message: 'Stock access removed' }
 *   404 when stock, group, or mapping not found
 *   500 on error
 *
 * Called by:
 *   - vianet/src/adminPages/accessGroupDetail.tsx -> api.delete(`.../sku/${sku}/access-group/${group}`)
 *   - vianet/src/adminPages/accessGroupStocks.tsx  -> api.delete(`.../sku/${item.id}/access-group/${group}`)
 *   Displays: removes the stock from the group's list.
 */
router.delete('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;

    const stock = await dbq.findStockId(sku);
    if (!stock) return res.status(404).json({ message: 'Stock item not found' });
    const stockId = stock.id;

    const groupRow = await dbq.findAccessGroupId(group);
    if (!groupRow) return res.status(404).json({ message: 'Access group not found' });
    const groupId = groupRow.id;

    const result = await dbq.removeStockGroupMapping({ stockId, groupId });
    if (!result) return res.status(404).json({ message: 'Mapping not found' });
    res.json({ message: 'Stock access removed' });
  } catch (err) {
    console.error('[stockitem] DELETE access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/inventory/access-group/:name
 *
 * All stocks visible to an access group, with the group-specific price and a
 * combined qty (inventory.quantity + vquantity + iag.quantity).
 *
 * Auth: adminAuth.
 * Path params: { name } — access group name (case-insensitive).
 * Returns:
 *   200 { group: { id, name }, items: [{ id, sku, name, brand, model, variant, color, qty, price, gst, hsn }] }
 *   404 when group not found
 *   500 on error
 *
 * Called by: vianet/src/adminPages/accessGroupStocks.tsx -> api.get(`/api/admin/inventory/access-group/${name}`)
 *   Displays: the group's stock list with editable qty/price/gst per stock.
 */
router.get('/inventory/access-group/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { group, rows } = await dbq.getAccessGroupStocks(name);
    if (!group) {
      console.warn('[stockitem] access-group not found for:', JSON.stringify(name));
      return res.status(404).json({ message: `Access group "${name}" not found` });
    }
    res.json({ group, items: rows });
  } catch (err) {
    console.error('[stockitem] GET access-group stocks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/admin/inventory/access/upload
 *
 * Bulk upsert stock-to-access-group mappings from an array of rows
 * (used by the Excel/CSV upload flow in the SKU page).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { rows: [{ skuId, accessGroup, partnerSkuName?, qty?, price? }] }
 * Returns:
 *   200 { message: 'Successfully processed N rows', errors: string[] }
 *   400 when rows is not a non-empty array
 *   500 on error
 *
 * Called by: vianet/src/adminPages/inventorySku.tsx -> api.post('/api/admin/inventory/access/upload', { rows })
 *   Displays: toast with processed/error counts, then refreshes the SKU table.
 */
router.post('/inventory/access/upload', async (req, res) => {
  try {
    const { rows } = req.body; // Expects an array of { skuId, accessGroup, partnerSkuName, qty, price }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty rows array provided' });
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const stock = await dbq.findStockId(row.skuId);
        if (!stock) {
          errors.push(`Row SKU ${row.skuId}: Stock item not found`);
          continue;
        }
        const stockId = stock.id;

        const groupRow = await dbq.findAccessGroupId(row.accessGroup);
        if (!groupRow) {
          errors.push(`Row SKU ${row.skuId}: Access group '${row.accessGroup}' not found`);
          continue;
        }
        const groupId = groupRow.id;

        await dbq.upsertStockGroupMapping({
          stockId,
          groupId,
          qty: row.qty,
          price: row.price,
          partnerSkuName: row.partnerSkuName,
        });
        successCount++;
      } catch (err) {
        errors.push(`Row SKU ${row.skuId}: ${err.message}`);
      }
    }

    res.json({ message: `Successfully processed ${successCount} rows`, errors });
  } catch (err) {
    console.error('[stockitem] POST /inventory/access/upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
