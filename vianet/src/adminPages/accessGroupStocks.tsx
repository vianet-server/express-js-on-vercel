import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Download, Loader2, Plus, Trash2, Save, Search, X } from 'lucide-react';
import { api } from '@/lib/api';

interface StockItem {
  id: number;
  name: string;
  brand: string;
  model: string;
  qty: number;
  price: number;
  gst: number;
}

export function AccessGroupStocks() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name || '');
  const [items, setItems] = useState<StockItem[]>([]);
  const [groupInfo, setGroupInfo] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<Record<number, { qty: number; price: number }>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('');

  const fetchItems = useCallback(() => {
    if (!decodedName) return;
    api.get(`/api/admin/inventory/access-group/${encodeURIComponent(decodedName)}`).then((res: any) => {
      setGroupInfo(res.group);
      setItems(res.items);
      setLoading(false);
    }).catch((err: Error) => {
      setLoadError(err.message);
      setLoading(false);
    });
  }, [decodedName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!addOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setNewPrice('');
      setNewQty('');
      setAdding(null);
    }
  }, [addOpen]);

  const startEdit = (item: StockItem) => {
    setEditing(prev => ({ ...prev, [item.id]: { qty: Number(item.qty), price: Number(item.price) } }));
  };

  const cancelEdit = (id: number) => {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveItem = async (item: StockItem) => {
    const e = editing[item.id];
    if (!e) return;
    setSaving(item.id);
    try {
      await api.put(`/api/admin/inventory/sku/${item.id}/access-group/${encodeURIComponent(decodedName)}`, { qty: e.qty, price: e.price });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: e.qty, price: e.price } : i));
      cancelEdit(item.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const removeItem = async (item: StockItem) => {
    if (!confirm(`Remove "${item.name}" from ${decodedName}?`)) return;
    try {
      await api.delete(`/api/admin/inventory/sku/${item.id}/access-group/${encodeURIComponent(decodedName)}`);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const searchStocks = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<any>(`/api/admin/inventory/stock?search=${encodeURIComponent(q)}&limit=20`);
      setSearchResults((res.rows || []).filter((r: any) => !items.find(i => i.id === r.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addStockAccess = async (stock: any) => {
    setAdding(stock.id);
    try {
      await api.post(`/api/admin/inventory/sku/${stock.id}/access-group/${encodeURIComponent(decodedName)}`, {
        qty: parseInt(newQty) || 0,
        price: parseFloat(newPrice) || 0,
      });
      setSearchResults(prev => prev.filter(r => r.id !== stock.id));
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setAdding(null);
    }
  };

  const exportExcel = useCallback(() => {
    import('xlsx').then((XLSX) => {
      const data = items.map((i) => ({
        Name: i.name,
        Brand: i.brand,
        Model: i.model,
        Quantity: i.qty,
        Price: i.price,
        'GST %': i.gst,

      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 30 }, { wch: 18 }, { wch: 18 },
        { wch: 10 }, { wch: 10 }, { wch: 8 },
        { wch: 8 }, { wch: 8 }, { wch: 12 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stocks');
      XLSX.writeFile(wb, `${decodedName}-stocks.xlsx`);
    });
  }, [items, decodedName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-64 p-6">
        <h2 className="text-xl font-bold">Access Group Not Found</h2>
        {loadError && <p className="text-sm text-destructive max-w-md text-center">{loadError}</p>}
        <Button variant="outline" onClick={() => navigate('/admin/inventory')}>
          <ArrowLeft size={14} /> Back
        </Button>
      </div>
    );
  }

  const totalQty = items.reduce((s, i) => s + Number(i.qty), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/inventory')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{decodedName}</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} stocks &middot; {totalQty} total qty</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportExcel}>
            <Download size={14} /> Export
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Stock
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isEditing = editing[item.id] != null;
          const edit = editing[item.id];
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow relative">
              <CardHeader className="pb-2 pr-8">
                <CardTitle className="text-base leading-tight">{item.name}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {item.brand}{item.brand && item.model ? ' / ' : ''}{item.model}
                </div>
              </CardHeader>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-6 text-muted-foreground hover:text-red-600" onClick={() => removeItem(item)}>
                <Trash2 size={13} />
              </Button>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground self-center">Qty</div>
                  <div className="text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="icon" className="size-6" onClick={() => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: Math.max(0, edit.qty - 1) } }))}>-</Button>
                        <Input type="number" className="w-16 h-7 text-xs text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={edit.qty} onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: Math.max(0, parseInt(e.target.value) || 0) } }))} />
                        <Button variant="outline" size="icon" className="size-6" onClick={() => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: edit.qty + 1 } }))}>+</Button>
                      </div>
                    ) : (
                      <span className="font-semibold cursor-pointer hover:underline" onClick={() => startEdit(item)}>{Number(item.qty).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground self-center">Price</div>
                  <div className="text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="icon" className="size-6" onClick={() => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], price: Math.max(0, edit.price - 1) } }))}>-</Button>
                        <Input type="number" className="w-20 h-7 text-xs text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={edit.price} onChange={e => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], price: Math.max(0, parseFloat(e.target.value) || 0) } }))} />
                        <Button variant="outline" size="icon" className="size-6" onClick={() => setEditing(prev => ({ ...prev, [item.id]: { ...prev[item.id], price: edit.price + 1 } }))}>+</Button>
                      </div>
                    ) : (
                      <span className="font-semibold cursor-pointer hover:underline" onClick={() => startEdit(item)}>{Number(item.price).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                    )}
                  </div>
                  {item.gst != null && (
                    <>
                      <div className="text-muted-foreground">GST</div>
                      <div className="text-right">{item.gst}%</div>
                    </>
                  )}

                </div>
                {isEditing && (
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => cancelEdit(item.id)}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs" onClick={() => saveItem(item)} disabled={saving === item.id}>
                      {saving === item.id ? <Loader2 className="animate-spin size-3" /> : <Save size={12} />} Save
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No stocks assigned to this access group.</div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Stock to {decodedName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search stock by name..." value={searchQuery} onChange={e => searchStocks(e.target.value)} autoFocus />
            </div>
            {searching && <div className="text-sm text-muted-foreground text-center py-2"><Loader2 className="animate-spin inline size-4 mr-1" />Searching...</div>}
            {!searching && searchQuery && searchResults.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">No stocks found.</div>
            )}
            {searchResults.map((stock) => (
              <div key={stock.id} className="flex items-center gap-3 border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{stock.name}</div>
                  {stock.brand && <div className="text-xs text-muted-foreground">{stock.brand}{stock.model ? ` / ${stock.model}` : ''}</div>}
                </div>
                <Input type="number" placeholder="Qty" className="w-16 h-8 text-xs" value={adding === stock.id ? (newQty || '') : ''} onChange={e => setNewQty(e.target.value)} />
                <Input type="number" placeholder="Price" className="w-20 h-8 text-xs" value={adding === stock.id ? (newPrice || '') : ''} onChange={e => setNewPrice(e.target.value)} />
                <Button size="sm" className="h-8 text-xs" disabled={adding === stock.id} onClick={() => addStockAccess(stock)}>
                  {adding === stock.id ? <Loader2 className="animate-spin size-3" /> : <Plus size={12} />} Add
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
