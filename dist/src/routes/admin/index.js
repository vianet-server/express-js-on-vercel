"use strict";
/**
 * admin/index.js
 *
 * Router entry point for all admin-level routes.
 * Mounts the following sub-routers:
 * - /login            -> login.js
 * - /accesscontrol    -> accesscontroll.js
 * - /inventory        -> inventory.js
 * - /stockitem        -> stockitem.js
 * - /tally            -> tally.js (covers stock-item, ledger, voucher, godown, masters, salesman)
 * - /api              -> api.js (API key management)
 * - /partner          -> partner.js (partner management)
 * - /employee         -> employee.js (employee management)
 * - /dashboard        -> dashboard.js
 * - /analytics        -> analytics.js
 * - /reports          -> reports.js
 * - /settings         -> settings.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const loginRouter = require('./login');
const accesscontrolRouter = require('./accesscontroll');
const inventoryRouter = require('./inventory');
const stockitemRouter = require('./stockitem');
const tallyRouter = require('./tally');
const apiRouter = require('./api');
const partnerRouter = require('./partner');
const employeeRouter = require('./employee');
const dashboardRouter = require('./dashboard');
const analyticsRouter = require('./analytics');
const reportsRouter = require('./reports');
const settingsRouter = require('./settings');
const router = express.Router();
router.use('/login', loginRouter);
router.use(accesscontrolRouter);
router.use(inventoryRouter);
router.use(stockitemRouter);
router.use(tallyRouter);
router.use(apiRouter);
router.use('/partner', partnerRouter);
router.use('/employee', employeeRouter);
router.use('/dashboard', dashboardRouter);
router.use('/analytics', analyticsRouter);
router.use('/reports', reportsRouter);
router.use('/settings', settingsRouter);
module.exports = router;
