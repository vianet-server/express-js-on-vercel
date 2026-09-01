import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Loader2 } from 'lucide-react';

interface UsageCardsProps {
  usage: any;
  activeKeyCount: number;
}

export function UsageCards({ usage, activeKeyCount }: UsageCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={16} /> Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <p className="text-2xl font-bold">{activeKeyCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Quota Remaining</p>
            <p className="text-2xl font-bold text-amber-600">{(usage?.quotaRemaining ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
