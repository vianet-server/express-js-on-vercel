import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function Masters() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    api.get('/api/admin/masters').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);
  const filtered = data.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.id?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Masters</h1>
        <Button size="sm"><Plus size={14} /> Add Master</Button>
      </div>
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search masters..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>
      <Card>
        <CardHeader><CardTitle>Master List</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium text-right">Records</th><th className="pb-2 font-medium">Last Updated</th><th className="pb-2 font-medium">Status</th>
            </tr></thead>
            <tbody>{filtered.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2.5 font-mono text-xs text-muted-foreground">{m.id}</td>
                <td className="py-2.5 font-medium">{m.name}</td>
                <td className="py-2.5 text-right">{m.records}</td>
                <td className="py-2.5 text-muted-foreground">{m.lastUpdated}</td>
                <td className="py-2.5"><Badge variant={m.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
