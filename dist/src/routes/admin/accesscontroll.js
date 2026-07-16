"use strict";
/**
 * Admin Access Control Routes
 *
 * Handles CRUD operations for user access control / role management.
 * All routes require admin authentication via adminAuth middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const bcrypt = require('bcryptjs');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(adminAuth);
// Create a new user
router.post('/accesscontrol', async (req, res) => {
    try {
        const { email, password, usertype, is_active, access_group_id } = req.body;
        const password_hash = await bcrypt.hash(password, 10);
        const result = await neonDb.query('INSERT INTO app.users (email, password_hash, usertype, is_active, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING userid, email, usertype, is_active, access_group_id', [email, password_hash, usertype, is_active ?? true, access_group_id || null]);
        res.status(201).json({ message: 'User created', data: result.rows[0] });
    }
    catch (err) {
        console.error('[accesscontrol] POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// Get paginated users with optional filtering
router.get('/accesscontrol', async (req, res) => {
    try {
        const { email, usertype, is_active } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 50, 500);
        const offset = parseInt(req.query.offset) || 0;
        const filters = [];
        const params = [];
        let idx = 1;
        if (email) {
            filters.push(`u.email ILIKE $${idx++}`);
            params.push(`%${email}%`);
        }
        if (usertype) {
            filters.push(`u.usertype = $${idx++}`);
            params.push(usertype);
        }
        if (is_active !== undefined) {
            filters.push(`u.is_active = $${idx++}`);
            params.push(is_active === 'true');
        }
        const where = filters.length ? ' WHERE ' + filters.join(' AND ') : '';
        const countResult = await neonDb.query('SELECT COUNT(*) FROM app.users u' + where, params);
        const total = parseInt(countResult.rows[0].count);
        const dataQuery = `SELECT u.userid, u.email, u.usertype, u.is_active, u.created_at, u.updated_at, u.access_group_id, g.name AS access_group_name FROM app.users u LEFT JOIN app.access_groups g ON g.id = u.access_group_id${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(limit, offset);
        const result = await neonDb.query(dataQuery, params);
        res.json({ rows: result.rows, total, limit, offset });
    }
    catch (err) {
        console.error('[accesscontrol] GET error:', err);
        res.status(500).json({ rows: [], total: 0, limit: 50, offset: 0 });
    }
});
// Update a user by ID
router.put('/accesscontrol', async (req, res) => {
    try {
        const { userid, email, usertype, is_active, access_group_id } = req.body;
        const result = await neonDb.query('UPDATE app.users SET email = $1, usertype = $2, is_active = $3, access_group_id = $4, updated_at = NOW() WHERE userid = $5 RETURNING userid, email, usertype, is_active, access_group_id', [email, usertype, is_active, access_group_id || null, userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated', data: result.rows[0] });
    }
    catch (err) {
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
    }
    catch (err) {
        console.error('[accesscontrol] DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
