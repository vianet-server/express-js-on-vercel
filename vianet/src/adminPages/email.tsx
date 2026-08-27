import { useState, useEffect } from 'react';
import { Mail, Plus, Send, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

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

const SCHEDULES = [
  { value: 'everyday', label: 'Everyday' },
  { value: 'every-week', label: 'Every Week' },
  { value: 'mid-week', label: 'Twice a Week (Mid Week)' },
  { value: 'every-month', label: 'Every Month' },
  { value: 'every-quarter', label: 'Every Quarter' },
];

const scheduleLabel = (v: string) => SCHEDULES.find(s => s.value === v)?.label ?? v;

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

        {/* ---------------- Email List ---------------- */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Mail size={28} />
                  <p>No email campaigns yet. Create one from the “Create Email” tab.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-muted-foreground">
                      <tr>
                        <th className="py-3 pl-4 pr-2 font-medium">Name</th>
                        <th className="py-3 px-2 font-medium">Email</th>
                        <th className="py-3 px-2 font-medium">Access Group</th>
                        <th className="py-3 px-2 font-medium">Brand</th>
                        <th className="py-3 px-2 font-medium">Schedule</th>
                        <th className="py-3 px-2 font-medium">Options</th>
                        <th className="py-3 px-2 font-medium">Last Sent</th>
                        <th className="py-3 px-2 font-medium text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map(e => (
                        <tr key={e.id} className="border-b last:border-0">
                          <td className="py-3 pl-4 pr-2 font-medium">{e.name}</td>
                          <td className="py-3 px-2">{e.email || <span className="text-muted-foreground">—</span>}</td>
                          <td className="py-3 px-2">{e.accessGroup}</td>
                          <td className="py-3 px-2">{e.brand}</td>
                          <td className="py-3 px-2">{scheduleLabel(e.schedule)}</td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1.5">
                              <Badge variant={e.includePrice ? 'default' : 'secondary'}>Price</Badge>
                              <Badge variant={e.includeDetailed ? 'default' : 'secondary'}>Detailed</Badge>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {e.lastSent ? new Date(e.lastSent).toLocaleString() : 'Never'}
                          </td>
                          <td className="py-3 px-2 text-right pr-4">
                            <Button size="sm" variant="outline" onClick={() => handleSend(e.id)}>
                              <Send size={14} /> Send
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Create Email ---------------- */}
        <TabsContent value="create" className="mt-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock size={18} /> New Email Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email Name</label>
                <Input
                  placeholder="e.g. Weekly Stock Update"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Access Group</label>
                <Select value={form.accessGroup} onValueChange={val => setForm(prev => ({ ...prev, accessGroup: val ?? '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access group" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessGroups.map(g => (
                      <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Brand</label>
                <Select value={form.brand} onValueChange={val => setForm(prev => ({ ...prev, brand: val ?? '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Schedule</label>
                <Select value={form.schedule} onValueChange={val => setForm(prev => ({ ...prev, schedule: val ?? 'everyday' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Include Price</div>
                    <div className="text-xs text-muted-foreground">Show product prices in email</div>
                  </div>
                  <Switch
                    checked={form.includePrice}
                    onCheckedChange={v => setForm(prev => ({ ...prev, includePrice: !!v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Include Detailed</div>
                    <div className="text-xs text-muted-foreground">Show detailed item breakdown</div>
                  </div>
                  <Switch
                    checked={form.includeDetailed}
                    onCheckedChange={v => setForm(prev => ({ ...prev, includeDetailed: !!v }))}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end">
                <Button onClick={handleCreate}>
                  <Plus size={14} /> Create Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
