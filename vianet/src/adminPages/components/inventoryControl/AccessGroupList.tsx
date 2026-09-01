import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Users, Trash2 } from 'lucide-react';

interface AccessGroupListProps {
  groups: any[];
  onDetail: (g: any) => void;
  onNavigate: (name: string) => void;
  onDelete: (g: any) => void;
}

export function AccessGroupList({ groups, onDetail, onNavigate, onDelete }: AccessGroupListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acccess Groups <Pencil /> </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {(groups ?? []).map((g, i) => (
            <div key={g.id} className={`flex items-center justify-between py-3 ${i < (groups ?? []).length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-start gap-3 cursor-pointer" onClick={() => onDetail(g)}>
                <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium hover:underline">{g.name}</div>
                  {g.group_key && <div className="text-xs text-muted-foreground">Key: {g.group_key}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-[10px]">Active</Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onNavigate(g.name)}>Stocks</Button>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600" onClick={() => onDelete(g)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
