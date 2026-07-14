import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface AccessGroupHeaderProps {
  groupName: string;
  hasAccess: boolean;
  onBack: () => void;
}

export function AccessGroupHeader({ groupName, hasAccess, onBack }: AccessGroupHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /></Button>
        <h1 className="text-3xl font-bold tracking-tight">{groupName}</h1>
        <Badge variant={hasAccess ? 'default' : 'secondary'}>
          {hasAccess ? 'Access Granted' : 'Blocked'}
        </Badge>
      </div>
    </div>
  );
}
