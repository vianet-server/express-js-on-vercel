import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { api } from '@/lib/api';

const LIMIT = 50;

export function StockItem() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (q: string, off: number) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/admin/stock-item?limit=${LIMIT}&offset=${off}${q ? `&name=${encodeURIComponent(q)}` : ''}`);
      setRows(Array.isArray(res) ? res : res.rows ?? []);
      setTotal(res.total ?? 0);
    } catch { setRows([]); setTotal(0); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(search, offset); }, [fetchData, search, offset]);

  const handleSearch = (val: string) => { setSearch(val); setOffset(0); };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stock Item</h1>
        <Button size="sm"><Plus size={14} /> New Stock Item</Button>
      </div>
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search stock items..." value={search} onChange={e => handleSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Items</CardTitle>
            <span className="text-xs text-muted-foreground">{total} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No stock items found.</p>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium">Stock Name</th><th className="pb-2 font-medium text-right">Quantity</th><th className="pb-2 font-medium text-right">Price</th>
            </tr></thead>
            <tbody>{rows.map((s: any) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="py-2.5 font-medium">{s.name}</td>
                <td className="py-2.5 text-right">{s.qty}</td>
                <td className="py-2.5 text-right font-medium">₹{s.value?.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
          )}
        </CardContent>
      </Card>

      {total > LIMIT && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>
            <ChevronLeft size={14} /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
