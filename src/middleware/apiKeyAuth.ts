const { neonDb } = require('../config/db');

async function ensureLogTable() {
  try {
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS api_key_log (
        id SERIAL PRIMARY KEY,
        api_key_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await neonDb.query(`ALTER TABLE api_key_log ALTER COLUMN api_key_id TYPE TEXT`).catch(() => {});
  } catch (err) {
    console.warn('[apiKeyAuth] ensureLogTable warning:', err.message);
  }
}
ensureLogTable();

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

      const result = await neonDb.query(
        `SELECT k.keyid, k.key_name, k.key, k.access_group_id, k.permissions, k.duration,
                k.is_active, k.created_at, g.name AS group_name
         FROM app.api k
         LEFT JOIN app.access_groups g ON g.id = k.access_group_id
         WHERE k.key = $1`,
        [apiKey]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid API key' });
      }

      const key = result.rows[0];

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

      await neonDb.query(
        'UPDATE app.api SET last_used = NOW() WHERE keyid = $1',
        [key.keyid]
      );

      try {
        await neonDb.query(
          `INSERT INTO api_key_log (api_key_id, endpoint, method, status) VALUES ($1, $2, $3, $4)`,
          [key.keyid, req.originalUrl, req.method, null]
        );
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
