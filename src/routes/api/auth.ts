const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, getMinAccessGroupId, createUser } = require('../../config/dbqueries/api');
const { sendWelcomeEmail } = require('../../services/email');

const router = express.Router();

/**
 * POST /api/auth/register
 *
 * Public app-user registration. Creates a 'user' assigned to the provided access
 * group (or the lowest-id group). Does NOT return a token.
 *
 * Auth: none (public).
 * Requires (JSON body): { email, password, user_type?, access_group_id? }
 * Returns:
 *   201 { message: 'User registered', data: { id, email, user_type } }
 *   400 when email/password missing or no access group available
 *   409 when email already exists
 *   500 on error
 *
 * Called by:
 *   - vianet/src/appPages/auth/appsignup.tsx -> fetch('/api/auth/register', {...})
 *   - vianet/src/pages/auth/signup.tsx        -> fetch('/api/auth/register', {...}) (no token invite path)
 *   Both display a sign-up form and then route the user to login.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, user_type, access_group_id } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const groupId = access_group_id || (await getMinAccessGroupId());
    if (!groupId) {
      return res.status(400).json({ message: 'No access group available. Contact admin.' });
    }
    const result = await createUser({ name: email, email, password_hash, user_type: user_type || 'user', access_group_id: groupId });
    sendWelcomeEmail({ to: result.email }).catch((err) =>
      console.error('[auth] welcome email error:', err?.message || err)
    );
    res.status(201).json({ message: 'User registered', data: result });
  } catch (err) {
    console.error('[auth] register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/auth/signup-with-token
 *
 * Invited signup: verifies a JWT invitation token (issued by the admin
 * POST /api/admin/access-group link), creates the user with the token's
 * usertype + access group, and returns a fresh 24h auth token.
 *
 * Auth: none (public) — the invitation JWT itself carries the role/group.
 * Requires (JSON body): { name?, email, password, token }
 * Returns:
 *   200 { token, message, email, user_type }
 *   400 when email/password/token missing, or token invalid/missing accessgroup
 *   409 when email already exists
 *   500 on error
 *
 * Called by: vianet/src/pages/auth/signup.tsx -> fetch('/api/auth/signup-with-token', {...})
 *   (invite link /app/signup?Token=<jwt> from admin inventory control).
 *   Displays: "Create Your Account" form; on success logs the user in and
 *   navigates to /app/home.
 */
router.post('/signup-with-token', async (req, res) => {
  try {
    const { name, email, password, token } = req.body;
    if (!email || !password || !token) {
      return res.status(400).json({ message: 'Email, password, and token are required' });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }
    const user_type = payload.usertype || payload.user_type || 'user';
    const accessgroup = payload.accessgroup || payload.access_group_id;
    if (!accessgroup) {
      return res.status(400).json({ message: 'Invalid invitation token' });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await createUser({ name: name || email, email, password_hash, user_type, access_group_id: accessgroup });
    const authToken = jwt.sign(
      { id: result.id, email: result.email, user_type: result.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    sendWelcomeEmail({ to: result.email }).catch((err) =>
      console.error('[auth] welcome email error:', err?.message || err)
    );
    res.json({ token: authToken, message: 'Signup successful', email: result.email, user_type: result.user_type });
  } catch (err) {
    console.error('[auth] signup-with-token error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/auth/login
 *
 * Public app-user login, returns a 24h JWT.
 *
 * Auth: none (public).
 * Requires (JSON body): { email, password }
 * Returns:
 *   200 { token, message, email, user_type }
 *   400 { message, token: null } when credentials missing
 *   401 { message, token: null } on invalid credentials
 *   500 { message, token: null, error }
 *
 * Called by: vianet/src/appPages/auth/applogin.tsx -> fetch('/api/auth/login', {...})
 *   Displays: login form; on success stores the JWT and routes to the app portal.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', token: null });
    }
    const user = await findUserByEmail(email);
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
    console.error('[auth] login error:', err);
    res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
