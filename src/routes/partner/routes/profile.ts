const express = require('express');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');

const router = express.Router();

router.use(auth('partner'));

router.get('/', async (req, res) => {
  try {
    const user_id = req.user.id;
    const userResult = await neonDb.query('SELECT id, email, user_type FROM app.users WHERE id = $1', [user_id]);
    const profileResult = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [user_id]);
    res.status(200).json({ message: 'Partner profile fetched', data: { ...userResult.rows[0], profile: profileResult.rows[0] || null } });
  } catch (err) {
    console.error('[partner/profile] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const user_id = req.user.id;
    const { company_name, phone, address } = req.body;
    const existing = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [user_id]);
    if (existing.rows.length > 0) {
      await neonDb.query(
        'UPDATE partner_profiles SET company_name = $1, phone = $2, address = $3, updated_at = NOW() WHERE user_id = $4',
        [company_name, phone, address, user_id]
      );
    } else {
      await neonDb.query(
        'INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [user_id, company_name, phone, address]
      );
    }
    res.status(200).json({ message: 'Partner profile updated' });
  } catch (err) {
    console.error('[partner/profile] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
