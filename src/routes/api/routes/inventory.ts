/**
 * api/routes/inventory.js
 *
 * Public inventory routes.
 * Uses standard auth middleware for protected endpoints.
 */

const express = require('express');
const { createInventoryRecord, listInventoryRecords, updateInventoryRecord, deleteInventoryRecord } = require('../../../config/dbqueries/api');
const auth = require('../../../middleware/auth');

const router = express.Router();

/**
 * POST /api/inventory
 *
 * Create an inventory record (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { stockitem_id, godown_id, quantity }
 * Returns:
 *   201 { message: 'Inventory record created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.post('/', auth('user'), async (req, res) => {
  try {
    const { stockitem_id, godown_id, quantity } = req.body;
    const data = await createInventoryRecord({ stockitem_id, godown_id, quantity });
    res.status(201).json({ message: 'Inventory record created', data });
  } catch (err) {
    console.error('[api/inventory] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/inventory
 *
 * List inventory records, optionally filtered by stockitem_id and/or godown_id
 * (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Query params: { stockitem_id?, godown_id? }
 * Returns:
 *   200 { message: 'Inventory records fetched', data: [...rows] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/', auth('user'), async (req, res) => {
  try {
    const { stockitem_id, godown_id } = req.query;
    const data = await listInventoryRecords({ stockitem_id, godown_id });
    res.status(200).json({ message: 'Inventory records fetched', data });
  } catch (err) {
    console.error('[api/inventory] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/inventory
 *
 * Update an inventory record by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id, stockitem_id?, godown_id?, quantity? }
 * Returns:
 *   200 { message: 'Inventory record updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/', auth('user'), async (req, res) => {
  try {
    const { id, stockitem_id, godown_id, quantity } = req.body;
    const data = await updateInventoryRecord({ id, stockitem_id, godown_id, quantity });
    if (!data) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.status(200).json({ message: 'Inventory record updated', data });
  } catch (err) {
    console.error('[api/inventory] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/inventory
 *
 * Delete an inventory record by id (public app API).
 *
 * Auth: auth('user') (admin also allowed).
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Inventory record deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const data = await deleteInventoryRecord(id);
    if (!data) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.status(200).json({ message: 'Inventory record deleted' });
  } catch (err) {
    console.error('[api/inventory] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
