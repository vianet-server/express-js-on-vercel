import { useState, useEffect, Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Users, Tag, Edit3, Eye, ShieldCheck, ShieldOff, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSkuData, updateSkuItem, type SkuRow } from '@/store/slices/inventorySlice';

const PAGE_SIZE = 8;

export function InventorySku() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const skuData = useAppSelector((state) => state.inventory.skuData);
  const allAccessGroups = useAppSelector((state) => state.inventory.allAccessGroups);
  const accessGroupNames = useMemo(() => (allAccessGroups ?? []).map(g => g.name), [allAccessGroups]);
  const [search, setSearch] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<{ sku: string; group: string; field: string; value: number } | null>(null);
  const [addAccess, setAddAccess] = useState<{ selectedSkus: string[]; group: string; qty: number; price: number } | null>(null);
  const [allStocks, setAllStocks] = useState<SkuRow[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [detailGroup, setDetailGroup] = useState<SkuRow | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: SkuRow } | null>(null);
  const [stockFilter, setStockFilter] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const STOCK_PAGE_SIZE = 10;

  const filteredStocks = useMemo(() =>
    allStocks.filter(s => {
      const q = stockFilter.toLowerCase();
      return !q || s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q) || s.model?.toLowerCase().includes(q);
    }),
    [allStocks, stockFilter]
  );

  const pagedStocks = useMemo(() =>
    filteredStocks.slice((stockPage - 1) * STOCK_PAGE_SIZE, stockPage * STOCK_PAGE_SIZE),
    [filteredStocks, stockPage]
  );

  const stockTotalPages = Math.max(1, Math.ceil(filteredStocks.length / STOCK_PAGE_SIZE));

  const openAddAccess = (preselectSku?: string) => {
    setAddAccess({ selectedSkus: preselectSku ? [preselectSku] : [], group: '', qty: 0, price: 0 });
    setStockFilter('');
    setStockPage(1);
    if (allStocks.length === 0) {
      setStocksLoading(true);
      api.get<SkuRow[]>('/api/admin/inventory/sku').then(res => {
        setAllStocks(res || []);
        setStocksLoading(false);
      }).catch(() => setStocksLoading(false));
    }
  };

  useEffect(() => {
    Promise.all([
      api.get<SkuRow[]>('/api/admin/inventory/sku'),
      api.get<any>('/api/admin/inventory/control').then((r: any) => r?.accessGroups || []).catch(() => []),
    ]).then(([skus, groups]: [SkuRow[], any[]]) => {
      dispatch(setSkuData(skus));
      setSelectedGroups((groups ?? []).map((g: any) => g.name));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dispatch]);

  const allBrands = useMemo(() => [...new Set((skuData ?? []).map(s => s.brand).filter(Boolean))], [skuData]);

  useEffect(() => {
    setSelectedBrands(prev => prev.length === 0 ? allBrands : prev);
  }, [allBrands]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
    setPage(1);
  };
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    setPage(1);
  };
  const visibleGroups = accessGroupNames.filter(g => selectedGroups.includes(g));

  const filtered = (skuData ?? []).filter(s =>
    (selectedBrands.length === 0 || selectedBrands.includes(s.brand)) &&
    (s.sku.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()) || s.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (sku: string, group: string, field: string) => {
    const item = (skuData ?? []).find(s => s.sku === sku);
    const ag = item?.accessGroups?.find(a => a.group === group);
    setEditTarget({ sku, group, field, value: ag ? field === 'qty' ? ag.qty : ag.price : 0 });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const item = (skuData ?? []).find(s => s.sku === editTarget.sku);
    const existing = item?.accessGroups?.find(a => a.group === editTarget.group);
    const qty = editTarget.field === 'qty' ? editTarget.value : (existing?.qty ?? 0);
    const price = editTarget.field === 'price' ? editTarget.value : (existing?.price ?? 0);
    try {
      await api.post(`/api/admin/inventory/sku/${editTarget.sku}/access-group/${encodeURIComponent(editTarget.group)}`, { qty, price });
      const currentAGS = (skuData ?? []).find(s => s.sku === editTarget.sku)?.accessGroups ?? [];
      const idx = currentAGS.findIndex(a => a.group === editTarget.group);
      dispatch(updateSkuItem({
        sku: editTarget.sku,
        updates: {
          accessGroups: idx >= 0
            ? currentAGS.map(a => a.group === editTarget.group ? { ...a, [editTarget.field]: editTarget.value } : a)
            : [...currentAGS, { group: editTarget.group, qty, price }],
        },
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update stock access');
    }
    setEditTarget(null);
  };

  const saveAddAccess = async () => {
    if (!addAccess || !addAccess.group || addAccess.selectedSkus.length === 0) return;
    try {
      await Promise.all(addAccess.selectedSkus.map(sku =>
        api.post(`/api/admin/inventory/sku/${sku}/access-group/${encodeURIComponent(addAccess.group)}`, { qty: addAccess.qty, price: addAccess.price })
      ));
      for (const sku of addAccess.selectedSkus) {
        const currentAGS = (skuData ?? []).find(s => s.sku === sku)?.accessGroups ?? [];
        const idx = currentAGS.findIndex(a => a.group === addAccess.group);
        dispatch(updateSkuItem({
          sku,
          updates: {
            accessGroups: idx >= 0
              ? currentAGS.map(a => a.group === addAccess.group ? { ...a, qty: addAccess.qty, price: addAccess.price } : a)
              : [...currentAGS, { group: addAccess.group, qty: addAccess.qty, price: addAccess.price }],
          },
        }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to add stock access');
    }
    setAddAccess(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory SKU</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
              <Tag size={14} /> Select Stock
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="flex flex-col gap-1">
                {allBrands.map(b => (
                  <label key={b} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                    <Checkbox checked={selectedBrands.includes(b)} onCheckedChange={() => toggleBrand(b)} />{b}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
              <Users size={14} /> Select Access Group
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="flex flex-col gap-1">
                {accessGroupNames.map(g => (
                  <label key={g} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                    <Checkbox checked={selectedGroups.includes(g)} onCheckedChange={() => toggleGroup(g)} />{g}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="secondary" onClick={() => openAddAccess()}><Users size={14} /> Add Access</Button>
          <Button><Plus size={14} /> Add SKU</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search by SKU, product or brand..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b">
              <th rowSpan={2} className="sticky left-0 z-10 bg-white dark:bg-gray-900 pb-2 pt-3 px-3 font-medium text-left text-muted-foreground min-w-[72px]">SKU ID</th>
              <th colSpan={4} className="pb-1 pt-3 px-3 font-semibold text-center text-xs text-muted-foreground border-x bg-muted/30">Inventory</th>
              {visibleGroups.map(g => (
                <th key={g} colSpan={2} className="pb-1 pt-3 px-2 font-semibold text-center text-[10px] text-muted-foreground border-x bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors min-w-[90px]" onClick={() => { if (pageData.length > 0) navigate(`/admin/inventory/sku/${pageData[0].sku}/access-group/${encodeURIComponent(g)}`); }}>
                  <div className="flex items-center justify-center gap-1"><Users size={10} />{g}</div>
                </th>
              ))}
              <th rowSpan={2} className="pb-2 pt-3 px-3 font-medium text-left text-muted-foreground min-w-[72px]">Status</th>
            </tr>
            <tr className="border-b">
              <th className="pb-2 px-3 font-medium text-left text-muted-foreground text-[11px] min-w-[120px]">Name</th>
              <th className="pb-2 px-3 font-medium text-left text-muted-foreground text-[11px] min-w-[80px]">Brand</th>
              <th className="pb-2 px-3 font-medium text-right text-muted-foreground text-[11px] min-w-[56px]">Qty</th>
              <th className="pb-2 px-3 font-medium text-right text-muted-foreground text-[11px] border-r min-w-[64px]">Price</th>
              {visibleGroups.map(g => (
                <Fragment key={g}>
                  <th className="pb-2 px-2 font-medium text-right text-muted-foreground text-[11px]">Qty</th>
                  <th className="pb-2 px-2 font-medium text-right text-muted-foreground text-[11px] border-r">Price</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((s) => (
              <tr key={s.sku} className="border-b last:border-0 hover:bg-muted/20 relative" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, row: s }); }}>
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 py-2.5 px-3 font-mono text-xs text-muted-foreground truncate">{s.sku}</td>
                <td className="py-2.5 px-3 font-medium truncate">{s.name}</td>
                <td className="py-2.5 px-3 text-muted-foreground truncate">{s.brand}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">{s.qty}</td>
                <td className="py-2.5 px-3 text-right border-r whitespace-nowrap">₹{(s.price ?? 0).toLocaleString()}</td>
                {visibleGroups.map(g => {
                  const ag = (s.accessGroups ?? []).find(a => a.group === g);
                  return (
                    <Fragment key={g}>
                      <td className="py-2.5 px-2 text-right cursor-pointer whitespace-nowrap" onClick={() => openEdit(s.sku, g, 'qty')}>
                        {ag && ag.qty > 0 ? ag.qty : <span className="text-amber-600 font-medium">Blocked</span>}
                      </td>
                      <td className="py-2.5 px-2 text-right border-r cursor-pointer whitespace-nowrap" onClick={() => openEdit(s.sku, g, 'price')}>
                        {ag && ag.qty > 0 ? `₹${ag.price.toLocaleString()}` : <span className="text-amber-600 font-medium">Blocked</span>}
                      </td>
                    </Fragment>
                  );
                })}
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <Badge variant={s.status === 'Active' ? 'default' : s.status === 'Inactive' ? 'secondary' : 'destructive'}>{s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div
            className="absolute bg-white dark:bg-gray-900 rounded-lg border shadow-xl py-1 min-w-48"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center gap-2">
              <span className="font-mono text-[10px]">{contextMenu.row.sku}</span>
              <span className="truncate">{contextMenu.row.name}</span>
            </div>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => { navigate(`/admin/inventory/sku/${contextMenu.row.sku}/access-group/${encodeURIComponent((contextMenu.row.accessGroups ?? [])[0]?.group || visibleGroups[0])}`); setContextMenu(null); }}
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-blue-700"><Eye size={14} /></div>
              View Access Details
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => { openAddAccess(contextMenu.row.sku); setContextMenu(null); }}
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-green-100 text-green-700"><Plus size={14} /></div>
              Add Access
            </button>
            <div className="border-t mx-2" />
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => { openEdit(contextMenu.row.sku, visibleGroups[0] || accessGroupNames[0], 'qty'); setContextMenu(null); }}
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-100 text-amber-700"><Edit3 size={14} /></div>
              Edit Price & Quantity
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} SKUs
        </p>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          {(() => {
            const pages: (number | string)[] = [];
            const start = Math.max(1, page - 2);
            const end = Math.min(totalPages, page + 2);
            if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
            return pages.map((p, i) =>
              typeof p === 'string'
                ? <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                : <Button key={p} size="sm" variant={page === p ? 'default' : 'outline'} onClick={() => setPage(p)} className="min-w-8 h-8 px-2">{p}</Button>
            );
          })()}
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editTarget?.field === 'qty' ? 'Quantity' : 'Price'} &mdash; {editTarget?.group}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <label className="text-sm font-medium text-muted-foreground">SKU: {editTarget?.sku}</label>
            <Input type="number" value={editTarget?.value ?? 0} onChange={e => setEditTarget(prev => prev ? { ...prev, value: Number(e.target.value) } : prev)} className="text-sm" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!addAccess} onOpenChange={open => !open && setAddAccess(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Add Stock Access</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-4 gap-4">
              <Select value={addAccess?.group ?? ''} onValueChange={v => setAddAccess(prev => prev ? { ...prev, group: v } : prev)}>
                <SelectTrigger><SelectValue placeholder="Select access group" /></SelectTrigger>
                <SelectContent>
                  {accessGroupNames.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Qty</label>
                <Input type="number" value={addAccess?.qty ?? 0} onChange={e => setAddAccess(prev => prev ? { ...prev, qty: Number(e.target.value) } : prev)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Price</label>
                <Input type="number" value={addAccess?.price ?? 0} onChange={e => setAddAccess(prev => prev ? { ...prev, price: Number(e.target.value) } : prev)} />
              </div>
              <Input placeholder="Search by SKU, name, brand or model..." className="h-9 text-xs" value={stockFilter} onChange={e => { setStockFilter(e.target.value); setStockPage(1); }} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{filteredStocks.length} stocks · {addAccess?.selectedSkus.length ?? 0} selected</label>
              </div>
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {stocksLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
                ) : filteredStocks.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">No stocks found</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground border-b sticky top-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 shrink-0"><Checkbox checked={pagedStocks.every(s => addAccess?.selectedSkus.includes(s.sku)) && pagedStocks.length > 0} onCheckedChange={v => { if (addAccess) { const ids = pagedStocks.map(s => s.sku); setAddAccess({ ...addAccess, selectedSkus: v ? [...new Set([...addAccess.selectedSkus, ...ids])] : addAccess.selectedSkus.filter(sk => !ids.includes(sk)) }); } }} /></div>
                        <div className="w-16 shrink-0 text-center">SKU</div>
                        <div className="flex-1 min-w-0">Name</div>
                        <div className="w-24 shrink-0">Brand</div>
                        <div className="w-20 shrink-0">Model</div>
                        <div className="w-16 shrink-0 text-right">Qty</div>
                        <div className="w-20 shrink-0 text-right">Price</div>
                      </div>
                    </div>
                    {pagedStocks.map(s => {
                      const checked = addAccess?.selectedSkus.includes(s.sku) ?? false;
                      return (
                        <div key={s.sku} className={`flex items-center gap-2 px-3 py-2 text-sm border-b last:border-0 hover:bg-muted/20 cursor-pointer ${checked ? 'bg-muted/30' : ''}`} onClick={() => { if (addAccess) setAddAccess({ ...addAccess, selectedSkus: checked ? addAccess.selectedSkus.filter(sk => sk !== s.sku) : [...addAccess.selectedSkus, s.sku] }); }}>
                          <div className="w-8 shrink-0"><Checkbox checked={checked} /></div>
                          <div className="w-16 shrink-0 font-mono text-xs truncate text-center">{s.sku}</div>
                          <div className="flex-1 min-w-0 truncate font-medium">{s.name}</div>
                          <div className="w-24 shrink-0 truncate text-muted-foreground">{s.brand || '—'}</div>
                          <div className="w-20 shrink-0 truncate text-muted-foreground">{s.model || '—'}</div>
                          <div className="w-16 shrink-0 text-right whitespace-nowrap">{s.qty}</div>
                          <div className="w-20 shrink-0 text-right whitespace-nowrap">₹{(s.price ?? 0).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              {filteredStocks.length > STOCK_PAGE_SIZE && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Button size="sm" variant="outline" disabled={stockPage <= 1} onClick={() => setStockPage(p => p - 1)}>Prev</Button>
                  <span className="text-xs text-muted-foreground px-2">Page {stockPage} of {stockTotalPages}</span>
                  <Button size="sm" variant="outline" disabled={stockPage >= stockTotalPages} onClick={() => setStockPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddAccess(null)}>Cancel</Button>
            <Button onClick={saveAddAccess} disabled={!addAccess?.group || (addAccess?.selectedSkus.length ?? 0) === 0}>
              {addAccess?.selectedSkus.length ? `Add Access (${addAccess.selectedSkus.length} stocks)` : 'Add Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailGroup} onOpenChange={open => !open && setDetailGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Access Group Details &mdash; {detailGroup?.name}</DialogTitle></DialogHeader>
          {detailGroup && (
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-muted-foreground">SKU</span><div className="font-mono text-sm">{detailGroup.sku}</div></div>
                <div><span className="text-xs text-muted-foreground">Product</span><div className="font-medium text-sm">{detailGroup.name}</div></div>
                <div><span className="text-xs text-muted-foreground">Brand</span><div className="text-sm">{detailGroup.brand}</div></div>
                <div><span className="text-xs text-muted-foreground">Status</span><div className="text-sm">{detailGroup.status}</div></div>
              </div>
              <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground border-b">
                  <div className="col-span-4">Access Group</div>
                  <div className="col-span-2 text-right">Quantity</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-4">Privileges</div>
                </div>
                {(detailGroup.accessGroups ?? []).map(ag => {
                  const hasAccess = ag.qty > 0;
                  return (
                    <div key={ag.group} className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b last:border-0 ${hasAccess ? '' : 'bg-amber-50'}`}>
                      <div className="col-span-4 font-medium flex items-center gap-1.5">
                        {hasAccess ? <ShieldCheck size={14} className="text-green-600" /> : <ShieldOff size={14} className="text-amber-600" />}
                        {ag.group}
                      </div>
                      <div className="col-span-2 text-right">{hasAccess ? ag.qty : <span className="text-amber-600">Blocked</span>}</div>
                      <div className="col-span-2 text-right">{hasAccess ? `\u20b9${(ag.price ?? 0).toLocaleString()}` : <span className="text-amber-600">Blocked</span>}</div>
                      <div className="col-span-4" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailGroup(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
