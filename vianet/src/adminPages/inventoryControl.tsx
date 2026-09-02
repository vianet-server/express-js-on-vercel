import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, UserCheck, Trash2, Info, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAllAccessGroups } from '@/store/slices/inventorySlice';
import { Badge } from '@/components/ui/badge';
import { AccessGroupList, GroupSettingsTable, ControlSettings, CreateGroupDialog } from './components/inventoryControl';

interface Category {
  category: string; items: number; value: number; status: string;
}

interface ControlSetting {
  id: string; label: string; description: string; defaultEnabled: boolean;
}

interface GroupSetting {
  group: string; maxQty: number; allowDiscount: boolean; autoApprove: boolean; active: boolean;
  accessibleStockCount?: number;
}

export function InventoryControl() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<ControlSetting[]>([]);
  const [grpSettings, setGrpSettings] = useState<GroupSetting[]>([]);
  const accessGroups = useAppSelector((state) => state.inventory.allAccessGroups);

  useEffect(() => {
    api.get('/api/admin/inventory/control').then(res => {
      const d = res;
      setCategories(d.categories || []);
      setSettings(d.controlSettings || []);
      setGrpSettings(d.groupSettings || []);
      dispatch(setAllAccessGroups(d.accessGroups || []));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dispatch]);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, defaultEnabled: !s.defaultEnabled } : s));
  };

  const toggleGroup = (group: string) => {
    setGrpSettings(prev => prev.map(g => g.group === group ? { ...g, active: !g.active } : g));
  };

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', group_key: '' });

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailGroup, setDetailGroup] = useState<any | null>(null);

  const handleCreateGroup = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/admin/access-group', { name: form.name });
      setCreatedLink(res.link || '');
      const control = await api.get('/api/admin/inventory/control');
      if (control.accessGroups) dispatch(setAllAccessGroups(control.accessGroups));
      setGrpSettings(control.groupSettings || []);
    } catch (e) {
      setCreatedLink('');
      alert(e instanceof Error ? e.message : 'Failed to create access group');
    }
    setSubmitting(false);
  };

  const handleOpenAdd = () => {
    setForm({ name: '', group_key: '' });
    setCreatedLink('');
    setShowAddGroup(true);
  };

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(window.location.origin + createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/access-group/${deleteTarget.id}`);
      setDeleteTarget(null);
      const res = await api.get('/api/admin/inventory/control');
      if (res.accessGroups) dispatch(setAllAccessGroups(res.accessGroups));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete access group');
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Control</h1>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={handleOpenAdd}><UserCheck size={14} />create new access group</Button>
        </div>
      </div>

      <Tabs defaultValue="access-group" className="flex gap-6">
        
        <TabsContent value="access-group" className="flex-1 mt-0 flex flex-col gap-6">
          <AccessGroupList
            groups={accessGroups ?? []}
            onNavigate={(name) => navigate(`/admin/inventory/access-group/${encodeURIComponent(name)}`)}
            onDelete={setDeleteTarget}
          />

          <GroupSettingsTable
            grpSettings={grpSettings}
            categories={categories}
            onToggleGroup={toggleGroup}
          />
        </TabsContent>

        <TabsContent value="detail" className="flex-1 mt-0 flex flex-col gap-6">
          <ControlSettings settings={settings} onToggle={toggleSetting} />
        </TabsContent>
      </Tabs>

      <CreateGroupDialog
        open={showAddGroup}
        onOpenChange={setShowAddGroup}
        form={form}
        onFormChange={setForm}
        onSubmit={handleCreateGroup}
        submitting={submitting}
        createdLink={createdLink}
        onCopyLink={copyLink}
        copied={copied}
      />

      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle size={16} /> Delete Access Group</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all stock mappings for this group.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleting}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailGroup} onOpenChange={open => !open && setDetailGroup(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Info size={16} /> {detailGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Group Key</span>
                <div className="font-mono text-xs mt-0.5">{detailGroup?.group_key || '—'}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="mt-0.5"><Badge variant="default" className="text-[10px]">Active</Badge></div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Permissions</span>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {(detailGroup?.permissions ?? []).length > 0
                    ? detailGroup.permissions.map((p: string) => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)
                    : <span className="text-xs text-muted-foreground">None configured</span>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailGroup(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
