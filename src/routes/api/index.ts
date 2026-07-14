/**
 * api/index.js
 *
 * Router entry point for all public API routes.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js (register, login)
 * - /tally      -> routes/tally.js (stock-item, ledger, voucher, godown)
 * - /inventory  -> routes/inventory.js
 * - /keys       -> keys/index.js (API key management)
 */

const express = require('express');
const authRouter = require('./auth');
const tallyRouter = require('./routes/tally');
const inventoryRouter = require('./routes/inventory');
const keysRouter = require('./keys');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/tally', tallyRouter);
router.use('/inventory', inventoryRouter);
router.use('/keys', keysRouter);

module.exports = router;
