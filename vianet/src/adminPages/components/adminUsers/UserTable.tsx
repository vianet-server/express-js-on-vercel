import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';

interface UserTableProps {
  rows: any[];
  loading: boolean;
  total: number;
  onRowClick: (user: any) => void;
}

export function UserTable({ rows, loading, total, onRowClick }: UserTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Users</CardTitle>
          <span className="text-xs text-muted-foreground">{total} total</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No users found.</p>
        ) : (
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Email</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium">Access Group</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Created</th>
          </tr></thead>
          <tbody>{rows.map((u: any) => (
            <tr key={u.id || u.userid} className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => onRowClick(u)}>
              <td className="py-2.5 font-medium">{u.email}</td>
              <td className="py-2.5"><Badge variant="outline" className="text-[10px] uppercase">{u.user_type}</Badge></td>
              <td className="py-2.5">{u.access_group_name ? <Badge variant="outline" className="text-[10px] gap-1"><Users size={10} />{u.access_group_name}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
              <td className="py-2.5"><Badge variant={u.is_active ? 'default' : 'secondary'} className="text-[10px]">{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
              <td className="py-2.5 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
        )}
      </CardContent>
    </Card>
  );
}
