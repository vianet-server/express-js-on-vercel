import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function Sync() {
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    api.get('/admin/settings/sync').then(setSyncHistory).catch(console.error).finally(() => setLoading(false));
  }, []);

  const lastSync = syncHistory.length > 0 ? syncHistory[0] : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sync</h1>
        <Button size="sm">
          <RefreshCw size={14} className="mr-1" /> Sync Now
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw size={16} /> Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
            ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-lg font-semibold">{lastSync?.date || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={lastSync?.status === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                  {lastSync?.status === 'success' ? <><CheckCircle size={12} className="mr-1" /> Success</> : <><XCircle size={12} className="mr-1" /> Failed</>}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Items Synced</p>
                <p className="text-lg font-semibold">{lastSync?.items?.toLocaleString() || '0'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Failed Items</p>
                <p className="text-lg font-semibold text-red-600">0</p>
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={16} /> Scheduled Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="text-lg font-semibold">Daily</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Next Scheduled</p>
              <p className="text-lg font-semibold">2026-07-04 08:00 AM</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Auto Sync</p>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSync ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                    autoSync ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Items</th>
                <th className="pb-2 font-medium text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {syncHistory.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2.5">{row.date}</td>
                  <td className="py-2.5 font-medium">{row.type}</td>
                  <td className="py-2.5">
                    <Badge
                      className={
                        row.status === 'success'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                      }
                    >
                      {row.status === 'success' ? (
                        <CheckCircle size={12} className="mr-1" />
                      ) : (
                        <XCircle size={12} className="mr-1" />
                      )}
                      {row.status === 'success' ? 'Success' : 'Failed'}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-right">{row.items?.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-mono">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
