import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ApiKeyTable, UsageCards, EndpointsTable, CreateKeyDialog } from './components/api';

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
      setKeys(Array.isArray(keysData) ? keysData as ApiKey[] : []);
      setUsage(typeof usageData === 'object' && usageData !== null ? usageData : {});
      setAccessGroups(Array.isArray(groupsData) ? groupsData as { id: number; name: string }[] : []);
      setAllPermissions(Array.isArray(permsData) ? permsData as { id: string; label: string }[] : []);
      if (Array.isArray(endpointsData) && endpointsData.length > 0) setEndpoints(endpointsData);
      if (Array.isArray(durationsData) && durationsData.length > 0) setDurationOptions(durationsData);
      setLoading(false);
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
      setKeys(prev => [...prev, newKey as ApiKey]);
      setNewKeyName('');
      setNewKeyGroup('');
      setNewKeyPerms([]);
      setNewKeyDuration('');
      setCreateOpen(false);
      toast.success('API key created');
    }).catch((err: Error) => {
      toast.error(err.message || 'Failed to create API key');
    });
  };

  const revokeKey = (id: string) => {
    api.put('/api/admin/api', { id, is_active: false }).then(() => {
      setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    }).catch(console.error);
  };

  const activeKeyCount = keys.filter(k => k.status === 'active').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">API</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={14} /> Generate New Key</Button>
      </div>

      <ApiKeyTable keys={keys} loading={loading} onRevoke={revokeKey} searchTerm={searchTerm} />

      <UsageCards usage={usage} activeKeyCount={activeKeyCount} />

      <EndpointsTable endpoints={endpoints} searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <CreateKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        keyName={newKeyName}
        onKeyNameChange={setNewKeyName}
        group={newKeyGroup}
        onGroupChange={setNewKeyGroup}
        permissions={newKeyPerms}
        onTogglePerm={togglePerm}
        duration={newKeyDuration}
        onDurationChange={setNewKeyDuration}
        allPermissions={allPermissions}
        accessGroups={accessGroups}
        durationOptions={durationOptions}
        onSubmit={createKey}
      />
    </div>
  );
}
