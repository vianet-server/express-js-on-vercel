"use strict";
/**
 * api/keys/index.js
 *
 * Public API key management routes.
 * Uses standard auth middleware for protected endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const crypto = require('crypto');
const { createOwnApiKey, listOwnApiKeys, updateOwnApiKey, deleteOwnApiKey } = require('../../../config/dbqueries/api');
const auth = require('../../../middleware/auth');
const router = express.Router();
/**
 * POST /api/keys
 *
 * Create an API key owned by the authenticated user. Generates a `via.<hex>` secret.
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { key_name? }
 * Returns:
 *   201 { message: 'API key created', data: { keyid, key_name, key, is_active, created_at } }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (admin API key management lives at /api/admin/api).
 */
router.post('/', auth('user'), async (req, res) => {
    try {
        const { key_name } = req.body;
        const keyid = crypto.randomUUID();
        const key = 'via.' + crypto.randomBytes(32).toString('hex');
        const user_id = req.user?.id;
        const data = await createOwnApiKey({ keyid, key_name, key, user_id });
        res.status(201).json({ message: 'API key created', data });
    }
    catch (err) {
        console.error('[api/keys] POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * GET /api/keys
 *
 * List the authenticated user's own API keys.
 *
 * Auth: auth('user') (admin also allowed).
 * Query params: none.
 * Returns:
 *   200 { message: 'API keys fetched', data: [{ keyid, key_name, key, is_active, created_at, last_used }] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/', auth('user'), async (req, res) => {
    try {
        const user_id = req.user?.id;
        const data = await listOwnApiKeys(user_id);
        res.status(200).json({ message: 'API keys fetched', data });
    }
    catch (err) {
        console.error('[api/keys] GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * PUT /api/keys
 *
 * Update a user's API key (name and/or active status).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id, key_name?, is_active? }
 * Returns:
 *   200 { message: 'API key updated', data: { keyid, key_name, key, is_active } }
 *   404 when key not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/', auth('user'), async (req, res) => {
    try {
        const { id, key_name, is_active } = req.body;
        const data = await updateOwnApiKey({ id, key_name, is_active });
        if (!data) {
            return res.status(404).json({ message: 'API key not found' });
        }
        res.status(200).json({ message: 'API key updated', data });
    }
    catch (err) {
        console.error('[api/keys] PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * DELETE /api/keys
 *
 * Delete a user's API key.
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'API key deleted' }
 *   404 when key not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/', auth('user'), async (req, res) => {
    try {
        const { id } = req.body;
        const data = await deleteOwnApiKey(id);
        if (!data) {
            return res.status(404).json({ message: 'API key not found' });
        }
        res.status(200).json({ message: 'API key deleted' });
    }
    catch (err) {
        console.error('[api/keys] DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
