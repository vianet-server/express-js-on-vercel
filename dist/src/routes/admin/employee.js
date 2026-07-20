"use strict";
/**
 * Admin Employee Routes
 *
 * Handles employee profile and related operations.
 * All routes require admin authentication via adminAuth middleware.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(adminAuth);
router.get('/', async (req, res) => {
    try {
        const result = await neonDb.query('SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE user_type = $1', ['employee']);
        res.status(200).json({ message: 'Employees fetched', data: result.rows });
    }
    catch (err) {
        console.error('[admin/employee] GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { email, password, employee_id, first_name, last_name, phone, designation } = req.body;
        const bcrypt = require('bcryptjs');
        const password_hash = await bcrypt.hash(password, 10);
        const groupId = (await neonDb.query('SELECT MIN(id) as id FROM app.access_groups')).rows[0]?.id;
        if (!groupId) {
            return res.status(400).json({ message: 'No access group available.' });
        }
        const result = await neonDb.query('INSERT INTO app.users (email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, user_type', [email, password_hash, 'employee', groupId]);
        if (employee_id || first_name || last_name || phone || designation) {
            await neonDb.query('INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [result.rows[0].id, employee_id, first_name, last_name, phone, designation]);
        }
        res.status(201).json({ message: 'Employee created', data: result.rows[0] });
    }
    catch (err) {
        console.error('[admin/employee] POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await neonDb.query('SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1 AND user_type = $2', [id, 'employee']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const profileResult = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [id]);
        res.status(200).json({ message: 'Employee fetched', data: { ...result.rows[0], profile: profileResult.rows[0] || null } });
    }
    catch (err) {
        console.error('[admin/employee] GET by id error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, employee_id, first_name, last_name, phone, designation } = req.body;
        const userResult = await neonDb.query('UPDATE app.users SET email = $1, updated_at = NOW() WHERE id = $2 AND user_type = $3 RETURNING id, email, user_type', [email, id, 'employee']);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const existingProfile = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [id]);
        if (existingProfile.rows.length > 0) {
            await neonDb.query('UPDATE employee_profiles SET employee_id = $1, first_name = $2, last_name = $3, phone = $4, designation = $5, updated_at = NOW() WHERE user_id = $6', [employee_id, first_name, last_name, phone, designation, id]);
        }
        else if (employee_id || first_name || last_name) {
            await neonDb.query('INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [id, employee_id, first_name, last_name, phone, designation]);
        }
        res.status(200).json({ message: 'Employee updated', data: userResult.rows[0] });
    }
    catch (err) {
        console.error('[admin/employee] PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await neonDb.query('DELETE FROM app.users WHERE id = $1 AND user_type = $2 RETURNING id', [id, 'employee']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json({ message: 'Employee deleted' });
    }
    catch (err) {
        console.error('[admin/employee] DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
