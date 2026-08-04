/**
 * api/index.js
 *
 * Router entry point for all public app API routes.
 * Full paths below are relative to the /api mount in src/index.ts.
 * Mounts the following sub-routers:
 * - /auth       -> auth.js           (/api/auth/register, /api/auth/signup-with-token, /api/auth/login) — public, no auth
 * - /stock      -> routes/stock.js   (/api/stock/stock-item, /ledger, /voucher, /godown) — auth('user')
 * - /inventory  -> routes/inventory.js (/api/inventory) — auth('user')
 * - /keys       -> keys/index.js     (/api/keys) — auth('user')
 * - /v1         -> v1/index.js       (/api/v1/products, /analytics/sales) — apiKeyAuth(permission)
 *
 * Frontend callers:
 * - /api/auth/*          -> vianet/src/appPages/auth/*, vianet/src/pages/auth/signup.tsx
 * - /api/stock/stock-item -> vianet/src/appPages/portals.tsx
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
