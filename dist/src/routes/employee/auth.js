"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, getMinAccessGroupId, createUser, createEmployeeProfile, findEmployeeLoginUser } = require('../../config/dbqueries/employee');
const { sendWelcomeEmail } = require('../../services/email');
const router = express.Router();
/**
 * POST /employee/auth/register
 *
 * Employee self-registration. Creates a user with user_type 'employee' assigned to
 * the lowest-id access group, optional employee_profiles row, and returns a JWT.
 *
 * Auth: none (public).
 * Requires (JSON body): { email, password, employee_id?, first_name?, last_name?, phone?, designation? }
 * Returns:
 *   201 { token, message, email, user_type: 'employee' }
 *   400 when email/password missing or no access group exists
 *   409 when email already exists
 *   500 on error
 *
 * Called by: vianet/src/employPages/auth/employsignup.tsx -> fetch('/employee/auth/register', {...})
 *   Displays: sign-up form; on success navigates to /employ/login.
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, employee_id, first_name, last_name, phone, designation } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'User already exists' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        const groupId = await getMinAccessGroupId();
        if (!groupId) {
            return res.status(400).json({ message: 'No access group available. Contact admin.' });
        }
        const fullName = [first_name, last_name].filter(Boolean).map(s => s.trim()).join(' ') || email.split('@')[0] || 'Employee';
        const result = await createUser({ name: fullName, email, password_hash, user_type: 'employee', access_group_id: groupId });
        sendWelcomeEmail({ to: result.email }).catch((err) => console.error('[employee/auth] welcome email error:', err?.message || err));
        if (employee_id || first_name || last_name || phone || designation) {
            try {
                await createEmployeeProfile({ user_id: result.id, employee_id, first_name, last_name, phone, designation });
            }
            catch (profileErr) {
                console.warn('[employee/auth] profile insert skipped:', profileErr.message);
            }
        }
        const token = jwt.sign({ id: result.id, email: result.email, user_type: 'employee' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, message: 'Employee registered', email: result.email, user_type: 'employee' });
    }
    catch (err) {
        console.error('[employee/auth] register error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * POST /employee/auth/login
 *
 * Employee login. Accepts users of type 'employee' OR 'admin', returns a JWT.
 *
 * Auth: none (public).
 * Requires (JSON body): { email, password }
 * Returns:
 *   200 { token, message, email, user_type }
 *   400 { message, token: null } when credentials missing
 *   401 { message, token: null } on invalid credentials
 *   500 { message, token: null, error }
 *
 * Called by: vianet/src/employPages/auth/employlogin.tsx -> fetch('/employee/auth/login', {...})
 *   Displays: login form; on success stores the JWT via useAuth().login() and
 *   navigates to /employ/home (or the originally requested employ route).
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required', token: null });
        }
        const user = await findEmployeeLoginUser(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials', token: null });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials', token: null });
        }
        const token = jwt.sign({ id: user.id, email: user.email, user_type: user.user_type }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, message: 'login successful', email: user.email, user_type: user.user_type });
    }
    catch (err) {
        console.error('[employee/auth] login error:', err);
        res.status(500).json({ message: 'Server error', token: null, error: err.message });
    }
});
module.exports = router;
