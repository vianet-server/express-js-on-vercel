import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';

const UserTable = lazy(() => import('./components/adminUsers').then(m => ({ default: m.UserTable })));
const CreateUserForm = lazy(() => import('./components/adminUsers').then(m => ({ default: m.CreateUserForm })));
const PermissionsDialog = lazy(() => import('./components/adminUsers').then(m => ({ default: m.PermissionsDialog })));

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

  const handleCreate = async () => {
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
    <Suspense fallback={<Loader2 className="animate-spin size-8 text-muted-foreground" />}>
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> Create User</Button>
      </div>

      {showForm && (
        <CreateUserForm
          form={form}
          onFormChange={setForm}
          onSubmit={handleCreate}
          submitting={submitting}
          onClose={() => setShowForm(false)}
          accessGroups={accessGroups}
        />
      )}

      <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <Input placeholder="Search by email..." value={search} onChange={e => handleSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
      </div>

      <UserTable rows={rows} loading={loading} total={total} onRowClick={openPermissions} />

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

      <PermissionsDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onSave={savePermissions}
        saving={saving}
        accessGroups={accessGroups}
      />
    </div>
    </Suspense>
  );
}
