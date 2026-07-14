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
    const { name, sku, description, quantity, price } = req.body;
    const result = await neonDb.query(
      'INSERT INTO stockitems (name, sku, description, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [name, sku, description, quantity, price]
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
    let query = 'SELECT * FROM stockitems WHERE 1=1';
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
    const { id, name, sku, description, quantity, price } = req.body;
    const result = await neonDb.query(
      'UPDATE stockitems SET name = $1, sku = $2, description = $3, quantity = $4, price = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [name, sku, description, quantity, price, id]
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
    const result = await neonDb.query('DELETE FROM stockitems WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[stockitem] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Paginated stock endpoint for admin/inventory/stock
router.get('/inventory/stock', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';

    let countQuery = 'SELECT COUNT(*) FROM stockitems WHERE 1=1';
    let dataQuery = 'SELECT * FROM stockitems WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (search) {
      const clause = ` AND (name ILIKE $${idx} OR sku ILIKE $${idx} OR COALESCE(description, '') ILIKE $${idx})`;
      countQuery += clause;
      dataQuery += clause;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await neonDb.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ` ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const dataResult = await neonDb.query(dataQuery, params);

    const rows = dataResult.rows.map(r => ({
      id: r.id,
      name: r.name,
      brand: '',
      model: '',
      variant: '',
      color: '',
      qty: r.quantity || 0,
      price: parseFloat(r.price) || 0,
      gst: 0,
      min: 0,
      max: 0,
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
    const result = await neonDb.query("SELECT id, name, sku, quantity AS qty, price FROM stockitems ORDER BY name");
    res.json(result.rows.map(r => ({ ...r, brand: '', accessGroups: [], status: 'active' })));
  } catch (err) {
    console.error('[stockitem] GET /inventory/sku error:', err);
    res.json([]);
  }
});

// Control settings overview
router.get('/inventory/control', async (req, res) => {
  try {
    const result = await neonDb.query("SELECT COUNT(*) AS items FROM stockitems");
    res.json({ totalItems: parseInt(result.rows[0].items), categories: [], settings: [], accessGroups: [] });
  } catch { res.json({ totalItems: 0, categories: [], settings: [], accessGroups: [] }); }
});

// Single stock item detail
router.get('/inventory/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query('SELECT * FROM stockitems WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    const r = result.rows[0];
    res.json({
      id: r.id, name: r.name, brand: '', model: '', variant: '', color: '',
      qty: r.quantity || 0, price: parseFloat(r.price) || 0, gst: 0,
      min: 0, max: 0, description: r.description || '', details: '', tags: '', url: '', id_no: '',
    });
  } catch (err) {
    console.error('[stockitem] GET /inventory/stock/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Access group detail (placeholder)
router.get('/inventory/sku/:sku/access-group/:group', async (req, res) => {
  try {
    const { sku, group } = req.params;
    const item = await neonDb.query("SELECT id, name, sku, quantity AS qty, price FROM stockitems WHERE sku = $1 OR CAST(id AS TEXT) = $1", [sku]);
    if (item.rows.length === 0) return res.status(404).json({ message: 'SKU not found' });
    const r = item.rows[0];
    res.json({
      item: { sku: r.sku || String(r.id), name: r.name, brand: '', status: 'active', accessGroups: [{ group, qty: r.qty || 0, price: parseFloat(r.price) || 0 }] },
      accessGroup: { group, qty: r.qty || 0, price: parseFloat(r.price) || 0 },
      privileges: ['view', 'order'],
      groupStocks: [{ sku: r.sku || String(r.id), name: r.name, brand: '', qty: r.qty || 0, price: parseFloat(r.price) || 0 }],
      stockConfig: { maxQty: 100, allowDiscount: true, autoApprove: false, notes: '' },
    });
  } catch (err) {
    console.error('[stockitem] GET access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
