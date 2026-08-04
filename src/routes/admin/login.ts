const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginUser } = require('../../config/dbqueries/admin');

const router = express.Router();

/**
 * POST /api/admin/login
 *
 * Admin login. Verifies the email + password against app.users and issues a JWT.
 * NOTE: any registered user can obtain a token here; the frontend decides access
 * (JWT user_type is embedded in the token and enforced by adminAuth on other routes).
 *
 * Auth: none (public).
 * Requires (JSON body): { email: string, password: string }
 * Returns:
 *   200 { token, message, user } where user = full app.users row
 *   400 { message, token: null } when email/password missing
 *   401 { message, token: null } on invalid credentials
 *   500 { message, token: null, error }
 *
 * Called by: vianet/src/adminPages/login.tsx -> api.post('/api/admin/login', {email,password})
 *   Displays: login form; on success stores the JWT via useAuth().login() and
 *   navigates to /admin/dashboard.
 */
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', token: null });
    }
    const user = await loginUser(email);
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
    res.json({ token, message: 'login successful', user });
  } catch (err) {
    console.error('[admin/login] error:', err);
    res.status(500).json({ message: 'Server error', token: null, error: err.message });
  }
});

module.exports = router;
