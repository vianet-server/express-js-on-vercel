/**
 * Admin Inventory Routes
 *
 * Handles CRUD operations for inventory records.
 * All routes require admin authentication via adminAuth middleware
 */

const express = require('express');
const adminAuth = require('../../middleware/adminAuth');
const { admin: dbq } = require('../../config/dbqueries');

const router = express.Router();

router.use(adminAuth);

/**
 * POST /api/admin/inventory
 *
 * Create an inventory record (stock quantity per godown).
 *
 * Auth: adminAuth.
 * Requires (JSON body): { stockitem_id, godown_id, quantity }
 * Returns:
 *   201 { message: 'Inventory record created', data: created row }
 *   500 on error
 *
 * Called by: no direct frontend caller currently (frontend uses /api/admin/inventory/stock/* and sku/access-group/*).
 */
router.post('/inventory', async (req, res) => {
  try {
    const { stockitem_id, godown_id, quantity } = req.body;
    const data = await dbq.createInventoryRecord({ stockitem_id, godown_id, quantity });
    res.status(201).json({ message: 'Inventory record created', data });
  } catch (err) {
    console.error('[inventory] POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/admin/inventory
 *
 * List inventory records, optionally filtered by stockitem_id and/or godown_id.
 *
 * Auth: adminAuth.
 * Query params: { stockitem_id?, godown_id? }
 * Returns:
 *   200 { message: 'Inventory records fetched', data: [...rows] }
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.get('/inventory', async (req, res) => {
  try {
    const { stockitem_id, godown_id } = req.query;
    const data = await dbq.listInventoryRecords({ stockitem_id, godown_id });
    res.status(200).json({ message: 'Inventory records fetched', data });
  } catch (err) {
    console.error('[inventory] GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/admin/inventory
 *
 * Update an inventory record by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id, stockitem_id?, godown_id?, quantity? }
 * Returns:
 *   200 { message: 'Inventory record updated', data: updated row }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.put('/inventory', async (req, res) => {
  try {
    const { id, stockitem_id, godown_id, quantity } = req.body;
    const data = await dbq.updateInventoryRecord({ id, stockitem_id, godown_id, quantity });
    if (!data) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.status(200).json({ message: 'Inventory record updated', data });
  } catch (err) {
    console.error('[inventory] PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/admin/inventory
 *
 * Delete an inventory record by id.
 *
 * Auth: adminAuth.
 * Requires (JSON body): { id }
 * Returns:
 *   200 { message: 'Inventory record deleted' }
 *   404 when not found
 *   500 on error
 *
 * Called by: no direct frontend caller currently.
 */
router.delete('/inventory', async (req, res) => {
  try {
    const { id } = req.body;
    const data = await dbq.deleteInventoryRecord(id);
    if (!data) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.status(200).json({ message: 'Inventory record deleted' });
  } catch (err) {
    console.error('[inventory] DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
