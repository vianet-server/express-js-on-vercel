import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ChevronLeft, ChevronRight, Plus, Search, UserCog, X, Users, Shield } from 'lucide-react';
import { api } from '@/lib/api';

const LIMIT = 50;

export function AdminUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [accessGroups, setAccessGroups] = useState<{ id: number; name: string }[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', usertype: 'admin', is_active: true, access_group_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ user_type: '', access_group_id: '', is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<any>('/api/admin/access-groups').then(res => {
      setAccessGroups(Array.isArray(res) ? res : []);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async (q: string, off: number) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/admin/accesscontrol?limit=${LIMIT}&offset=${off}${q ? `&email=${encodeURIComponent(q)}` : ''}`);
      setRows(res.rows ?? []);
      setTotal(res.total ?? 0);
    } catch { setRows([]); setTotal(0); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(search, offset); }, [fetchData, search, offset]);

  const handleSearch = (val: string) => { setSearch(val); setOffset(0); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/admin/accesscontrol', { ...form, access_group_id: form.access_group_id ? Number(form.access_group_id) : null });
      setShowForm(false);
      setForm({ email: '', password: '', usertype: 'admin', is_active: true, access_group_id: '' });
      setOffset(0);
      fetchData(search, 0);
    } catch (err) {
      console.error(err);
      alert('Failed to create user. Check console.');
    }
    setSubmitting(false);
  };

  const openPermissions = (user: any) => {
    setEditUser(user);
    setEditForm({
      user_type: user.user_type || 'user',
      access_group_id: user.access_group_id ? String(user.access_group_id) : '',
      is_active: user.is_active ?? true,
    });
  };

  const savePermissions = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api.put('/api/admin/accesscontrol', {
        id: editUser.id,
        email: editUser.email,
        user_type: editForm.user_type,
        access_group_id: editForm.access_group_id ? Number(editForm.access_group_id) : null,
        is_active: editForm.is_active,
      });
      setEditUser(null);
      fetchData(search, offset);
    } catch (err) {
      console.error(err);
      alert('Failed to save permissions.');
    }
    setSaving(false);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> Create User</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><UserCog size={16} /> New User</CardTitle>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowForm(false)}><X size={14} /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground">Email</label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" required />
              </div>
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground">Password</label>
                <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required />
              </div>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-xs text-muted-foreground">Type</label>
                <select value={form.usertype} onChange={e => setForm(p => ({ ...p, usertype: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground">Access Group</label>
                <select value={form.access_group_id} onChange={e => setForm(p => ({ ...p, access_group_id: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">None</option>
                  {accessGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                Active
              </label>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search by email..." value={search} onChange={e => handleSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>

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
              <tr key={u.id || u.userid} className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openPermissions(u)}>
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

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={18} /> Permissions — {editUser?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">User Type</label>
              <select value={editForm.user_type} onChange={e => setEditForm(p => ({ ...p, user_type: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Access Group</label>
              <select value={editForm.access_group_id} onChange={e => setEditForm(p => ({ ...p, access_group_id: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">None</option>
                {accessGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(p => ({ ...p, is_active: e.target.checked }))} />
              Active
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditUser(null)}><X size={14} /> Cancel</Button>
            <Button size="sm" onClick={savePermissions} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
