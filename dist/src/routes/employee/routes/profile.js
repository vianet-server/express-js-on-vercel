"use strict";
/**
 * employee/routes/profile.js
 *
 * Employee profile routes.
 * Requires authentication.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');
const router = express.Router();
router.use(auth('employee'));
router.get('/', async (req, res) => {
    try {
        const user_id = req.user.id;
        const userResult = await neonDb.query('SELECT userid, email, usertype, is_active FROM app.users WHERE userid = $1', [user_id]);
        const profileResult = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [user_id]);
        res.status(200).json({ message: 'Employee profile fetched', data: { ...userResult.rows[0], profile: profileResult.rows[0] || null } });
    }
    catch (err) {
        console.error('[employee/profile] GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.put('/', async (req, res) => {
    try {
        const user_id = req.user.id;
        const { employee_id, first_name, last_name, phone, designation } = req.body;
        const existing = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [user_id]);
        if (existing.rows.length > 0) {
            await neonDb.query('UPDATE employee_profiles SET employee_id = $1, first_name = $2, last_name = $3, phone = $4, designation = $5, updated_at = NOW() WHERE user_id = $6', [employee_id, first_name, last_name, phone, designation, user_id]);
        }
        else {
            await neonDb.query('INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [user_id, employee_id, first_name, last_name, phone, designation]);
        }
        res.status(200).json({ message: 'Employee profile updated' });
    }
    catch (err) {
        console.error('[employee/profile] PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
