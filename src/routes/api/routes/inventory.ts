/**
 * api/routes/inventory.js
 *
 * Public inventory routes.
 * Uses standard auth middleware for protected endpoints.
 */

const express = require('express');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');

const router = express.Router();

// Create a new inventory record
router.post('/', auth('user'), async (req, res) => {
  try {
    const { stockitem_id, godown_id, quantity } = req.body;
    const result = await neonDb.query(
      'INSERT INTO inventory (stockitem_id, godown_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [stockitem_id, godown_id, quantity]
    );
    res.status(201).json({ message: 'Inventory record created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/inventory] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all inventory records with optional filtering
router.get('/', auth('user'), async (req, res) => {
  try {
    const { stockitem_id, godown_id } = req.query;
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (stockitem_id) { query += ` AND stockitem_id = $${idx++}`; params.push(stockitem_id); }
    if (godown_id) { query += ` AND godown_id = $${idx++}`; params.push(godown_id); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Inventory records fetched', data: result.rows });
  } catch (err) {
    console.error('[api/inventory] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an inventory record by ID
router.put('/', auth('user'), async (req, res) => {
  try {
    const { id, stockitem_id, godown_id, quantity } = req.body;
    const result = await neonDb.query(
      'UPDATE inventory SET stockitem_id = $1, godown_id = $2, quantity = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [stockitem_id, godown_id, quantity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.status(200).json({ message: 'Inventory record updated', data: result.rows[0] });
  } catch (err) {
    console.error('[api/inventory] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an inventory record by ID
router.delete('/', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.status(200).json({ message: 'Inventory record deleted' });
  } catch (err) {
    console.error('[api/inventory] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
