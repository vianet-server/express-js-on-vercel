import { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Users, Edit3, Eye, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSkuData, updateSkuItem, setAllAccessGroups, type SkuRow } from '@/store/slices/inventorySlice';

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
  const [brandSearch, setBrandSearch] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editTarget, setEditTarget] = useState<{ sku: string; group: string; field: string; value: string | number } | null>(null);
  const [addAccess, setAddAccess] = useState<{ selectedSkus: string[]; group: string; qty: number; price: number } | null>(null);
  const [detailGroup, setDetailGroup] = useState<SkuRow | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: SkuRow } | null>(null);
  const [stockFilter, setStockFilter] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [allStocks, setAllStocks] = useState<SkuRow[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const STOCK_PAGE_SIZE = 10;

  const filteredStocks = useMemo(() =>
    allStocks.filter(s => {
      const q = stockFilter.toLowerCase();
      const name = (s.name ?? '').trim();
      const brand = (s.brand ?? '').trim();
      const nameOk = name.length > 0 && /[a-zA-Z]/.test(name);
      const brandOk = brand.length === 0 || /[a-zA-Z]/.test(brand);
      const matchSelected = !showSelectedOnly || !!addAccess?.selectedSkus.includes(s.sku);
      return nameOk && brandOk && matchSelected && (!q || s.sku.toLowerCase().includes(q) || name.toLowerCase().includes(q) || brand.toLowerCase().includes(q) || s.model?.toLowerCase().includes(q));
    }),
    [allStocks, stockFilter, showSelectedOnly, addAccess?.selectedSkus]
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
    setStocksLoading(true);
    api.get<SkuRow[]>('/api/admin/inventory/sku').then(res => {
      setAllStocks(res || []);
      dispatch(setSkuData(res || []));
      setStocksLoading(false);
    }).catch(() => setStocksLoading(false));
  };

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<SkuRow[]>('/api/admin/inventory/sku').catch(() => [] as SkuRow[]),
      api.get<any>('/api/admin/inventory/control').then((r: any) => r?.accessGroups || []).catch(() => []),
    ]).then(([skus, groups]: [SkuRow[], any[]]) => {
      dispatch(setSkuData(skus));
      dispatch(setAllAccessGroups(groups ?? []));
      setSelectedGroups((groups ?? []).map((g: any) => g.name));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dispatch]);

  const fetchBrands = useCallback(() => {
    api.get<any>('/api/admin/inventory/brands')
      .then(res => {
        const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const list = rawList.filter((b: any) => typeof b === 'string' && b.trim().length > 0 && /[a-zA-Z]/.test(b));
        setBrands(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    const onFocus = () => { fetchAll(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchAll]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
    setPage(1);
  };
  const visibleGroups = accessGroupNames.filter(g => selectedGroups.includes(g));

  const filtered = (skuData ?? []).filter(s => {
    const q = search.toLowerCase();
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(s.brand);
    return brandMatch && (!q || s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (sku: string, group: string, field: string) => {
    const item = (skuData ?? []).find(s => s.sku === sku);
    const ag = item?.accessGroups?.find(a => a.group === group);
    setEditTarget({ sku, group, field, value: ag ? field === 'qty' ? ag.qty : field === 'price' ? ag.price : (ag.partnerSkuName || '') : 0 });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const item = (skuData ?? []).find(s => s.sku === editTarget.sku);
    const existing = item?.accessGroups?.find(a => a.group === editTarget.group);
    const qty = editTarget.field === 'qty' ? editTarget.value : (existing?.qty ?? 0);
    const price = editTarget.field === 'price' ? editTarget.value : (existing?.price ?? 0);
    const partnerSkuName = editTarget.field === 'partnerSkuName' ? editTarget.value : (existing?.partnerSkuName || '');
    try {
      await api.post(`/api/admin/inventory/sku/${editTarget.sku}/access-group/${encodeURIComponent(editTarget.group)}`, { qty, price, partnerSkuName });
      const currentAGS = (skuData ?? []).find(s => s.sku === editTarget.sku)?.accessGroups ?? [];
      const idx = currentAGS.findIndex(a => a.group === editTarget.group);
      dispatch(updateSkuItem({
        sku: editTarget.sku,
        updates: {
          accessGroups: idx >= 0
            ? currentAGS.map(a => a.group === editTarget.group ? { ...a, [editTarget.field]: editTarget.value } : a)
            : [...currentAGS, { group: editTarget.group, qty: Number(qty), price: Number(price), partnerSkuName: String(partnerSkuName) }],
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

  const handleExportTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows = [];
      for (const s of (skuData ?? [])) {
        for (const g of visibleGroups) {
          const ag = s.accessGroups?.find(a => a.group === g);
          rows.push({
            SKU_ID: s.sku,
            Access_Group: g,
            Partner_SKU_Name: ag?.partnerSkuName || '',
            Qty: ag?.qty || 0,
            Price: ag?.price || 0,
          });
        }
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mappings');
      XLSX.writeFile(wb, 'AccessGroup_Mappings.xlsx');
    } catch (err) {
      console.error(err);
      alert('Failed to export mappings');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json<any>(ws);

          const rowsToUpload = data.map(row => ({
            skuId: String(row.SKU_ID),
            accessGroup: String(row.Access_Group),
            partnerSkuName: row.Partner_SKU_Name ? String(row.Partner_SKU_Name) : '',
            qty: Number(row.Qty) || 0,
            price: Number(row.Price) || 0,
          }));

          const res = await api.post('/api/admin/inventory/access/upload', { rows: rowsToUpload });
          alert(res.message + (res.errors?.length ? '\\nErrors:\\n' + res.errors.join('\\n') : ''));
          // reload data
          const { data: skusData } = await api.get('/api/admin/inventory/sku');
          dispatch(setSkuData(Array.isArray(skusData) ? skusData : (skusData?.data ?? [])));
        } catch (err: any) {
          console.error(err);
          alert('Upload failed: ' + (err.message || 'Unknown error'));
        } finally {
          setUploading(false);
          e.target.value = '';
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      alert('Failed to process file');
      setUploading(false);
    }
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Brand:</span>
            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 cursor-pointer min-w-[150px] max-w-[220px]">
                <span className="truncate">{selectedBrands.length === 0 ? 'All Brands' : selectedBrands.length === 1 ? selectedBrands[0] : `${selectedBrands.length} brands`}</span>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 max-h-[60vh] flex flex-col" align="start">
                <div className="px-1 pb-2 border-b mb-2 sticky top-0 bg-background z-10">
                  <Input 
                    placeholder="Search brands..." 
                    className="h-8 text-sm" 
                    value={brandSearch} 
                    onChange={e => setBrandSearch(e.target.value)} 
                    onKeyDown={e => e.stopPropagation()}
                  />
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm font-medium">
                    <Checkbox checked={selectedBrands.length === 0} onCheckedChange={() => { setSelectedBrands([]); setPage(1); }} />All Brands
                  </label>
                  <div className="border-t my-1" />
                  {brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map(b => (
                    <label key={b} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm font-medium">
                      <Checkbox 
                        checked={selectedBrands.includes(b)} 
                        onCheckedChange={(c) => {
                          setSelectedBrands(prev => c ? [...prev, b] : prev.filter(x => x !== b));
                          setPage(1);
                        }} 
                      />
                      {b}
                    </label>
                  ))}
                  {brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">No brands found</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
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
          <Button variant="outline" size="sm" onClick={handleExportTemplate} className="gap-1 px-3" title="Export current view to Excel">
            <Edit3 size={14} /> Export Map
          </Button>
          <div className="relative inline-block">
            <input type="file" id="file-upload" className="hidden" accept=".xlsx,.csv" onChange={handleImport} />
            <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()} className="gap-1 px-3" disabled={uploading} title="Import Excel mapping">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />} Import Map
            </Button>
          </div>
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
                <th key={g} colSpan={3} className="pb-1 pt-3 px-2 font-semibold text-center text-[10px] text-muted-foreground border-x bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors min-w-[120px]" onClick={() => { navigate(`/admin/inventory/access-group/${encodeURIComponent(g)}`); }}>
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
                  <th className="pb-2 px-2 font-medium text-left text-muted-foreground text-[11px] min-w-[80px]">P-SKU</th>
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
                      <td className="py-2.5 px-2 text-left cursor-pointer whitespace-nowrap text-[11px] text-muted-foreground" onClick={() => openEdit(s.sku, g, 'partnerSkuName')}>
                        {ag && ag.partnerSkuName ? ag.partnerSkuName : '-'}
                      </td>
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
              onClick={() => { navigate(`/admin/inventory/access-group/${encodeURIComponent((contextMenu.row.accessGroups ?? [])[0]?.group || visibleGroups[0])}`); setContextMenu(null); }}
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
          <DialogHeader><DialogTitle>Edit {editTarget?.field === 'qty' ? 'Quantity' : editTarget?.field === 'price' ? 'Price' : 'Partner SKU Name'} &mdash; {editTarget?.group}</DialogTitle></DialogHeader>
          <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-sm">{editTarget?.sku}</span>
              <span className="text-sm text-muted-foreground">({editTarget?.group})</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{editTarget?.field === 'qty' ? 'Quantity' : editTarget?.field === 'price' ? 'Price (₹)' : 'Partner SKU Name'}</label>
              <Input 
                type={editTarget?.field === 'partnerSkuName' ? 'text' : 'number'}
                value={editTarget?.value ?? ''} 
                onChange={(e) => setEditTarget(prev => prev ? { ...prev, value: prev.field === 'partnerSkuName' ? e.target.value : Number(e.target.value) } : null)}
                autoFocus
              />
            </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!addAccess} onOpenChange={open => !open && setAddAccess(null)}>
        <DialogContent className="!max-w-[70vw] h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Add Stock Access</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 shrink-0">
              <Select value={addAccess?.group ?? ''} onValueChange={v => setAddAccess(prev => prev ? { ...prev, group: v ?? prev.group } : null)}>
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
            <div className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <Checkbox checked={showSelectedOnly} onCheckedChange={v => setShowSelectedOnly(!!v)} />
                    Only selected
                  </label>
                  <label className="text-sm font-medium">{filteredStocks.length} stocks · {addAccess?.selectedSkus.length ?? 0} selected</label>
                </div>
              </div>
              <div className="border rounded-lg flex-1 overflow-y-auto min-h-0">
                {stocksLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
                ) : filteredStocks.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">No stocks found</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-background text-xs font-semibold text-muted-foreground border-b sticky top-0 z-10">
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
                <div className="flex items-center justify-center gap-1.5 mt-3 shrink-0">
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
