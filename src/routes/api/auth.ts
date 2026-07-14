/**
 * api/auth.js
 *
 * Public authentication routes for the API.
 * Does not require admin authentication.
 * Handles user registration and login.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { neonDb } = require('../../config/db');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, usertype } = req.body;
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
      [email, password_hash, usertype || 'user']
    );
    res.status(201).json({ message: 'User registered', data: result.rows[0] });
  } catch (err) {
    console.error('[auth] register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login for non-admin users
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', token: null });
    }
    const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }
    const hash = user.password_hash || user.password;
    const validPassword = await bcrypt.compare(password, hash);
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
    console.error('[auth] login error:', err);
    res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
