const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, getMinAccessGroupId, createUserNoName, createPartnerProfile, findPartnerLoginUser } = require('../../config/dbqueries/partner');

const router = express.Router();

/**
 * POST /partner/auth/register
 *
 * Partner self-registration. Creates a user with user_type 'partner' assigned to
 * the lowest-id access group, optional partner_profiles row, and returns a JWT.
 *
 * Auth: none (public).
 * Requires (JSON body): { email, password, company_name?, phone?, address? }
 * Returns:
 *   201 { token, message, email, user_type: 'partner' }
 *   400 when email/password missing or no access group exists
 *   409 when email already exists
 *   500 on error
 *
 * Called by: no frontend caller yet (partner portal UI not built).
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, company_name, phone, address } = req.body;
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
    const result = await createUserNoName({ email, password_hash, user_type: 'partner', access_group_id: groupId });
    if (company_name || phone || address) {
      await createPartnerProfile({ user_id: result.id, company_name, phone, address });
    }
    const token = jwt.sign(
      { id: result.id, email: result.email, user_type: 'partner' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, message: 'Partner registered', email: result.email, user_type: 'partner' });
  } catch (err) {
    console.error('[partner/auth] register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /partner/auth/login
 *
 * Partner login (scoped to user_type = 'partner'), returns a JWT.
 *
 * Auth: none (public).
 * Requires (JSON body): { email, password }
 * Returns:
 *   200 { token, message, email, user_type }
 *   400 { message, token: null } when credentials missing
 *   401 { message, token: null } on invalid credentials
 *   500 { message, token: null, error }
 *
 * Called by: no frontend caller yet.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', token: null });
    }
    const user = await findPartnerLoginUser(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials', token: null });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, message: 'login successful', email: user.email, user_type: user.user_type });
  } catch (err) {
    console.error('[partner/auth] login error:', err);
    res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
