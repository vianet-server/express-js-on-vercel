/**
 * admin/mcp.ts
 *
 * MCP (Model Context Protocol) server mounted at /api/admin/mcp.
 * Provides:
 *   - GET  /sse       — SSE connection endpoint for MCP clients
 *   - POST /messages  — JSON-RPC message handling endpoint
 *
 * Tools registered:
 *   Database intelligence (read-only queries against app.inventory):
 *     - get_inventory_stats    — summary stats (total items, value, qty, low stock)
 *     - search_inventory       — search by name/brand/model
 *     - list_access_groups     — list all access groups with stock counts
 *     - get_low_stock_items    — items below minimum stock
 *     - get_brand_summary      — aggregated stats per brand
 *
 *   Gemini AI:
 *     - gemini_chat            — general-purpose chat with Gemini
 *     - gemini_analyze_inventory — send inventory data to Gemini for analysis
 *     - gemini_generate_report — generate a business report from inventory data
 *
 * Auth: adminAuth (inherited from parent router at /api/admin).
 * Env: GEMINI_API_KEY (required for Gemini tools).
 *
 * Note: MCP SDK is ESM-only, so we use dynamic import() at init time.
 */

const express = require('express');
const { neonDb } = require('../../config/db');
const { admin: dbq } = require('../../config/dbqueries');

const router = express.Router();

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (fast)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (capable)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (legacy)' },
];
const DEFAULT_MODEL = 'gemini-2.5-flash';

/* ------------------------------------------------------------------ */
/* Lazy-init MCP server (ESM dynamic import)                          */
/* ------------------------------------------------------------------ */

let mcpServerReady: Promise<any> | null = null;

function getMcpServer() {
  if (!mcpServerReady) {
    mcpServerReady = (async () => {
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');
      const { z } = await import('zod');

      const server = new McpServer({
        name: 'vianet-admin-mcp',
        version: '1.0.0',
      });

      /* ============================================================ */
      /* Database Intelligence Tools (read-only)                      */
      /* ============================================================ */

      server.tool(
        'get_inventory_stats',
        'Get summary statistics for the inventory: total items, total quantity, total value, and count of low-stock items.',
        {},
        async () => {
          try {
            const stats = await neonDb.query(`
              SELECT
                COUNT(*)::int                                      AS total_items,
                COALESCE(SUM(COALESCE(quantity,0) + COALESCE(vquantity,0)), 0)::int AS total_qty,
                COALESCE(SUM((COALESCE(quantity,0) + COALESCE(vquantity,0)) * COALESCE(price,0)), 0)::numeric AS total_value,
                COUNT(*) FILTER (WHERE COALESCE(quantity,0) <= 0)::int AS zero_stock,
                COUNT(*) FILTER (WHERE COALESCE(quantity,0) > 0 AND COALESCE(quantity,0) <= 5)::int AS low_stock
              FROM app.inventory
              WHERE isblocked IS NOT TRUE
            `);
            const row = stats.rows[0];
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  total_items: row.total_items,
                  total_quantity: row.total_qty,
                  total_value: Number(row.total_value),
                  zero_stock_count: row.zero_stock,
                  low_stock_count: row.low_stock,
                }, null, 2),
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'search_inventory',
        'Search inventory items by name, brand, or model. Returns matching items with quantity, price, and brand.',
        {
          query: z.string().describe('Search term (matches name, brand, or model)'),
          limit: z.number().optional().describe('Max results (default 20)'),
        },
        async ({ query, limit }) => {
          try {
            const max = limit || 20;
            const result = await neonDb.query(
              `SELECT id, COALESCE(fullname, stockname) AS name, brand, model,
                      COALESCE(quantity,0) + COALESCE(vquantity,0) AS qty,
                      price, category_level_1 AS "group"
               FROM app.inventory
               WHERE isblocked IS NOT TRUE
                 AND (stockname ILIKE $1 OR fullname ILIKE $1 OR brand ILIKE $1 OR model ILIKE $1)
               ORDER BY COALESCE(NULLIF(fullname, ''), stockname) ASC
               LIMIT $2`,
              [`%${query}%`, max]
            );
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result.rows, null, 2),
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'list_access_groups',
        'List all access groups with the number of stock items assigned to each.',
        {},
        async () => {
          try {
            const result = await neonDb.query(`
              SELECT g.id, g.name,
                     COUNT(iag.inventoryid)::int AS stock_count
              FROM app.access_groups g
              LEFT JOIN app.inventory_access_group iag ON iag.accessgroupid = g.id
              GROUP BY g.id, g.name
              ORDER BY g.name
            `);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result.rows, null, 2),
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'get_low_stock_items',
        'Get inventory items that are at or below their minimum stock level, or have zero/negative quantity.',
        {
          limit: z.number().optional().describe('Max results (default 20)'),
        },
        async ({ limit }) => {
          try {
            const max = limit || 20;
            const result = await neonDb.query(
              `SELECT id, COALESCE(fullname, stockname) AS name, brand,
                      COALESCE(quantity,0) + COALESCE(vquantity,0) AS qty,
                      price, category_level_1 AS "group"
               FROM app.inventory
               WHERE isblocked IS NOT TRUE
                 AND COALESCE(quantity,0) + COALESCE(vquantity,0) <= 5
               ORDER BY (COALESCE(quantity,0) + COALESCE(vquantity,0)) ASC
               LIMIT $1`,
              [max]
            );
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result.rows, null, 2),
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'get_brand_summary',
        'Get aggregated inventory stats per brand: item count, total quantity, and total value.',
        {
          limit: z.number().optional().describe('Max brands to return (default 20)'),
        },
        async ({ limit }) => {
          try {
            const max = limit || 20;
            const result = await neonDb.query(
              `SELECT COALESCE(NULLIF(brand, ''), 'Unknown') AS brand,
                      COUNT(*)::int AS item_count,
                      SUM(COALESCE(quantity,0) + COALESCE(vquantity,0))::int AS total_qty,
                      SUM((COALESCE(quantity,0) + COALESCE(vquantity,0)) * COALESCE(price,0))::numeric AS total_value
               FROM app.inventory
               WHERE isblocked IS NOT TRUE
               GROUP BY brand
               ORDER BY total_value DESC
               LIMIT $1`,
              [max]
            );
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result.rows.map((r: any) => ({
                  ...r,
                  total_value: Number(r.total_value),
                })), null, 2),
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      /* ============================================================ */
      /* Ledger Tools                                                 */
      /* ============================================================ */

      server.tool(
        'search_ledger',
        'Search ledger accounts by name. Returns matching ledgers with id, name, address, mobile, and opening balance.',
        {
          query: z.string().describe('Search term (matches ledger name)'),
          limit: z.number().optional().describe('Max results (default 10)'),
        },
        async ({ query, limit }) => {
          try {
            const max = limit || 10;
            const result = await neonDb.query(
              `SELECT id, name, COALESCE(address, '') AS address,
                      COALESCE(mobile, '') AS mobile,
                      COALESCE(opening_balance, 0)::numeric AS opening_balance,
                      COALESCE(gstin, '') AS gstin,
                      COALESCE(parent, '') AS parent_group,
                      COALESCE(credit_period, 0)::int AS credit_period
               FROM app.ledger
               WHERE name ILIKE $1
               ORDER BY name ASC
               LIMIT $2`,
              [`%${query}%`, max]
            );
            return {
              content: [{
                type: 'text',
                text: result.rows.length
                  ? JSON.stringify(result.rows.map((r: any) => ({ ...r, opening_balance: Number(r.opening_balance) })), null, 2)
                  : 'No ledgers found matching that query.',
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'get_ledger_detail',
        'Get full details for a ledger account by id, including recent vouchers (last 20 transactions) with debit/credit amounts.',
        {
          ledger_id: z.number().describe('The ledger id'),
        },
        async ({ ledger_id }) => {
          try {
            const ledgerResult = await neonDb.query(
              `SELECT id, name, COALESCE(address, '') AS address,
                      COALESCE(mobile, '') AS mobile,
                      COALESCE(gstin, '') AS gstin,
                      COALESCE(parent, '') AS parent_group,
                      COALESCE(state, '') AS state,
                      COALESCE(pincode, '') AS pincode,
                      COALESCE(pan, '') AS pan,
                      COALESCE(email, '') AS email,
                      COALESCE(opening_balance, 0)::numeric AS opening_balance,
                      COALESCE(credit_period, 0)::int AS credit_period
               FROM app.ledger WHERE id = $1`,
              [ledger_id]
            );
            if (!ledgerResult.rows.length) {
              return { content: [{ type: 'text', text: `Ledger with id ${ledger_id} not found.` }] };
            }
            const ledger = { ...ledgerResult.rows[0], opening_balance: Number(ledgerResult.rows[0].opening_balance) };

            // Get recent vouchers involving this ledger
            const voucherResult = await neonDb.query(
              `SELECT id, voucher_number, voucher_type, voucher_date,
                      COALESCE(party_ledger_name, '') AS party,
                      COALESCE(total_amount, 0)::numeric AS total_amount,
                      COALESCE(narration, '') AS narration,
                      COALESCE(ledgerentries, '[]'::jsonb) AS ledger_entries
               FROM app.vouchers
               WHERE party_ledger_name = (
                 SELECT name FROM app.ledger WHERE id = $1
               )
               ORDER BY voucher_date DESC
               LIMIT 20`,
              [ledger_id]
            );

            // Calculate totals from voucher entries
            let totalDebit = 0;
            let totalCredit = 0;
            const vouchers = voucherResult.rows.map((v: any) => {
              const entries = Array.isArray(v.ledger_entries) ? v.ledger_entries : [];
              let debit = 0;
              let credit = 0;
              for (const e of entries) {
                const amt = Math.abs(Number(e.amount) || 0);
                if (e.isDeemedPositive || e.is_debit) {
                  debit += amt;
                } else {
                  credit += amt;
                }
              }
              totalDebit += debit;
              totalCredit += credit;
              return {
                id: v.id,
                number: v.voucher_number,
                type: v.voucher_type,
                date: v.voucher_date,
                party: v.party,
                amount: Number(v.total_amount),
                narration: v.narration,
                debit: Math.round(debit * 100) / 100,
                credit: Math.round(credit * 100) / 100,
              };
            });

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  ledger,
                  summary: {
                    total_debit: Math.round(totalDebit * 100) / 100,
                    total_credit: Math.round(totalCredit * 100) / 100,
                    voucher_count: voucherResult.rows.length,
                  },
                  recent_vouchers: vouchers,
                }, null, 2),
              }],
            };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      /* ============================================================ */
      /* Gemini AI Tools                                              */
      /* ============================================================ */

      async function callGemini(prompt: string, systemInstruction?: string, modelName?: string) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment');
        let GoogleGenerativeAI: any;
        try {
          ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
        } catch {
          throw new Error('Gemini SDK not installed. Run: npm install @google/generative-ai');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName || DEFAULT_MODEL,
          ...(systemInstruction ? { systemInstruction } : {}),
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      }

      server.tool(
        'gemini_chat',
        'Chat with Gemini AI. General-purpose question answering.',
        {
          message: z.string().describe('Your message or question for Gemini'),
        },
        async ({ message }) => {
          try {
            const reply = await callGemini(message);
            return { content: [{ type: 'text', text: reply }] };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Gemini error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'gemini_analyze_inventory',
        'Use Gemini AI to analyze current inventory data and provide business insights, recommendations, or alerts.',
        {
          focus: z.string().optional().describe('Specific area to focus analysis on (e.g. "low stock", "brand performance", "pricing")'),
        },
        async ({ focus }) => {
          try {
            const statsResult = await neonDb.query(`
              SELECT
                COUNT(*)::int AS total_items,
                COALESCE(SUM(COALESCE(quantity,0) + COALESCE(vquantity,0)), 0)::int AS total_qty,
                COALESCE(SUM((COALESCE(quantity,0) + COALESCE(vquantity,0)) * COALESCE(price,0)), 0)::numeric AS total_value
              FROM app.inventory WHERE isblocked IS NOT TRUE
            `);
            const topBrands = await neonDb.query(`
              SELECT COALESCE(NULLIF(brand, ''), 'Unknown') AS brand,
                     COUNT(*)::int AS items,
                     SUM(COALESCE(quantity,0) + COALESCE(vquantity,0))::int AS qty
              FROM app.inventory WHERE isblocked IS NOT TRUE
              GROUP BY brand ORDER BY qty DESC LIMIT 10
            `);
            const lowStock = await neonDb.query(`
              SELECT COALESCE(fullname, stockname) AS name, brand,
                     COALESCE(quantity,0) + COALESCE(vquantity,0) AS qty
              FROM app.inventory WHERE isblocked IS NOT TRUE
                AND COALESCE(quantity,0) + COALESCE(vquantity,0) <= 5
              ORDER BY qty ASC LIMIT 10
            `);

            const context = `
Inventory Summary:
- Total items: ${statsResult.rows[0].total_items}
- Total quantity: ${statsResult.rows[0].total_qty}
- Total inventory value: ₹${statsResult.rows[0].total_value}

Top Brands by Quantity:
${topBrands.rows.map((r: any) => `  ${r.brand}: ${r.items} items, ${r.qty} units`).join('\n')}

Low Stock Items (≤5 units):
${lowStock.rows.map((r: any) => `  ${r.name} (${r.brand}): ${r.qty} units`).join('\n') || '  None'}

${focus ? `Focus area: ${focus}` : 'Provide a general analysis with key insights and recommendations.'}
`;
            const reply = await callGemini(
              context,
              'You are a business intelligence analyst for an inventory management system. Analyze the data and provide actionable insights, identify risks, and suggest improvements. Be concise and specific.'
            );
            return { content: [{ type: 'text', text: reply }] };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      server.tool(
        'gemini_generate_report',
        'Generate a formatted business report from current inventory data using Gemini AI.',
        {
          report_type: z.enum(['daily', 'weekly', 'brand', 'stock_health']).describe('Type of report to generate'),
        },
        async ({ report_type }) => {
          try {
            let dataContext = '';

            if (report_type === 'daily' || report_type === 'weekly') {
              const stats = await neonDb.query(`
                SELECT COUNT(*)::int AS total_items,
                       COALESCE(SUM(COALESCE(quantity,0)), 0)::int AS total_qty,
                       COALESCE(SUM(COALESCE(quantity,0) * COALESCE(price,0)), 0)::numeric AS total_value
                FROM app.inventory WHERE isblocked IS NOT TRUE
              `);
              dataContext = `Current Inventory: ${JSON.stringify(stats.rows[0])}`;
            } else if (report_type === 'brand') {
              const brands = await neonDb.query(`
                SELECT COALESCE(NULLIF(brand, ''), 'Unknown') AS brand,
                       COUNT(*)::int AS items,
                       SUM(COALESCE(quantity,0))::int AS qty,
                       SUM(COALESCE(quantity,0) * COALESCE(price,0))::numeric AS value
                FROM app.inventory WHERE isblocked IS NOT TRUE
                GROUP BY brand ORDER BY value DESC LIMIT 15
              `);
              dataContext = `Brand Breakdown:\n${JSON.stringify(brands.rows, null, 2)}`;
            } else {
              const health = await neonDb.query(`
                SELECT
                  COUNT(*) FILTER (WHERE COALESCE(quantity,0) > 10)::int AS healthy,
                  COUNT(*) FILTER (WHERE COALESCE(quantity,0) BETWEEN 1 AND 10)::int AS warning,
                  COUNT(*) FILTER (WHERE COALESCE(quantity,0) <= 0)::int AS critical
                FROM app.inventory WHERE isblocked IS NOT TRUE
              `);
              dataContext = `Stock Health:\n${JSON.stringify(health.rows[0], null, 2)}`;
            }

            const reply = await callGemini(
              `Generate a ${report_type} inventory report based on this data:\n${dataContext}`,
              'You are an inventory analyst. Generate a clear, professional business report with sections, key metrics, and actionable recommendations. Use markdown formatting.'
            );
            return { content: [{ type: 'text', text: reply }] };
          } catch (err: any) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
          }
        }
      );

      return { server, SSEServerTransport };
    })();
  }
  return mcpServerReady;
}

/* ------------------------------------------------------------------ */
/* SSE + Message endpoints                                            */
/* ------------------------------------------------------------------ */

const transports = new Map<string, any>();

router.get('/mcp/sse', async (req, res) => {
  try {
    const { server, SSEServerTransport } = await getMcpServer();
    const transport = new SSEServerTransport('/api/admin/mcp/messages', res);
    transports.set(transport.sessionId, transport);
    req.on('close', () => transports.delete(transport.sessionId));
    await server.connect(transport);
  } catch (err: any) {
    console.error('[mcp] SSE connection error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

router.post('/mcp/messages', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId query param' });
    const transport = transports.get(sessionId);
    if (!transport) return res.status(404).json({ error: 'Session not found' });
    await transport.handlePostMessage(req, res);
  } catch (err: any) {
    console.error('[mcp] Message handling error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

router.get('/mcp', (_req, res) => {
  res.json({
    name: 'vianet-admin-mcp',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      sse: '/api/admin/mcp/sse',
      messages: '/api/admin/mcp/messages',
    },
    tools: [
      'get_inventory_stats', 'search_inventory', 'list_access_groups',
      'get_low_stock_items', 'get_brand_summary',
      'search_ledger', 'get_ledger_detail',
      'gemini_chat', 'gemini_analyze_inventory', 'gemini_generate_report',
    ],
  });
});

/* ------------------------------------------------------------------ */
/* Chat endpoint — Gemini with function-calling (MCP tools)           */
/* ------------------------------------------------------------------ */

const CHAT_TOOLS = [
  {
    name: 'get_inventory_stats',
    description: 'Get summary statistics: total items, total quantity, total value, zero-stock count, low-stock count.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'search_inventory',
    description: 'Search inventory items by name, brand, or model.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_access_groups',
    description: 'List all access groups with the number of stock items assigned to each.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_low_stock_items',
    description: 'Get inventory items at or below 5 units — potential stockouts.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_brand_summary',
    description: 'Get aggregated inventory stats per brand: item count, total quantity, total value.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max brands (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'search_ledger',
    description: 'Search ledger accounts by name. Returns matching ledgers with id, name, address, mobile, opening balance.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term (matches ledger name)' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_ledger_detail',
    description: 'Get full details for a ledger account by id, including recent vouchers (last 20 transactions) with debit/credit amounts.',
    parameters: {
      type: 'object',
      properties: {
        ledger_id: { type: 'number', description: 'The ledger id' },
      },
      required: ['ledger_id'],
    },
  },
];

async function executeTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'get_inventory_stats': {
      const r = await neonDb.query(`
        SELECT COUNT(*)::int AS total_items,
               COALESCE(SUM(COALESCE(quantity,0)+COALESCE(vquantity,0)),0)::int AS total_qty,
               COALESCE(SUM((COALESCE(quantity,0)+COALESCE(vquantity,0))*COALESCE(price,0)),0)::numeric AS total_value,
               COUNT(*) FILTER (WHERE COALESCE(quantity,0)<=0)::int AS zero_stock,
               COUNT(*) FILTER (WHERE COALESCE(quantity,0)>0 AND COALESCE(quantity,0)<=5)::int AS low_stock
        FROM app.inventory WHERE isblocked IS NOT TRUE
      `);
      return JSON.stringify(r.rows[0]);
    }
    case 'search_inventory': {
      const limit = args.limit || 10;
      const r = await neonDb.query(
        `SELECT id, COALESCE(fullname,stockname) AS name, brand, model,
                COALESCE(quantity,0)+COALESCE(vquantity,0) AS qty, price
         FROM app.inventory WHERE isblocked IS NOT TRUE
           AND (stockname ILIKE $1 OR fullname ILIKE $1 OR brand ILIKE $1 OR model ILIKE $1)
         ORDER BY COALESCE(NULLIF(fullname,''),stockname) ASC LIMIT $2`,
        [`%${args.query}%`, limit]
      );
      return JSON.stringify(r.rows);
    }
    case 'list_access_groups': {
      const r = await neonDb.query(`
        SELECT g.name, COUNT(iag.inventoryid)::int AS stock_count
        FROM app.access_groups g
        LEFT JOIN app.inventory_access_group iag ON iag.accessgroupid = g.id
        GROUP BY g.id, g.name ORDER BY g.name
      `);
      return JSON.stringify(r.rows);
    }
    case 'get_low_stock_items': {
      const limit = args.limit || 10;
      const r = await neonDb.query(
        `SELECT id, COALESCE(fullname,stockname) AS name, brand,
                COALESCE(quantity,0)+COALESCE(vquantity,0) AS qty, price
         FROM app.inventory WHERE isblocked IS NOT TRUE
           AND COALESCE(quantity,0)+COALESCE(vquantity,0) <= 5
         ORDER BY qty ASC LIMIT $1`,
        [limit]
      );
      return JSON.stringify(r.rows);
    }
    case 'get_brand_summary': {
      const limit = args.limit || 10;
      const r = await neonDb.query(
        `SELECT COALESCE(NULLIF(brand,''),'Unknown') AS brand,
                COUNT(*)::int AS item_count,
                SUM(COALESCE(quantity,0)+COALESCE(vquantity,0))::int AS total_qty,
                SUM((COALESCE(quantity,0)+COALESCE(vquantity,0))*COALESCE(price,0))::numeric AS total_value
         FROM app.inventory WHERE isblocked IS NOT TRUE
         GROUP BY brand ORDER BY total_value DESC LIMIT $1`,
        [limit]
      );
      return JSON.stringify(r.rows.map((row: any) => ({ ...row, total_value: Number(row.total_value) })));
    }
    case 'search_ledger': {
      const limit = args.limit || 10;
      const r = await neonDb.query(
        `SELECT id, name, COALESCE(address,'') AS address,
                COALESCE(mobile,'') AS mobile,
                COALESCE(opening_balance,0)::numeric AS opening_balance,
                COALESCE(gstin,'') AS gstin,
                COALESCE(parent,'') AS parent_group
         FROM app.ledger WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2`,
        [`%${args.query}%`, limit]
      );
      return JSON.stringify(r.rows.map((row: any) => ({ ...row, opening_balance: Number(row.opening_balance) })));
    }
    case 'get_ledger_detail': {
      const ledgerResult = await neonDb.query(
        `SELECT id, name, COALESCE(address,'') AS address,
                COALESCE(mobile,'') AS mobile, COALESCE(gstin,'') AS gstin,
                COALESCE(parent,'') AS parent_group, COALESCE(state,'') AS state,
                COALESCE(pincode,'') AS pincode, COALESCE(pan,'') AS pan,
                COALESCE(email,'') AS email,
                COALESCE(opening_balance,0)::numeric AS opening_balance,
                COALESCE(credit_period,0)::int AS credit_period
         FROM app.ledger WHERE id = $1`,
        [args.ledger_id]
      );
      if (!ledgerResult.rows.length) return JSON.stringify({ error: `Ledger ${args.ledger_id} not found` });
      const ledger = { ...ledgerResult.rows[0], opening_balance: Number(ledgerResult.rows[0].opening_balance) };
      const voucherResult = await neonDb.query(
        `SELECT id, voucher_number, voucher_type, voucher_date,
                COALESCE(party_ledger_name,'') AS party,
                COALESCE(total_amount,0)::numeric AS total_amount,
                COALESCE(narration,'') AS narration
         FROM app.vouchers WHERE party_ledger_name = (SELECT name FROM app.ledger WHERE id = $1)
         ORDER BY voucher_date DESC LIMIT 20`,
        [args.ledger_id]
      );
      return JSON.stringify({
        ledger,
        recent_vouchers: voucherResult.rows.map((v: any) => ({ ...v, total_amount: Number(v.total_amount) })),
      });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

router.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

    const { message, history = [], model: requestedModel } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const selectedModel = GEMINI_MODELS.find((m) => m.id === requestedModel)
      ? requestedModel
      : DEFAULT_MODEL;

    let GoogleGenerativeAI: any;
    try {
      ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
    } catch {
      return res.status(500).json({
        error: 'Gemini SDK not installed. Run: npm install @google/generative-ai',
      });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: `You are Vianet AI, an assistant for the Vianet admin panel. You have access to real-time inventory, stock, access group, and ledger data via tools. Always use tools when the user asks about business data — never make up numbers. Be concise and helpful.`,
      tools: [{ functionDeclarations: CHAT_TOOLS }],
    });

    // Convert frontend history to Gemini format
    const geminiHistory = history.map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    let response = result.response;

    // Handle function calls in a loop (max 5 rounds to prevent infinite loops)
    let rounds = 0;
    while (response.functionCalls()?.length && rounds < 5) {
      rounds++;
      const calls = response.functionCalls();
      const functionResponses: any[] = [];

      for (const call of calls!) {
        const toolResult = await executeTool(call.name, call.args || {});
        functionResponses.push({
          functionResponse: { name: call.name, response: { result: toolResult } },
        });
      }

      const callResult = await chat.sendMessage(functionResponses);
      response = callResult.response;
    }

    const text = response.text();
    res.json({ message: text, model: selectedModel });
  } catch (err: any) {
    console.error('[chat] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/chat/models', (_req, res) => {
  res.json({ models: GEMINI_MODELS, default: DEFAULT_MODEL });
});

module.exports = router;
