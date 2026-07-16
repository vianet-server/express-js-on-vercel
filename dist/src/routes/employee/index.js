"use strict";
/**
 * employee/index.js
 *
 * Router entry point for all employee-level routes.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js (register, login)
 * - /profile    -> routes/profile.js (employee profile management)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const authRouter = require('./auth');
const profileRouter = require('./routes/profile');
const router = express.Router();
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
module.exports = router;
