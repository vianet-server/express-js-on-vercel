/**
 * api/routes/tally.js
 *
 * Public Tally ERP routes for stock items, ledgers, vouchers, and godowns.
 * Uses standard auth middleware for protected endpoints.
 */

const express = require('express');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');

const router = express.Router();

// ==================== STOCK ITEM CRUD ====================

router.post('/stock-item', auth('user'), async (req, res) => {
  try {
    const { name, sku, description, quantity, price } = req.body;
    const result = await neonDb.query(
      'INSERT INTO stockitems (name, sku, description, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [name, sku, description, quantity, price]
    );
    res.status(201).json({ message: 'Stock item created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] stock-item POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/stock-item', auth('user'), async (req, res) => {
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
    console.error('[api/tally] stock-item GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/stock-item', auth('user'), async (req, res) => {
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
    console.error('[api/tally] stock-item PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/stock-item', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM stockitems WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stock item not found' });
    }
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[api/tally] stock-item DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== LEDGER CRUD ====================

router.post('/ledger', auth('user'), async (req, res) => {
  try {
    const { name, group_name, opening_balance, type } = req.body;
    const result = await neonDb.query(
      'INSERT INTO ledgers (name, group_name, opening_balance, type, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [name, group_name, opening_balance, type]
    );
    res.status(201).json({ message: 'Ledger created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] ledger POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/ledger', auth('user'), async (req, res) => {
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
    console.error('[api/tally] ledger GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/ledger', auth('user'), async (req, res) => {
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
    console.error('[api/tally] ledger PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/ledger', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM ledgers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    res.status(200).json({ message: 'Ledger deleted' });
  } catch (err) {
    console.error('[api/tally] ledger DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== VOUCHER CRUD ====================

router.post('/voucher', auth('user'), async (req, res) => {
  try {
    const { type, number, date, amount, narration } = req.body;
    const result = await neonDb.query(
      'INSERT INTO vouchers (type, number, date, amount, narration, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [type, number, date, amount, narration]
    );
    res.status(201).json({ message: 'Voucher created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] voucher POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/voucher', auth('user'), async (req, res) => {
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
    console.error('[api/tally] voucher GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/voucher', auth('user'), async (req, res) => {
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
    console.error('[api/tally] voucher PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/voucher', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM vouchers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.status(200).json({ message: 'Voucher deleted' });
  } catch (err) {
    console.error('[api/tally] voucher DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== GODOWN CRUD ====================

router.post('/godown', auth('user'), async (req, res) => {
  try {
    const { name, address } = req.body;
    const result = await neonDb.query(
      'INSERT INTO godowns (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [name, address]
    );
    res.status(201).json({ message: 'Godown created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] godown POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/godown', auth('user'), async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT * FROM godowns WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Godowns fetched', data: result.rows });
  } catch (err) {
    console.error('[api/tally] godown GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/godown', auth('user'), async (req, res) => {
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
    console.error('[api/tally] godown PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/godown', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM godowns WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Godown not found' });
    }
    res.status(200).json({ message: 'Godown deleted' });
  } catch (err) {
    console.error('[api/tally] godown DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
