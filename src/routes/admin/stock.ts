const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const crypto = require('crypto');

const router = express.Router();
router.use(adminAuth);

function genGuid() { return crypto.randomUUID(); }

// ==================== STOCK ITEM CRUD ====================

router.post('/stock-item', async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const result = await neonDb.query(
      'INSERT INTO app.stock (stockname, guid, quantity, price, masterid, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, NOW(), NOW()) RETURNING *',
      [name, genGuid(), quantity, price]
    );
    res.status(201).json({ message: 'Stock item created', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] stock-item POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/stock-item', async (req, res) => {
  try {
    const { name } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    let countQuery = 'SELECT COUNT(*) FROM app.stock WHERE 1=1';
    let dataQuery = 'SELECT * FROM app.stock WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (name) {
      const clause = ` AND stockname ILIKE $${idx++}`;
      countQuery += clause;
      dataQuery += clause;
      params.push(`%${name}%`);
    }

    const countResult = await neonDb.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ` ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const result = await neonDb.query(dataQuery, params);
    const rows = result.rows.map((r: any) => ({
      id: r.id,
      name: r.stockname || '',
      category: '',
      qty: r.quantity || 0,
      value: parseFloat(r.price) || 0,
      status: 'Active',
    }));
    res.json({ rows, total, limit, offset });
  } catch (err) {
    console.error('[stock] stock-item GET error:', err);
    res.json({ rows: [], total: 0, limit: 50, offset: 0 });
  }
});

router.put('/stock-item', async (req, res) => {
  try {
    const { id, name, quantity, price } = req.body;
    const result = await neonDb.query(
      'UPDATE app.stock SET stockname = $1, quantity = $2, price = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, quantity, price, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    res.status(200).json({ message: 'Stock item updated', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] stock-item PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/stock-item', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.stock WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[stock] stock-item DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== LEDGER CRUD ====================

router.post('/ledger', async (req, res) => {
  try {
    const { name, address, mobile } = req.body;
    const result = await neonDb.query(
      'INSERT INTO app.ledger (guid, name, address, mobile) VALUES ($1, $2, $3, $4) RETURNING *',
      [genGuid(), name, address ? [address] : null, mobile ? [mobile] : null]
    );
    res.status(201).json({ message: 'Ledger created', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] ledger POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/ledger', async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT id, guid, name, address, mobile, ledgername FROM app.ledger WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    query += ' ORDER BY name';
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Ledgers fetched', data: result.rows });
  } catch (err) {
    console.error('[stock] ledger GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/ledger', async (req, res) => {
  try {
    const { id, name, address, mobile } = req.body;
    const result = await neonDb.query(
      'UPDATE app.ledger SET name = $1, address = $2, mobile = $3 WHERE id = $4 RETURNING *',
      [name, address ? [address] : null, mobile ? [mobile] : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Ledger not found' });
    res.status(200).json({ message: 'Ledger updated', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] ledger PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/ledger', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.ledger WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Ledger not found' });
    res.status(200).json({ message: 'Ledger deleted' });
  } catch (err) {
    console.error('[stock] ledger DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== VOUCHER CRUD ====================

router.post('/voucher', async (req, res) => {
  try {
    const { voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
    const result = await neonDb.query(
      `INSERT INTO app.vouchers (guid, date, voucher_type, voucher_number, party_ledger_name, narration)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [genGuid(), date, voucher_type, voucher_number, party_ledger_name, narration]
    );
    res.status(201).json({ message: 'Voucher created', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] voucher POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/voucher', async (req, res) => {
  try {
    const { voucher_type, voucher_number, from_date, to_date } = req.query;
    let query = `SELECT id, guid, date, voucher_type, voucher_number, party_ledger_name,
                        narration, ledgerentries, inventoryentries, created_at, billagentname
                 FROM app.vouchers WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;
    if (voucher_type) { query += ` AND voucher_type = $${idx++}`; params.push(voucher_type); }
    if (voucher_number) { query += ` AND voucher_number = $${idx++}`; params.push(voucher_number); }
    if (from_date) { query += ` AND date >= $${idx++}`; params.push(from_date); }
    if (to_date) { query += ` AND date <= $${idx++}`; params.push(to_date); }
    query += ' ORDER BY date DESC LIMIT 200';
    const result = await neonDb.query(query, params);
    const rows = result.rows.map((r: any) => ({
      ...r,
      type: r.voucher_type,
      number: r.voucher_number,
      amount: r.ledgerentries
        ? r.ledgerentries
            .filter((e: any) => e.isDeemedPositive === 'No')
            .reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
        : 0,
    }));
    res.status(200).json(rows);
  } catch (err) {
    console.error('[stock] voucher GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/voucher', async (req, res) => {
  try {
    const { id, voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
    const result = await neonDb.query(
      `UPDATE app.vouchers SET voucher_type = $1, voucher_number = $2, date = $3,
       narration = $4, party_ledger_name = $5 WHERE id = $6 RETURNING *`,
      [voucher_type, voucher_number, date, narration, party_ledger_name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Voucher not found' });
    res.status(200).json({ message: 'Voucher updated', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] voucher PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/voucher', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.vouchers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Voucher not found' });
    res.status(200).json({ message: 'Voucher deleted' });
  } catch (err) {
    console.error('[stock] voucher DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== GODOWN CRUD ====================

router.post('/godown', async (req, res) => {
  try {
    const { name, address } = req.body;
    const result = await neonDb.query(
      'INSERT INTO godowns (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [name, address]
    );
    res.status(201).json({ message: 'Godown created', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] godown POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/godown', async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT * FROM godowns WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Godowns fetched', data: result.rows });
  } catch (err) {
    console.error('[stock] godown GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/godown', async (req, res) => {
  try {
    const { id, name, address } = req.body;
    const result = await neonDb.query(
      'UPDATE godowns SET name = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, address, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Godown not found' });
    res.status(200).json({ message: 'Godown updated', data: result.rows[0] });
  } catch (err) {
    console.error('[stock] godown PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/godown', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM godowns WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Godown not found' });
    res.status(200).json({ message: 'Godown deleted' });
  } catch (err) {
    console.error('[stock] godown DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== MASTERS & SALESMAN ====================

router.get('/masters', async (req, res) => {
  try {
    const [stock, ledger, voucher, godown] = await Promise.all([
      neonDb.query("SELECT COUNT(*) FROM app.stock"),
      neonDb.query("SELECT COUNT(*) FROM app.ledger"),
      neonDb.query("SELECT COUNT(*) FROM app.vouchers"),
      neonDb.query("SELECT COUNT(*) FROM godowns"),
    ]);
    res.json([
      { id: 'stock', name: 'Stock Items', records: parseInt(stock.rows[0].count), lastUpdated: '', status: 'Active' },
      { id: 'ledger', name: 'Ledgers', records: parseInt(ledger.rows[0].count), lastUpdated: '', status: 'Active' },
      { id: 'voucher', name: 'Vouchers', records: parseInt(voucher.rows[0].count), lastUpdated: '', status: 'Active' },
      { id: 'godown', name: 'Godowns', records: parseInt(godown.rows[0].count), lastUpdated: '', status: 'Active' },
    ]);
  } catch (err) {
    console.error('[stock] GET /masters error:', err);
    res.json([]);
  }
});

router.get('/salesman', async (req, res) => {
  try {
    const result = await neonDb.query("SELECT id, name FROM godowns ORDER BY name");
    res.json(result.rows.map((r: any) => ({ ...r, target: 0, achieved: 0, commission: 0 })));
  } catch (err) {
    console.error('[stock] GET /salesman error:', err);
    res.json([]);
  }
});

module.exports = router;
