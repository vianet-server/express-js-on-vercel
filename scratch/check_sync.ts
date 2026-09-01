const { neonDb } = require('../src/config/db');

async function check() {
  try {
    const bs = await neonDb.query("SELECT * FROM app.balancesheet ORDER BY id DESC LIMIT 1");
    console.log("Balance Sheet Rows:", bs.rowCount);
    
    const pnl = await neonDb.query("SELECT * FROM app.profitloss ORDER BY id DESC LIMIT 1");
    console.log("P&L Rows:", pnl.rowCount);
    
    const syncTime = await neonDb.query("SELECT MAX(last_sync_time) as last_sync FROM public.sync_metadata");
    console.log("Max Sync Time:", syncTime.rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
