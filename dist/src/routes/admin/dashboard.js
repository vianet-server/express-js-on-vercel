"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(adminAuth);
router.get('/stats', async (req, res) => {
    try {
        const ts = await neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS total, COUNT(*) AS orders FROM app.sales_records WHERE sales_date = CURRENT_DATE");
        const ys = await neonDb.query("SELECT COALESCE(SUM(bill_amt),0) AS total FROM app.sales_records WHERE sales_date = CURRENT_DATE - 1");
        const sm = await neonDb.query("SELECT salesman AS name, SUM(bill_amt) AS amount FROM app.sales_records WHERE sales_date = CURRENT_DATE AND salesman IS NOT NULL AND salesman != '' GROUP BY salesman ORDER BY amount DESC LIMIT 1");
        const sv = await neonDb.query("SELECT COALESCE(SUM(quantity * price),0) AS total FROM app.stock");
        const today = parseFloat(ts.rows[0].total);
        const yesterday = parseFloat(ys.rows[0].total);
        const orders = parseInt(ts.rows[0].orders);
        const pct = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : (today > 0 ? 100 : 0);
        res.json({
            todaySale: today,
            saleChangePercent: pct,
            totalProfit: today * 0.2,
            profitChangePercent: 0,
            totalSpend: parseFloat(sv.rows[0].total),
            spendChangePercent: 0,
            topSalesman: sm.rows.length > 0 ? { name: sm.rows[0].name, amount: parseFloat(sm.rows[0].amount) } : null,
            totalOrders: orders,
        });
    }
    catch (err) {
        console.error('[dashboard] stats error:', err);
        res.json({ todaySale: 0, saleChangePercent: 0, totalProfit: 0, profitChangePercent: 0, totalSpend: 0, spendChangePercent: 0, topSalesman: null, totalOrders: 0 });
    }
});
router.get('/top-salesmen', async (req, res) => {
    try {
        const r = await neonDb.query("SELECT salesman AS name, SUM(bill_amt) AS sales FROM app.sales_records WHERE salesman IS NOT NULL AND salesman != '' GROUP BY salesman ORDER BY sales DESC LIMIT 5");
        res.json(r.rows.map(function (x) { return { name: x.name, sales: parseFloat(x.sales) || 0 }; }));
    }
    catch (e) {
        console.error('[dashboard] top-salesmen error:', e);
        res.json([]);
    }
});
router.get('/monthly-trend', async (req, res) => {
    try {
        const r = await neonDb.query("SELECT TO_CHAR(DATE_TRUNC('month', sales_date), 'Mon YYYY') AS month, SUM(bill_amt) AS sales FROM app.sales_records WHERE sales_date >= CURRENT_DATE - INTERVAL '12 months' GROUP BY DATE_TRUNC('month', sales_date) ORDER BY DATE_TRUNC('month', sales_date)");
        res.json(r.rows.map(function (x) { return { month: x.month, sales: parseFloat(x.sales) || 0, profit: (parseFloat(x.sales) || 0) * 0.2 }; }));
    }
    catch (e) {
        console.error('[dashboard] monthly-trend error:', e);
        res.json([]);
    }
});
router.get('/product-share', async (req, res) => {
    try {
        const r = await neonDb.query("SELECT stockname AS name, COALESCE(quantity, 0) AS value FROM app.stock ORDER BY quantity DESC LIMIT 10");
        res.json(r.rows);
    }
    catch (e) {
        console.error('[dashboard] product-share error:', e);
        res.json([]);
    }
});
module.exports = router;
