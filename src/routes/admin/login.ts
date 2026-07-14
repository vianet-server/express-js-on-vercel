/**
 * Admin Login Route
 *
 * Handles admin authentication.
 * Verifies credentials against the users table.
 * Returns a JWT token on successful login.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { neonDb } = require('../../config/db');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', token: null });
    }

    res.setHeader('Content-Type', 'application/json');
    const result = await neonDb.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('[login] query rows:', result.rows.length);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }

    console.log('[login] user found, usertype:', user.usertype);
    if (user.usertype !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.', token: null });
    }

    const hash = user.password_hash || user.password;
    console.log('[login] hash prefix:', hash ? hash.substring(0, 7) : 'null');
    const validPassword = await bcrypt.compare(password, hash);
    console.log('[login] password valid:', validPassword);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }

    const token = jwt.sign(
      { id: user.userid, email: user.email, usertype: user.usertype },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, message: 'login successful', email: user.email, usertype: user.usertype });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
