const crypto = require('crypto');
const express = require('express');
const { neonDb } = require('../../../config/db');
const auth = require('../../../middleware/auth');

const router = express.Router();

function genGuid() { return crypto.randomUUID(); }

// ==================== STOCK ITEM CRUD ====================

router.post('/stock-item', auth('user'), async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const result = await neonDb.query(
      'INSERT INTO app.stock (stockname, guid, quantity, price, masterid, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, NOW(), NOW()) RETURNING *',
      [name, genGuid(), quantity, price]
    );
    res.status(201).json({ message: 'Stock item created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] stock-item POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/stock-item', auth('user'), async (req, res) => {
  try {
    const { name } = req.query;
    const params: any[] = [];
    let idx = 1;
    let query;

    if (req.user.usertype === 'admin') {
      query = 'SELECT s.* FROM app.stock s WHERE 1=1';
    } else {
      query = `SELECT s.* FROM app.stock s INNER JOIN app.inventory_access_group iag ON iag.inventoryid = s.id INNER JOIN app.users u ON u.userid = $${idx++} AND u.access_group_id = iag.accessgroupid`;
      params.push(req.user.id);
    }

    if (name) { query += ` AND s.stockname ILIKE $${idx++}`; params.push(`%${name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Stock items fetched', data: result.rows });
  } catch (err) {
    console.error('[api/tally] stock-item GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/stock-item', auth('user'), async (req, res) => {
  try {
    const { id, name, quantity, price } = req.body;
    const result = await neonDb.query(
      'UPDATE app.stock SET stockname = $1, quantity = $2, price = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, quantity, price, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    res.status(200).json({ message: 'Stock item updated', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] stock-item PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/stock-item', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.stock WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Stock item not found' });
    res.status(200).json({ message: 'Stock item deleted' });
  } catch (err) {
    console.error('[api/tally] stock-item DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== LEDGER CRUD ====================

router.post('/ledger', auth('user'), async (req, res) => {
  try {
    const { name, address, mobile } = req.body;
    const result = await neonDb.query(
      'INSERT INTO app.ledger (guid, name, address, mobile) VALUES ($1, $2, $3, $4) RETURNING *',
      [genGuid(), name, address ? [address] : null, mobile ? [mobile] : null]
    );
    res.status(201).json({ message: 'Ledger created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] ledger POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/ledger', auth('user'), async (req, res) => {
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
    console.error('[api/tally] ledger GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/ledger', auth('user'), async (req, res) => {
  try {
    const { id, name, address, mobile } = req.body;
    const result = await neonDb.query(
      'UPDATE app.ledger SET name = $1, address = $2, mobile = $3 WHERE id = $4 RETURNING *',
      [name, address ? [address] : null, mobile ? [mobile] : null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Ledger not found' });
    res.status(200).json({ message: 'Ledger updated', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] ledger PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/ledger', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.ledger WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Ledger not found' });
    res.status(200).json({ message: 'Ledger deleted' });
  } catch (err) {
    console.error('[api/tally] ledger DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== VOUCHER CRUD ====================

router.post('/voucher', auth('user'), async (req, res) => {
  try {
    const { voucher_type, voucher_number, date, narration, party_ledger_name } = req.body;
    const result = await neonDb.query(
      `INSERT INTO app.vouchers (guid, date, voucher_type, voucher_number, party_ledger_name, narration)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [genGuid(), date, voucher_type, voucher_number, party_ledger_name, narration]
    );
    res.status(201).json({ message: 'Voucher created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] voucher POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/voucher', auth('user'), async (req, res) => {
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
      amount: r.ledgerentries ? r.ledgerentries.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0) : 0,
    }));
    res.status(200).json({ message: 'Vouchers fetched', data: rows });
  } catch (err) {
    console.error('[api/tally] voucher GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/voucher', auth('user'), async (req, res) => {
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
    console.error('[api/tally] voucher PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/voucher', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM app.vouchers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Voucher not found' });
    res.status(200).json({ message: 'Voucher deleted' });
  } catch (err) {
    console.error('[api/tally] voucher DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ==================== GODOWN CRUD ====================

router.post('/godown', auth('user'), async (req, res) => {
  try {
    const { name, address } = req.body;
    const result = await neonDb.query(
      'INSERT INTO godowns (name, address, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [name, address]
    );
    res.status(201).json({ message: 'Godown created', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] godown POST error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/godown', auth('user'), async (req, res) => {
  try {
    const { name } = req.query;
    let query = 'SELECT * FROM godowns WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (name) { query += ` AND name ILIKE $${idx++}`; params.push(`%${name}%`); }
    const result = await neonDb.query(query, params);
    res.status(200).json({ message: 'Godowns fetched', data: result.rows });
  } catch (err) {
    console.error('[api/tally] godown GET error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/godown', auth('user'), async (req, res) => {
  try {
    const { id, name, address } = req.body;
    const result = await neonDb.query(
      'UPDATE godowns SET name = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, address, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Godown not found' });
    res.status(200).json({ message: 'Godown updated', data: result.rows[0] });
  } catch (err) {
    console.error('[api/tally] godown PUT error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/godown', auth('user'), async (req, res) => {
  try {
    const { id } = req.body;
    const result = await neonDb.query('DELETE FROM godowns WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Godown not found' });
    res.status(200).json({ message: 'Godown deleted' });
  } catch (err) {
    console.error('[api/tally] godown DELETE error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
