import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Shield, Building2, MapPin, Globe, Clock, Palette, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex items-center gap-2 w-40 shrink-0">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

export function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/settings/profile').then(setProfile).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  const user = profile?.user || {};
  const business = profile?.business || {};
  const preferences = profile?.preferences || {};
  const initials = (user.name || '').split(' ').map((n: string) => n[0]).join('');

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </div>
            <span>{user.name}</span>
            <Badge variant="secondary">{user.role}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRow icon={<Mail size={15} />} label="Email" value={user.email || ''} />
          <FieldRow icon={<Phone size={15} />} label="Phone" value={user.phone || ''} />
          <FieldRow icon={<Shield size={15} />} label="Role" value={user.role || ''} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={18} />
            Business Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRow icon={<Building2 size={15} />} label="Business Name" value={business.name || ''} />
          <FieldRow icon={<MapPin size={15} />} label="GSTIN" value={business.gstin || ''} />
          <FieldRow icon={<MapPin size={15} />} label="PAN" value={business.pan || ''} />
          <FieldRow icon={<MapPin size={15} />} label="Address" value={business.address || ''} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={18} />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldRow icon={<Globe size={15} />} label="Language" value={preferences.language || ''} />
          <FieldRow icon={<DollarSign size={15} />} label="Currency" value={preferences.currency || ''} />
          <FieldRow icon={<Clock size={15} />} label="Timezone" value={preferences.timezone || ''} />
          <FieldRow icon={<Calendar size={15} />} label="Date Format" value={preferences.dateFormat || ''} />
        </CardContent>
      </Card>
    </div>
  );
}
