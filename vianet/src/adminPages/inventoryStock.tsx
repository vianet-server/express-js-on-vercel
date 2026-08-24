/* eslint-disable react-hooks/set-state-in-effect -- server data fetch is a valid effect use */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit3, ExternalLink, Check, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setStockPage, updateStockItem } from '@/store/slices/inventorySlice';

interface StockItem {
  id: number; name: string; brand: string; group: string; model: string; variant: string; color: string;
  qty: number; price: number; gst: number; min: number; max: number;
}

/** API caps each response at 500 rows, so the full list is fetched in batches. */
const FETCH_BATCH = 500

const editFields = [
  { key: 'name', label: 'Stock Name', type: 'text' },
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'variant', label: 'Variant', type: 'text' },
  { key: 'color', label: 'Color', type: 'text' },
  { key: 'qty', label: 'Quantity', type: 'number' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'gst', label: 'GST %', type: 'number' },
  { key: 'min', label: 'Min Stock', type: 'number' },
  { key: 'max', label: 'Max Stock', type: 'number' },
];

export function InventoryStock() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.inventory?.stockItems ?? []);
  const pagination = useAppSelector((state) => state.inventory?.stockPagination ?? { offset: 0, limit: 10, total: 0 });
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editAll, setEditAll] = useState<StockItem | null>(null);
  const [editForm, setEditForm] = useState<StockItem | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');

  interface StockPageResponse {
    rows: StockItem[];
    total: number;
    limit: number;
    offset: number;
  }

  /**
   * Fetches the entire stock list for the current brand/group filters by
   * walking the API's paginated endpoint in FETCH_BATCH chunks. Rendering
   * cost stays flat thanks to table virtualization.
   */
  const fetchAll = useCallback(async (brand = selectedBrand, group = selectedGroup) => {
    setLoading(true)
    try {
      let url = (offset: number) =>
        `/api/admin/inventory/stock?limit=${FETCH_BATCH}&offset=${offset}&brand=${brand}&group=${group}`
      const first = await api.get<StockPageResponse>(url(0))
      let all = [...first.rows]
      let total = first.total
      while (all.length < total) {
        const next = await api.get<StockPageResponse>(url(all.length))
        if (!next.rows || next.rows.length === 0) break
        all = all.concat(next.rows)
        total = next.total
      }
      dispatch(setStockPage({ items: all, total, limit: Math.max(all.length, 1), offset: 0 }))
      return all
    } finally {
      setLoading(false)
    }
  }, [dispatch, selectedBrand, selectedGroup])

  useEffect(() => {
    api.get<any>('/api/admin/inventory/brands')
      .then(res => {
        const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const list = rawList.filter((b: any) => typeof b === 'string' && b.trim().length > 0 && /[a-zA-Z]/.test(b));
        setBrands(list);
      })
      .catch(console.error);

    api.get<any>('/api/admin/inventory/groups')
      .then(res => {
        const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const list = rawList.filter((g: any) => typeof g === 'string' && g.trim().length > 0);
        setGroups(list);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filtered = items.filter(p =>
    (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.model ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // --- Table virtualization (@tanstack/react-virtual) ---
  const ROW_H = 41; // py-2.5 + text-sm line + border
  const overviewScrollRef = useRef<HTMLDivElement>(null);
  const detailedScrollRef = useRef<HTMLDivElement>(null);
  const overviewVirt = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => overviewScrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });
  const detailedVirt = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => detailedScrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  /** Top/bottom spacer heights so only visible rows are mounted inside <tbody>. */
  const tableSpacers = (virt: { getTotalSize(): number; getVirtualItems(): { start: number; end: number }[] }) => {
    const vItems = virt.getVirtualItems();
    const top = vItems[0]?.start ?? 0;
    const bottom = vItems.length ? virt.getTotalSize() - vItems[vItems.length - 1].end : 0;
    return { top, bottom };
  };
  const oSpacers = tableSpacers(overviewVirt);
  const dSpacers = tableSpacers(detailedVirt);

  const openEditAll = (item: StockItem) => {
    setEditAll(item);
    setEditForm({ ...item });
  };

  const confirmEditAll = () => {
    if (!editAll || !editForm) return;
    dispatch(updateStockItem({ ...editForm }));
    setEditAll(null);
    setEditForm(null);
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Stock</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedGroup} onValueChange={(val) => { setSelectedGroup(val ?? 'all'); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedBrand} onValueChange={(val) => { setSelectedBrand(val ?? 'all'); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <Input placeholder="Search name, brand or model..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filtered.length === pagination.total
            ? `${pagination.total} items`
            : `${filtered.length} of ${pagination.total} items`}
        </div>
      </div>

      <Tabs defaultValue="overview" orientation="vertical" className="flex gap-6">
        <TabsList className="h-fit min-w-36">
          <TabsTrigger value="overview" className="justify-start px-3 py-2 w-full">Overview</TabsTrigger>
          <TabsTrigger value="detailed" className="justify-start px-3 py-2 w-full">Detailed View</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pagination.total}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{items.reduce((s, p) => s + (Number(p.qty) || 0), 0).toLocaleString()}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{items.filter(p => p.qty <= p.min).length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Stock Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{items.reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0).toLocaleString()}</div></CardContent></Card>
            </div>
            {loading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="animate-spin size-4 mr-2" /> Loading...
              </div>
            )}
            <Card className="mt-4">
              <CardHeader><CardTitle>Stock Levels</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div ref={overviewScrollRef} className="overflow-auto relative max-h-[60vh]">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="sticky top-0 bg-background z-10 shadow-sm">
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-3 pl-2.5 pr-2 font-medium">Product</th>
                        <th className="py-3 px-2 font-medium">Group</th>
                        <th className="py-3 px-2 font-medium">Brand</th>
                        <th className="py-3 px-2 font-medium text-right">Stock</th>
                        <th className="py-3 px-2 font-medium text-right">Min</th>
                        <th className="py-3 px-2 font-medium text-right">Max</th>
                        <th className="py-3 px-2 font-medium text-right">Price</th>
                        <th className="py-3 px-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oSpacers.top > 0 && <tr style={{ height: oSpacers.top }}><td colSpan={8} /></tr>}
                      {overviewVirt.getVirtualItems().map(vi => {
                        const p = filtered[vi.index];
                        return (
                          <tr key={p.id} data-index={vi.index} ref={overviewVirt.measureElement} className="border-b last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/inventory/stock/${p.id}`)}>
                            <td className="py-2.5 pl-2.5 font-medium">{p.name}</td>
                            <td className="py-2.5 text-muted-foreground">{p.group}</td>
                            <td className="py-2.5 text-muted-foreground">{p.brand}</td>
                            <td className="py-2.5 text-right">{p.qty}</td>
                            <td className="py-2.5 text-right">{p.min}</td>
                            <td className="py-2.5 text-right">{p.max}</td>
                            <td className="py-2.5 text-right">₹{p.price}</td>
                            <td className="py-2.5">
                              <Badge variant={p.qty <= p.min ? 'destructive' : p.qty >= p.max * 0.9 ? 'secondary' : 'default'}>
                                {p.qty <= p.min ? 'Low' : p.qty >= p.max * 0.9 ? 'Excess' : 'Normal'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                      {oSpacers.bottom > 0 && <tr style={{ height: oSpacers.bottom }}><td colSpan={8} /></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Stock View</CardTitle>
              </CardHeader>
              <CardContent className="relative p-0">
                {loading && (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground absolute inset-0 bg-background/50 z-20">
                    <Loader2 className="animate-spin size-4 mr-2" /> Loading...
                  </div>
                )}
                <div ref={detailedScrollRef} className="overflow-auto max-h-[70vh]">
                  <table className="w-full text-sm min-w-[1000px]">
                    <thead className="sticky top-0 bg-background z-10 shadow-sm">
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-3 font-medium whitespace-nowrap px-2 first:pl-0">Stock Name</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2">Group</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2">Brand</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2">Model</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2">Variant</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2">Color</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2 text-right">Qty</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2 text-right">Price</th>
                        <th className="py-3 font-medium whitespace-nowrap px-2 text-right">GST %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dSpacers.top > 0 && <tr style={{ height: dSpacers.top }}><td colSpan={9} /></tr>}
                      {detailedVirt.getVirtualItems().map(vi => {
                        const p = filtered[vi.index];
                        return (
                          <ContextMenu key={p.id}>
                            <ContextMenuTrigger className="contents">
                              <tr data-index={vi.index} ref={detailedVirt.measureElement} className="border-b last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/inventory/stock/${p.id}`)}>
                                <td className="px-2 py-2.5 font-medium first:pl-0">{p.name}</td>
                                <td className="px-2 py-2.5">{p.group}</td>
                                <td className="px-2 py-2.5">{p.brand}</td>
                                <td className="px-2 py-2.5">{p.model}</td>
                                <td className="px-2 py-2.5">{p.variant}</td>
                                <td className="px-2 py-2.5">{p.color}</td>
                                <td className="px-2 py-2.5 text-right font-medium">{p.qty}</td>
                                <td className="px-2 py-2.5 text-right">₹{(p.price ?? 0).toLocaleString()}</td>
                                <td className="px-2 py-2.5 text-right">{p.gst}%</td>
                              </tr>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => openEditAll(p)}>
                                <Edit3 size={14} /> Edit All Fields
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => navigate(`/admin/inventory/stock/${p.id}`)}>
                                <ExternalLink size={14} /> Open Detail Page
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                      {dSpacers.bottom > 0 && <tr style={{ height: dSpacers.bottom }}><td colSpan={9} /></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={!!editAll} onOpenChange={(open) => { if (!open) { setEditAll(null); setEditForm(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit All — {editAll?.name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {editFields.map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <Input
                  type={f.type}
                  value={editForm ? String(editForm[f.key as keyof StockItem]) : ''}
                  onChange={e => setEditForm(prev => prev ? { ...prev, [f.key]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } : prev)}
                  className="text-sm h-8"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditAll(null); setEditForm(null); }}><X size={14} /> Cancel</Button>
            <Button size="sm" onClick={confirmEditAll}><Check size={14} /> Save All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
