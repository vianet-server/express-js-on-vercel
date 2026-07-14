const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

router.get('/stats', (req, res) => {
  res.json({ totalRevenue: '0', totalOrders: '0', avgOrderValue: '0', conversionRate: '0' });
});

router.get('/monthly-trend', (req, res) => res.json([]));
router.get('/category-data', (req, res) => res.json([]));
router.get('/top-customers', (req, res) => res.json([]));
router.get('/daily-sales', (req, res) => res.json([]));
router.get('/sales-by-region', (req, res) => res.json([]));
router.get('/orders-by-channel', (req, res) => res.json([]));

module.exports = router;
