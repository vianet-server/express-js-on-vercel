/**
 * dbCheck
 *
 * Diagnostics middleware/handler: returns the first row of app.users to prove DB
 * connectivity. NOT mounted in src/index.ts — used manually for health checks.
 *
 * Params: none (plain Express (req, res)).
 * Returns:
 *   200 { ok: true, user: <first app.users row> }
 *   404 { ok: false, error: 'No users found' }
 *   500 { ok: false, error }
 */
const { getFirstUser } = require('../config/dbqueries/shared');

async function dbCheck(req, res) {
  try {
    const user = await getFirstUser();
    if (!user) {
      return res.status(404).json({ ok: false, error: 'No users found' });
    }
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = dbCheck;
