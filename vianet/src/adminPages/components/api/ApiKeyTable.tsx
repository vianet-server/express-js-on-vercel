import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, CheckCircle, XCircle, Shield, Trash2, Loader2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  group: string;
  created: string;
  lastUsed: string;
  status: string;
  permissions: string[];
  duration: string;
}

interface ApiKeyTableProps {
  keys: ApiKey[];
  loading: boolean;
  onRevoke: (id: string) => void;
  searchTerm: string;
}

export function ApiKeyTable({ keys, loading, onRevoke, searchTerm }: ApiKeyTableProps) {
  const filteredKeys = keys.filter(k =>
    k.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.group?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={16} /> API Keys
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Key Name</th>
              <th className="pb-2 font-medium">Key Value</th>
              <th className="pb-2 font-medium">Access Group</th>
              <th className="pb-2 font-medium">Created</th>
              <th className="pb-2 font-medium">Last Used</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map((k) => (
              <tr key={k.id} className="border-b last:border-0">
                <td className="py-2.5 font-medium">{k.name}</td>
                <td className="py-2.5 font-mono text-muted-foreground">{k.key}</td>
                <td className="py-2.5">
                  <Badge variant="outline" className="text-[10px]"><Shield size={10} className="mr-1" />{k.group}</Badge>
                </td>
                <td className="py-2.5">{k.created}</td>
                <td className="py-2.5">{k.lastUsed}</td>
                <td className="py-2.5">
                  <Badge className={k.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                    {k.status === 'active' ? <><CheckCircle size={12} className="mr-1" />Active</> : <><XCircle size={12} className="mr-1" />Revoked</>}
                  </Badge>
                </td>
                <td className="py-2.5 text-right">
                  {k.status === 'active' && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => onRevoke(k.id)} title="Revoke"><Trash2 size={13} /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </CardContent>
    </Card>
  );
}
