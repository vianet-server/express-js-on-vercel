/* eslint-disable react-hooks/set-state-in-effect -- server data fetch is a valid effect use */
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setStockPage, updateStockItem, resetStockPagination } from '@/store/slices/inventorySlice';

const StockOverviewCards = lazy(() => import('./components/inventoryStock').then(m => ({ default: m.StockOverviewCards })));
const StockOverviewTable = lazy(() => import('./components/inventoryStock').then(m => ({ default: m.StockOverviewTable })));
const StockDetailedTable = lazy(() => import('./components/inventoryStock').then(m => ({ default: m.StockDetailedTable })));
const StockEditDialog = lazy(() => import('./components/inventoryStock').then(m => ({ default: m.StockEditDialog })));

interface StockItem {
  id: number; name: string; brand: string; group: string; model: string; variant: string; color: string;
  qty: number; price: number; gst: number; min: number; max: number;
}

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

  /**
   * Streams the full stock list via NDJSON so rows appear progressively.
   * Sends the count first, then rows in batches as they arrive from the server.
   */
  const fetchAll = useCallback(async (brand = selectedBrand, group = selectedGroup) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ brand, group });
      const token = (() => { try { return JSON.parse(JSON.parse(localStorage.getItem('persist:root') || '{}').auth || '{}').token } catch { return null } })();
      const res = await fetch(`${window.location.origin}/api/admin/inventory/stock/stream?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let all: StockItem[] = [];
      let total = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line);
          if (evt.type === 'count') {
            total = evt.total;
          } else if (evt.type === 'rows') {
            all = all.concat(evt.rows);
            dispatch(setStockPage({ items: [...all], total: total || evt.total, limit: Math.max(all.length, 1), offset: 0 }));
          } else if (evt.type === 'done' || evt.type === 'error') {
            break;
          }
        }
      }
      return all;
    } finally {
      setLoading(false);
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
    // Wipe persisted rows so the previous visit's data is never shown as
    // current while the fresh fetch is in flight (loader shows instead).
    dispatch(resetStockPagination());
    fetchAll()
  }, [fetchAll, dispatch])

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
    <Suspense fallback={<Loader2 className="animate-spin size-8 text-muted-foreground" />}>
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Stock</h1>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => fetchAll()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
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
            <StockOverviewCards
              total={pagination.total}
              totalStock={items.reduce((s, p) => s + (Number(p.qty) || 0), 0)}
              lowStockCount={items.filter(p => p.qty <= p.min).length}
              stockValue={items.reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0)}
            />
            <StockOverviewTable
              items={filtered}
              loading={loading}
              onRowClick={(id) => navigate(`/admin/inventory/stock/${id}`)}
              scrollRef={overviewScrollRef}
              virtualizer={overviewVirt}
              spacers={oSpacers}
            />
          </TabsContent>

          <TabsContent value="detailed">
            <StockDetailedTable
              items={filtered}
              loading={loading}
              onRowClick={(id) => navigate(`/admin/inventory/stock/${id}`)}
              onEdit={openEditAll}
              scrollRef={detailedScrollRef}
              virtualizer={detailedVirt}
              spacers={dSpacers}
            />
          </TabsContent>
        </div>
      </Tabs>

      <StockEditDialog
        item={editAll}
        form={editForm}
        onFormChange={setEditForm}
        onClose={() => { setEditAll(null); setEditForm(null); }}
        onSave={confirmEditAll}
      />
    </div>
    </Suspense>
  );
}
