"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { getUserBriefById, findPartnerProfile, updatePartnerProfileByUserId, createPartnerProfile } = require('../../../config/dbqueries/partner');
const auth = require('../../../middleware/auth');
const router = express.Router();
router.use(auth('partner'));
/**
 * GET /partner/profile
 *
 * Fetch the authenticated partner's user row + partner_profiles row.
 *
 * Auth: auth('partner') (admin also allowed).
 * Query params: none.
 * Returns:
 *   200 { message: 'Partner profile fetched', data: { id, email, user_type, profile } }
 *   500 on error
 *
 * Called by: no frontend caller yet (partner portal UI not built).
 */
router.get('/', async (req, res) => {
    try {
        const user_id = req.user.id;
        const user = await getUserBriefById(user_id);
        const profile = await findPartnerProfile(user_id);
        res.status(200).json({ message: 'Partner profile fetched', data: { ...user, profile: profile || null } });
    }
    catch (err) {
        console.error('[partner/profile] GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * PUT /partner/profile
 *
 * Update the authenticated partner's profile (upserts partner_profiles).
 *
 * Auth: auth('partner') (admin also allowed).
 * Requires (JSON body): { company_name?, phone?, address? }
 * Returns:
 *   200 { message: 'Partner profile updated' }
 *   500 on error
 *
 * Called by: no frontend caller yet.
 */
router.put('/', async (req, res) => {
    try {
        const user_id = req.user.id;
        const { company_name, phone, address } = req.body;
        const existing = await findPartnerProfile(user_id);
        if (existing) {
            await updatePartnerProfileByUserId({ user_id, company_name, phone, address });
        }
        else {
            await createPartnerProfile({ user_id, company_name, phone, address });
        }
        res.status(200).json({ message: 'Partner profile updated' });
    }
    catch (err) {
        console.error('[partner/profile] PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
