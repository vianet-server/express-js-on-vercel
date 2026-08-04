const express = require('express');
const { getPnlData, getOutstandingVouchers, getBalanceSheetData, getDaybook } = require('../../config/dbqueries/admin');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

/**
 * GET /api/admin/reports/pnl
 *
 * Profit & Loss rows from the latest pre-computed app.profitloss row.
 * Income/expense is derived from the sign of each amount.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, label, amount, type: 'income'|'expense', subs: [] }]
 *   or [] when no data / on error
 *
 * Called by: vianet/src/adminPages/pnl.tsx -> api.get('/api/admin/reports/pnl')
 *   Displays: P&L statement table (income vs expense entries).
 */
router.get('/pnl', async (req, res) => {
  try {
    const pl = await getPnlData();
    if (!pl) return res.json([]);
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

/**
 * GET /api/admin/reports/outstanding
 *
 * Outstanding receivables/payables from the latest 200 vouchers. Derives
 * aging (days), status (due/overdue/critical), and category (receivable/payable)
 * from the voucher type and amount.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, customer, amount, days, date, status, category, subs: [{ invoice, amount, due }] }]
 *   or [] on error
 *
 * Called by: vianet/src/adminPages/outstanding.tsx -> api.get('/api/admin/reports/outstanding')
 *   Displays: outstanding bills table with aging and status badges.
 */
router.get('/outstanding', async (req, res) => {
  try {
    const vouchers = await getOutstandingVouchers();
    const rows = vouchers.map((r: any) => {
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

/**
 * GET /api/admin/reports/balance-sheet
 *
 * Balance sheet rows from the latest pre-computed app.balancesheet row.
 * Asset/liability is derived from the sign of each amount.
 *
 * Auth: adminAuth.
 * Query params: none.
 * Returns:
 *   200 [{ id, label, amount, type: 'liability'|'asset', subs: [] }]
 *   or [] when no data / on error
 *
 * Called by: vianet/src/adminPages/balanceSheet.tsx -> api.get('/api/admin/reports/balance-sheet')
 *   Displays: balance sheet statement table.
 */
router.get('/balance-sheet', async (req, res) => {
  try {
    const bs = await getBalanceSheetData();
    if (!bs) return res.json([]);
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

/**
 * GET /api/admin/reports/daybook
 *
 * Daybook: vouchers within a date range (defaults to the current month) enriched
 * with per-voucher inventory entries and ledger entries, and mapped to a display
 * type (Sale/Payment/Purchase/Expense/Other).
 *
 * Auth: adminAuth.
 * Query params: { from_date?, to_date? } (YYYY-MM-DD)
 * Returns:
 *   200 [{ id, date, type, voucherType, customer, ref, narration, salesman, amount, inventoryEntries: [...], ledgerEntries: [...] }]
 *   or [] on error
 *
 * Called by: vianet/src/adminPages/daybook.tsx -> useAdminQuery('/api/admin/reports/daybook')
 *   Displays: daybook transactions list grouped by day with inventory/ledger drilldowns.
 */
router.get('/daybook', async (req, res) => {
  try {
    const now = new Date();
    const from_date = (req.query as any).from_date ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to_date = (req.query as any).to_date ||
      now.toISOString().split('T')[0];

    const { voucherRows, invMap, ledMap } = await getDaybook({ from_date, to_date });

    const rows = voucherRows.map((r: any) => {
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
