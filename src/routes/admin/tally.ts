/**
 * Admin Tally Routes
 *
 * Handles CRUD operations for Tally ERP entities:
 * - Stock Items
 * - Ledgers
 * - Vouchers
 * - Godowns
 *
 * All routes require admin authentication via adminAuth middleware
 */

const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

// ==================== STOCK ITEM CRUD ====================

// Create a new stock item
router.post('/stock-item', async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const result = await neonDb.query(
      'INSERT INTO app.stock (stockname, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [name, quantity, price]
    );
    res.status(201).json({ message: 'Stock item created', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] stock-item POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all stock items with optional filtering
router.get('/stock-item', async (req, res) => {
  try {
    const { name, sku } = req.query;
    let query = 'SELECT * FROM app.stock WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND stockname ILIKE $${idx++}`; params.push(`%${name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Stock items fetched', data: result.rows });
  } catch (err) {
    console.error('[tally] stock-item GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a stock item by ID
router.put('/stock-item', async (req, res) => {
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
    console.error('[tally] stock-item PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a stock item by ID
router.delete('/stock-item', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.stock WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[tally] stock-item DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== LEDGER CRUD ====================

// Create a new ledger
router.post('/ledger', async (req, res) => {
  try {
    const { name, group_name, opening_balance, type } = req.body;
    const result = await neonDb.query(
      'INSERT INTO ledgers (name, group_name, opening_balance, type, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [name, group_name, opening_balance, type]
    );
    res.status(201).json({ message: 'Ledger created', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] ledger POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all ledgers with optional filtering
router.get('/ledger', async (req, res) => {
  try {
    const { name, group_name, type } = req.query;
    let query = 'SELECT * FROM ledgers WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    if (group_name) { query += ` AND group_name = $${idx++}`; params.push(group_name); }
    if (type) { query += ` AND type = $${idx++}`; params.push(type); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Ledgers fetched', data: result.rows });
  } catch (err) {
    console.error('[tally] ledger GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a ledger by ID
router.put('/ledger', async (req, res) => {
  try {
    const { id, name, group_name, opening_balance, type } = req.body;
    const result = await neonDb.query(
      'UPDATE ledgers SET name = $1, group_name = $2, opening_balance = $3, type = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, group_name, opening_balance, type, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    res.status(200).json({ message: 'Ledger updated', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] ledger PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a ledger by ID
router.delete('/ledger', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM ledgers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    res.status(200).json({ message: 'Ledger deleted' });
  } catch (err) {
    console.error('[tally] ledger DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== VOUCHER CRUD ====================

// Create a new voucher
router.post('/voucher', async (req, res) => {
  try {
    const { type, number, date, amount, narration } = req.body;
    const result = await neonDb.query(
      'INSERT INTO vouchers (type, number, date, amount, narration, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [type, number, date, amount, narration]
    );
    res.status(201).json({ message: 'Voucher created', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] voucher POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all vouchers with optional filtering
router.get('/voucher', async (req, res) => {
  try {
    const { type, number, from_date, to_date } = req.query;
    let query = 'SELECT * FROM vouchers WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (type) { query += ` AND type = $${idx++}`; params.push(type); }
    if (number) { query += ` AND number = $${idx++}`; params.push(number); }
    if (from_date) { query += ` AND date >= $${idx++}`; params.push(from_date); }
    if (to_date) { query += ` AND date <= $${idx++}`; params.push(to_date); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Vouchers fetched', data: result.rows });
  } catch (err) {
    console.error('[tally] voucher GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a voucher by ID
router.put('/voucher', async (req, res) => {
  try {
    const { id, type, number, date, amount, narration } = req.body;
    const result = await neonDb.query(
      'UPDATE vouchers SET type = $1, number = $2, date = $3, amount = $4, narration = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [type, number, date, amount, narration, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.status(200).json({ message: 'Voucher updated', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] voucher PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a voucher by ID
router.delete('/voucher', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM vouchers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.status(200).json({ message: 'Voucher deleted' });
  } catch (err) {
    console.error('[tally] voucher DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== GODOWN CRUD ====================

// Create a new godown
router.post('/godown', async (req, res) => {
  try {
    const { name, address } = req.body;
    const result = await neonDb.query(
      'INSERT INTO godowns (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [name, address]
    );
    res.status(201).json({ message: 'Godown created', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] godown POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all godowns with optional filtering
router.get('/godown', async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT * FROM godowns WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Godowns fetched', data: result.rows });
  } catch (err) {
    console.error('[tally] godown GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a godown by ID
router.put('/godown', async (req, res) => {
  try {
    const { id, name, address } = req.body;
    const result = await neonDb.query(
      'UPDATE godowns SET name = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, address, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Godown not found' });
    }
    res.status(200).json({ message: 'Godown updated', data: result.rows[0] });
  } catch (err) {
    console.error('[tally] godown PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a godown by ID
router.delete('/godown', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM godowns WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Godown not found' });
    }
    res.status(200).json({ message: 'Godown deleted' });
  } catch (err) {
    console.error('[tally] godown DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Tally masters overview
router.get('/masters', async (req, res) => {
  try {
    const stock = await neonDb.query('SELECT COUNT(*) FROM app.stock');
    const ledger = await neonDb.query('SELECT COUNT(*) FROM ledgers');
    const voucher = await neonDb.query('SELECT COUNT(*) FROM vouchers');
    const godown = await neonDb.query('SELECT COUNT(*) FROM godowns');
    res.json({
      stockItems: parseInt(stock.rows[0].count),
      ledgers: parseInt(ledger.rows[0].count),
      vouchers: parseInt(voucher.rows[0].count),
      godowns: parseInt(godown.rows[0].count),
    });
  } catch (err) {
    console.error('[tally] GET /masters error:', err);
    res.json({ stockItems: 0, ledgers: 0, vouchers: 0, godowns: 0 });
  }
});

// Salesman listing
router.get('/salesman', async (req, res) => {
  try {
    const result = await neonDb.query("SELECT id, name FROM godowns ORDER BY name");
    res.json(result.rows.map(r => ({ ...r, target: 0, achieved: 0, commission: 0 })));
  } catch (err) {
    console.error('[tally] GET /salesman error:', err);
    res.json([]);
  }
});

module.exports = router;
