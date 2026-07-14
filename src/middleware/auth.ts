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
      const usertype = decoded.usertype;

      if (allowedRoles.length > 0 && usertype !== 'admin' && !allowedRoles.includes(usertype)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token', error: err.message });
    }
  };
};

module.exports = auth;
