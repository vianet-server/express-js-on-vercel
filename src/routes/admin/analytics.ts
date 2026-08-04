const express = require('express');
const {
  getAnalyticsStats,
  getAnalyticsMonthlyTrend,
  getAnalyticsCategoryData,
  getAnalyticsTopCustomers,
  getAnalyticsDailySales,
  getAnalyticsSalesByRegion,
  getAnalyticsOrdersByChannel,
} = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

function fmtMonth(d: Date) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getFullYear();
}

function fmtDay(d: Date) {
  return d.toISOString().split('T')[0];
}

/**
 * GET /api/admin/analytics/stats
 *
 * Overall analytics KPIs from sales-type vouchers: total revenue/orders,
 * average order value, and % change vs the previous year. Note the "current"
 * period is hard-coded to 2026 and "previous" to 2025.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { totalRevenue, totalOrders, avgOrderValue, conversionRate, revenueChange, ordersChange, avgOrderValueChange, conversionRateChange }
 *   conversionRate and the two Change fields are static values.
 *   500 fallback { totalRevenue: '0', totalOrders: '0', avgOrderValue: '0', conversionRate: '0' }
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/stats')
 *   Displays: analytics KPI cards (revenue, orders, avg order value, conversion).
 */
router.get('/stats', async (req, res) => {
  try {
    const { all, current, prev } = await getAnalyticsStats();

    const c = current;
    const p = prev;
    const a = all;
    const cRev = parseFloat(c.revenue) || 0;
    const pRev = parseFloat(p.revenue) || 0;
    const cOrd = parseInt(c.orders) || 0;
    const pOrd = parseInt(p.orders) || 0;
    const tOrd = parseInt(a.total_orders) || 0;
    const tRev = parseFloat(a.total_revenue) || 0;

    res.json({
      totalRevenue: String(tRev),
      totalOrders: String(tOrd),
      avgOrderValue: tOrd > 0 ? (tRev / tOrd).toFixed(2) : '0',
      conversionRate: '14.6',
      revenueChange: pRev > 0 ? ((cRev - pRev) / pRev * 100).toFixed(1) : '0',
      ordersChange: pOrd > 0 ? ((cOrd - pOrd) / pOrd * 100).toFixed(1) : '0',
      avgOrderValueChange: '3.2',
      conversionRateChange: '-0.8',
    });
  } catch { res.json({ totalRevenue: '0', totalOrders: '0', avgOrderValue: '0', conversionRate: '0' }); }
});

/**
 * GET /api/admin/analytics/monthly-trend
 *
 * Monthly sales voucher revenue for 2026 (Jan-Dec), as a line/bar trend.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ month: 'Jan 2026', sales, profit }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/monthly-trend')
 *   Displays: monthly revenue trend chart.
 */
router.get('/monthly-trend', async (req, res) => {
  try {
    const result = await getAnalyticsMonthlyTrend();
    const rows = result.map((r: any) => ({
      month: fmtMonth(new Date(r.month)),
      sales: parseFloat(r.sales) || 0,
      profit: parseInt(r.profit) || 0,
    }));
    res.json(rows);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/analytics/category-data
 *
 * Top 10 sales voucher types (labels stripped of the "Sales " prefix) by revenue,
 * with share percentage of the grand total.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ name, value, count }]  (value = % share 0-100, count = voucher count)
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/category-data')
 *   Displays: category/revenue-share chart.
 */
router.get('/category-data', async (req, res) => {
  try {
    const result = await getAnalyticsCategoryData();
    const grandTotal = result.reduce((s: number, r: any) => s + (parseFloat(r.total) || 0), 0);
    const rows = result.map((r: any) => ({
      name: r.name.replace(/^Sales\s+/i, ''),
      value: grandTotal > 0 ? Math.round((parseFloat(r.total) || 0) / grandTotal * 100) : 0,
      count: parseInt(r.count) || 0,
    }));
    res.json(rows);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/analytics/top-customers
 *
 * Top 10 customers by spend on sales vouchers, ranked with a status bucket
 * (VIP > 5L, Regular > 1L, else Standard).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ rank, name, orders, spent, status }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/top-customers')
 *   Displays: top customers list with orders/spend/status.
 */
router.get('/top-customers', async (req, res) => {
  try {
    const result = await getAnalyticsTopCustomers();
    const rows = result.map((r: any, i: number) => {
      const spent = parseFloat(r.spent) || 0;
      return {
        rank: i + 1,
        name: r.name,
        orders: parseInt(r.orders) || 0,
        spent,
        status: spent > 500000 ? 'VIP' : spent > 100000 ? 'Regular' : 'Standard',
      };
    });
    res.json(rows);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/analytics/daily-sales
 *
 * Daily sales (revenue + orders) from sales vouchers over the last 90 days
 * (grouped by Asia/Kolkata date).
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ day: 'YYYY-MM-DD', sales, orders }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/daily-sales')
 *   Displays: daily sales line chart.
 */
router.get('/daily-sales', async (req, res) => {
  try {
    const result = await getAnalyticsDailySales();
    const rows = result.map((r: any) => ({
      day: r.day ? fmtDay(new Date(r.day)) : '',
      sales: parseFloat(r.sales) || 0,
      orders: parseInt(r.orders) || 0,
    }));
    res.json(rows);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/analytics/sales-by-region
 *
 * Top 10 regions by sales from app.sales_records since 2026-01-01.
 * Region = sales_records.parent, or 'Other' when empty.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ region, sales }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/sales-by-region')
 *   Displays: sales-by-region chart.
 */
router.get('/sales-by-region', async (req, res) => {
  try {
    const result = await getAnalyticsSalesByRegion();
    const rows = result.map((r: any) => ({
      region: r.region,
      sales: parseFloat(r.sales) || 0,
    }));
    res.json(rows);
  } catch { res.json([]); }
});

/**
 * GET /api/admin/analytics/orders-by-channel
 *
 * Monthly order counts split by voucher-type buckets (retail=Sales, direct=Receipt,
 * online=Payment, phone=Purchase) since 2026-01-01.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ month: 'Jan 2026', direct, online, phone }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/analytics.tsx -> api.get('/api/admin/analytics/orders-by-channel')
 *   Displays: stacked channel order chart.
 */
router.get('/orders-by-channel', async (req, res) => {
  try {
    const result = await getAnalyticsOrdersByChannel();
    const rows = result.map((r: any) => {
      const m = new Date(r.month);
      return {
        month: fmtMonth(m),
        direct: parseInt(r.direct) || 0,
        online: parseInt(r.online) || 0,
        phone: parseInt(r.phone) || 0,
      };
    });
    res.json(rows);
  } catch { res.json([]); }
});

module.exports = router;
