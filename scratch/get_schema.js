require('dotenv').config();
const { neonDb } = require('./src/config/db');
async function main() {
  const res = await neonDb.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'app' AND table_name = 'inventory_access_group'
  `);
  console.log(res.rows);
}
main();
