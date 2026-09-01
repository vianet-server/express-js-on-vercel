import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCog, X } from 'lucide-react';

interface CreateUserFormProps {
  form: {
    email: string;
    password: string;
    usertype: string;
    is_active: boolean;
    access_group_id: string;
  };
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  onClose: () => void;
  accessGroups: { id: number; name: string }[];
}

export function CreateUserForm({ form, onFormChange, onSubmit, submitting, onClose, accessGroups }: CreateUserFormProps) {
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><UserCog size={16} /> New User</CardTitle>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}><X size={14} /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Email</label>
            <Input value={form.email} onChange={e => onFormChange({ ...form, email: e.target.value })} placeholder="user@example.com" required />
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs text-muted-foreground">Password</label>
            <Input type="password" value={form.password} onChange={e => onFormChange({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </div>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground">Type</label>
            <select value={form.usertype} onChange={e => onFormChange({ ...form, usertype: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs text-muted-foreground">Access Group</label>
            <select value={form.access_group_id} onChange={e => onFormChange({ ...form, access_group_id: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">None</option>
              {accessGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm mb-1">
            <input type="checkbox" checked={form.is_active} onChange={e => onFormChange({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
