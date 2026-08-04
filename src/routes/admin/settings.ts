const express = require('express');
const { listRecentUsers, countUsersByType, getUserProfileById, listPublicTables } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * GET /api/admin/settings/settings
 *
 * Recent users (up to 10) — used as a general settings page data source.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, email, user_type, created_at }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/settings.tsx -> api.get('/api/admin/settings/settings')
 *   Displays: settings page showing recent user accounts.
 */
router.get('/settings', async (req, res) => {
  try {
    const users = await listRecentUsers();
    res.json(users);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/settings/controls
 *
 * User counts grouped by user_type — powers the settings "controls" view.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ category, items }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/settingsControl.tsx -> api.get('/api/admin/settings/controls')
 *   Displays: controls/settings cards with counts per user category.
 */
router.get('/controls', async (req, res) => {
  try {
    const users = await countUsersByType();
    res.json(users);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/settings/profile
 *
 * Current admin's own profile (from the JWT id in req.user).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { id, email, user_type, created_at, updated_at } or {} if not found
 *   500 fallback {}
 *
 * Called by: vianet/src/adminPages/profile.tsx -> api.get('/api/admin/settings/profile')
 *   Displays: admin profile card (email, user type, created date).
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await getUserProfileById(req.user.id);
    res.json(user || {});
  } catch { res.json({}); }
});

/**
 * GET /api/admin/settings/sync
 *
 * List public-schema tables (sync history source).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ tablename }]
 *   500 fallback []
 *
 * NOTE: vianet/src/adminPages/sync.tsx also POSTs to /api/admin/settings/sync to
 * trigger a sync — that POST endpoint is NOT implemented on the server.
 *
 * Called by: vianet/src/adminPages/sync.tsx -> api.get('/api/admin/settings/sync')
 *   Displays: sync history list (filters rows that look like sync records).
 */
router.get('/sync', async (req, res) => {
  try {
    const result = await listPublicTables();
    res.json(result);
  } catch { res.json([]); }
});

module.exports = router;
