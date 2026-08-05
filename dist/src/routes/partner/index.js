"use strict";
/**
 * partner/index.js
 *
 * Router entry point for all partner-level routes.
 * Full paths below are relative to the /partner mount in src/index.ts.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js          (/partner/auth/register, /partner/auth/login) — public, no auth
 * - /profile    -> routes/profile.js (/partner/profile, GET/PUT) — requires auth('partner')
 *
 * Frontend callers: none yet — partner portal UI is not built. Intended for external
 * partner access to their own profile and access-group-scoped inventory.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const authRouter = require('./auth');
const profileRouter = require('./routes/profile');
const router = express.Router();
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
module.exports = router;
