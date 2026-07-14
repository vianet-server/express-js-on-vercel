/**
 * Admin Employee Routes
 *
 * Handles employee profile and related operations.
 * All routes require admin authentication via adminAuth middleware.
 */

const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

// Get all employees (users with usertype = 'employee')
router.get('/', async (req, res) => {
  try {
    const result = await neonDb.query(
      'SELECT userid, email, usertype, is_active, created_at, updated_at FROM users WHERE usertype = $1',
      ['employee']
    );
    res.status(200).json({ message: 'Employees fetched', data: result.rows });
  } catch (err) {
    console.error('[admin/employee] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new employee
router.post('/', async (req, res) => {
  try {
    const { email, password, employee_id, first_name, last_name, phone, designation, is_active } = req.body;
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 10);
    const result = await neonDb.query(
      'INSERT INTO users (email, password_hash, usertype, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING userid, email, usertype, is_active',
      [email, password_hash, 'employee', is_active ?? true]
    );
    if (employee_id || first_name || last_name || phone || designation) {
      await neonDb.query(
        'INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [result.rows[0].userid, employee_id, first_name, last_name, phone, designation]
      );
    }
    res.status(201).json({ message: 'Employee created', data: result.rows[0] });
  } catch (err) {
    console.error('[admin/employee] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query(
      'SELECT userid, email, usertype, is_active, created_at, updated_at FROM users WHERE userid = $1 AND usertype = $2',
      [id, 'employee']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const profileResult = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [id]);
    res.status(200).json({ message: 'Employee fetched', data: { ...result.rows[0], profile: profileResult.rows[0] || null } });
  } catch (err) {
    console.error('[admin/employee] GET by id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an employee by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, employee_id, first_name, last_name, phone, designation, is_active } = req.body;
    const userResult = await neonDb.query(
      'UPDATE users SET email = $1, is_active = $2, updated_at = NOW() WHERE userid = $3 AND usertype = $4 RETURNING userid, email, usertype, is_active',
      [email, is_active, id, 'employee']
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const existingProfile = await neonDb.query('SELECT * FROM employee_profiles WHERE user_id = $1', [id]);
    if (existingProfile.rows.length > 0) {
      await neonDb.query(
        'UPDATE employee_profiles SET employee_id = $1, first_name = $2, last_name = $3, phone = $4, designation = $5, updated_at = NOW() WHERE user_id = $6',
        [employee_id, first_name, last_name, phone, designation, id]
      );
    } else if (employee_id || first_name || last_name) {
      await neonDb.query(
        'INSERT INTO employee_profiles (user_id, employee_id, first_name, last_name, phone, designation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [id, employee_id, first_name, last_name, phone, designation]
      );
    }
    res.status(200).json({ message: 'Employee updated', data: userResult.rows[0] });
  } catch (err) {
    console.error('[admin/employee] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an employee by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query('DELETE FROM users WHERE userid = $1 AND usertype = $2 RETURNING userid', [id, 'employee']);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('[admin/employee] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
