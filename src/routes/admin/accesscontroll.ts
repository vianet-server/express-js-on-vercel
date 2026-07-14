/**
 * Admin Access Control Routes
 *
 * Handles CRUD operations for user access control / role management.
 * All routes require admin authentication via adminAuth middleware
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

// Create a new user / access control record
router.post('/accesscontrol', async (req, res) => {
  try {
    const { email, password, usertype, is_active } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const result = await neonDb.query(
      'INSERT INTO app.users (email, password_hash, usertype, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING userid, email, usertype, is_active',
      [email, password_hash, usertype, is_active ?? true]
    );
    res.status(201).json({ message: 'User created', data: result.rows[0] });
  } catch (err) {
    console.error('[accesscontrol] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all app.users / access control records with optional filtering
router.get('/accesscontrol', async (req, res) => {
  try {
    const { email, usertype, is_active } = req.query;
    let query = 'SELECT userid, email, usertype, is_active, created_at, updated_at FROM app.users WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (email) { query += ` AND email ILIKE $${idx++}`; params.push(`%${email}%`); }
    if (usertype) { query += ` AND usertype = $${idx++}`; params.push(usertype); }
    if (is_active !== undefined) { query += ` AND is_active = $${idx++}`; params.push(is_active === 'true'); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Users fetched', data: result.rows });
  } catch (err) {
    console.error('[accesscontrol] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a user by ID
router.put('/accesscontrol', async (req, res) => {
  try {
    const { userid, email, usertype, is_active } = req.body;
    const result = await neonDb.query(
      'UPDATE app.users SET email = $1, usertype = $2, is_active = $3, updated_at = NOW() WHERE userid = $4 RETURNING userid, email, usertype, is_active',
      [email, usertype, is_active, userid]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated', data: result.rows[0] });
  } catch (err) {
    console.error('[accesscontrol] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a user by ID
router.delete('/accesscontrol', async (req, res) => {
  try {
    const { userid } = req.body;
    const result = await neonDb.query('DELETE FROM app.users WHERE userid = $1 RETURNING userid', [userid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    console.error('[accesscontrol] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
