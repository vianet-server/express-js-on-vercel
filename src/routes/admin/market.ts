const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

router.get('/', async (req, res) => {
  try {
    const now30 = await neonDb.query(
      "SELECT COALESCE(SUM(bill_amt),0) AS total, COUNT(*) AS orders FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 30"
    );
    const prev30 = await neonDb.query(
      "SELECT COALESCE(SUM(bill_amt),0) AS total FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 60 AND sales_date < CURRENT_DATE - 30"
    );
    const todaySales = await neonDb.query(
      "SELECT COALESCE(SUM(bill_amt),0) AS vol FROM app.sales_records WHERE sales_date = CURRENT_DATE"
    );
    const yesterdaySales = await neonDb.query(
      "SELECT COALESCE(SUM(bill_amt),0) AS vol FROM app.sales_records WHERE sales_date = CURRENT_DATE - 1"
    );
    const topProducts = await neonDb.query(
      "SELECT stockname, quantity, price, (COALESCE(quantity,0) * COALESCE(price,0)) AS total_value FROM app.stock ORDER BY total_value DESC LIMIT 10"
    );
    const stockCount = await neonDb.query(
      "SELECT COUNT(*) AS cnt FROM app.stock"
    );
    const regionData = await neonDb.query(
      "SELECT COALESCE(NULLIF(parent, ''), 'Other') AS region, SUM(bill_amt) AS sales FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 30 GROUP BY region ORDER BY sales DESC LIMIT 5"
    );

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

router.get('/sales-trend', async (req, res) => {
  try {
    const r = await neonDb.query(
      "SELECT sales_date::text AS day, SUM(bill_amt) AS sales, COUNT(*) AS orders FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 30 GROUP BY sales_date ORDER BY sales_date"
    );
    res.json(r.rows.map(function(x) {
      return { day: x.day, sales: parseFloat(x.sales) || 0, orders: parseInt(x.orders) || 0 };
    }));
  } catch (e) { console.error('[market] sales-trend error:', e); res.json([]); }
});

router.get('/category-data', async (req, res) => {
  try {
    const r = await neonDb.query(
      "SELECT stockname, quantity, price, (COALESCE(quantity,0) * COALESCE(price,0)) AS total FROM app.stock ORDER BY total DESC LIMIT 10"
    );
    const total = r.rows.reduce(function(s, x) { return s + (parseFloat(x.total) || 0); }, 0);
    res.json(r.rows.map(function(x, i) {
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

router.get('/candlestick', async (req, res) => {
  try {
    const r = await neonDb.query(
      "SELECT sales_date, SUM(bill_amt) AS sales FROM app.sales_records WHERE sales_date >= CURRENT_DATE - 84 GROUP BY sales_date ORDER BY sales_date"
    );
    const daily = r.rows.map(function(x) {
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
