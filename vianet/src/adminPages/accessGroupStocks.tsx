import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { StockGrid, AddStockDialog } from './components/accessGroupStocks';

interface StockItem {
  id: number;
  sku: string;
  name: string;
  brand: string;
  model: string;
  variant: string;
  color: string;
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
  const [editing, setEditing] = useState<Record<number, { qty: number; price: number; gst: number }>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const filtered = useMemo(() => {
    if (!submittedQuery) return searchResults;
    const q = submittedQuery.toLowerCase();
    return searchResults.filter((r: any) => r.name?.toLowerCase().includes(q) || r.brand?.toLowerCase().includes(q));
  }, [searchResults, submittedQuery]);

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
      setSubmittedQuery('');
      setSearchResults([]);
      setNewPrice('');
      setNewQty('');
      setAdding(null);
    }
  }, [addOpen]);

  const startEdit = (item: StockItem) => {
    setEditing(prev => ({ ...prev, [item.id]: { qty: Number(item.qty), price: Number(item.price), gst: Number(item.gst) || 0 } }));
  };

  const cancelEdit = (id: number) => {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveItem = async (item: StockItem) => {
    const e = editing[item.id];
    if (!e) return;
    setSaving(item.id);
    try {
      await api.put(`/api/admin/inventory/sku/${item.id}/access-group/${encodeURIComponent(decodedName)}`, { qty: e.qty, price: e.price, gst: e.gst });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: e.qty, price: e.price, gst: e.gst } : i));
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
    setSubmittedQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<any>(`/api/admin/inventory/stock?search=${encodeURIComponent(q)}&limit=500`);
      setSearchResults((res.rows || []).filter((r: any) => !items.find(i => i.id === r.id)));
    } catch (err) {
      console.error('[add-stock search]', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchStocks(searchQuery);
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
        <Button variant="outline" onClick={() => navigate('/admin/inventory/control')}>
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
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/inventory/control')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{decodedName}</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} stocks &middot; {totalQty} total qty</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportExcel}>
            <Download size={14} /> sidnosnd
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Stock
          </Button>
        </div>
      </div>

      <StockGrid
        items={items}
        editing={editing}
        onEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSave={saveItem}
        onRemove={removeItem}
        onEditingChange={(id, field, value) => setEditing(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))}
        saving={saving}
      />

      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No stocks assigned to this access group.</div>
      )}

      <AddStockDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchKeyDown={handleSearchKeyDown}
        searchResults={filtered}
        searching={searching}
        newQty={newQty}
        onNewQtyChange={setNewQty}
        newPrice={newPrice}
        onNewPriceChange={setNewPrice}
        adding={adding}
        onAddStock={addStockAccess}
      />
    </div>
  );
}
