require('dotenv').config();
const { neonDb } = require('../src/config/db');
async function main() {
  const res = await neonDb.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'app'
    ORDER BY table_name, ordinal_position
  `);
  const tables = {};
  res.rows.forEach(r => {
    if (!tables[r.table_name]) tables[r.table_name] = [];
    tables[r.table_name].push(r.column_name);
  });
  console.log(Object.keys(tables).map(t => `${t}: ${tables[t].join(', ')}`).join('\n'));
  process.exit(0);
}
main();
