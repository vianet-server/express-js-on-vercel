import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Globe, Bell, Shield, Clock, History, Lock, Smartphone, FileText, KeyRound, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex items-center gap-2 w-44 shrink-0">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

function ToggleRow({ icon, label, enabled }: { icon: React.ReactNode; label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
    </div>
  );
}

function SecurityRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex items-center gap-2 w-44 shrink-0">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

export function Settings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/settings/settings').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  const general = data?.general || {};
  const notifications = data?.notifications || [];
  const security = data?.security || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={18} />
            General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow icon={<Building2 size={15} />} label="Company Name" value={general.companyName || ''} />
          <InfoRow icon={<Mail size={15} />} label="Email" value={general.email || ''} />
          <InfoRow icon={<Phone size={15} />} label="Phone" value={general.phone || ''} />
          <InfoRow icon={<MapPin size={15} />} label="Address" value={general.address || ''} />
          <InfoRow icon={<Globe size={15} />} label="Website" value={general.website || ''} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={18} />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.map((n: any) => (
            <ToggleRow
              key={n.label}
              icon={n.label === 'Email Alerts' ? <Mail size={15} /> : n.label === 'SMS Alerts' ? <Smartphone size={15} /> : n.label === 'Push Notifications' ? <Bell size={15} /> : <FileText size={15} />}
              label={n.label}
              enabled={n.enabled}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={18} />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          {security.map((s: any) => (
            <SecurityRow
              key={s.label}
              icon={s.label === 'Last Password Change' ? <KeyRound size={15} /> : s.label === 'Two-Factor Auth' ? <Lock size={15} /> : s.label === 'Session Timeout' ? <Clock size={15} /> : <History size={15} />}
              label={s.label}
              value={s.value}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
