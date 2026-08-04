const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  ensureApiColumns,
  findAccessGroupByName,
  createApiKey,
  getAccessGroupName,
  listApiKeys,
  updateApiKey,
  deleteApiKey,
  listAccessGroupOptions,
  createAccessGroup,
  deleteAccessGroup,
  getApiUsage,
} = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * POST /api/admin/api
 *
 * Create an API key bound to an access group. Generates a `via.<hex>` secret key
 * (shown only here) plus the group-scoped permissions/duration.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { key_name, group (access group name), permissions?: string[], duration?: string }
 * Returns:
 *   201 { id, name, key, group, created, lastUsed, status, permissions, duration }
 *   400 when key_name/group missing
 *   404 when the access group is not found
 *   500 on error
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.post('/api/admin/api', {...})
 *   Displays: after creation the generated API key is shown/copied and the key list refreshes.
 */
router.post('/api', async (req, res) => {
  try {
    await ensureApiColumns();

    const { key_name, group: groupName, permissions, duration } = req.body;
    if (!key_name || !groupName) {
      return res.status(400).json({ message: 'key_name and group are required' });
    }

    const groupRow = await findAccessGroupByName(groupName);
    if (!groupRow) {
      return res.status(404).json({ message: 'Access group not found' });
    }
    const accessGroupId = groupRow.id;

    const keyid = crypto.randomUUID();
    const apiKey = 'via.' + crypto.randomBytes(32).toString('hex');
    const row = await createApiKey({ keyid, key_name, apiKey, accessGroupId, userId: req.user?.id || null, permissions, duration });

    const groupNameRow = await getAccessGroupName(row.access_group_id);
    res.status(201).json({
      id: row.keyid,
      name: row.key_name || '',
      key: row.key,
      group: groupNameRow?.name || '',
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

/**
 * GET /api/admin/api
 *
 * List all API keys (optionally filtered by owner user_id or name), newest first.
 *
 * Auth: adminAuth.
 * Query params: { user_id?, key_name? }
 * Returns:
 *   200 [{ id, name, key, group, created, lastUsed, status, permissions, duration }]
 *   500 on error
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.get('/api/admin/api')
 *   Displays: API keys table (name, key, group, status, last used, created).
 */
router.get('/api', async (req, res) => {
  try {
    const { user_id, key_name } = req.query;
    const rows = await listApiKeys({ user_id, key_name });
    res.json(rows.map(r => ({
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

/**
 * PUT /api/admin/api
 *
 * Update an API key's name and/or active status (used to revoke keys).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, key_name?, is_active? }
 * Returns:
 *   200 { message: 'API key updated' }
 *   400 when id missing
 *   404 when key not found
 *   500 on error
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.put('/api/admin/api', { id, is_active: false })
 *   Displays: toggles the key's status to "revoked" in the table.
 */
router.put('/api', async (req, res) => {
  try {
    const { id, key_name, is_active } = req.body;
    if (!id) return res.status(400).json({ message: 'id is required' });

    const result = await updateApiKey({ id, key_name, is_active });
    if (!result) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.json({ message: 'API key updated' });
  } catch (err) {
    console.error('[api] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/api
 *
 * Delete an API key.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'API key deleted' }
 *   404 when key not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently (admin API page revokes via PUT).
 */
router.delete('/api', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await deleteApiKey(id);
    if (!result) {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.json({ message: 'API key deleted' });
  } catch (err) {
    console.error('[api] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/access-groups
 *
 * List all access groups (id + name), used as dropdown options for API keys and users.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, name }]
 *   500 fallback []
 *
 * Called by:
 *   - vianet/src/adminPages/adminUsers.tsx -> api.get('/api/admin/access-groups') (group dropdown)
 *   - vianet/src/adminPages/api.tsx         -> api.get('/api/admin/access-groups') (group dropdown for keys)
 */
router.get('/access-groups', async (req, res) => {
  try {
    const result = await listAccessGroupOptions();
    res.json(result);
  } catch (err) {
    console.error('[api] GET /access-groups error:', err);
    res.json([]);
  }
});

/**
 * POST /api/admin/access-group
 *
 * Create an access group and generate a JWT signup link so invited users can
 * create an account scoped to that group (the link is served to the frontend).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { name }
 * Returns:
 *   201 { message: 'Access group created', data: { id, name }, link: '/app/signup?Token=<jwt>' }
 *   400 when name missing/empty
 *   409 when group name already exists
 *   500 on error
 *
 * Called by: vianet/src/adminPages/inventoryControl.tsx -> api.post('/api/admin/access-group', { name })
 *   Displays: creates a group; returned `link` is used to invite users to /app/signup.
 */
router.post('/access-group', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    const group = await createAccessGroup(name.trim());
    const signupToken = jwt.sign(
      { usertype: 'user', accessgroup: group.id },
      process.env.JWT_SECRET
    );
    const link = `/app/signup?Token=${signupToken}`;
    res.status(201).json({ message: 'Access group created', data: group, link });
  } catch (err) {
    console.error('[api] POST /access-group error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Access group with this name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/access-group/:id
 *
 * Delete an access group by numeric id. Also cleans up related rows:
 * inventory_access_group mappings, api keys (unlink), users (unlink).
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Returns:
 *   200 { message: 'Access group deleted' }
 *   400 when id is not a number
 *   500 on error
 *
 * Called by: vianet/src/adminPages/inventoryControl.tsx -> api.delete(`/api/admin/access-group/${id}`)
 *   Displays: removes the group from the access-group list.
 */
router.delete('/access-group/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid access group id' });
    }
    await deleteAccessGroup(numericId);
    res.json({ message: 'Access group deleted' });
  } catch (err) {
    console.error('[api] DELETE /access-group error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/api/usage
 *
 * API key request usage counts from the api_key_log table.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { todayRequests, monthRequests, quotaRemaining }
 *   quotaRemaining = max(0, 10000 - monthRequests).
 *   500 fallback { todayRequests: 0, monthRequests: 0, quotaRemaining: 10000 }
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.get('/api/admin/api/usage')
 *   Displays: usage stats cards (today/month requests + quota remaining).
 */
router.get('/api/usage', async (req, res) => {
  try {
    const { todayRequests, monthRequests } = await getApiUsage();
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

/**
 * GET /api/admin/api/permissions
 *
 * Static list of available API key permissions.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns: 200 [{ id, label }] (products_read, products_write, products_delete,
 *   analytics_read, orders_read, orders_write, users_read, settings_read, settings_write)
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.get('/api/admin/api/permissions')
 *   Displays: permission checkboxes in the "create API key" form.
 */
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

/**
 * GET /api/admin/api/endpoints
 *
 * Static list of the public /api/v1/* endpoints an API key can call.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns: 200 [{ method, path, description }]
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.get('/api/admin/api/endpoints')
 *   Displays: endpoint reference list in the API management page.
 */
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

/**
 * GET /api/admin/api/durations
 *
 * Static list of API key expiry durations.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns: 200 [{ value, label }] (1h, 6h, 24h, 7d, 30d, never)
 *
 * Called by: vianet/src/adminPages/api.tsx -> api.get('/api/admin/api/durations')
 *   Displays: duration dropdown in the "create API key" form.
 */
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
