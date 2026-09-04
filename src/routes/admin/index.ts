/**
 * admin/index.js
 *
 * Router entry point for all admin-level routes.
 * Full paths below are relative to the /api/admin mount in src/index.ts.
 * Every sub-router except /login applies adminAuth (JWT with user_type === 'admin').
 * Mounts the following sub-routers:
 * - /login            -> login.js            (no auth)
 * - /accesscontrol    -> accesscontroll.js   (mounted at /api/admin/accesscontrol)
 * - /inventory        -> inventory.js        (mounted at /api/admin/inventory)
 * - /stockitem        -> stockitem.js        (mounted at /api/admin/stockitem, /inventory/*, /inventory/sku/*, /migrate-partner-sku)
 * - /stock            -> stock.js            (mounted at /api/admin/stock-item, /ledger, /voucher, /godown, /masters, /salesman, /salesman-chart)
 * - /api              -> api.js              (mounted at /api/admin/api, /access-groups, /access-group)
 * - /partner          -> partner.js          (mounted at /api/admin/partner)
 * - /employee         -> employee.js         (mounted at /api/admin/employee)
 * - /dashboard        -> dashboard.js        (mounted at /api/admin/dashboard)
 * - /analytics        -> analytics.js        (mounted at /api/admin/analytics)
 * - /reports          -> reports.js          (mounted at /api/admin/reports)
 * - /settings        -> settings.js        (mounted at /api/admin/settings)
 * - /market          -> market.js           (mounted at /api/admin/market)
 * - /email           -> email.js            (mounted at /api/admin/email-marketing)
 *
 * Frontend callers: vianet/src/adminPages/*.tsx (via useAdminQuery / api wrapper).
 */

const express = require('express');
const loginRouter = require('./login');
const accesscontrolRouter = require('./accesscontroll');
const inventoryRouter = require('./inventory');
const stockitemRouter = require('./stockitem');
const stockRouter = require('./stock');
const apiRouter = require('./api');
const partnerRouter = require('./partner');
const employeeRouter = require('./employee');
const dashboardRouter = require('./dashboard');
const analyticsRouter = require('./analytics');
const reportsRouter = require('./reports');
const settingsRouter = require('./settings');
const marketRouter = require('./market');
const emailRouter = require('./email');
const semanticRouter = require('./semantic');
const mcpRouter = require('./mcp');

const router = express.Router();

router.use('/login', loginRouter);
router.use(accesscontrolRouter);
router.use(inventoryRouter);
router.use(stockitemRouter);
router.use(stockRouter);
router.use(apiRouter);
router.use('/partner', partnerRouter);
router.use('/employee', employeeRouter);
router.use('/dashboard', dashboardRouter);
router.use('/analytics', analyticsRouter);
router.use('/reports', reportsRouter);
router.use('/settings', settingsRouter);
router.use('/market', marketRouter);
router.use(emailRouter);
router.use('/semantic', semanticRouter);
router.use(mcpRouter);

module.exports = router;
