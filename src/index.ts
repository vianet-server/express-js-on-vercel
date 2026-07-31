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

// API routes
app.get('/api', (req, res) => {
  res.send('hi');
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
});

// Mount routers
app.use('/api', apiRoutes);
app.use('/partner', partnerRoutes);
app.use('/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);

// Serve React static files (Vite build) — hashed filenames are immutable
app.use(express.static(path.join(__dirname, '..', 'vianet', 'dist'), {
  maxAge: '1y',
  immutable: true,
}));

// SPA fallback — never cache index.html so it always picks up the latest JS chunks
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, '..', 'vianet', 'dist', 'index.html'));
});

module.exports = app;
