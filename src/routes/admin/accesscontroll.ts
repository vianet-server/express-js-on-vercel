const express = require('express');
const bcrypt = require('bcryptjs');
const { createAccessControlUser, listAccessControlUsers, updateAccessControlUser, deleteAccessControlUser, ensureUserColumns } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * POST /api/admin/accesscontrol
 *
 * Create a new app user (e.g. "user" type assigned to an access group).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { email, password, user_type?, access_group_id? }
 * Returns:
 *   201 { message: 'User created', data: { id, email, user_type, access_group_id } }
 *   400 when email/password missing
 *   500 on error
 *
 * Called by: vianet/src/adminPages/adminUsers.tsx -> api.post('/api/admin/accesscontrol', {...})
 *   Displays: after creation the users table refreshes (user list with role/access group).
 */
router.post('/accesscontrol', async (req, res) => {
  try {
    const { email, password, user_type, access_group_id } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const data = await createAccessControlUser({ email, password_hash, user_type, access_group_id });
    res.status(201).json({ message: 'User created', data });
  } catch (err) {
    console.error('[accesscontrol] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/accesscontrol
 *
 * Paginated list of app users with optional search/filter. Joins access_groups to
 * include the group name.
 *
 * Auth: adminAuth.
 * Query params: { email?, user_type?, limit? (default 50, max 500), offset? (default 0) }
 * Returns:
 *   200 { rows: [{ id, email, user_type, is_active, created_at, updated_at, access_group_id, access_group_name }], total, limit, offset }
 *   500 fallback { rows: [], total: 0, limit: 50, offset: 0 }
 *
 * Called by: vianet/src/adminPages/adminUsers.tsx -> api.get('/api/admin/accesscontrol?limit=&offset=&email=')
 *   Displays: paginated users table (email, role, access group, status, created date).
 */
router.get('/accesscontrol', async (req, res) => {
  try {
    await ensureUserColumns();
    const { email, user_type } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;

    const { rows, total } = await listAccessControlUsers({ email, user_type, limit, offset });
    res.json({ rows, total, limit, offset });
  } catch (err) {
    console.error('[accesscontrol] GET error:', err);
    res.status(500).json({ rows: [], total: 0, limit: 50, offset: 0 });
  }
});

/**
 * PUT /api/admin/accesscontrol
 *
 * Update an existing app user (email, role, access group, active status).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, email?, user_type?, access_group_id?, is_active? }
 * Returns:
 *   200 { message: 'User updated', data: { id, email, user_type, access_group_id, is_active } }
 *   400 when id missing
 *   404 when user not found
 *   500 on error
 *
 * Called by: vianet/src/adminPages/adminUsers.tsx -> api.put('/api/admin/accesscontrol', {...})
 *   Displays: edits the selected user row (role/access group/active toggle) and refreshes the table.
 */
router.put('/accesscontrol', async (req, res) => {
  try {
    await ensureUserColumns();
    const { id, email, user_type, access_group_id, is_active } = req.body;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const data = await updateAccessControlUser({ id, email, user_type, access_group_id, is_active });
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated', data });
  } catch (err) {
    console.error('[accesscontrol] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/accesscontrol
 *
 * Delete an app user.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'User deleted' }
 *   400 when id missing
 *   404 when user not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently (adminUsers.tsx manages users via
 *   POST/PUT; DELETE is available for API/script use).
 */
router.delete('/accesscontrol', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const data = await deleteAccessControlUser(id);
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    console.error('[accesscontrol] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
