require('dotenv').config();
const { neonDb } = require('./dist/src/config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const arg = process.argv[2];
let data;

if (arg) {
  try {
    data = JSON.parse(arg);
  } catch {
    try {
      data = JSON.parse(fs.readFileSync(arg, 'utf8'));
    } catch {
      console.error('Usage: node create.js [user.json]');
      console.error('  Or set EMAIL, PASSWORD env vars');
      process.exit(1);
    }
  }
} else {
  const EMAIL = (process.env.EMAIL || '').trim();
  const PASSWORD = (process.env.PASSWORD || '').trim();
  const NAME = (process.env.NAME || '').trim();
  const USER_TYPE = (process.env.USER_TYPE || 'admin').trim();
  const ACCESS_GROUP_ID = (process.env.ACCESS_GROUP_ID || '1').trim();

  if (!EMAIL || !PASSWORD) {
    console.error('Set EMAIL and PASSWORD environment variables');
    console.error('  set EMAIL=admin@test.com && set PASSWORD=admin123 && node create.js');
    console.error('  Or: node create.js user.json');
    process.exit(1);
  }

  data = { email: EMAIL, password: PASSWORD, name: NAME || undefined, user_type: USER_TYPE, access_group_id: parseInt(ACCESS_GROUP_ID) };
}

const { email, password, name, user_type, access_group_id, settings } = data;
if (!email || !password) {
  console.error('email and password are required');
  process.exit(1);
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await neonDb.query(
    `INSERT INTO app.users (name, email, password, user_type, access_group_id, settings, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id, name, email, user_type, access_group_id, created_at`,
    [name || email, email, passwordHash, user_type || 'admin', access_group_id || 1, JSON.stringify(settings || {})]
  );

  const user = result.rows[0];
  console.log('User created:');
  console.log(JSON.stringify(user, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
