-- Cache-supporting indexes for app.inventory (Option B unified table).
-- These are also created idempotently inside ensureInventoryUnification() at
-- every server startup, so this file is primarily for documentation / manual
-- re-application. Safe to run repeatedly (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_inventory_id
  ON app.inventory (id);

-- Partial expression index: serves the `isblocked IS NOT TRUE` filter AND the
-- `ORDER BY COALESCE(NULLIF(fullname, ''), stockname)` + LIMIT/OFFSET pagination
-- used by GET /api/admin/inventory/stock, replacing a seqscan + sort with an
-- index scan. Even a cache-miss load of the inventory table is now fast.
CREATE INDEX IF NOT EXISTS idx_inventory_list
  ON app.inventory (COALESCE(NULLIF(fullname, ''), stockname))
  WHERE isblocked IS NOT TRUE;

-- Partial index to speed brand-filtered counts on the same endpoint.
CREATE INDEX IF NOT EXISTS idx_inventory_brand_active
  ON app.inventory (brand)
  WHERE isblocked IS NOT TRUE;
