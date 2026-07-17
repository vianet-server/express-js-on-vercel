require('dotenv').config();
const { neonDb } = require('./dist/src/config/db');
const bcrypt = require('bcryptjs');

const EMAIL = 'deepsehgal@vianet.co.in';
const PASSWORD = 'vianet@adminserver';
if (!EMAIL || !PASSWORD) {
  console.error('Set EMAIL and PASSWORD environment variables');
  console.error('  set EMAIL=admin@test.com && set PASSWORD=newpass456 && node update.js');
  process.exit(1);
}

async function main() {
  const existing = await neonDb.query('SELECT id FROM app.users WHERE email = $1', [EMAIL]);
  if (existing.rows.length === 0) {
    console.error('User not found');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await neonDb.query(
    'UPDATE app.users SET password = $1, updated_at = NOW() WHERE email = $2',
    [passwordHash, EMAIL]
  );

  console.log('Password updated for ' + EMAIL);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
