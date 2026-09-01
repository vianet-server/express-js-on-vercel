require('dotenv').config();
const { Pool } = require('pg');
async function main() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  try {
    await pool.query(`
      ALTER TABLE app.inventory_access_group 
      ADD COLUMN IF NOT EXISTS partner_sku_name VARCHAR(255);
    `);
    console.log("Column partner_sku_name added successfully");
  } catch(e) {
    console.error("Error adding column:", e);
  } finally {
    pool.end();
  }
}
main();
