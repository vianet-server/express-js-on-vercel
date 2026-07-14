import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, HardDrive, Download, RefreshCw, Wrench, UserPlus, Server, Clock, Calendar, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function ControlRow({ icon, label, enabled }: { icon: React.ReactNode; label: string; enabled: boolean }) {
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

export function SettingsControl() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/admin/settings/controls').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings Control</h1>
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  const accessRoles = data?.accessRoles || [];
  const systemControls = data?.systemControls || [];
  const backupInfo = data?.backupInfo || {};

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings Control</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Access Control
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pt-3 px-4 font-medium">Role</th>
                <th className="pb-2 pt-3 px-4 font-medium text-right">Users Count</th>
                <th className="pb-2 pt-3 px-4 font-medium">Permissions</th>
                <th className="pb-2 pt-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {accessRoles.map((r: any) => (
                <tr key={r.role} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{r.role}</td>
                  <td className="py-3 px-4 text-right">{r.users}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.permissions}</td>
                  <td className="py-3 px-4">
                    <Badge variant={r.status === 'Active' ? 'default' : 'secondary'}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench size={18} />
            System Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemControls.map((c: any) => (
            <ControlRow
              key={c.label}
              icon={c.label === 'Maintenance Mode' ? <Server size={15} /> : c.label === 'Debug Mode' ? <Wrench size={15} /> : c.label === 'Allow Registration' ? <UserPlus size={15} /> : <HardDrive size={15} />}
              label={c.label}
              enabled={c.enabled}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive size={18} />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-3 border-b">
              <Clock size={15} className="text-muted-foreground" />
              <span className="text-sm font-medium w-44">Last Backup</span>
              <span className="text-sm text-muted-foreground">{backupInfo.lastBackup || ''}</span>
            </div>
            <div className="flex items-center gap-3 py-3 border-b">
              <Calendar size={15} className="text-muted-foreground" />
              <span className="text-sm font-medium w-44">Next Scheduled</span>
              <span className="text-sm text-muted-foreground">{backupInfo.nextScheduled || ''}</span>
            </div>
            <div className="flex items-center gap-3 py-3 border-b">
              <Server size={15} className="text-muted-foreground" />
              <span className="text-sm font-medium w-44">Backup Size</span>
              <span className="text-sm text-muted-foreground">{backupInfo.backupSize || ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-2">
            <Button size="sm" className="gap-1.5">
              <Download size={14} /> Backup Now
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5">
              <RefreshCw size={14} /> Restore
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
