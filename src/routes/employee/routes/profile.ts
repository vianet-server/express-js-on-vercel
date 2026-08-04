const express = require('express');
const { getUserBriefById, findEmployeeProfile, updateEmployeeProfileByUserId, createEmployeeProfile } = require('../../../config/dbqueries/employee');
const auth = require('../../../middleware/auth');

const router = express.Router();

router.use(auth('employee'));

/**
 * GET /employee/profile
 *
 * Fetch the authenticated employee's user row + employee_profiles row.
 *
 * Auth: auth('employee') (admin also allowed by the auth middleware).
 * Query params: none.
 * Returns:
 *   200 { message: 'Employee profile fetched', data: { id, email, user_type, profile } }
 *   500 on error
 *
 * Called by: no direct frontend caller yet (employ portal pages are placeholders).
 */
router.get('/', async (req, res) => {
  try {
    const user_id = req.user.id;
    const user = await getUserBriefById(user_id);
    const profile = await findEmployeeProfile(user_id);
    res.status(200).json({ message: 'Employee profile fetched', data: { ...user, profile: profile || null } });
  } catch (err) {
    console.error('[employee/profile] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /employee/profile
 *
 * Update the authenticated employee's profile (upserts employee_profiles).
 *
 * Auth: auth('employee') (admin also allowed).
 * Requires (JSON body): { employee_id?, first_name?, last_name?, phone?, designation? }
 * Returns:
 *   200 { message: 'Employee profile updated' }
 *   500 on error
 *
 * Called by: no direct frontend caller yet.
 */
router.put('/', async (req, res) => {
  try {
    const user_id = req.user.id;
    const { employee_id, first_name, last_name, phone, designation } = req.body;
    const existing = await findEmployeeProfile(user_id);
    if (existing) {
      await updateEmployeeProfileByUserId({ user_id, employee_id, first_name, last_name, phone, designation });
    } else {
      await createEmployeeProfile({ user_id, employee_id, first_name, last_name, phone, designation });
    }
    res.status(200).json({ message: 'Employee profile updated' });
  } catch (err) {
    console.error('[employee/profile] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
