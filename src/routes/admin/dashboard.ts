const express = require('express');
const { getDashboardStats, getTopSalesmen, getDashboardMonthlyTrend, getProductShare } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * GET /api/admin/dashboard/stats
 *
 * Today's sales/orders, change % vs yesterday, total stock value, and the top salesman.
 * Profit is estimated as 20% of today's sales.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { todaySale, saleChangePercent, totalProfit, profitChangePercent, totalSpend, spendChangePercent, topSalesman: { name, amount } | null, totalOrders }
 *   500 fallback zeroed object
 *
 * Called by: vianet/src/adminPages/dashboard.tsx -> useAdminQuery('/api/admin/dashboard/stats')
 *   Displays: KPI cards (today's sale, profit, spend, orders) and the top salesman.
 */
router.get('/stats', async (req, res) => {
  try {
    const { today, yesterday, topSalesman, stockValue } = await getDashboardStats();

    const todaySale = parseFloat(today.total);
    const yesterdaySale = parseFloat(yesterday.total);
    const orders = parseInt(today.orders);
    const pct = yesterdaySale > 0 ? Math.round(((todaySale - yesterdaySale) / yesterdaySale) * 100) : (todaySale > 0 ? 100 : 0);

    res.json({
      todaySale,
      saleChangePercent: pct,
      totalProfit: todaySale * 0.2,
      profitChangePercent: 0,
      totalSpend: stockValue,
      spendChangePercent: 0,
      topSalesman: topSalesman ? { name: topSalesman.name, amount: parseFloat(topSalesman.amount) } : null,
      totalOrders: orders,
    });
  } catch (err) {
    console.error('[dashboard] stats error:', err);
    res.json({ todaySale: 0, saleChangePercent: 0, totalProfit: 0, profitChangePercent: 0, totalSpend: 0, spendChangePercent: 0, topSalesman: null, totalOrders: 0 });
  }
});

/**
 * GET /api/admin/dashboard/top-salesmen
 *
 * Top 5 salesmen by total bill amount.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ name, sales }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/dashboard.tsx -> useAdminQuery('/api/admin/dashboard/top-salesmen')
 *   Displays: top salesmen leaderboard (names + sales).
 */
router.get('/top-salesmen', async (req, res) => {
  try {
    const r = await getTopSalesmen();
    res.json(r.map(function(x) { return { name: x.name, sales: parseFloat(x.sales) || 0 }; }));
  } catch (e) { console.error('[dashboard] top-salesmen error:', e); res.json([]); }
});

/**
 * GET /api/admin/dashboard/monthly-trend
 *
 * Monthly sales for the last 12 months. Profit is estimated at 20% of sales.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ month: 'Jan 2026', sales, profit }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/dashboard.tsx -> useAdminQuery('/api/admin/dashboard/monthly-trend')
 *   Displays: monthly sales trend chart.
 */
router.get('/monthly-trend', async (req, res) => {
  try {
    const r = await getDashboardMonthlyTrend();
    res.json(r.map(function(x) { return { month: x.month, sales: parseFloat(x.sales) || 0, profit: (parseFloat(x.sales) || 0) * 0.2 }; }));
  } catch (e) { console.error('[dashboard] monthly-trend error:', e); res.json([]); }
});

/**
 * GET /api/admin/dashboard/product-share
 *
 * Top 10 products by quantity (donut/pie share data).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ name, value }]  (value = stock quantity)
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/dashboard.tsx -> useAdminQuery('/api/admin/dashboard/product-share')
 *   Displays: product share chart by stock quantity.
 */
router.get('/product-share', async (req, res) => {
  try {
    const r = await getProductShare();
    res.json(r);
  } catch (e) { console.error('[dashboard] product-share error:', e); res.json([]); }
});

module.exports = router;