const express = require('express');
const { neonDb } = require('../../../config/db');
const apiKeyAuth = require('../../../middleware/apiKeyAuth');

const router = express.Router();

function scopedQuery(req: any, baseQuery: string, params: any[] = []) {
  const groupId = req.apiKey.accessGroupId;
  let idx = params.length + 1;
  if (groupId) {
    return {
      text: `${baseQuery} INNER JOIN app.inventory_access_group iag ON iag.inventoryid = s.id AND iag.accessgroupid = $${idx++}`,
      params: [...params, groupId],
    };
  }
  return { text: baseQuery, params };
}

router.get('/products', apiKeyAuth('products_read'), async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const pageLimit = parseInt(limit, 10);

    let baseWhere = 'WHERE 1=1';
    const queryParams: any[] = [];
    let idx = 1;

    if (search) {
      baseWhere += ` AND (s.stockname ILIKE $${idx} OR CAST(s.id AS TEXT) ILIKE $${idx})`;
      queryParams.push(`%${search}%`);
      idx++;
    }

    const { text: joinText, params: joinParams } = scopedQuery(req,
      'SELECT s.id, s.stockname AS name, CAST(s.id AS TEXT) AS sku, s.quantity AS qty, s.price, s.created_at, s.updated_at FROM app.stock s',
      queryParams
    );

    const countResult = await neonDb.query(
      `SELECT COUNT(*)::int AS total FROM app.stock s ${joinText.replace('SELECT s.id, s.stockname AS name, CAST(s.id AS TEXT) AS sku, s.quantity AS qty, s.price, s.created_at, s.updated_at', '')}`,
      joinParams
    );
    const total = countResult.rows[0]?.total || 0;

    const dataResult = await neonDb.query(
      `${joinText} ${baseWhere} ORDER BY s.stockname LIMIT $${idx} OFFSET $${idx + 1}`,
      [...joinParams, ...(search ? [`%${search}%`] : []), pageLimit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page: parseInt(page, 10),
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

router.get('/products/:id', apiKeyAuth('products_read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { text, params } = scopedQuery(req,
      'SELECT s.id, s.stockname AS name, CAST(s.id AS TEXT) AS sku, s.quantity AS qty, s.price, s.created_at, s.updated_at FROM app.stock s'
    );
    const result = await neonDb.query(
      `${text} AND s.id = $${params.length + 1}`,
      [...params, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[api/v1] GET /products/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/products', apiKeyAuth('products_write'), async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const result = await neonDb.query(
      'INSERT INTO app.stock (stockname, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, stockname AS name, quantity AS qty, price, created_at, updated_at',
      [name, quantity || 0, price || 0]
    );

    if (req.apiKey.accessGroupId) {
      await neonDb.query(
        'INSERT INTO app.inventory_access_group (inventoryid, accessgroupid, quantity, oprice) VALUES ($1, $2, $3, $4)',
        [result.rows[0].id, req.apiKey.accessGroupId, quantity || 0, price || 0]
      );
    }

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('[api/v1] POST /products error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/products/:id', apiKeyAuth('products_write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price } = req.body;

    const result = await neonDb.query(
      'UPDATE app.stock SET stockname = COALESCE($1, stockname), quantity = COALESCE($2, quantity), price = COALESCE($3, price), updated_at = NOW() WHERE id = $4 RETURNING id, stockname AS name, quantity AS qty, price, created_at, updated_at',
      [name ?? null, quantity ?? null, price ?? null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.apiKey.accessGroupId && (quantity != null || price != null)) {
      await neonDb.query(
        `UPDATE app.inventory_access_group SET quantity = COALESCE($1, quantity), oprice = COALESCE($2, oprice) WHERE inventoryid = $3 AND accessgroupid = $4`,
        [quantity ?? null, price ?? null, id, req.apiKey.accessGroupId]
      );
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('[api/v1] PUT /products/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/products/:id', apiKeyAuth('products_delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDb.query('DELETE FROM app.stock WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('[api/v1] DELETE /products/:id error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/analytics/sales', apiKeyAuth('analytics_read'), async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let baseQuery = `SELECT v.id, v.date, v.voucher_type, v.voucher_number, v.party_ledger_name,
                            v.narration, v.ledgerentries, v.inventoryentries, v.created_at
                     FROM app.vouchers v`;
    const params: any[] = [];
    let idx = 1;
    const conditions: string[] = [];

    if (req.apiKey.accessGroupId) {
      baseQuery += ` INNER JOIN app.inventory_access_group iag ON iag.accessgroupid = $${idx}`;
      params.push(req.apiKey.accessGroupId);
      conditions.push(`v.inventoryentries IS NOT NULL`);
      idx++;
    }

    if (from_date) { conditions.push(`v.date >= $${idx++}`); params.push(from_date); }
    if (to_date) { conditions.push(`v.date <= $${idx++}`); params.push(to_date); }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }
    baseQuery += ' ORDER BY v.date DESC LIMIT 200';

    const result = await neonDb.query(baseQuery, params);
    const rows = result.rows.map((r: any) => ({
      ...r,
      type: r.voucher_type,
      number: r.voucher_number,
      amount: r.ledgerentries
        ? r.ledgerentries.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
        : 0,
    }));

    res.json({ data: rows });
  } catch (err) {
    console.error('[api/v1] GET /analytics/sales error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
