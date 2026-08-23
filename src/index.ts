const express = require('express');
const path = require('path');
const cors = require('cors');
const adminRoutes = require('./routes/admin/index');
const apiRoutes = require('./routes/api/index');
const partnerRoutes = require('./routes/partner/index');
const employeeRoutes = require('./routes/employee/index');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

/**
 * GET /api
 *
 * Health/ping endpoint. No params or auth required.
 * Returns: plain text "hi"
 * Called by: nothing in the frontend (used as a deploy/uptime check).
 */
app.get('/api', (req, res) => {
  res.send('hi');
});

/**
 * GET /api/users
 *
 * Placeholder demo endpoint returning a hard-coded user list. No params or auth.
 * Returns: JSON array [{ id, name }]
 * Called by: nothing in the frontend (sample data).
 */
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
});

/**
 * Router mount map (each mount's routes are documented in its own file):
 * - /api        -> public app API   (auth, stock, inventory, keys, v1)  -> consumed by vianet/src/appPages/* and vianet/src/pages/auth/*
 * - /partner    -> partner portal   (auth, profile)                     -> no frontend caller yet
 * - /employee   -> employee portal  (auth, profile)                     -> consumed by vianet/src/employPages/auth/*
 * - /api/admin  -> admin dashboard  (login, dashboard, analytics, reports, settings, inventory, stock, api, partner, employee, market) -> consumed by vianet/src/adminPages/*
 */
app.use('/api', apiRoutes);
app.use('/partner', partnerRoutes);
app.use('/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);

// Serve React static files (Vite build) — hashed filenames are immutable
app.use(express.static(path.join(__dirname, '..', 'vianet', 'dist'), {
  maxAge: 0,       // Tells browser NOT to store for future use without asking
  etag: true,      // Enables ETag validation so the server knows if the file changed
  lastModified: true, // Uses last-modified header for file freshness check
}));

// SPA fallback — never cache index.html so it always picks up the latest JS chunks
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, '..', 'vianet', 'dist', 'index.html'));
});

module.exports = app;
