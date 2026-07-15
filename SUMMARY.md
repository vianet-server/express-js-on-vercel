## Objective
- Resolve undefined variable runtime errors and replace hardcoded placeholder/mock data with real server-fetched data across the frontend.

## Important Details
- Backend table is `app.stock` (singular) with column `stockname` instead of `name`; analytics endpoints may not map all fields.
- Admin login forces `usertype: 'admin'` for adminAuth middleware.
- API helper uses relative `BASE_URL = ''` (works via Vite proxy/Vercel rewrites).
- CORS enabled for `localhost:5173` and `127.0.0.1:5173` in `src/index.ts`.
- Redux store initializes `allAccessGroups: []` and `skuData: []`.

## Work State
### Completed
- **Undefined variable fixes** (`?? []` / `?? {}` / `?? 0` / `?? ''` fallbacks): `balanceSheet.tsx`, `pnl.tsx`, `outstanding.tsx`, `daybook.tsx`, `inventoryStock.tsx`, `inventorySku.tsx`, `inventoryStockDetail.tsx`, `inventoryControl.tsx`, `dashboard.tsx`, `analytics.tsx`, `accessGroupDetail.tsx`, `AccessGroupStockList.tsx`, `AccessGroupComparisonTable.tsx`.
- **Bug fixes**: `accessGroups.map()` (2 places), `c.value.toLocaleString()` in `inventoryControl.tsx`; `stats.todaySale`/`totalProfit`/`totalSpend`/`s.sales` in `dashboard.tsx`.
- **API layer**: Fixed `BASE_URL` from `http://localhost:3000` to `''`; added CORS middleware to `src/index.ts`.
- **Backend queries**: Changed all `stockitems` (plural) to `app.stock` (singular) and `r.name` → `r.stockname` in `stockitem.ts`, `dashboard.ts`, `tally.ts`; fixed INSERT/UPDATE/DELETE/COUNT queries in all admin + api routes.
- **Admin login JWT** now forces `usertype: 'admin'`.
- **Default page limit** changed to 30 in `inventoryStock.tsx`.
- **Redux** `inventorySlice.ts` has `(state.stockItems ?? [])` guards on reducers.
- **`inventorySku.tsx`** — replaced hardcoded `accessGroups`, `accessPrivileges`, `allBrands` arrays with real Redux/data from API.
- **`inventoryStockDetail.tsx`** — replaced save/upload stubs with real API integration; working save, dirty-state tracking, discard confirmation.
- **`market.tsx`** — replaced hardcoded `topMovers`, `marketSummary`, market index cards with API fetch (`/api/admin/market`).
- **`sync.tsx`** — replaced hardcoded "Failed Items" `0` with `lastSync?.failed`; added "Sync Now" button calling `POST /api/admin/settings/sync`; used `lastSync?.frequency`/`nextScheduled`.
- **`api.tsx`** — replaced hardcoded `accessGroups`, `allPermissions`, `durationOptions`, `endpoints` with API fetches from respective endpoints (with fallback defaults); added `usage` state management; POST body now includes `group`, `permissions`, `duration`.
- **`analytics.tsx`** — replaced hardcoded comparison percentages with `stats.revenueChange`, `stats.ordersChange`, etc. from API; all endpoint calls have `.catch(() => default)` wrappers so page renders even if endpoints are missing.
- **`daybook.tsx`** — `dailyTotals` now computed from transactions data (grouped by date, income vs expense); chart shows "No daily data" when empty.
- **`inventoryControl.tsx`** — removed `Math.random()` mock count, uses `g.accessibleStockCount` from API; permission matrix shows real `CheckCircle`/`X` based on `g.permissions`.
- **`AccessGroupPrivilegesCard.tsx`** — `allPermissions` now accepts as a prop (defaults to `['view', 'edit', 'approve', 'configure', 'export']`).
- **TypeScript**: `npx tsc --noEmit` passes with zero errors.

### Remaining / Blocked
- **Stock list page (`/api/admin/inventory/stock`) still returns 500** — the server error is unresolved. Possible causes: column mapping, query syntax, or database connection.
- **Advanced tab in analytics** still uses hardcoded ML/demo data (model accuracy, forecast chart data, insights, model health) — requires a real ML endpoint to replace.
- **Export functionality** in analytics/market pages is UI-only (no actual export logic connected).
- **Inventory stock detail** has a working save stub but the stock endpoint 500 prevents testing.
- **Daybook** Daily Income vs Expense chart reference `chartConfig` keys `income`/`expense` but the config object uses `color-income`/`color-expense` which won't match CSS variable resolution (cosmetic, works with fallback).

## Relevant Files
- `D:\vercel\express\express-js-on-vercel\src\routes\admin\stockitem.ts` — Main stock CRUD + paginated/SKU/access-group endpoints
- `D:\vercel\express\express-js-on-vercel\src\routes\admin\dashboard.ts` — Dashboard stats queries
- `D:\vercel\express\express-js-on-vercel\src\routes\admin\tally.ts` — Tally stock-item CRUD
- `D:\vercel\express\express-js-on-vercel\src\routes\api\routes\tally.ts` — API tally stock-item CRUD
- `D:\vercel\express\express-js-on-vercel\src\routes\admin\login.ts` — Admin login JWT signing
- `D:\vercel\express\express-js-on-vercel\src\index.ts` — Express entry with CORS
- `D:\vercel\express\express-js-on-vercel\src\middleware\adminAuth.ts` — Admin auth middleware
- `D:\vercel\express\express-js-on-vercel\vianet\src\lib\api.ts` — API client with relative BASE_URL
- `D:\vercel\express\express-js-on-vercel\vianet\src\store\slices\inventorySlice.ts` — Redux slice
