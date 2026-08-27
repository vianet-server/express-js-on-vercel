const express = require('express');
const adminAuth = require('../../middleware/adminAuth');
const { admin: dbq } = require('../../config/dbqueries');

const router = express.Router();
router.use(adminAuth);

/**
 * Create an email marketing campaign.
 * Body: { name, email?, accessGroup?, brand?, schedule?, includePrice?, includeDetailed? }
 * accessGroup is the access group name; it is resolved to access_group_id server-side.
 */
router.post('/email-marketing', async (req, res) => {
  try {
    const { name, email, accessGroup, brand, schedule, includePrice, includeDetailed } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'name is required' });
    }
    const saved = await dbq.saveEmailMarketing({
      name: String(name).trim(),
      email: email ? String(email).trim() : null,
      accessGroupName: accessGroup ? String(accessGroup).trim() : null,
      brand: brand ? String(brand) : null,
      schedule: schedule ? String(schedule) : null,
      includePrice: !!includePrice,
      includeDetailed: !!includeDetailed,
    });
    res.status(201).json({ message: 'Email campaign created', data: saved });
  } catch (err) {
    console.error('[email] POST /email-marketing error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * Stamp last_sent for a campaign when it is actually sent.
 */
router.put('/email-marketing/:id/sent', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'invalid id' });
    }
    const updated = await dbq.updateEmailMarketingLastSent(id);
    if (!updated) {
      return res.status(404).json({ message: 'Email campaign not found' });
    }
    res.json({ message: 'Last sent updated', data: updated });
  } catch (err) {
    console.error('[email] PUT /email-marketing/:id/sent error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
