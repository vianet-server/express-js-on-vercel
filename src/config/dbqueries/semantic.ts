const { neonDb } = require('../db');

/**
 * Fetch semantic sales metrics for the AI layer and Dashboards.
 */
async function getSemanticSales(period = 30) {
  // 1. Total Sales and Orders for the period
  const overview = await neonDb.query(
    "SELECT COALESCE(SUM(bill_amt),0) AS total_sales, COUNT(*) AS total_orders FROM app.sales_records WHERE sales_date >= CURRENT_DATE - $1",
    [period]
  );
  
  // 2. Sales by Salesperson
  const bySalesperson = await neonDb.query(
    "SELECT COALESCE(salesman, 'Unassigned') AS name, SUM(bill_amt) AS amount FROM app.sales_records WHERE sales_date >= CURRENT_DATE - $1 GROUP BY salesman ORDER BY amount DESC LIMIT 10",
    [period]
  );

  // 3. Sales Trend
  const trend = await neonDb.query(
    "SELECT sales_date::text AS date, SUM(bill_amt) AS amount FROM app.sales_records WHERE sales_date >= CURRENT_DATE - $1 GROUP BY sales_date ORDER BY sales_date",
    [period]
  );

  return {
    overview: overview.rows[0],
    bySalesperson: bySalesperson.rows,
    trend: trend.rows
  };
}

/**
 * Fetch semantic inventory metrics
 */
async function getSemanticInventory() {
  // 1. Total Stock Value
  const value = await neonDb.query(
    "SELECT COALESCE(SUM(quantity * price),0) AS total_value, SUM(quantity) AS total_qty FROM app.inventory WHERE isblocked IS NOT TRUE AND quantity > 0"
  );

  // 2. Out of Stock / Low Stock (quantity <= 0)
  const outOfStock = await neonDb.query(
    "SELECT id, COALESCE(fullname, stockname) as name, brand, quantity FROM app.inventory WHERE isblocked IS NOT TRUE AND quantity <= 0 ORDER BY quantity ASC LIMIT 10"
  );

  // 3. Value by Brand
  const byBrand = await neonDb.query(
    "SELECT COALESCE(NULLIF(brand, ''), 'Unknown') AS brand, SUM(quantity * price) AS amount FROM app.inventory WHERE isblocked IS NOT TRUE AND quantity > 0 GROUP BY brand ORDER BY amount DESC LIMIT 10"
  );

  return {
    overview: value.rows[0],
    outOfStock: outOfStock.rows,
    byBrand: byBrand.rows
  };
}

module.exports = {
  getSemanticSales,
  getSemanticInventory
};
