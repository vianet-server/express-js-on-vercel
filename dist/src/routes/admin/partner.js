"use strict";
/**
 * Admin Partner Routes
 *
 * Handles partner profile and related operations.
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
        const result = await neonDb.query('SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE user_type = $1', ['partner']);
        res.status(200).json({ message: 'Partners fetched', data: result.rows });
    }
    catch (err) {
        console.error('[admin/partner] GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { email, password, company_name, phone, address } = req.body;
        const bcrypt = require('bcryptjs');
        const password_hash = await bcrypt.hash(password, 10);
        const groupId = (await neonDb.query('SELECT MIN(id) as id FROM app.access_groups')).rows[0]?.id;
        if (!groupId) {
            return res.status(400).json({ message: 'No access group available.' });
        }
        const result = await neonDb.query('INSERT INTO app.users (email, password, user_type, access_group_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, user_type', [email, password_hash, 'partner', groupId]);
        if (company_name || phone || address) {
            await neonDb.query('INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())', [result.rows[0].id, company_name, phone, address]);
        }
        res.status(201).json({ message: 'Partner created', data: result.rows[0] });
    }
    catch (err) {
        console.error('[admin/partner] POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await neonDb.query('SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1 AND user_type = $2', [id, 'partner']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        const profileResult = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [id]);
        res.status(200).json({ message: 'Partner fetched', data: { ...result.rows[0], profile: profileResult.rows[0] || null } });
    }
    catch (err) {
        console.error('[admin/partner] GET by id error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, company_name, phone, address } = req.body;
        const userResult = await neonDb.query('UPDATE app.users SET email = $1, updated_at = NOW() WHERE id = $2 AND user_type = $3 RETURNING id, email, user_type', [email, id, 'partner']);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        const existingProfile = await neonDb.query('SELECT * FROM partner_profiles WHERE user_id = $1', [id]);
        if (existingProfile.rows.length > 0) {
            await neonDb.query('UPDATE partner_profiles SET company_name = $1, phone = $2, address = $3, updated_at = NOW() WHERE user_id = $4', [company_name, phone, address, id]);
        }
        else if (company_name || phone || address) {
            await neonDb.query('INSERT INTO partner_profiles (user_id, company_name, phone, address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())', [id, company_name, phone, address]);
        }
        res.status(200).json({ message: 'Partner updated', data: userResult.rows[0] });
    }
    catch (err) {
        console.error('[admin/partner] PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await neonDb.query('DELETE FROM app.users WHERE id = $1 AND user_type = $2 RETURNING id', [id, 'partner']);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        res.status(200).json({ message: 'Partner deleted' });
    }
    catch (err) {
        console.error('[admin/partner] DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
