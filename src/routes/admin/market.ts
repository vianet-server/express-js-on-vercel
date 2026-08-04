const express = require('express');
const { getMarketOverview, getMarketSalesTrend, getMarketCategoryData, getMarketCandlestick } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * GET /api/admin/market
 *
 * Market overview: 30-day sales/orders vs the prior 30 days, today vs yesterday
 * volume, top 10 products by value, total stock count, top 5 regions, plus a
 * formatted summary list.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 {
 *     marketIndex: { value, change, changePct, dayChange, dayChangePct, volume, volumeChange },
 *     topMovers: [{ rank, product, category, price, total_value }],
 *     marketSummary: [{ label, value }]
 *   }
 *   500 fallback zeroed object
 *
 * Called by: vianet/src/adminPages/market.tsx -> useAdminQuery('/api/admin/market')
 *   Displays: market index card, top movers, and summary stats.
 */
router.get('/', async (req, res) => {
  try {
    const { now30, prev30, todaySales, yesterdaySales, topProducts, stockCount, regionData } = await getMarketOverview();

    const n30 = parseFloat(now30.rows[0].total);
    const ord30 = parseInt(now30.rows[0].orders);
    const p30 = parseFloat(prev30.rows[0].total);
    const diff = n30 - p30;
    const diffPct = p30 > 0 ? Math.round((diff / p30) * 100) : (n30 > 0 ? 100 : 0);
    const tVol = parseFloat(todaySales.rows[0].vol);
    const yVol = parseFloat(yesterdaySales.rows[0].vol);
    const volChange = yVol > 0 ? Math.round(((tVol - yVol) / yVol) * 100) : (tVol > 0 ? 100 : 0);
    const totalStock = parseInt(stockCount.rows[0].cnt);

    const topMovers = topProducts.rows.map(function(r, i) {
      return {
        rank: i + 1,
        product: r.stockname,
        category: 'General',
        price: parseFloat(r.price) || 0,
        total_value: parseFloat(r.total_value) || 0,
      };
    });

    const marketSummary = [
      { label: 'Total Products', value: String(totalStock) },
      { label: '30-Day Sales', value: '\u20b9' + n30.toLocaleString('en-IN') },
      { label: '30-Day Orders', value: String(ord30) },
      { label: 'Avg Daily Sales', value: '\u20b9' + Math.round(n30 / 30).toLocaleString('en-IN') },
      { label: 'Active Regions', value: String(regionData.rows.length) },
    ];

    res.json({
      marketIndex: {
        value: '\u20b9' + n30.toLocaleString('en-IN'),
        change: (diff >= 0 ? '+' : '') + Math.round(diff).toLocaleString('en-IN'),
        changePct: (diffPct >= 0 ? '+' : '') + diffPct,
        dayChange: tVol,
        dayChangePct: volChange,
        volume: tVol,
        volumeChange: volChange,
      },
      topMovers,
      marketSummary,
    });
  } catch (err) {
    console.error('[market] error:', err);
    res.json({ marketIndex: { value: '\u20b90', change: '0', changePct: '0', dayChange: 0, dayChangePct: 0, volume: 0, volumeChange: 0 }, topMovers: [], marketSummary: [] });
  }
});

/**
 * GET /api/admin/market/sales-trend
 *
 * Daily sales (revenue + orders) from app.sales_records for the last 30 days.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ day, sales, orders }]
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/market.tsx -> useAdminQuery('/api/admin/market/sales-trend')
 *   Displays: 30-day sales trend chart.
 */
router.get('/sales-trend', async (req, res) => {
  try {
    const r = await getMarketSalesTrend();
    res.json(r.map(function(x) {
      return { day: x.day, sales: parseFloat(x.sales) || 0, orders: parseInt(x.orders) || 0 };
    }));
  } catch (e) { console.error('[market] sales-trend error:', e); res.json([]); }
});

/**
 * GET /api/admin/market/category-data
 *
 * Top 10 products by stock value with % share of the total.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ name, value, count, total }]  (value = % share 0-100)
 *   500 fallback []
 *
 * Called by: vianet/src/adminPages/market.tsx -> useAdminQuery('/api/admin/market/category-data')
 *   Displays: category share chart.
 */
router.get('/category-data', async (req, res) => {
  try {
    const r = await getMarketCategoryData();
    const total = r.reduce(function(s, x) { return s + (parseFloat(x.total) || 0); }, 0);
    res.json(r.map(function(x, i) {
      const t = parseFloat(x.total) || 0;
      return {
        name: x.stockname,
        value: total > 0 ? Math.round((t / total) * 100) : 0,
        count: parseInt(x.quantity) || 0,
        total: t,
      };
    }));
  } catch (e) { console.error('[market] category-data error:', e); res.json([]); }
});

/**
 * GET /api/admin/market/candlestick
 *
 * Weekly OHLCV candles derived from the last 84 days of daily sales; returns the
 * most recent 12 weeks.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ weekStart, open, high, low, close, volume, count }]
 *   or [] when no data / on error
 *
 * Called by: vianet/src/adminPages/market.tsx -> useAdminQuery('/api/admin/market/candlestick')
 *   Displays: candlestick chart of weekly sales.
 */
router.get('/candlestick', async (req, res) => {
  try {
    const r = await getMarketCandlestick();
    const daily = r.map(function(x) {
      return { date: x.sales_date, sales: parseFloat(x.sales) || 0 };
    });
    if (daily.length === 0) { res.json([]); return; }

    var weeks: any[] = [];
    var currentWeek: any = null;
    for (var i = 0; i < daily.length; i++) {
      var d = new Date(daily[i].date);
      var dayOfWeek = d.getUTCDay();
      var weekStart = new Date(d);
      weekStart.setUTCDate(d.getUTCDate() - dayOfWeek);
      var ws = weekStart.toISOString().split('T')[0];

      if (!currentWeek || currentWeek.weekStart !== ws) {
        if (currentWeek) weeks.push(currentWeek);
        currentWeek = {
          weekStart: ws,
          open: daily[i].sales,
          high: daily[i].sales,
          low: daily[i].sales,
          close: daily[i].sales,
          volume: daily[i].sales,
          count: 1,
        };
      } else {
        currentWeek.high = Math.max(currentWeek.high, daily[i].sales);
        currentWeek.low = Math.min(currentWeek.low, daily[i].sales);
        currentWeek.close = daily[i].sales;
        currentWeek.volume += daily[i].sales;
        currentWeek.count++;
      }
    }
    if (currentWeek) weeks.push(currentWeek);

    res.json(weeks.slice(-12).map(function(w) {
      return {
        weekStart: w.weekStart,
        open: w.open,
        high: w.high,
        low: w.low,
        close: w.close,
        volume: w.volume,
        count: w.count,
      };
    }));
  } catch (e) { console.error('[market] candlestick error:', e); res.json([]); }
});

module.exports = router;
