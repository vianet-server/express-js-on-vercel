const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

router.get('/settings', async (req, res) => {
  try {
    const users = await neonDb.query("SELECT userid, email, usertype, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 10");
    res.json(users.rows);
  } catch { res.json([]); }
});

router.get('/controls', async (req, res) => {
  try {
    const users = await neonDb.query("SELECT usertype AS category, COUNT(*) AS items FROM users GROUP BY usertype");
    res.json(users.rows);
  } catch { res.json([]); }
});

router.get('/profile', async (req, res) => {
  try {
    const user = await neonDb.query("SELECT userid, email, usertype, is_active, created_at, updated_at FROM users WHERE userid = $1", [req.user.id]);
    res.json(user.rows[0] || {});
  } catch { res.json({}); }
});

router.get('/sync', async (req, res) => {
  try {
    const result = await neonDb.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    res.json(result.rows);
  } catch { res.json([]); }
});

module.exports = router;
