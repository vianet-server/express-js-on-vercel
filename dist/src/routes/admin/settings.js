"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(adminAuth);
router.get('/settings', async (req, res) => {
    try {
        const users = await neonDb.query("SELECT id, email, user_type, created_at FROM app.users ORDER BY created_at DESC LIMIT 10");
        res.json(users.rows);
    }
    catch {
        res.json([]);
    }
});
router.get('/controls', async (req, res) => {
    try {
        const users = await neonDb.query("SELECT user_type AS category, COUNT(*) AS items FROM app.users GROUP BY user_type");
        res.json(users.rows);
    }
    catch {
        res.json([]);
    }
});
router.get('/profile', async (req, res) => {
    try {
        const user = await neonDb.query("SELECT id, email, user_type, created_at, updated_at FROM app.users WHERE id = $1", [req.user.id]);
        res.json(user.rows[0] || {});
    }
    catch {
        res.json({});
    }
});
router.get('/sync', async (req, res) => {
    try {
        const result = await neonDb.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename");
        res.json(result.rows);
    }
    catch {
        res.json([]);
    }
});
module.exports = router;
