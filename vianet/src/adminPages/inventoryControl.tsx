import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Package, Settings, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight, UserCheck, Users, UserCog, X, Hash, Loader2, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAllAccessGroups } from '@/store/slices/inventorySlice';

interface Category {
  category: string; items: number; value: number; status: string;
}

interface ControlSetting {
  id: string; label: string; description: string; defaultEnabled: boolean;
}

interface GroupSetting {
  group: string; maxQty: number; allowDiscount: boolean; autoApprove: boolean; active: boolean;
}

export function InventoryControl() {
  const dispatch = useAppDispatch();
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

  const handleCreateGroup = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/admin/api/access-group', { name: form.name });
      setCreatedLink(res.link || '');
    } catch (e) {
      setCreatedLink('');
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
          <Button variant="default" onClick={handleOpenAdd}><UserCheck size={14} /> Add Group</Button>
          <Button variant="secondary"><Settings size={14} /> Configure</Button>
        </div>
      </div>

      <Tabs orientation="vertical" defaultValue="overview" className="flex gap-6">
        <TabsList className="flex-col w-48 h-fit min-h-40">
          <TabsTrigger value="overview" className="justify-start w-full gap-2"><Package size={14} /> Overview</TabsTrigger>
          <TabsTrigger value="access-group" className="justify-start w-full gap-2"><UserCog size={14} /> Access Group</TabsTrigger>
          <TabsTrigger value="detail" className="justify-start w-full gap-2"><Settings size={14} /> Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-0 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-green-600" />
                  <div className="text-2xl font-bold">{(settings ?? []).filter((s: any) => s.defaultEnabled).length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">of {(settings ?? []).length} control rules</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <div className="text-2xl font-bold">{(categories ?? []).length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{(categories ?? []).filter((c: any) => c.status === 'Active').length} active</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Access Groups</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-purple-600" />
                  <div className="text-2xl font-bold">{(accessGroups ?? []).length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{(accessGroups ?? []).filter((g: any) => g.status === 'Active').length} active</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Control Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {settings.map((s, i) => (
                  <div key={s.id} className={`flex items-center justify-between py-3 ${i < settings.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${s.defaultEnabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.description}</div>
                      </div>
                    </div>
                    <Button
                      variant={s.defaultEnabled ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => toggleSetting(s.id)}
                      className="gap-1.5 text-xs"
                    >
                      {s.defaultEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {s.defaultEnabled ? 'Active' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-group" className="flex-1 mt-0 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {accessGroups.map((g, i) => (
                  <div key={g.id} className={`flex items-center justify-between py-3 ${i < accessGroups.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{g.name}</div>
                        {g.group_key && <div className="text-xs text-muted-foreground">Key: {g.group_key}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-[10px]">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Permission Matrix</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Group</th>
                    <th className="pb-2 font-medium text-center">View</th>
                    <th className="pb-2 font-medium text-center">Edit</th>
                    <th className="pb-2 font-medium text-center">Approve</th>
                    <th className="pb-2 font-medium text-center">Configure</th>
                    <th className="pb-2 font-medium text-center">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {accessGroups.map((g, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{g.name}</td>
                      {['view', 'edit', 'approve', 'configure', 'export'].map(p => (
                        <td key={p} className="py-2.5 text-center">
                          <X size={14} className="text-muted-foreground/40 inline" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Access Group Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {grpSettings.map((g, i) => (
                  <div key={g.group} className={`flex items-center justify-between py-3 ${i < grpSettings.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${g.active ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{g.group}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Hash size={10} /> Max Qty: <span className="font-medium">{(g.maxQty ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={g.allowDiscount ? 'default' : 'secondary'} className="text-[10px]">{g.allowDiscount ? 'Discount Allowed' : 'No Discount'}</Badge>
                      <Badge variant={g.autoApprove ? 'default' : 'outline'} className="text-[10px]">{g.autoApprove ? 'Auto Approve' : 'Manual'}</Badge>
                      <Button
                        variant={g.active ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => toggleGroup(g.group)}
                        className="gap-1.5 text-xs"
                      >
                        {g.active ? 'Active' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Stock Access Limits per Group</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Access Group</th>
                      <th className="pb-2 font-medium">Accessible Stocks</th>
                      <th className="pb-2 font-medium text-right">Max Qty Allowed</th>
                      <th className="pb-2 font-medium">Restrictions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grpSettings.map((g) => {
                      const count = Math.floor(Math.random() * 8) + 1;
                      const restrictions: string[] = [];
                      if (!g.allowDiscount) restrictions.push('No Discount');
                      if (!g.autoApprove) restrictions.push('Manual Approval');
                      if (!g.active) restrictions.push('Disabled');
                      return (
                        <tr key={g.group} className="border-b last:border-0">
                          <td className="py-2.5 font-medium flex items-center gap-2">
                            <div className={`flex size-7 items-center justify-center rounded-md ${g.active ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}><Users size={13} /></div>
                            {g.group}
                          </td>
                           <td className="py-2.5 text-muted-foreground">{count} of {(categories ?? []).length} categories</td>
                          <td className="py-2.5 text-right font-medium">{(g.maxQty ?? 0).toLocaleString()} units</td>
                          <td className="py-2.5">
                            <div className="flex gap-1 flex-wrap">
                              {restrictions.length > 0 ? restrictions.map(r => (
                                <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                              )) : <Badge variant="outline" className="text-[10px]">No Restrictions</Badge>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="flex-1 mt-0 flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Control Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {settings.map((s, i) => (
                  <div key={s.id} className={`flex items-center justify-between py-3 ${i < settings.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${s.defaultEnabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.description}</div>
                      </div>
                    </div>
                    <Button
                      variant={s.defaultEnabled ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => toggleSetting(s.id)}
                      className="gap-1.5 text-xs"
                    >
                      {s.defaultEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {s.defaultEnabled ? 'Active' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium text-right">Item Count</th>
                    <th className="pb-2 font-medium text-right">Stock Value</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{c.category}</td>
                      <td className="py-2.5 text-right">{c.items}</td>
                      <td className="py-2.5 text-right">₹{c.value.toLocaleString()}</td>
                      <td className="py-2.5">
                        <Badge variant={c.status === 'Active' ? 'default' : c.status === 'Inactive' ? 'secondary' : 'outline'}>{c.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Access Group</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {createdLink ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-lg border p-3 bg-green-50">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">Access group created!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={window.location.origin + createdLink} readOnly className="text-xs" />
                  <Button variant="secondary" size="sm" className="gap-1.5 shrink-0" onClick={copyLink}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Group Name <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Warehouse Mgrs" />
                </div>
              </>
            )}
          </div>
          {!createdLink && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAddGroup(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup} disabled={!form.name.trim() || submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                {submitting ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          )}
          {createdLink && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddGroup(false); setCreatedLink(''); }}>Close</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
