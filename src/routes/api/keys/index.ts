/**
 * api/keys/index.js
 *
 * Public API key management routes.
 * Uses standard auth middleware for protected endpoints.
 */

const express = require('express');
const crypto = require('crypto');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');

const router = express.Router();

// Create a new API key
router.post('/', auth('user'), async (req, res) => {
  try {
    const { key_name } = req.body;
    const keyid = crypto.randomUUID();
    const key = 'via.' + crypto.randomBytes(32).toString('hex');
    const user_id = req.user?.id;
    const result = await neonDb.query(
      `INSERT INTO app.api (keyid, key_name, key, user_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW()) RETURNING keyid, key_name, key, is_active, created_at`,
      [keyid, key_name, key, user_id]
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
    const result = await neonDb.query(
      `SELECT keyid, key_name, key, is_active, created_at, last_used FROM app.api WHERE user_id = $1`,
      [user_id]
    );
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
      'UPDATE app.api SET key_name = COALESCE($1, key_name), is_active = COALESCE($2, is_active), updated_at = NOW() WHERE keyid = $3 RETURNING keyid, key_name, key, is_active',
      [key_name ?? null, is_active ?? null, id]
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
    const result = await neonDb.query('DELETE FROM app.api WHERE keyid = $1 RETURNING keyid', [id]);
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
