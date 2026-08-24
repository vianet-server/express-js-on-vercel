const express = require('express');
const { listProductsV1, getProductV1, createProductV1, updateProductV1, deleteStockItemById, listSalesVouchersV1 } = require('../../../config/dbqueries/api');
const apiKeyAuth = require('../../../middleware/apiKeyAuth');

const router = express.Router();

/**
 * GET /api/v1/products
 *
 * Paginated product catalog. When the API key is bound to an access group, results
 * are scoped via INNER JOIN to inventory_access_group for that group.
 *
 * Auth: apiKeyAuth('products_read').
 * Query params: { search?, page? (default 1), limit? (default 20) }
 * Returns:
 *   200 { data: [{ id, name, sku, qty, price, created_at, updated_at }], pagination: { page, limit, total, totalPages } }
 *   500 { message, error }
 *
 * Called by: external integrations via the public API (listed in admin API endpoints reference).
 */
router.get('/products', apiKeyAuth('products_read'), async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);

    const { rows, total } = await listProductsV1({
      accessGroupId: req.apiKey.accessGroupId,
      search,
      page: pageNum,
      limit: pageLimit,
    });

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (err) {
    console.error('[api/v1] GET /products error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/v1/products/:id
 *
 * Single product by id (group-scoped when the key has an access group).
 *
 * Auth: apiKeyAuth('products_read').
 * Path params: { id }
 * Returns:
 *   200 { data: { id, name, sku, qty, price, created_at, updated_at } }
 *   404 { message: 'Product not found' }
 *   500 { message, error }
 *
 * Called by: external integrations via the public API.
 */
router.get('/products/:id', apiKeyAuth('products_read'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getProductV1({ accessGroupId: req.apiKey.accessGroupId, id });
    if (!data) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ data });
  } catch (err) {
    console.error('[api/v1] GET /products/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/v1/products
 *
 * Create a product. When the key has an access group, the product is also mapped
 * to that group via inventory_access_group.
 *
 * Auth: apiKeyAuth('products_write').
 * Requires (JSON body): { name, quantity?, price?, category_level_1?, category_level_2? }
 * Returns:
 *   201 { data: { id, name, qty, price, created_at, updated_at } }
 *   400 { message: 'name is required' }
 *   500 { message, error }
 *
 * Called by: external integrations via the public API.
 */
router.post('/products', apiKeyAuth('products_write'), async (req, res) => {
  try {
    const { name, quantity, price, category_level_1, category_level_2 } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const data = await createProductV1({ name, quantity, price, category_level_1, category_level_2, accessGroupId: req.apiKey.accessGroupId });

    res.status(201).json({ data });
  } catch (err) {
    console.error('[api/v1] POST /products error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/v1/products/:id
 *
 * Partially update a product. When the key has an access group, qty/price changes
 * are mirrored into the group's inventory_access_group mapping.
 *
 * Auth: apiKeyAuth('products_write').
 * Path params: { id }
 * Requires (JSON body): { name?, quantity?, price?, category_level_1?, category_level_2? }
 * Returns:
 *   200 { data: updated product }
 *   404 { message: 'Product not found' }
 *   500 { message, error }
 *
 * Called by: external integrations via the public API.
 */
router.put('/products/:id', apiKeyAuth('products_write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, category_level_1, category_level_2 } = req.body;

    const data = await updateProductV1({ id, name, quantity, price, category_level_1, category_level_2, accessGroupId: req.apiKey.accessGroupId });
    if (!data) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ data });
  } catch (err) {
    console.error('[api/v1] PUT /products/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * DELETE /api/v1/products/:id
 *
 * Delete a product.
 *
 * Auth: apiKeyAuth('products_delete').
 * Path params: { id }
 * Returns:
 *   200 { message: 'Product deleted' }
 *   404 { message: 'Product not found' }
 *   500 { message, error }
 *
 * Called by: external integrations via the public API.
 */
router.delete('/products/:id', apiKeyAuth('products_delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const data = await deleteStockItemById(id);
    if (!data) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('[api/v1] DELETE /products/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/v1/analytics/sales
 *
 * Sales vouchers (max 200) optionally filtered by date range. When the key has an
 * access group the query joins inventory_access_group to scope the result. Each row
 * gains `type`, `number`, and an `amount` (sum of ledgerentry amounts).
 *
 * Auth: apiKeyAuth('analytics_read').
 * Query params: { from_date?, to_date? }
 * Returns:
 *   200 { data: [{ id, date, voucher_type, voucher_number, party_ledger_name, narration, ledgerentries, inventoryentries, created_at, type, number, amount }] }
 *   500 { message, error }
 *
 * Called by: external integrations via the public API.
 */
router.get('/analytics/sales', apiKeyAuth('analytics_read'), async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const rows = await listSalesVouchersV1({ accessGroupId: req.apiKey.accessGroupId, from_date, to_date });
    const data = rows.map((r: any) => ({
      ...r,
      type: r.voucher_type,
      number: r.voucher_number,
      amount: r.ledgerentries
        ? r.ledgerentries.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
        : 0,
    }));

    res.json({ data });
  } catch (err) {
    console.error('[api/v1] GET /analytics/sales error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
