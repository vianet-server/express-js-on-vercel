const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { neonDb } = require('../../config/db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, user_type, access_group_id } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await neonDb.query('SELECT * FROM app.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const groupId = access_group_id || (await neonDb.query('SELECT MIN(id) as id FROM app.access_groups')).rows[0]?.id;
    if (!groupId) {
      return res.status(400).json({ message: 'No access group available. Contact admin.' });
    }
    const result = await neonDb.query(
      'INSERT INTO app.users (name, email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, email, user_type',
      [email, email, password_hash, user_type || 'user', groupId]
    );
    res.status(201).json({ message: 'User registered', data: result.rows[0] });
  } catch (err) {
    console.error('[auth] register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/signup-with-token', async (req, res) => {
  try {
    const { name, email, password, token } = req.body;
    if (!email || !password || !token) {
      return res.status(400).json({ message: 'Email, password, and token are required' });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }
    const user_type = payload.usertype || payload.user_type || 'user';
    const accessgroup = payload.accessgroup || payload.access_group_id;
    if (!accessgroup) {
      return res.status(400).json({ message: 'Invalid invitation token' });
    }
    const existing = await neonDb.query('SELECT * FROM app.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await neonDb.query(
      'INSERT INTO app.users (name, email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, email, user_type',
      [name || email, email, password_hash, user_type, accessgroup]
    );
    const authToken = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email, user_type: result.rows[0].user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token: authToken, message: 'Signup successful', email: result.rows[0].email, user_type: result.rows[0].user_type });
  } catch (err) {
    console.error('[auth] signup-with-token error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, message: 'login successful', email: user.email, user_type: user.user_type });
  } catch (err) {
    console.error('[auth] login error:', err);
    res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
