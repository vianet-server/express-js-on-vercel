"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        const groupId = (await neonDb.query('SELECT MIN(id) as id FROM app.access_groups')).rows[0]?.id;
        if (!groupId) {
            return res.status(400).json({ message: 'No access group available. Contact admin.' });
        }
        const result = await neonDb.query('INSERT INTO app.users (email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, user_type', [email, password_hash, 'employee', groupId]);
        if (employee_id || first_name || last_name || phone || designation) {
            await neonDb.query('INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [result.rows[0].id, employee_id, first_name, last_name, phone, designation]);
        }
        const token = jwt.sign({ id: result.rows[0].id, email: result.rows[0].email, user_type: 'employee' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, message: 'Employee registered', email: result.rows[0].email, user_type: 'employee' });
    }
    catch (err) {
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
        const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1 AND (user_type = $2 OR user_type = $3)', [email, 'employee', 'admin']);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials', token: null });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials', token: null });
        }
        const token = jwt.sign({ id: user.id, email: user.email, user_type: user.user_type }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, message: 'login successful', email: user.email, user_type: user.user_type });
    }
    catch (err) {
        console.error('[employee/auth] login error:', err);
        res.status(500).json({ message: 'Server error', token: null, error: err.message });
    }
});
module.exports = router;
