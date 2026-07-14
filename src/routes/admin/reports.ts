const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

router.get('/pnl', async (req, res) => {
  try {
    const ledgers = await neonDb.query("SELECT id, name, COALESCE(opening_balance, 0) AS balance, type FROM ledgers ORDER BY name");
    res.json(ledgers.rows);
  } catch { res.json([]); }
});

router.get('/outstanding', async (req, res) => {
  try {
    const ledgers = await neonDb.query("SELECT id, name, COALESCE(opening_balance, 0) AS amount, type AS status FROM ledgers ORDER BY name");
    res.json(ledgers.rows);
  } catch { res.json([]); }
});

router.get('/balance-sheet', async (req, res) => {
  try {
    const ledgers = await neonDb.query("SELECT id, name, COALESCE(opening_balance, 0) AS balance, type FROM ledgers ORDER BY type, name");
    res.json(ledgers.rows);
  } catch { res.json([]); }
});

router.get('/daybook', async (req, res) => {
  try {
    const vouchers = await neonDb.query("SELECT id, type, number, date, amount, narration FROM vouchers ORDER BY date DESC LIMIT 100");
    res.json(vouchers.rows);
  } catch { res.json([]); }
});

module.exports = router;
