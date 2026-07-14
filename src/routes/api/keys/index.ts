/**
 * api/keys/index.js
 *
 * Public API key management routes.
 * Uses standard auth middleware for protected endpoints.
 */

const express = require('express');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');

const router = express.Router();

// Create a new API key
router.post('/', auth('user'), async (req, res) => {
  try {
    const { key_name } = req.body;
    const api_key = require('crypto').randomBytes(32).toString('hex');
    const user_id = req.user?.id;
    const result = await neonDb.query(
      'INSERT INTO api_keys (key_name, api_key, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [key_name, api_key, user_id]
    );
    res.status(201).json({ message: 'API key created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/keys] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all API keys for the authenticated user
router.get('/', auth('user'), async (req, res) => {
  try {
    const user_id = req.user?.id;
    const result = await neonDb.query('SELECT * FROM api_keys WHERE user_id = $1', [user_id]);
    res.status(200).json({ message: 'API keys fetched', data: result.rows });
  } catch (err) {
    console.error('[api/keys] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an API key
router.put('/', auth('user'), async (req, res) => {
  try {
    const { id, key_name, is_active } = req.body;
    const result = await neonDb.query(
      'UPDATE api_keys SET key_name = $1, is_active = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [key_name, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.status(200).json({ message: 'API key updated', data: result.rows[0] });
  } catch (err) {
    console.error('[api/keys] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an API key
router.delete('/', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM api_keys WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.status(200).json({ message: 'API key deleted' });
  } catch (err) {
    console.error('[api/keys] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
