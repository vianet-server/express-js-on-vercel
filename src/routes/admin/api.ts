const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

async function ensureColumns() {
  try {
    await neonDb.query(`
      ALTER TABLE app.api
        ADD COLUMN IF NOT EXISTS key_name TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS access_group_id INTEGER,
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT 'never',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ
    `);
  } catch (err) {
    console.warn('[api] ensureColumns warning:', err.message);
  }
}

router.post('/api', async (req, res) => {
  try {
    await ensureColumns();

    const { key_name, group: groupName, permissions, duration } = req.body;
    if (!key_name || !groupName) {
      return res.status(400).json({ message: 'key_name and group are required' });
    }

    const groupResult = await neonDb.query(
      'SELECT id FROM app.access_groups WHERE name = $1',
      [groupName]
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Access group not found' });
    }
    const accessGroupId = groupResult.rows[0].id;

    const keyid = crypto.randomUUID();
    const apiKey = 'via.' + crypto.randomBytes(32).toString('hex');
    const result = await neonDb.query(
      `INSERT INTO app.api (keyid, key_name, key, access_group_id, user_id, permissions, duration, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, true, NOW(), NOW())
       RETURNING keyid, key_name, key, access_group_id, permissions, duration, is_active, created_at, last_used`,
      [keyid, key_name, apiKey, accessGroupId, req.user?.id || null, JSON.stringify(permissions || []), duration || 'never']
    );

    const row = result.rows[0];
    const groupNameResult = await neonDb.query('SELECT name FROM app.access_groups WHERE id = $1', [row.access_group_id]);
    res.status(201).json({
      id: row.keyid,
      name: row.key_name || '',
      key: row.key,
      group: groupNameResult.rows[0]?.name || '',
      created: row.created_at,
      lastUsed: row.last_used || '',
      status: row.is_active ? 'active' : 'revoked',
      permissions: row.permissions || [],
      duration: row.duration || 'never',
    });
  } catch (err) {
    console.error('[api] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/api', async (req, res) => {
  try {
    const { user_id, key_name } = req.query;
    let query = `SELECT k.keyid, k.key_name, k.key, k.access_group_id, k.permissions, k.duration,
                        k.is_active, k.created_at, k.last_used, g.name AS group_name
                 FROM app.api k
                 LEFT JOIN app.access_groups g ON g.id = k.access_group_id
                 WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;
    if (user_id) { query += ` AND k.user_id = $${idx++}`; params.push(user_id); }
    if (key_name) { query += ` AND k.key_name ILIKE $${idx++}`; params.push(`%${key_name}%`); }
    query += ' ORDER BY k.created_at DESC';

    const result = await neonDb.query(query, params);
    res.json(result.rows.map(r => ({
      id: r.keyid,
      name: r.key_name || '',
      key: r.key,
      group: r.group_name || '',
      created: r.created_at,
      lastUsed: r.last_used || '',
      status: r.is_active ? 'active' : 'revoked',
      permissions: r.permissions || [],
      duration: r.duration || 'never',
    })));
  } catch (err) {
    console.error('[api] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/api', async (req, res) => {
  try {
    const { id, key_name, is_active } = req.body;
    if (!id) return res.status(400).json({ message: 'id is required' });

    const result = await neonDb.query(
      'UPDATE app.api SET key_name = COALESCE($1, key_name), is_active = COALESCE($2, is_active), updated_at = NOW() WHERE keyid = $3 RETURNING keyid',
      [key_name ?? null, is_active ?? null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.json({ message: 'API key updated' });
  } catch (err) {
    console.error('[api] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/api', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.api WHERE keyid = $1 RETURNING keyid', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.json({ message: 'API key deleted' });
  } catch (err) {
    console.error('[api] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/access-groups', async (req, res) => {
  try {
    const result = await neonDb.query('SELECT id, name FROM app.access_groups ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('[api] GET /access-groups error:', err);
    res.json([]);
  }
});

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
    const signupToken = jwt.sign(
      { usertype: 'user', accessgroup: result.rows[0].id },
      process.env.JWT_SECRET
    );
    const link = `/app/signup?Token=${signupToken}`;
    res.status(201).json({ message: 'Access group created', data: result.rows[0], link });
  } catch (err) {
    console.error('[api] POST /access-group error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Access group with this name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/access-group/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query('DELETE FROM app.access_groups WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Access group not found' });
    res.json({ message: 'Access group deleted' });
  } catch (err) {
    console.error('[api] DELETE /access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/api/usage', async (req, res) => {
  try {
    const todayResult = await neonDb.query(`
      SELECT COUNT(*)::int AS count FROM api_key_log
      WHERE created_at >= CURRENT_DATE
    `);
    const monthResult = await neonDb.query(`
      SELECT COUNT(*)::int AS count FROM api_key_log
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const todayRequests = todayResult.rows[0]?.count ?? 0;
    const monthRequests = monthResult.rows[0]?.count ?? 0;
    res.json({
      todayRequests,
      monthRequests,
      quotaRemaining: Math.max(0, 10000 - monthRequests),
    });
  } catch (err) {
    console.error('[api] GET /api/usage error:', err);
    res.json({ todayRequests: 0, monthRequests: 0, quotaRemaining: 10000 });
  }
});

router.get('/api/permissions', async (req, res) => {
  res.json([
    { id: 'products_read', label: 'Read Products' },
    { id: 'products_write', label: 'Create/Update Products' },
    { id: 'products_delete', label: 'Delete Products' },
    { id: 'analytics_read', label: 'Read Analytics' },
    { id: 'orders_read', label: 'Read Orders' },
    { id: 'orders_write', label: 'Create/Update Orders' },
    { id: 'users_read', label: 'Read Users' },
    { id: 'settings_read', label: 'Read Settings' },
    { id: 'settings_write', label: 'Update Settings' },
  ]);
});

router.get('/api/endpoints', async (req, res) => {
  res.json([
    { method: 'GET', path: '/api/v1/products', description: 'Retrieve all products with optional filters' },
    { method: 'GET', path: '/api/v1/products/:id', description: 'Get a single product by ID' },
    { method: 'POST', path: '/api/v1/products', description: 'Create a new product' },
    { method: 'PUT', path: '/api/v1/products/:id', description: 'Update an existing product' },
    { method: 'DELETE', path: '/api/v1/products/:id', description: 'Delete a product' },
    { method: 'GET', path: '/api/v1/analytics/sales', description: 'Get sales analytics data' },
  ]);
});

router.get('/api/durations', async (req, res) => {
  res.json([
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'never', label: 'Never Expire' },
  ]);
});

module.exports = router;
