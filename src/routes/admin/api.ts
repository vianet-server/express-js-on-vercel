/**
 * Admin API Routes
 *
 * Handles CRUD operations for API keys / integrations.
 * All routes require admin authentication via adminAuth middleware
 */

const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

// Create a new API key record
router.post('/api', async (req, res) => {
  try {
    const { key_name, user_id } = req.body;
    const api_key = require('crypto').randomBytes(32).toString('hex');
    const result = await neonDb.query(
      'INSERT INTO api_keys (key_name, api_key, user_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [key_name, api_key, user_id]
    );
    res.status(201).json({ message: 'API key created', data: result.rows[0] });
  } catch (err) {
    console.error('[api] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all API keys with optional filtering
router.get('/api', async (req, res) => {
  try {
    const { user_id, key_name } = req.query;
    let query = 'SELECT * FROM api_keys WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (user_id) { query += ` AND user_id = $${idx++}`; params.push(user_id); }
    if (key_name) { query += ` AND key_name ILIKE $${idx++}`; params.push(`%${key_name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'API keys fetched', data: result.rows });
  } catch (err) {
    console.error('[api] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an API key record by ID
router.put('/api', async (req, res) => {
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
    console.error('[api] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an API key by ID
router.delete('/api', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM api_keys WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.status(200).json({ message: 'API key deleted' });
  } catch (err) {
    console.error('[api] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /access-groups — List all access groups
router.get('/access-groups', async (req, res) => {
  try {
    const result = await neonDb.query('SELECT id, name FROM app.access_groups ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('[api] GET /access-groups error:', err);
    res.json([]);
  }
});

// POST /access-group — Create a new access group
router.post('/access-group', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    const result = await neonDb.query(
      'INSERT INTO app.access_groups (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id, name',
      [name.trim()]
    );
    const link = `/admin/inventory/sku?group=${encodeURIComponent(name.trim())}`;
    res.status(201).json({ message: 'Access group created', data: result.rows[0], link });
  } catch (err) {
    console.error('[api] POST /access-group error:', err);
    // Handle duplicate name
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Access group with this name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
