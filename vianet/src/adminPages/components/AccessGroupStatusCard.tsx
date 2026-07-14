import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ShieldOff } from 'lucide-react';

interface StatusCardProps {
  hasAccess: boolean;
}

export function AccessGroupStatusCard({ hasAccess }: StatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Access Status</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-2">
          {hasAccess ? (
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck size={32} className="text-green-700" />
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
              <ShieldOff size={32} className="text-amber-700" />
            </div>
          )}
          <span className={hasAccess ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
            {hasAccess ? 'Full Access' : 'No Access'}
          </span>
          <span className="text-xs text-muted-foreground text-center">
            {hasAccess
              ? 'This group can view and manage this stock item.'
              : 'This group has been blocked from accessing this stock item.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
