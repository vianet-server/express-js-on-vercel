import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface PrivilegesCardProps {
  privileges: string[];
  allPermissions?: string[];
}

export function AccessGroupPrivilegesCard({ privileges, allPermissions }: PrivilegesCardProps) {
  const perms = allPermissions ?? ['view', 'edit', 'approve', 'configure', 'export'];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Privileges</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {perms.map(p => (
            <div key={p} className="flex items-center justify-between text-sm">
              <span className="capitalize text-muted-foreground">{p}</span>
              {privileges.includes(p)
                ? <CheckCircle size={16} className="text-green-600" />
                : <div className="size-4 rounded-full border-2 border-muted-foreground/30" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
