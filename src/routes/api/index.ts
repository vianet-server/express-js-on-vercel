/**
 * api/index.js
 *
 * Router entry point for all public API routes.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js (register, login)
 * - /stock      -> routes/stock.js (stock-item, ledger, voucher, godown)
 * - /inventory  -> routes/inventory.js
 * - /keys       -> keys/index.js (API key management)
 */

const express = require('express');
const authRouter = require('./auth');
const stockRouter = require('./routes/stock');
const inventoryRouter = require('./routes/inventory');
const keysRouter = require('./keys');
const v1Router = require('./v1');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/stock', stockRouter);
router.use('/inventory', inventoryRouter);
router.use('/keys', keysRouter);
router.use('/v1', v1Router);

module.exports = router;
