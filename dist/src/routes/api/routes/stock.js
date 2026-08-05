"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require('crypto');
const express = require('express');
const { createStockItemGuid, updateStockItemById, deleteStockItemById, createLedger, listLedgers, updateLedger, deleteLedger, createVoucher, listVouchers, updateVoucher, deleteVoucher, createGodown, listGodowns, updateGodown, deleteGodown, listStockItemsForUser, } = require('../../../config/dbqueries/api');
const auth = require('../../../middleware/auth');
const router = express.Router();
function genGuid() { return crypto.randomUUID(); }
// ==================== STOCK ITEM CRUD ====================
/**
 * POST /api/stock/stock-item
 *
 * Create a stock item (public app API). Generates a UUID guid, masterid 0.
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { name, quantity?, price? }
 * Returns:
 *   201 { message: 'Stock item created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/stock-item', auth('user'), async (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        const data = await createStockItemGuid({ name, guid: genGuid(), quantity, price });
        res.status(201).json({ message: 'Stock item created', data });
    }
    catch (err) {
        console.error('[api/stock] stock-item POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * GET /api/stock/stock-item
 *
 * List stock items. Admins see all stock; other users see ONLY stock mapped to
 * their access group (via inventory_access_group + app.inventory join), enriched
 * with brand/model/variant/color/gst and group price/qty. Also computes sgst/cgst
 * from gst and passes hsn through.
 *
 * Auth: auth('user') (admin also allowed).
 * Query params: { name? }
 * Returns:
 *   200 { message: 'Stock items fetched', data: [...], }
 *   For non-admin with no group access: 200 { message: 'No stock access...', data: [], noAccess: true }
 *   500 on error
 *
 * Called by: vianet/src/appPages/portals.tsx -> api.get('/api/stock/stock-item')
 *   Displays: the app portal's stock/product catalog (name, brand, qty, price,
 *   gst/sgst/cgst). Handles the noAccess flag to show a "no access" message.
 */
router.get('/stock-item', auth('user'), async (req, res) => {
    try {
        const { name } = req.query;
        const rows = await listStockItemsForUser({ isAdmin: req.user.user_type === 'admin', userId: req.user.id, name });
        if (req.user.user_type !== 'admin' && rows.length === 0) {
            return res.status(200).json({ message: 'No stock access. Contact the team.', data: [], noAccess: true });
        }
        const data = rows.map((r) => { const g = parseFloat(r.gst) || 0; return { ...r, sgst: g / 2, cgst: g / 2, hsn: r.hsn || '' }; });
        res.status(200).json({ message: 'Stock items fetched', data });
    }
    catch (err) {
        console.error('[api/stock] stock-item GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * PUT /api/stock/stock-item
 *
 * Update a stock item by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id, name?, quantity?, price? }
 * Returns:
 *   200 { message: 'Stock item updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/stock-item', auth('user'), async (req, res) => {
    try {
        const { id, name, quantity, price } = req.body;
        const data = await updateStockItemById({ id, name, quantity, price });
        if (!data)
            return res.status(404).json({ message: 'Stock item not found' });
        res.status(200).json({ message: 'Stock item updated', data });
    }
    catch (err) {
        console.error('[api/stock] stock-item PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * DELETE /api/stock/stock-item
 *
 * Delete a stock item by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Stock item deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/stock-item', auth('user'), async (req, res) => {
    try {
        const { id } = req.body;
        const data = await deleteStockItemById(id);
        if (!data)
            return res.status(404).json({ message: 'Stock item not found' });
        res.status(200).json({ message: 'Stock item deleted' });
    }
    catch (err) {
        console.error('[api/stock] stock-item DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// ==================== LEDGER CRUD ====================
/**
 * POST /api/stock/ledger
 *
 * Create a ledger (public app API). address/mobile stored as arrays.
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { name, address?, mobile? }
 * Returns:
 *   201 { message: 'Ledger created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/ledger', auth('user'), async (req, res) => {
    try {
        const { name, address, mobile } = req.body;
        const data = await createLedger({ guid: genGuid(), name, address, mobile });
        res.status(201).json({ message: 'Ledger created', data });
    }
    catch (err) {
        console.error('[api/stock] ledger POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * GET /api/stock/ledger
 *
 * List ledgers, optionally filtered by name (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Query params: { name? }
 * Returns:
 *   200 { message: 'Ledgers fetched', data: [{ id, guid, name, address, mobile, ledgername }] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/ledger', auth('user'), async (req, res) => {
    try {
        const { name } = req.query;
        const data = await listLedgers({ name });
        res.status(200).json({ message: 'Ledgers fetched', data });
    }
    catch (err) {
        console.error('[api/stock] ledger GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * PUT /api/stock/ledger
 *
 * Update a ledger by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id, name?, address?, mobile? }
 * Returns:
 *   200 { message: 'Ledger updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/ledger', auth('user'), async (req, res) => {
    try {
        const { id, name, address, mobile } = req.body;
        const data = await updateLedger({ id, name, address, mobile });
        if (!data)
            return res.status(404).json({ message: 'Ledger not found' });
        res.status(200).json({ message: 'Ledger updated', data });
    }
    catch (err) {
        console.error('[api/stock] ledger PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * DELETE /api/stock/ledger
 *
 * Delete a ledger by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Ledger deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/ledger', auth('user'), async (req, res) => {
    try {
        const { id } = req.body;
        const data = await deleteLedger(id);
        if (!data)
            return res.status(404).json({ message: 'Ledger not found' });
        res.status(200).json({ message: 'Ledger deleted' });
    }
    catch (err) {
        console.error('[api/stock] ledger DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// ==================== VOUCHER CRUD ====================
/**
 * POST /api/stock/voucher
 *
 * Create a voucher (public app API). Generates a UUID guid.
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { voucher_type, voucher_number?, date?, narration?, party_ledger_name? }
 * Returns:
 *   201 { message: 'Voucher created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/voucher', auth('user'), async (req, res) => {
    try {
        const { voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
        const data = await createVoucher({ guid: genGuid(), date, voucher_type, voucher_number, party_ledger_name, narration });
        res.status(201).json({ message: 'Voucher created', data });
    }
    catch (err) {
        console.error('[api/stock] voucher POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * GET /api/stock/voucher
 *
 * List vouchers, optionally filtered by type/number/date range (max 200, newest
 * first). Each row gets a derived `amount` (sum of ledgerentries amounts) plus
 * type/number aliases.
 *
 * Auth: auth('user') (admin also allowed).
 * Query params: { voucher_type?, voucher_number?, from_date?, to_date? }
 * Returns:
 *   200 { message: 'Vouchers fetched', data: [...rows with amount/type/number] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/voucher', auth('user'), async (req, res) => {
    try {
        const { voucher_type, voucher_number, from_date, to_date } = req.query;
        const rows = await listVouchers({ voucher_type, voucher_number, from_date, to_date });
        const data = rows.map((r) => ({
            ...r,
            type: r.voucher_type,
            number: r.voucher_number,
            amount: r.ledgerentries ? r.ledgerentries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) : 0,
        }));
        res.status(200).json({ message: 'Vouchers fetched', data });
    }
    catch (err) {
        console.error('[api/stock] voucher GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * PUT /api/stock/voucher
 *
 * Update a voucher by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id, voucher_type?, voucher_number?, date?, narration?, party_ledger_name? }
 * Returns:
 *   200 { message: 'Voucher updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/voucher', auth('user'), async (req, res) => {
    try {
        const { id, voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
        const data = await updateVoucher({ id, voucher_type, voucher_number, date, narration, party_ledger_name });
        if (!data)
            return res.status(404).json({ message: 'Voucher not found' });
        res.status(200).json({ message: 'Voucher updated', data });
    }
    catch (err) {
        console.error('[api/stock] voucher PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * DELETE /api/stock/voucher
 *
 * Delete a voucher by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Voucher deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/voucher', auth('user'), async (req, res) => {
    try {
        const { id } = req.body;
        const data = await deleteVoucher(id);
        if (!data)
            return res.status(404).json({ message: 'Voucher not found' });
        res.status(200).json({ message: 'Voucher deleted' });
    }
    catch (err) {
        console.error('[api/stock] voucher DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
// ==================== GODOWN CRUD ====================
/**
 * POST /api/stock/godown
 *
 * Create a godown (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { name, address? }
 * Returns:
 *   201 { message: 'Godown created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/godown', auth('user'), async (req, res) => {
    try {
        const { name, address } = req.body;
        const data = await createGodown({ name, address });
        res.status(201).json({ message: 'Godown created', data });
    }
    catch (err) {
        console.error('[api/stock] godown POST error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * GET /api/stock/godown
 *
 * List godowns, optionally filtered by name (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Query params: { name? }
 * Returns:
 *   200 { message: 'Godowns fetched', data: [...godown rows] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/godown', auth('user'), async (req, res) => {
    try {
        const { name } = req.query;
        const data = await listGodowns({ name });
        res.status(200).json({ message: 'Godowns fetched', data });
    }
    catch (err) {
        console.error('[api/stock] godown GET error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * PUT /api/stock/godown
 *
 * Update a godown by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id, name?, address? }
 * Returns:
 *   200 { message: 'Godown updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/godown', auth('user'), async (req, res) => {
    try {
        const { id, name, address } = req.body;
        const data = await updateGodown({ id, name, address });
        if (!data)
            return res.status(404).json({ message: 'Godown not found' });
        res.status(200).json({ message: 'Godown updated', data });
    }
    catch (err) {
        console.error('[api/stock] godown PUT error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
/**
 * DELETE /api/stock/godown
 *
 * Delete a godown by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Godown deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/godown', auth('user'), async (req, res) => {
    try {
        const { id } = req.body;
        const data = await deleteGodown(id);
        if (!data)
            return res.status(404).json({ message: 'Godown not found' });
        res.status(200).json({ message: 'Godown deleted' });
    }
    catch (err) {
        console.error('[api/stock] godown DELETE error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
module.exports = router;
