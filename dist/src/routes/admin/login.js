"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { neonDb } = require('../../config/db');
const router = express.Router();
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required', token: null });
        }
        const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1 LIMIT 1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials', token: null });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials', token: null });
        }
        const token = jwt.sign({ id: user.id, email: user.email, user_type: user.user_type }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, message: 'login successful', user });
    }
    catch (err) {
        console.error('[admin/login] error:', err);
        res.status(500).json({ message: 'Server error', token: null, error: err.message });
    }
});
module.exports = router;
