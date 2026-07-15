import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, Activity, Globe, CheckCircle, XCircle, Search, Plus, Shield, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

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

const defaultEndpoints = [
  { method: 'GET', path: '/api/v1/products', description: 'Retrieve all products with optional filters' },
  { method: 'GET', path: '/api/v1/products/:id', description: 'Get a single product by ID' },
  { method: 'POST', path: '/api/v1/products', description: 'Create a new product' },
  { method: 'PUT', path: '/api/v1/products/:id', description: 'Update an existing product' },
  { method: 'DELETE', path: '/api/v1/products/:id', description: 'Delete a product' },
  { method: 'GET', path: '/api/v1/analytics/sales', description: 'Get sales analytics data' },
];

const defaultDurationOptions = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'never', label: 'Never Expire' },
];

const methodStyles: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

export function Api() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<any>({});
  const [accessGroups, setAccessGroups] = useState<{ id: number; name: string }[]>([]);
  const [allPermissions, setAllPermissions] = useState<{ id: string; label: string }[]>([]);
  const [endpoints, setEndpoints] = useState(defaultEndpoints);
  const [durationOptions, setDurationOptions] = useState(defaultDurationOptions);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyGroup, setNewKeyGroup] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>([]);
  const [newKeyDuration, setNewKeyDuration] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/api').catch(() => []),
      api.get('/api/admin/api/usage').catch(() => ({})),
      api.get('/api/admin/access-groups').catch(() => []),
      api.get('/api/admin/api/permissions').catch(() => []),
      api.get('/api/admin/api/endpoints').catch(() => defaultEndpoints),
      api.get('/api/admin/api/durations').catch(() => defaultDurationOptions),
    ]).then(([keysData, usageData, groupsData, permsData, endpointsData, durationsData]) => {
      setKeys(Array.isArray(keysData) ? keysData as ApiKey[] : keysData?.data ?? []);
      setUsage(usageData?.data ?? usageData ?? {});
      setAccessGroups(Array.isArray(groupsData) ? groupsData as string[] : groupsData?.data ?? []);
      const perms = Array.isArray(permsData) ? permsData as { id: string; label: string }[] : permsData?.data ?? [];
      setAllPermissions(perms);
      const eps = Array.isArray(endpointsData) ? endpointsData : endpointsData?.data ?? [];
      if (eps.length > 0) setEndpoints(eps);
      const durs = Array.isArray(durationsData) ? durationsData : durationsData?.data ?? [];
      if (durs.length > 0) setDurationOptions(durs);
    }).catch(() => setLoading(false));
  }, []);

  const togglePerm = (id: string) => {
    setNewKeyPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const createKey = () => {
    if (!newKeyName || !newKeyGroup || newKeyPerms.length === 0) return;
    api.post('/api/admin/api', {
      key_name: newKeyName,
      group: newKeyGroup,
      permissions: newKeyPerms,
      duration: newKeyDuration,
    }).then((newKey) => {
      setKeys(prev => [...prev, newKey]);
      setNewKeyName('');
      setNewKeyGroup('');
      setNewKeyPerms([]);
      setNewKeyDuration('');
      setCreateOpen(false);
    }).catch(console.error);
  };

  const revokeKey = (id: string) => {
    api.put('/api/admin/api', { id, is_active: false }).then(() => {
      setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    }).catch(console.error);
  };

  const filteredKeys = keys.filter(k =>
    k.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.group?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">API</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={14} /> Generate New Key</Button>
      </div>

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
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => revokeKey(k.id)} title="Revoke"><Trash2 size={13} /></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={16} /> Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Today's Requests</p>
              <p className="text-2xl font-bold">{(usage?.todayRequests ?? 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{(usage?.monthRequests ?? 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Keys</p>
              <p className="text-2xl font-bold">{keys.filter(k => k.status === 'active').length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Quota Remaining</p>
              <p className="text-2xl font-bold text-amber-600">{(usage?.quotaRemaining ?? 0).toLocaleString()}</p>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={16} /> Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-sm">
            <Search size={14} className="text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 p-0 h-auto text-sm focus-visible:ring-0"
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Method</th>
                <th className="pb-2 font-medium">Endpoint</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.filter(ep =>
                !searchTerm || ep.path?.toLowerCase().includes(searchTerm.toLowerCase()) || ep.description?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((ep) => (
                <tr key={ep.path} className="border-b last:border-0">
                  <td className="py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${methodStyles[ep.method]}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-sm">{ep.path}</td>
                  <td className="py-2.5 text-muted-foreground">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Generate New API Key</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label>Key Name</Label>
              <Input placeholder="e.g. Production Key" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Associated Access Group</Label>
              <Select value={newKeyGroup} onValueChange={(v) => v && setNewKeyGroup(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access group..." />
                </SelectTrigger>
                <SelectContent>
                  {accessGroups.map(g => (
                    <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={newKeyPerms.includes(p.id)} onCheckedChange={() => togglePerm(p.id)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max User Active Duration</Label>
              <Select value={newKeyDuration} onValueChange={(v) => v && setNewKeyDuration(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration..." />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCreateOpen(false); setNewKeyName(''); setNewKeyGroup(''); setNewKeyPerms([]); setNewKeyDuration(''); }}>Cancel</Button>
            <Button onClick={createKey} disabled={!newKeyName || !newKeyGroup || newKeyPerms.length === 0}>Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
