const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

// === P&L — use pre-computed data from app.profitloss ===
router.get('/pnl', async (req, res) => {
  try {
    const result = await neonDb.query(
      "SELECT data FROM app.profitloss ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length === 0) return res.json([]);
    const pl = result.rows[0].data;
    const rows = (pl.rows || []).map((r: any, i: number) => ({
      id: i + 1,
      label: r.name || 'Unknown',
      amount: Math.abs(parseFloat(r.amount) || 0),
      type: (parseFloat(r.amount) || 0) >= 0 ? 'income' : 'expense',
      subs: [],
    }));
    res.json(rows);
  } catch { res.json([]); }
});

// === Outstanding — use app.vouchers with correct column names ===
router.get('/outstanding', async (req, res) => {
  try {
    const vouchers = await neonDb.query(
      `SELECT id, date, voucher_type, voucher_number, narration, party_ledger_name,
              COALESCE((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
WHERE (e->>'isDeemedPositive') = 'No'), 0) AS amount
        FROM app.vouchers ORDER BY date DESC LIMIT 200`
    );
    const rows = vouchers.rows.map((r: any) => {
      const days = r.date ? Math.floor((Date.now() - new Date(r.date).getTime()) / 86400000) : 0;
      let status = 'due';
      if (days > 60) status = 'critical';
      else if (days > 30) status = 'overdue';
      const vt = (r.voucher_type || '').toLowerCase();
      const category =
        vt.startsWith('sales') || vt.startsWith('receipt') || vt.includes('receipt') || vt === 'credit note'
          ? 'receivable'
          : vt.startsWith('purchase') || vt.startsWith('payment') || vt.startsWith('cash') || vt.startsWith('chq') || vt.startsWith('material') || vt === 'debit note'
            ? 'payable'
            : (parseFloat(r.amount) || 0) < 0 ? 'payable' : 'receivable';
      return {
        id: r.id,
        customer: r.party_ledger_name || r.narration || `Voucher #${r.voucher_number || r.id}`,
        amount: Math.abs(parseFloat(r.amount) || 0),
        days,
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
        status,
        category,
        subs: [{
          invoice: r.voucher_number || `V-${r.id}`,
          amount: Math.abs(parseFloat(r.amount) || 0),
          due: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
        }],
      };
    });
    res.json(rows);
  } catch { res.json([]); }
});

// === Balance Sheet — use pre-computed data from app.balancesheet ===
router.get('/balance-sheet', async (req, res) => {
  try {
    const result = await neonDb.query(
      "SELECT data FROM app.balancesheet ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length === 0) return res.json([]);
    const bs = result.rows[0].data;
    const rows = (bs.rows || []).map((r: any, i: number) => ({
      id: i + 1,
      label: r.name || 'Unknown',
      amount: Math.abs(parseFloat(r.amount) || 0),
      type: (parseFloat(r.amount) || 0) >= 0 ? 'liability' : 'asset',
      subs: [],
    }));
    res.json(rows);
  } catch { res.json([]); }
});

// === Daybook — use app.vouchers with date range ===
router.get('/daybook', async (req, res) => {
  try {
    const now = new Date();
    const from_date = (req.query as any).from_date ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to_date = (req.query as any).to_date ||
      now.toISOString().split('T')[0];

    const vouchers = await neonDb.query(
      `SELECT id, date, voucher_type, voucher_number, narration, party_ledger_name,
              billagentname,
              COALESCE((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                        WHERE (e->>'isDeemedPositive') = 'No'), 0) AS amount
       FROM app.vouchers
       WHERE date >= $1 AND date <= $2
       ORDER BY date DESC`,
      [from_date, to_date]
    );
    const invQuery = await neonDb.query(
      `SELECT v.id::int AS vid,
              COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'item', e->>'stockItemName',
                    'qty', CAST(SPLIT_PART(COALESCE(e->>'billedQty', '0'), ' ', 1) AS numeric),
                    'unit', COALESCE(NULLIF(SPLIT_PART(COALESCE(e->>'billedQty', ''), ' ', 2), ''), ''),
                    'rate', CAST(SPLIT_PART(COALESCE(e->>'rate', '0'), '/', 1) AS numeric),
                    'amount', CAST(COALESCE(e->>'amount', '0') AS numeric),
                    'description', e->>'description',
                    'serialNo', COALESCE(e->>'serialNo', '[]')
                  )
                ) FILTER (WHERE e->>'stockItemName' IS NOT NULL), '[]'::jsonb
              ) AS invEntries
       FROM app.vouchers v
       LEFT JOIN LATERAL jsonb_array_elements(v.inventoryentries) e ON true
       WHERE v.date >= $1 AND v.date <= $2
       GROUP BY v.id`,
      [from_date, to_date]
    );
    const invMap: Record<string, any[]> = {};
    for (const row of invQuery.rows) {
      invMap[String(row.vid)] = row.inventries || [];
    }

    const ledQuery = await neonDb.query(
      `SELECT v.id::int AS vid,
              COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'ledgerName', e->>'ledgerName',
                    'amount', CAST(COALESCE(e->>'amount', '0') AS numeric),
                    'isDeemedPositive', e->>'isDeemedPositive',
                    'description', e->>'description'
                  )
                ), '[]'::jsonb
              ) AS ledEntries
       FROM app.vouchers v
       LEFT JOIN LATERAL jsonb_array_elements(v.ledgerentries) e ON true
       WHERE v.date >= $1 AND v.date <= $2
       GROUP BY v.id`,
      [from_date, to_date]
    );
    const ledMap: Record<string, any[]> = {};
    for (const row of ledQuery.rows) {
      ledMap[String(row.vid)] = row.ledentries || [];
    }

    const rows = vouchers.rows.map((r: any) => {
      const raw = r.voucher_type || '';
      let displayType;
      if (/receipt|sales|credit note/i.test(raw) && !/return/i.test(raw)) displayType = 'Sale';
      else if (/payment/i.test(raw) && !/receipt/i.test(raw)) displayType = 'Payment';
      else if (/purchase|debit note/i.test(raw)) displayType = 'Purchase';
      else if (/expense|cost|manufacturing|overhead/i.test(raw)) displayType = 'Expense';
      else displayType = 'Other';
      return {
        id: r.id,
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
        type: displayType,
        voucherType: raw,
        customer: r.party_ledger_name || '',
        ref: r.voucher_number || '',
        narration: r.narration || '',
        salesman: r.billagentname || '',
        amount: Math.abs(parseFloat(r.amount) || 0),
        inventoryEntries: invMap[String(r.id)] || [],
        ledgerEntries: ledMap[String(r.id)] || [],
      };
    });
    res.json(rows);
  } catch { res.json([]); }
});

module.exports = router;
