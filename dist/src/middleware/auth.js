"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * auth(...allowedRoles)
 *
 * JWT authentication + role guard. Reads `Authorization: Bearer <jwt>`.
 * Verifies the token against process.env.JWT_SECRET and attaches the payload to
 * req.user ({ id, email, user_type }).
 *
 * Role rule: if allowedRoles is non-empty, the user must be 'admin' OR one of the
 * allowedRoles, otherwise 403. 'admin' always passes.
 *
 * Errors:
 *   401 when no/invalid token
 *   403 when role not allowed
 *
 * Used by: /api/*, /partner/*, /employee/* routes (e.g. auth('user'), auth('employee'), auth('partner')).
 */
const jwt = require('jsonwebtoken');
const auth = (...allowedRoles) => {
    return (req, res, next) => {
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
            const usertype = decoded.user_type || decoded.usertype;
            if (allowedRoles.length > 0 && usertype !== 'admin' && !allowedRoles.includes(usertype)) {
                return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }
            req.user = decoded;
            next();
        }
        catch (err) {
            return res.status(401).json({ message: 'Invalid token', error: err.message });
        }
    };
};
module.exports = auth;
