import { useState, useEffect, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

const EmailList = lazy(() => import('./components/email').then(m => ({ default: m.EmailList })));
const EmailForm = lazy(() => import('./components/email').then(m => ({ default: m.EmailForm })));

interface EmailCampaign {
  id: number;
  dbId?: number;
  name: string;
  email: string;
  accessGroup: string;
  brand: string;
  schedule: string;
  includePrice: boolean;
  includeDetailed: boolean;
  lastSent: string | null;
}

export function Email() {
  const [activeTab, setActiveTab] = useState('list');
  const [emails, setEmails] = useState<EmailCampaign[]>([]);
  const [accessGroups, setAccessGroups] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    accessGroup: '',
    brand: '',
    schedule: 'everyday',
    includePrice: false,
    includeDetailed: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<any>('/api/admin/access-groups')
      .then(res => setAccessGroups(Array.isArray(res) ? res : []))
      .catch(() => setAccessGroups([]));

    api.get<any>('/api/admin/inventory/brands')
      .then(res => {
        const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const list = rawList.filter((b: any) => typeof b === 'string' && b.trim().length > 0 && /[a-zA-Z]/.test(b));
        setBrands(list);
      })
      .catch(() => setBrands([]));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('Please enter an email name.');
      return;
    }
    if (!form.accessGroup) {
      setError('Please select an access group.');
      return;
    }
    if (!form.brand) {
      setError('Please select a brand.');
      return;
    }
    setError('');
    const campaign: EmailCampaign = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      accessGroup: form.accessGroup,
      brand: form.brand,
      schedule: form.schedule,
      includePrice: form.includePrice,
      includeDetailed: form.includeDetailed,
      lastSent: null,
    };
    try {
      const res = await api.post<any>('/api/admin/email-marketing', {
        name: campaign.name,
        email: campaign.email,
        accessGroup: campaign.accessGroup,
        brand: campaign.brand,
        schedule: campaign.schedule,
        includePrice: campaign.includePrice,
        includeDetailed: campaign.includeDetailed,
      });
      if (res?.data?.id) {
        campaign.dbId = res.data.id;
      }
    } catch (e) {
      console.error('Failed to save email campaign', e);
    }
    setEmails(prev => [campaign, ...prev]);
    setForm({ name: '', email: '', accessGroup: '', brand: '', schedule: 'everyday', includePrice: false, includeDetailed: false });
    setActiveTab('list');
  };

  const handleSend = async (id: number) => {
    const now = new Date().toISOString();
    let dbId: number | undefined;
    setEmails(prev => prev.map(e => {
      if (e.id !== id) return e;
      dbId = e.dbId;
      return { ...e, lastSent: now };
    }));
    if (dbId) {
      try {
        await api.put(`/api/admin/email-marketing/${dbId}/sent`);
      } catch (e) {
        console.error('Failed to stamp last sent', e);
      }
    }
  };

  return (
    <Suspense fallback={<Loader2 className="animate-spin size-8 text-muted-foreground" />}>
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create scheduled email campaigns and track when they were last sent.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Email List</TabsTrigger>
          <TabsTrigger value="create">Create Email</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <EmailList emails={emails} onSend={handleSend} />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <EmailForm
            form={form}
            onFormChange={setForm}
            onSubmit={handleCreate}
            error={error}
            accessGroups={accessGroups}
            brands={brands}
          />
        </TabsContent>
      </Tabs>
    </div>
    </Suspense>
  );
}
