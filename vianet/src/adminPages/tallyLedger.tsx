import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Plus, Search, Loader2 } from 'lucide-react';
import { useAdminQuery } from '@/hooks/useAdminQuery';

export function Ledger() {
  const [search, setSearch] = useState('');
  const { data: raw, loading } = useAdminQuery<any>('ledger', '/api/admin/ledger');
  const data = Array.isArray(raw) ? raw : raw?.data ?? [];
  const filtered = data.filter((l: any) => l.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
        <Button size="sm"><Plus size={14} /> New Ledger</Button>
      </div>
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search ledgers..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>
      <Card>
        <CardHeader><CardTitle>Ledgers</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Mobile</th><th className="pb-2 font-medium">Address</th><th className="pb-2 font-medium">Ledger Name</th>
            </tr></thead>
            <tbody>{filtered.map((l: any) => (
              <tr key={l.id || l.name} className="border-b last:border-0">
                <td className="py-2.5 font-medium">{l.name}</td>
                <td className="py-2.5 text-muted-foreground">{(l.mobile || []).join(', ') || '-'}</td>
                <td className="py-2.5 text-muted-foreground">{(l.address || []).join(', ') || '-'}</td>
                <td className="py-2.5">{l.ledgername || '-'}</td>
              </tr>
            ))}</tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
