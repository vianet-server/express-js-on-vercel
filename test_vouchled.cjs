process.env.POSTGRES_URL = 'postgresql://neondb_owner:npg_VGbkdhoP7Aw5@ep-fragrant-recipe-ao2d4tg8-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_VGbkdhoP7Aw5@ep-fragrant-recipe-ao2d4tg8-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require';

const { neonDb } = require('./dist/src/config/db');

(async () => {
  try {
    const r = await neonDb.query('SELECT id, voucher_type, voucher_number, party_ledger_name, date FROM app.vouchers ORDER BY date DESC LIMIT 3');
    console.log('VOUCHER OK:', JSON.stringify(r.rows));
  } catch(e) { console.error('VOUCHER ERR:', e.message); }

  try {
    const r = await neonDb.query('SELECT id, name, address, mobile, ledgername FROM app.ledger ORDER BY name LIMIT 3');
    console.log('LEDGER OK:', JSON.stringify(r.rows));
  } catch(e) { console.error('LEDGER ERR:', e.message); }

  process.exit(0);
})();
