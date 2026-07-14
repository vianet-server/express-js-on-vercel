const express = require('express');
const path = require('path');
const adminRoutes = require('./routes/admin/index');
const apiRoutes = require('./routes/api/index');
const partnerRoutes = require('./routes/partner/index');
const employeeRoutes = require('./routes/employee/index');

const app = express();

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

// Serve React static files (Vite build)
app.use(express.static(path.join(__dirname, '..', 'vianet', 'dist')));

// SPA fallback (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'vianet', 'dist', 'index.html'));
});

module.exports = app;
