/* eslint-disable react-hooks/set-state-in-effect -- server data fetch is a valid effect use */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit3, ExternalLink, Check, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setStockItems, updateStockItem } from '@/store/slices/inventorySlice';

interface StockItem {
  id: number; name: string; brand: string; model: string; variant: string; color: string;
  qty: number; price: number; gst: number; min: number; max: number;
}

const LIMIT_OPTIONS = [10, 25, 30, 50, 100]

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
  const [pageLimit, setPageLimit] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)
  const [editAll, setEditAll] = useState<StockItem | null>(null);
  const [editForm, setEditForm] = useState<StockItem | null>(null);

  interface StockPageResponse {
    rows: StockItem[];
    total: number;
    limit: number;
    offset: number;
  }

  const didInit = useRef(false);
  const totalPages = Math.max(1, Math.ceil(pagination.total / pageLimit));

  const fetchPage = useCallback(async (page: number, limit = pageLimit) => {
    setLoading(true)
    try {
      const offset = page * limit
      const res = await api.get<StockPageResponse>(`/api/admin/inventory/stock?limit=${limit}&offset=${offset}`)
      dispatch(setStockItems(res.rows))
      return res
    } finally {
      setLoading(false)
    }
  }, [dispatch, pageLimit])

  useEffect(() => {
    dispatch(setStockItems([]))
    setCurrentPage(0)
    didInit.current = true
  }, [pageLimit, dispatch])

  useEffect(() => {
    if (didInit.current) {
      fetchPage(currentPage)
    }
  }, [currentPage, pageLimit, fetchPage])

  const handleLimitChange = (value: string | null) => {
    if (value !== null) setPageLimit(Number(value));
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page)
  };

  const filtered = items.filter(p =>
    (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.model ?? '').toLowerCase().includes(search.toLowerCase())
  )

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

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const range = 2
    const start = Math.max(0, currentPage - range)
    const end = Math.min(totalPages - 1, currentPage + range)
    if (start > 0) pages.push(0)
    if (start > 1) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 2) pages.push('...')
    if (end < totalPages - 1) pages.push(totalPages - 1)
    return pages
  }

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
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <Input placeholder="Search name, brand or model..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages} ({pagination.total} total items)
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Per page</span>
          <Select value={String(pageLimit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue placeholder={String(pageLimit)} />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map(opt => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{items.reduce((s, p) => s + p.qty, 0).toLocaleString()}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{items.filter(p => p.qty <= p.min).length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Stock Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{items.reduce((s, p) => s + p.qty * (p.price ?? 0), 0).toLocaleString()}</div></CardContent></Card>
            </div>
            {loading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="animate-spin size-4 mr-2" /> Loading...
              </div>
            )}
            <Card className="mt-4">
              <CardHeader><CardTitle>Stock Levels</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Brand</th>
                      <th className="pb-2 font-medium text-right">Stock</th>
                      <th className="pb-2 font-medium text-right">Min</th>
                      <th className="pb-2 font-medium text-right">Max</th>
                      <th className="pb-2 font-medium text-right">Price</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/inventory/stock/${p.id}`)}>
                        <td className="py-2.5 font-medium">{p.name}</td>
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
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Stock View</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {loading && (
                  <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                    <Loader2 className="animate-spin size-4 mr-2" /> Loading...
                  </div>
                )}
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium whitespace-nowrap px-2 first:pl-0">Stock Name</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2">Brand</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2">Model</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2">Variant</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2">Color</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2 text-right">Qty</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2 text-right">Price</th>
                      <th className="pb-2 font-medium whitespace-nowrap px-2 text-right">GST %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <ContextMenu key={p.id}>
                        <ContextMenuTrigger className="contents">
                          <tr className="border-b last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/inventory/stock/${p.id}`)}>
                            <td className="px-2 py-2.5 font-medium first:pl-0">{p.name}</td>
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
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex items-center justify-center gap-1 pt-4 overflow-x-auto">
            <Button variant="outline" size="icon" className="size-8" disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
              <ChevronLeft size={14} />
            </Button>
            {getPageNumbers().map((p, i) =>
              typeof p === 'string' ? (
                <span key={`e-${i}`} className="text-xs text-muted-foreground px-1">...</span>
              ) : (
                <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="icon" className="size-8 text-xs" onClick={() => goToPage(p)}>
                  {p + 1}
                </Button>
              )
            )}
            <Button variant="outline" size="icon" className="size-8" disabled={currentPage >= totalPages - 1} onClick={() => goToPage(currentPage + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
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
