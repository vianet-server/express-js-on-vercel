/**
 * partner/index.js
 *
 * Router entry point for all partner-level routes.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js (register, login)
 * - /profile    -> routes/profile.js (partner profile management)
 */

const express = require('express');
const authRouter = require('./auth');
const profileRouter = require('./routes/profile');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/profile', profileRouter);

module.exports = router;
