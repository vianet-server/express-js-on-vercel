"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { neonPool } = require('../config/db');
async function dbCheck(req, res) {
    try {
        const result = await neonPool.query('SELECT * FROM app.users ORDER BY id LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, error: 'No users found' });
        }
        res.json({ ok: true, user: result.rows[0] });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
}
module.exports = dbCheck;
