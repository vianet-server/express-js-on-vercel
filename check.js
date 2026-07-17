require('dotenv').config();
const { neonDb } = require('./dist/src/config/db');
const bcrypt = require('bcryptjs');

// ── Fill these variables ──
const EMAIL = 'deepsehgal@vianet.co.in';
const PASSWORD = 'vianet@adminserver';
const HASH = '$2b$10$nbRWs7vL0fa7jfYqrPsX9edQNUfae0sszHuxvCWZ6UUitJFY6szQO';
// ─────────────────────────

async function main() {
  if (!PASSWORD) {
    console.error('Set PASSWORD');
    process.exit(1);
  }

  let passwordHash = HASH;

  if (!passwordHash) {
    if (!EMAIL) {
      console.error('Set EMAIL or HASH');
      process.exit(1);
    }
    const result = await neonDb.query('SELECT * FROM app.users WHERE email = $1', [EMAIL]);
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    passwordHash = result.rows[0].password;
  }

  const valid = await bcrypt.compare(PASSWORD, passwordHash);

  if (valid) {
    console.log('Password is valid');
  } else {
    console.log('Invalid password');
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
