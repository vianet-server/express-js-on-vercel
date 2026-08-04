const express = require('express');
const adminAuth = require('../../middleware/adminAuth');
const crypto = require('crypto');
const { admin: dbq } = require('../../config/dbqueries');

const router = express.Router();
router.use(adminAuth);

function genGuid() { return crypto.randomUUID(); }

// ==================== STOCK ITEM CRUD ====================

/**
 * POST /api/admin/stock-item
 *
 * Create a stock item. Generates a UUID guid, defaults masterid to 0.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { name, quantity?, price? }
 * Returns:
 *   201 { message: 'Stock item created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (admin stock UI uses /api/admin/inventory/*).
 */
router.post('/stock-item', async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const data = await dbq.createStockItemGuid({ name, guid: genGuid(), quantity, price });
    res.status(201).json({ message: 'Stock item created', data });
  } catch (err) {
    console.error('[stock] stock-item POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/stock-item
 *
 * Paginated stock item list with optional name search. Maps DB rows to the
 * UI shape { id, name, category, qty, value, status }.
 *
 * Auth: adminAuth.
 * Query params: { name?, limit? (default 50, max 500), offset? (default 0) }
 * Returns:
 *   200 { rows: [...], total, limit, offset }
 *   500 fallback { rows: [], total: 0, limit: 50, offset: 0 }
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/stock-item', async (req, res) => {
  try {
    const { name } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const { rows, total } = await dbq.listStockItemsAdmin({ name, limit, offset });
    const mapped = rows.map((r: any) => ({
      id: r.id,
      name: r.stockname || '',
      category: '',
      qty: r.quantity || 0,
      value: parseFloat(r.price) || 0,
      status: 'Active',
    }));
    res.json({ rows: mapped, total, limit, offset });
  } catch (err) {
    console.error('[stock] stock-item GET error:', err);
    res.json({ rows: [], total: 0, limit: 50, offset: 0 });
  }
});

/**
 * PUT /api/admin/stock-item
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
router.put('/stock-item', async (req, res) => {
  try {
    const { id, name, quantity, price } = req.body;
    const data = await dbq.updateStockItemById({ id, name, quantity, price });
    if (!data) return res.status(404).json({ message: 'Stock item not found' });
    res.status(200).json({ message: 'Stock item updated', data });
  } catch (err) {
    console.error('[stock] stock-item PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/stock-item
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
router.delete('/stock-item', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await dbq.deleteStockItemById(id);
    if (!data) return res.status(404).json({ message: 'Stock item not found' });
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[stock] stock-item DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== LEDGER CRUD ====================

/**
 * POST /api/admin/ledger
 *
 * Create a ledger (customer/supplier party). address/mobile stored as arrays.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { name, address?, mobile? }
 * Returns:
 *   201 { message: 'Ledger created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/ledger', async (req, res) => {
  try {
    const { name, address, mobile } = req.body;
    const data = await dbq.createLedger({ guid: genGuid(), name, address, mobile });
    res.status(201).json({ message: 'Ledger created', data });
  } catch (err) {
    console.error('[stock] ledger POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/ledger
 *
 * List ledgers, optionally filtered by name (case-insensitive contains).
 *
 * Auth: adminAuth.
 * Query params: { name? }
 * Returns:
 *   200 { message: 'Ledgers fetched', data: [{ id, guid, name, address, mobile, ledgername }] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/ledger', async (req, res) => {
  try {
    const { name } = req.query;
    const data = await dbq.listLedgers({ name });
    res.status(200).json({ message: 'Ledgers fetched', data });
  } catch (err) {
    console.error('[stock] ledger GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/ledger
 *
 * Update a ledger by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, name?, address?, mobile? }
 * Returns:
 *   200 { message: 'Ledger updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/ledger', async (req, res) => {
  try {
    const { id, name, address, mobile } = req.body;
    const data = await dbq.updateLedger({ id, name, address, mobile });
    if (!data) return res.status(404).json({ message: 'Ledger not found' });
    res.status(200).json({ message: 'Ledger updated', data });
  } catch (err) {
    console.error('[stock] ledger PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/ledger
 *
 * Delete a ledger by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Ledger deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/ledger', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await dbq.deleteLedger(id);
    if (!data) return res.status(404).json({ message: 'Ledger not found' });
    res.status(200).json({ message: 'Ledger deleted' });
  } catch (err) {
    console.error('[stock] ledger DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== VOUCHER CRUD ====================

/**
 * POST /api/admin/voucher
 *
 * Create a voucher (sales/receipt/payment/purchase/etc). Generates a UUID guid.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { voucher_type, voucher_number?, date?, narration?, party_ledger_name? }
 * Returns:
 *   201 { message: 'Voucher created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (vouchers are displayed via
 *   GET /api/admin/reports/daybook and /api/admin/reports/outstanding).
 */
router.post('/voucher', async (req, res) => {
  try {
    const { voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
    const data = await dbq.createVoucher({ guid: genGuid(), date, voucher_type, voucher_number, party_ledger_name, narration });
    res.status(201).json({ message: 'Voucher created', data });
  } catch (err) {
    console.error('[stock] voucher POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/voucher
 *
 * List vouchers, optionally filtered by type/number/date range (max 200 rows,
 * newest first). Each row gets a derived `amount` (sum of ledgerentries where
 * isDeemedPositive === 'No') plus type/number aliases.
 *
 * Auth: adminAuth.
 * Query params: { voucher_type?, voucher_number?, from_date?, to_date? }
 * Returns:
 *   200 [{ id, guid, date, voucher_type, voucher_number, party_ledger_name, narration,
 *          ledgerentries, inventoryentries, created_at, billagentname, amount, type, number }]
 *   500 { message, error }
 *
 * Called by: no direct frontend caller currently (see /reports endpoints instead).
 */
router.get('/voucher', async (req, res) => {
  try {
    const { voucher_type, voucher_number, from_date, to_date } = req.query;
    const result = await dbq.listVouchers({ voucher_type, voucher_number, from_date, to_date });
    const rows = result.map((r: any) => ({
      ...r,
      type: r.voucher_type,
      number: r.voucher_number,
      amount: r.ledgerentries
        ? r.ledgerentries
            .filter((e: any) => e.isDeemedPositive === 'No')
            .reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
        : 0,
    }));
    res.status(200).json(rows);
  } catch (err) {
    console.error('[stock] voucher GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/voucher
 *
 * Update a voucher by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, voucher_type?, voucher_number?, date?, narration?, party_ledger_name? }
 * Returns:
 *   200 { message: 'Voucher updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/voucher', async (req, res) => {
  try {
    const { id, voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
    const data = await dbq.updateVoucher({ id, voucher_type, voucher_number, date, narration, party_ledger_name });
    if (!data) return res.status(404).json({ message: 'Voucher not found' });
    res.status(200).json({ message: 'Voucher updated', data });
  } catch (err) {
    console.error('[stock] voucher PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/voucher
 *
 * Delete a voucher by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Voucher deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/voucher', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await dbq.deleteVoucher(id);
    if (!data) return res.status(404).json({ message: 'Voucher not found' });
    res.status(200).json({ message: 'Voucher deleted' });
  } catch (err) {
    console.error('[stock] voucher DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== GODOWN CRUD ====================

/**
 * POST /api/admin/godown
 *
 * Create a godown (warehouse).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { name, address? }
 * Returns:
 *   201 { message: 'Godown created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/godown', async (req, res) => {
  try {
    const { name, address } = req.body;
    const data = await dbq.createGodown({ name, address });
    res.status(201).json({ message: 'Godown created', data });
  } catch (err) {
    console.error('[stock] godown POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/godown
 *
 * List godowns, optionally filtered by name.
 *
 * Auth: adminAuth.
 * Query params: { name? }
 * Returns:
 *   200 { message: 'Godowns fetched', data: [...godown rows] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/godown', async (req, res) => {
  try {
    const { name } = req.query;
    const data = await dbq.listGodowns({ name });
    res.status(200).json({ message: 'Godowns fetched', data });
  } catch (err) {
    console.error('[stock] godown GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/godown
 *
 * Update a godown by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, name?, address? }
 * Returns:
 *   200 { message: 'Godown updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/godown', async (req, res) => {
  try {
    const { id, name, address } = req.body;
    const data = await dbq.updateGodown({ id, name, address });
    if (!data) return res.status(404).json({ message: 'Godown not found' });
    res.status(200).json({ message: 'Godown updated', data });
  } catch (err) {
    console.error('[stock] godown PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/godown
 *
 * Delete a godown by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Godown deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/godown', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await dbq.deleteGodown(id);
    if (!data) return res.status(404).json({ message: 'Godown not found' });
    res.status(200).json({ message: 'Godown deleted' });
  } catch (err) {
    console.error('[stock] godown DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== MASTERS & SALESMAN ====================

/**
 * GET /api/admin/masters
 *
 * Record counts per master table (stock, ledger, voucher, godown).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, name, records, lastUpdated, status }] for the 4 masters
 *   500 fallback [] (e.g. table missing)
 *
 * Called by: vianet/src/adminPages/tallyMasters.tsx -> api.get('/api/admin/masters')
 *   Displays: cards/rows of master tables with their record counts and sync status.
 */
router.get('/masters', async (req, res) => {
  try {
    const counts = await dbq.getMasterCounts();
    res.json(counts.map((c: any) => ({ ...c, lastUpdated: '', status: 'Active' })));
  } catch (err) {
    console.error('[stock] GET /masters error:', err);
    res.json([]);
  }
});

/**
 * GET /api/admin/salesman
 *
 * Salesman leaderboard from app.sales_records: order count + total sales per salesman.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, name, orders, sales, region, status, target, achieved, commission }]
 *   region/target/achieved/commission are placeholder values ('' or 0).
 *   500 fallback []
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/salesman', async (req, res) => {
  try {
    const result = await dbq.listSalesmen();
    res.json(result.map((r: any) => ({ id: r.id, name: r.name, orders: r.orders, sales: parseFloat(r.sales) || 0, region: '', status: 'Active', target: 0, achieved: 0, commission: 0 })));
  } catch (err) {
    console.error('[stock] GET /salesman error:', err);
    res.json([]);
  }
});

/**
 * GET /api/admin/salesman-chart
 *
 * Daily sales per salesman from app.sales_records (for charting).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ date, name, sales }]
 *   500 fallback []
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/salesman-chart', async (req, res) => {
  try {
    const result = await dbq.listSalesmanChart();
    res.json(result.map((r: any) => ({ date: r.sales_date, name: r.salesman, sales: parseFloat(r.sales) || 0 })));
  } catch (err) {
    console.error('[stock] GET /salesman-chart error:', err);
    res.json([]);
  }
});

module.exports = router;
