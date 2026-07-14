import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Users, Tag, Edit3, Eye, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSkuData, updateSkuItem, type SkuRow } from '@/store/slices/inventorySlice';

const accessGroups = ['Warehouse Mgrs', 'Purchase Team', 'Sales Team', 'Auditors', 'Admin', 'Vendors'];
const accessPrivileges: Record<string, string[]> = {
  'Warehouse Mgrs': ['view', 'edit', 'approve'],
  'Purchase Team': ['view', 'edit'],
  'Sales Team': ['view', 'edit'],
  'Auditors': ['view', 'export'],
  'Admin': ['view', 'edit', 'approve', 'configure'],
  'Vendors': [],
};
const PAGE_SIZE = 8;
const allBrands = ['FashionCo', 'TechSound', 'NatureLeaf', 'EcoLiving', 'LuxLeather', 'SportFit', 'ZenFit'];

export function InventorySku() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const skuData = useAppSelector((state) => state.inventory.skuData);
  const [search, setSearch] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(accessGroups);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(allBrands);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<{ sku: string; group: string; field: string; value: number } | null>(null);
  const [detailGroup, setDetailGroup] = useState<SkuRow | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: SkuRow } | null>(null);

  useEffect(() => {
    api.get('/api/admin/inventory/sku').then((res: SkuRow[]) => {
      dispatch(setSkuData(res));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dispatch]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
    setPage(1);
  };
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    setPage(1);
  };
  const visibleGroups = accessGroups.filter(g => selectedGroups.includes(g));

  const filtered = skuData.filter(s =>
    (selectedBrands.length === 0 || selectedBrands.includes(s.brand)) &&
    (s.sku.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()) || s.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (sku: string, group: string, field: string) => {
    const item = skuData.find(s => s.sku === sku);
    const ag = item?.accessGroups.find(a => a.group === group);
    setEditTarget({ sku, group, field, value: ag ? field === 'qty' ? ag.qty : ag.price : 0 });
  };

  const saveEdit = () => {
    if (!editTarget) return;
    dispatch(updateSkuItem({
      sku: editTarget.sku,
      updates: {
        accessGroups: skuData
          .find(s => s.sku === editTarget.sku)
          ?.accessGroups.map(a =>
            a.group === editTarget.group ? { ...a, [editTarget.field]: editTarget.value } : a
          ) || [],
      },
    }));
    setEditTarget(null);
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
                {accessGroups.map(g => (
                  <label key={g} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                    <Checkbox checked={selectedGroups.includes(g)} onCheckedChange={() => toggleGroup(g)} />{g}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button><Plus size={14} /> Add SKU</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search by SKU, product or brand..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>

      <div className="overflow-x-auto">
        <Card>
          <CardHeader><CardTitle>SKU List</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th rowSpan={2} className="pb-2 pt-3 px-3 font-medium text-left text-muted-foreground">SKU ID</th>
                  <th colSpan={4} className="pb-1 pt-3 px-3 font-semibold text-center text-xs text-muted-foreground border-x bg-muted/30">Inventory</th>
                  {visibleGroups.map(g => (
                    <th key={g} colSpan={2} className="pb-1 pt-3 px-2 font-semibold text-center text-[10px] text-muted-foreground border-x bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { if (pageData.length > 0) navigate(`/admin/inventory/sku/${pageData[0].sku}/access-group/${encodeURIComponent(g)}`); }}>
                      <div className="flex items-center justify-center gap-1"><Users size={10} />{g}</div>
                    </th>
                  ))}
                  <th rowSpan={2} className="pb-2 pt-3 px-3 font-medium text-left text-muted-foreground">Status</th>
                </tr>
                <tr className="border-b">
                  <th className="pb-2 px-3 font-medium text-left text-muted-foreground text-[11px]">Name</th>
                  <th className="pb-2 px-3 font-medium text-left text-muted-foreground text-[11px]">Brand</th>
                  <th className="pb-2 px-3 font-medium text-right text-muted-foreground text-[11px]">Qty</th>
                  <th className="pb-2 px-3 font-medium text-right text-muted-foreground text-[11px] border-r">Price</th>
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
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{s.sku}</td>
                    <td className="py-2.5 px-3 font-medium">{s.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{s.brand}</td>
                    <td className="py-2.5 px-3 text-right">{s.qty}</td>
                    <td className="py-2.5 px-3 text-right border-r">₹{s.price.toLocaleString()}</td>
                    {visibleGroups.map(g => {
                      const ag = s.accessGroups.find(a => a.group === g);
                      return (
                        <Fragment key={g}>
                          <td className="py-2.5 px-2 text-right cursor-pointer" onClick={() => openEdit(s.sku, g, 'qty')}>
                            {ag && ag.qty > 0 ? ag.qty : <span className="text-amber-600 font-medium">Blocked</span>}
                          </td>
                          <td className="py-2.5 px-2 text-right border-r cursor-pointer" onClick={() => openEdit(s.sku, g, 'price')}>
                            {ag && ag.qty > 0 ? `₹${ag.price.toLocaleString()}` : <span className="text-amber-600 font-medium">Blocked</span>}
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className="py-2.5 px-3">
                      <Badge variant={s.status === 'Active' ? 'default' : s.status === 'Inactive' ? 'secondary' : 'destructive'}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
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
              onClick={() => { navigate(`/admin/inventory/sku/${contextMenu.row.sku}/access-group/${encodeURIComponent(contextMenu.row.accessGroups[0]?.group || accessGroups[0])}`); setContextMenu(null); }}
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-blue-700"><Eye size={14} /></div>
              View Access Details
            </button>
            <div className="border-t mx-2" />
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => { openEdit(contextMenu.row.sku, visibleGroups[0] || accessGroups[0], 'qty'); setContextMenu(null); }}
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-100 text-amber-700"><Edit3 size={14} /></div>
              Edit Price & Quantity
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} SKUs
        </p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button key={i} size="sm" variant={page === i + 1 ? 'default' : 'outline'} onClick={() => setPage(i + 1)} className="min-w-9">{i + 1}</Button>
          ))}
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editTarget?.field === 'qty' ? 'Quantity' : 'Price'} — {editTarget?.group}</DialogTitle></DialogHeader>
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

      <Dialog open={!!detailGroup} onOpenChange={open => !open && setDetailGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Access Group Details — {detailGroup?.name}</DialogTitle></DialogHeader>
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
                {detailGroup.accessGroups.map(ag => {
                  const privs = accessPrivileges[ag.group] || [];
                  const hasAccess = ag.qty > 0;
                  return (
                    <div key={ag.group} className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b last:border-0 ${hasAccess ? '' : 'bg-amber-50'}`}>
                      <div className="col-span-4 font-medium flex items-center gap-1.5">
                        {hasAccess ? <ShieldCheck size={14} className="text-green-600" /> : <ShieldOff size={14} className="text-amber-600" />}
                        {ag.group}
                      </div>
                      <div className="col-span-2 text-right">{hasAccess ? ag.qty : <span className="text-amber-600">Blocked</span>}</div>
                      <div className="col-span-2 text-right">{hasAccess ? `₹${ag.price.toLocaleString()}` : <span className="text-amber-600">Blocked</span>}</div>
                      <div className="col-span-4 flex gap-1 flex-wrap">
                        {privs.length > 0 ? privs.map(p => (
                          <span key={p} className="inline-block rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium capitalize">{p}</span>
                        )) : <span className="text-amber-600 text-xs">No access</span>}
                      </div>
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
