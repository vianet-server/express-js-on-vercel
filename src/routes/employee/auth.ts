/**
 * employee/auth.js
 *
 * Public authentication routes for employees.
 * Handles employee registration and login.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { neonDb } = require('../../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, employee_id, first_name, last_name, phone, designation } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await neonDb.query('SELECT * FROM app.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await neonDb.query(
      'INSERT INTO app.users (email, password_hash, usertype, is_active, created_at, updated_at) VALUES ($1, $2, $3, true, NOW(), NOW()) RETURNING userid, email, usertype',
      [email, password_hash, 'employee']
    );
    if (employee_id || first_name || last_name || phone || designation) {
      await neonDb.query(
        'INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [result.rows[0].userid, employee_id, first_name, last_name, phone, designation]
      );
    }
    const token = jwt.sign(
      { id: result.rows[0].userid, email: result.rows[0].email, usertype: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, message: 'Employee registered', email: result.rows[0].email, usertype: 'employee' });
  } catch (err) {
    console.error('[employee/auth] register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', token: null });
    }
    const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1 AND (usertype = $2 OR usertype = $3)', [email, 'employee', 'admin']);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }
    const hash = user.password_hash || user.password;
    const validPassword =  bcrypt.compare(password, hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }
    const token = jwt.sign(
      { id: user.userid, email: user.email, usertype: user.usertype },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, message: 'login successful', email: user.email, usertype: user.usertype });
  } catch (err) {
    console.error('[employee/auth] login error:', err);
    res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
