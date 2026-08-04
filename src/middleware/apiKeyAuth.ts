/**
 * apiKeyAuth(requiredPermission)
 *
 * API-key authentication + permission guard for /api/v1/* endpoints.
 * Reads `Authorization: Bearer <api_key>`, resolves it in app.api (joined with the
 * access group), checks is_active, expiry (duration like '1h'/'7d'/'never'), and that
 * the key's permissions include requiredPermission. On success records usage:
 * updates last_used and inserts a row into api_key_log (table auto-created here).
 *
 * Sets req.apiKey = { id, name, key, accessGroupId, groupName, permissions }.
 *
 * Errors:
 *   401 when no/invalid API key
 *   403 when revoked, expired, or missing permission
 *   500 on failure
 */
const { ensureLogTable, findApiKey, touchApiKey, logApiUsage } = require('../config/dbqueries/api');

ensureLogTable().catch((err) => {
  console.warn('[apiKeyAuth] ensureLogTable warning:', err.message);
});

const apiKeyAuth = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(401).json({ message: 'API key is required. Use Authorization: Bearer <your_api_key>' });
      }

      const apiKey = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      if (!apiKey) {
        return res.status(401).json({ message: 'API key is required' });
      }

      const key = await findApiKey(apiKey);

      if (!key) {
        return res.status(401).json({ message: 'Invalid API key' });
      }

      if (!key.is_active) {
        return res.status(403).json({ message: 'API key has been revoked' });
      }

      if (key.duration && key.duration !== 'never') {
        const match = key.duration.match(/^(\d+)([hd])$/);
        if (match) {
          const num = parseInt(match[1], 10);
          const unit = match[2];
          const ms = unit === 'h' ? num * 60 * 60 * 1000 : num * 24 * 60 * 60 * 1000;
          const keyAge = Date.now() - new Date(key.created_at).getTime();
          if (keyAge > ms) {
            return res.status(403).json({ message: 'API key has expired' });
          }
        }
      }

      const perms = key.permissions || [];
      if (requiredPermission && !perms.includes(requiredPermission)) {
        return res.status(403).json({ message: `API key does not have the '${requiredPermission}' permission` });
      }

      await touchApiKey(key.keyid);

      try {
        await logApiUsage({ keyid: key.keyid, endpoint: req.originalUrl, method: req.method, status: null });
      } catch (logErr) {
        console.warn('[apiKeyAuth] log insert warning:', logErr.message);
      }

      req.apiKey = {
        id: key.keyid,
        name: key.key_name || '',
        key: key.key,
        accessGroupId: key.access_group_id,
        groupName: key.group_name,
        permissions: perms,
      };

      next();
    } catch (err) {
      console.error('[apiKeyAuth] error:', err);
      res.status(500).json({ message: 'Authentication error', error: err.message });
    }
  };
};

module.exports = apiKeyAuth;
