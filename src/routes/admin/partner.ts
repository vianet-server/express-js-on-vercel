const express = require('express');
const { listPartners, getMinAccessGroupId, createUserNoName, createPartnerProfile, getPartnerById, updatePartnerUserEmail, updatePartnerProfileByUserId, findPartnerProfile, deletePartnerById } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

router.use(adminAuth);

/**
 * GET /api/admin/partner
 *
 * List all partner users.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 { message: 'Partners fetched', data: [{ id, email, user_type, created_at, updated_at }] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (partner management UI not built).
 */
router.get('/', async (req, res) => {
  try {
    const result = await listPartners();
    res.status(200).json({ message: 'Partners fetched', data: result });
  } catch (err) {
    console.error('[admin/partner] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/admin/partner
 *
 * Create a partner user (assigned to the lowest-id access group) and optionally a
 * partner_profiles row.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { email, password, company_name?, phone?, address? }
 * Returns:
 *   201 { message: 'Partner created', data: { id, email, user_type } }
 *   400 when email/password missing or no access group exists
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/', async (req, res) => {
  try {
    const { email, password, company_name, phone, address } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);
    const groupId = await getMinAccessGroupId();
    if (!groupId) {
      return res.status(400).json({ message: 'No access group available.' });
    }
    const result = await createUserNoName({ email, password_hash, user_type: 'partner', access_group_id: groupId });
    if (company_name || phone || address) {
      await createPartnerProfile({ user_id: result.id, company_name, phone, address });
    }
    res.status(201).json({ message: 'Partner created', data: result });
  } catch (err) {
    console.error('[admin/partner] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/partner/:id
 *
 * Fetch one partner user plus their partner_profiles row (or null).
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Returns:
 *   200 { message: 'Partner fetched', data: { id, email, user_type, created_at, updated_at, profile } }
 *   404 when partner not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user, profile } = await getPartnerById(id);
    if (!user) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.status(200).json({ message: 'Partner fetched', data: { ...user, profile: profile || null } });
  } catch (err) {
    console.error('[admin/partner] GET by id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/partner/:id
 *
 * Update a partner's email and profile (company_name/phone/address), upserting the
 * partner_profiles row if it does not exist yet.
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Requires (JSON body): { email?, company_name?, phone?, address? }
 * Returns:
 *   200 { message: 'Partner updated', data: { id, email, user_type } }
 *   404 when partner not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, company_name, phone, address } = req.body;
    const userResult = await updatePartnerUserEmail({ id, email });
    if (!userResult) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    const existingProfile = await findPartnerProfile(id);
    if (existingProfile) {
      await updatePartnerProfileByUserId({ user_id: id, company_name, phone, address });
    } else if (company_name || phone || address) {
      await createPartnerProfile({ user_id: id, company_name, phone, address });
    }
    res.status(200).json({ message: 'Partner updated', data: userResult });
  } catch (err) {
    console.error('[admin/partner] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/partner/:id
 *
 * Delete a partner user (scoped to user_type = 'partner').
 *
 * Auth: adminAuth.
 * Path params: { id }
 * Returns:
 *   200 { message: 'Partner deleted' }
 *   404 when partner not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deletePartnerById(id);
    if (!result) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.status(200).json({ message: 'Partner deleted' });
  } catch (err) {
    console.error('[admin/partner] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
