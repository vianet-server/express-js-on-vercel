/**
 * employee.ts
 *
 * DB query helpers for the /employee/* router (employee self-registration, login
 * and profile management). Re-exports every shared helper so employee-domain
 * routes can import from this single module.
 *
 * Every function returns the raw DB result (row / rows / aggregate object);
 * response shaping stays in the route handlers.
 */
const { neonDb } = require('../db');
const shared = require('./shared');

/**
 * Look up an employee login user (user_type 'employee' OR 'admin').
 * @param {string} email - login email
 * @returns {Promise<object|undefined>} full app.users row, or undefined
 * @route Used by POST /employee/auth/login
 */
async function findEmployeeLoginUser(email) {
  const result = await neonDb.query(
    'SELECT * FROM app.users WHERE email = $1 AND (user_type = $2 OR user_type = $3)',
    [email, 'employee', 'admin']
  );
  return result.rows[0];
}

module.exports = {
  ...shared,
  findEmployeeLoginUser,
};
