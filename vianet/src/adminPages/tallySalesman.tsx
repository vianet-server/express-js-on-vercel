import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, UserCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function Salesman() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    api.get('/admin/salesman').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);
  const filtered = data.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.region?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Salesman</h1>
        <Button size="sm"><Plus size={14} /> Add Salesman</Button>
      </div>
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search salesmen..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>
      <Card>
        <CardHeader><CardTitle>Salesmen</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Region</th><th className="pb-2 font-medium text-right">Sales</th><th className="pb-2 font-medium text-right">Orders</th><th className="pb-2 font-medium">Status</th>
            </tr></thead>
            <tbody>{filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="py-2.5 font-medium flex items-center gap-1.5"><div className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-700"><UserCheck size={12} /></div>{s.name}</td>
                <td className="py-2.5 text-muted-foreground">{s.region}</td>
                <td className="py-2.5 text-right">₹{s.sales?.toLocaleString()}</td>
                <td className="py-2.5 text-right">{s.orders}</td>
                <td className="py-2.5"><Badge variant={s.status === 'Active' ? 'default' : s.status === 'On Leave' ? 'secondary' : 'outline'} className="text-[10px]">{s.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
