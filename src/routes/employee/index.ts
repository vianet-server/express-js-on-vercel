/**
 * employee/index.js
 *
 * Router entry point for all employee-level routes.
 * Full paths below are relative to the /employee mount in src/index.ts.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js          (/employee/auth/register, /employee/auth/login) — public, no auth
 * - /profile    -> routes/profile.js (/employee/profile, GET/PUT) — requires auth('employee')
 *
 * Frontend callers:
 * - /employee/auth/register -> vianet/src/employPages/auth/employsignup.tsx (sign-up form -> navigates to /employ/login)
 * - /employee/auth/login    -> vianet/src/employPages/auth/employlogin.tsx (login form -> stores JWT, routes to /employ/home)
 * - /employee/profile       -> no frontend caller yet
 */

const express = require('express');
const authRouter = require('./auth');
const profileRouter = require('./routes/profile');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/profile', profileRouter);

module.exports = router;
