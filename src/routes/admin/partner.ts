/**
 * Admin Partner Routes
 *
 * Handles partner profile and related operations.
 * All routes require admin authentication via adminAuth middleware.
 */

const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

// Get all partners (users with usertype = 'partner')
router.get('/', async (req, res) => {
  try {
    const result = await neonDb.query(
      'SELECT userid, email, usertype, is_active, created_at, updated_at FROM app.users WHERE usertype = $1',
      ['partner']
    );
    res.status(200).json({ message: 'Partners fetched', data: result.rows });
  } catch (err) {
    console.error('[admin/partner] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new partner
router.post('/', async (req, res) => {
  try {
    const { email, password, company_name, phone, address, is_active } = req.body;
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);
    const result = await neonDb.query(
      'INSERT INTO app.users (email, password_hash, usertype, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING userid, email, usertype, is_active',
      [email, password_hash, 'partner', is_active ?? true]
    );
    if (company_name || phone || address) {
      await neonDb.query(
        'INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [result.rows[0].userid, company_name, phone, address]
      );
    }
    res.status(201).json({ message: 'Partner created', data: result.rows[0] });
  } catch (err) {
    console.error('[admin/partner] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a single partner by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query(
      'SELECT userid, email, usertype, is_active, created_at, updated_at FROM app.users WHERE userid = $1 AND usertype = $2',
      [id, 'partner']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    const profileResult = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [id]);
    res.status(200).json({ message: 'Partner fetched', data: { ...result.rows[0], profile: profileResult.rows[0] || null } });
  } catch (err) {
    console.error('[admin/partner] GET by id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a partner by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, company_name, phone, address, is_active } = req.body;
    const userResult = await neonDb.query(
      'UPDATE app.users SET email = $1, is_active = $2, updated_at = NOW() WHERE userid = $3 AND usertype = $4 RETURNING userid, email, usertype, is_active',
      [email, is_active, id, 'partner']
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    const existingProfile = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [id]);
    if (existingProfile.rows.length > 0) {
      await neonDb.query(
        'UPDATE partner_profiles SET company_name = $1, phone = $2, address = $3, updated_at = NOW() WHERE user_id = $4',
        [company_name, phone, address, id]
      );
    } else if (company_name || phone || address) {
      await neonDb.query(
        'INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [id, company_name, phone, address]
      );
    }
    res.status(200).json({ message: 'Partner updated', data: userResult.rows[0] });
  } catch (err) {
    console.error('[admin/partner] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a partner by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query('DELETE FROM app.users WHERE userid = $1 AND usertype = $2 RETURNING userid', [id, 'partner']);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.status(200).json({ message: 'Partner deleted' });
  } catch (err) {
    console.error('[admin/partner] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
