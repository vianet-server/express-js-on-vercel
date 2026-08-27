/**
 * partner.ts
 *
 * DB query helpers for the /partner/* router (partner self-registration, login
 * and profile management). Re-exports every shared helper so partner-domain
 * routes can import from this single module.
 *
 * Every function returns the raw DB result (row / rows / aggregate object);
 * response shaping stays in the route handlers.
 */
const { neonDb } = require('../db');
const shared = require('./shared');
const cache = require('../cache');

/**
 * Look up a partner login user (user_type 'partner' only).
 * @param {string} email - login email
 * @returns {Promise<object|undefined>} full app.users row, or undefined
 * @route Used by POST /partner/auth/login
 */
async function findPartnerLoginUser(email) {
  const result = await neonDb.query(
    'SELECT * FROM app.users WHERE email = $1 AND user_type = $2',
    [email, 'partner']
  );
  return result.rows[0];
}

module.exports = {
  ...shared,
  ...cache.wrapExports({ findPartnerLoginUser }, { findPartnerLoginUser: { role: 'read', tables: ['app.users'] } }),
};
