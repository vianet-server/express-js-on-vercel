"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require('jsonwebtoken');
const adminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if ((decoded.user_type || decoded.usertype) !== 'admin') {
            return res.status(403).json({ message: 'User is not an admin' });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error('[adminAuth] token verification failed:', err.message);
        return res.status(401).json({ message: 'Invalid token', error: err.message });
    }
};
module.exports = adminAuth;
