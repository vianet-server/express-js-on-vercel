import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function Voucher() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    api.get('/api/admin/voucher').then(r => { console.log('[VOUCHER] response:', r); setData(Array.isArray(r) ? r : r?.data ?? []); setLoading(false); }).catch(e => { console.error('[VOUCHER] error:', e); setLoading(false); });
  }, []);
  const filtered = data.filter(v =>
    (v.party_ledger_name || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (v.voucher_type || v.type || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (v.voucher_number || '')?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Voucher</h1>
        <Button size="sm"><Plus size={14} /> New Voucher</Button>
      </div>
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search vouchers..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>
      <Card>
        <CardHeader><CardTitle>Vouchers</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">Party</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium text-right">Amount</th>
            </tr></thead>
            <tbody>{filtered.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="py-2.5 font-mono text-xs text-muted-foreground">{v.voucher_number || v.id}</td>
                <td className="py-2.5"><Badge variant="outline" className="text-[10px]">{v.voucher_type || v.type}</Badge></td>
                <td className="py-2.5 font-medium">{v.party_ledger_name || v.narration || '-'}</td>
                <td className="py-2.5 text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString() : ''}</td>
                <td className="py-2.5 text-right font-medium">₹{(v.amount ?? 0).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
