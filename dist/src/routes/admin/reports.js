"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { neonDb } = require('../../config/db');
const adminAuth = require('../../middleware/adminAuth');
const router = express.Router();
router.use(adminAuth);
// === P&L — use pre-computed data from app.profitloss ===
router.get('/pnl', async (req, res) => {
    try {
        const result = await neonDb.query("SELECT data FROM app.profitloss ORDER BY id DESC LIMIT 1");
        if (result.rows.length === 0)
            return res.json([]);
        const pl = result.rows[0].data;
        const rows = (pl.rows || []).map((r, i) => ({
            id: i + 1,
            label: r.name || 'Unknown',
            amount: Math.abs(parseFloat(r.amount) || 0),
            type: (parseFloat(r.amount) || 0) >= 0 ? 'income' : 'expense',
            subs: [],
        }));
        res.json(rows);
    }
    catch {
        res.json([]);
    }
});
// === Outstanding — use app.vouchers with correct column names ===
router.get('/outstanding', async (req, res) => {
    try {
        const vouchers = await neonDb.query(`SELECT id, date, voucher_type, voucher_number, narration, party_ledger_name,
              COALESCE((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                        WHERE (e->>'isdeemedpositive') = 'No'), 0) AS amount
       FROM app.vouchers ORDER BY date DESC LIMIT 200`);
        const rows = vouchers.rows.map((r) => {
            const days = r.date ? Math.floor((Date.now() - new Date(r.date).getTime()) / 86400000) : 0;
            let status = 'due';
            if (days > 60)
                status = 'critical';
            else if (days > 30)
                status = 'overdue';
            const vt = (r.voucher_type || '').toLowerCase();
            const category = vt.startsWith('sales') || vt.startsWith('receipt') || vt.includes('receipt') || vt === 'credit note'
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
    }
    catch {
        res.json([]);
    }
});
// === Balance Sheet — use pre-computed data from app.balancesheet ===
router.get('/balance-sheet', async (req, res) => {
    try {
        const result = await neonDb.query("SELECT data FROM app.balancesheet ORDER BY id DESC LIMIT 1");
        if (result.rows.length === 0)
            return res.json([]);
        const bs = result.rows[0].data;
        const rows = (bs.rows || []).map((r, i) => ({
            id: i + 1,
            label: r.name || 'Unknown',
            amount: Math.abs(parseFloat(r.amount) || 0),
            type: (parseFloat(r.amount) || 0) >= 0 ? 'liability' : 'asset',
            subs: [],
        }));
        res.json(rows);
    }
    catch {
        res.json([]);
    }
});
// === Daybook — use app.vouchers with correct column names ===
router.get('/daybook', async (req, res) => {
    try {
        const vouchers = await neonDb.query(`SELECT id, date, voucher_type, voucher_number, narration, party_ledger_name,
              billagentname,
              COALESCE((SELECT SUM((e->>'amount')::numeric) FROM jsonb_array_elements(ledgerentries) e
                        WHERE (e->>'isdeemedpositive') = 'No'), 0) AS amount
       FROM app.vouchers ORDER BY date DESC LIMIT 100`);
        const rows = vouchers.rows.map((r) => {
            const raw = r.voucher_type || '';
            let displayType = 'Sale';
            if (/payment/i.test(raw))
                displayType = 'Payment';
            else if (/purchase/i.test(raw))
                displayType = 'Purchase';
            else if (/expense|cost/i.test(raw))
                displayType = 'Expense';
            else if (/receipt/i.test(raw))
                displayType = 'Payment';
            return {
                id: r.id,
                date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
                type: displayType,
                customer: r.party_ledger_name || r.narration || '',
                ref: r.voucher_number || '',
                salesman: r.billagentname || '',
                amount: Math.abs(parseFloat(r.amount) || 0),
                mode: 'Cash',
                subs: [],
            };
        });
        res.json(rows);
    }
    catch {
        res.json([]);
    }
});
module.exports = router;
