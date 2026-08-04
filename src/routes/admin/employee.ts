const express = require('express');
const { listEmployees, getMinAccessGroupId, createUserNoName, createEmployeeProfile, getEmployeeById, updateEmployeeUserEmail, updateEmployeeProfileByUserId, findEmployeeProfile, deleteEmployeeById } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * GET /api/admin/employee
 *
 * List all employee users.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { message: 'Employees fetched', data: [{ id, email, user_type, created_at, updated_at }] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (employee management UI not built).
 */
router.get('/', async (req, res) => {
  try {
    const result = await listEmployees();
    res.status(200).json({ message: 'Employees fetched', data: result });
  } catch (err) {
    console.error('[admin/employee] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/admin/employee
 *
 * Create an employee user (assigned to the lowest-id access group) and optionally
 * an employee_profiles row.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { email, password, employee_id?, first_name?, last_name?, phone?, designation? }
 * Returns:
 *   201 { message: 'Employee created', data: { id, email, user_type } }
 *   400 when email/password missing or no access group exists
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/', async (req, res) => {
  try {
    const { email, password, employee_id, first_name, last_name, phone, designation } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);
    const groupId = await getMinAccessGroupId();
    if (!groupId) {
      return res.status(400).json({ message: 'No access group available.' });
    }
    const result = await createUserNoName({ email, password_hash, user_type: 'employee', access_group_id: groupId });
    if (employee_id || first_name || last_name || phone || designation) {
      await createEmployeeProfile({ user_id: result.id, employee_id, first_name, last_name, phone, designation });
    }
    res.status(201).json({ message: 'Employee created', data: result });
  } catch (err) {
    console.error('[admin/employee] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/employee/:id
 *
 * Fetch one employee user plus their employee_profiles row (or null).
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Returns:
 *   200 { message: 'Employee fetched', data: { id, email, user_type, created_at, updated_at, profile } }
 *   404 when employee not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user, profile } = await getEmployeeById(id);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee fetched', data: { ...user, profile: profile || null } });
  } catch (err) {
    console.error('[admin/employee] GET by id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/employee/:id
 *
 * Update an employee's email and profile (employee_id, first/last name, phone,
 * designation), upserting the employee_profiles row if needed.
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Requires (JSON body): { email?, employee_id?, first_name?, last_name?, phone?, designation? }
 * Returns:
 *   200 { message: 'Employee updated', data: { id, email, user_type } }
 *   404 when employee not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, employee_id, first_name, last_name, phone, designation } = req.body;
    const userResult = await updateEmployeeUserEmail({ id, email });
    if (!userResult) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const existingProfile = await findEmployeeProfile(id);
    if (existingProfile) {
      await updateEmployeeProfileByUserId({ user_id: id, employee_id, first_name, last_name, phone, designation });
    } else if (employee_id || first_name || last_name) {
      await createEmployeeProfile({ user_id: id, employee_id, first_name, last_name, phone, designation });
    }
    res.status(200).json({ message: 'Employee updated', data: userResult });
  } catch (err) {
    console.error('[admin/employee] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/employee/:id
 *
 * Delete an employee user (scoped to user_type = 'employee').
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Returns:
 *   200 { message: 'Employee deleted' }
 *   404 when employee not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteEmployeeById(id);
    if (!result) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('[admin/employee] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
