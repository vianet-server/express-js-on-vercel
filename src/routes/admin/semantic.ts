const express = require('express');
const { getSemanticSales, getSemanticInventory } = require('../../config/dbqueries/semantic');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

router.get('/sales', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const data = await getSemanticSales(period);
    res.json(data);
  } catch (err) {
    console.error('[semantic] sales error:', err);
    res.json({ overview: { total_sales: 0, total_orders: 0 }, bySalesperson: [], trend: [] });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    const data = await getSemanticInventory();
    res.json(data);
  } catch (err) {
    console.error('[semantic] inventory error:', err);
    res.json({ overview: { total_value: 0, total_qty: 0 }, outOfStock: [], byBrand: [] });
  }
});

module.exports = router;
