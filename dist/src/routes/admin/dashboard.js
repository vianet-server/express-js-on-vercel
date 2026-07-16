"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(adminAuth);
router.get('/stats', async (req, res) => {
    try {
        const stockCount = await neonDb.query('SELECT COUNT(*) FROM app.stock');
        const totalStock = await neonDb.query('SELECT COALESCE(SUM(quantity), 0) FROM app.stock');
        const lowStock = await neonDb.query("SELECT COUNT(*) FROM app.stock WHERE quantity <= COALESCE((SELECT 0), 0)");
        const stockValue = await neonDb.query('SELECT COALESCE(SUM(quantity * price), 0) FROM app.stock');
        res.json({
            totalProducts: parseInt(stockCount.rows[0].count),
            totalStock: parseInt(totalStock.rows[0].coalesce),
            lowStockItems: parseInt(lowStock.rows[0].count),
            stockValue: parseFloat(stockValue.rows[0].coalesce),
        });
    }
    catch (err) {
        console.error('[dashboard] stats error:', err);
        res.json({ totalProducts: 0, totalStock: 0, lowStockItems: 0, stockValue: 0 });
    }
});
router.get('/top-salesmen', async (req, res) => {
    try {
        const result = await neonDb.query('SELECT id AS name, COALESCE(SUM(0), 0) AS sales FROM godowns GROUP BY id LIMIT 5');
        res.json(result.rows);
    }
    catch {
        res.json([]);
    }
});
router.get('/monthly-trend', async (req, res) => {
    res.json([]);
});
router.get('/product-share', async (req, res) => {
    try {
        const result = await neonDb.query("SELECT stockname AS name, COALESCE(quantity, 0) AS value FROM app.stock ORDER BY quantity DESC LIMIT 10");
        res.json(result.rows);
    }
    catch {
        res.json([]);
    }
});
module.exports = router;
