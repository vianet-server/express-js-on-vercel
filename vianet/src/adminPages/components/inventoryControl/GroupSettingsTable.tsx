import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Hash } from 'lucide-react';

interface GroupSettingsTableProps {
  grpSettings: any[];
  categories: any[];
  onToggleGroup: (group: string) => void;
}

export function GroupSettingsTable({ grpSettings, categories, onToggleGroup }: GroupSettingsTableProps) {
  return (
    <>
      <Card>
        <CardHeader><CardTitle>Access Group Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col">
            {grpSettings.map((g, i) => (
              <div key={g.group} className={`flex items-center justify-between py-3 ${i < grpSettings.length - 1 ? 'border-b' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${g.active ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>
                    <Users size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{g.group}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Hash size={10} /> Max Qty: <span className="font-medium">{(g.maxQty ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={g.allowDiscount ? 'default' : 'secondary'} className="text-[10px]">{g.allowDiscount ? 'Discount Allowed' : 'No Discount'}</Badge>
                  <Badge variant={g.autoApprove ? 'default' : 'outline'} className="text-[10px]">{g.autoApprove ? 'Auto Approve' : 'Manual'}</Badge>
                  <Button
                    variant={g.active ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onToggleGroup(g.group)}
                    className="gap-1.5 text-xs"
                  >
                    {g.active ? 'Active' : 'Disabled'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Stock Access Limits per Group</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Access Group</th>
                  <th className="pb-2 font-medium">Accessible Stocks</th>
                  <th className="pb-2 font-medium text-right">Max Qty Allowed</th>
                  <th className="pb-2 font-medium">Restrictions</th>
                </tr>
              </thead>
              <tbody>
                {grpSettings.map((g) => {
                  const restrictions: string[] = [];
                  if (!g.allowDiscount) restrictions.push('No Discount');
                  if (!g.autoApprove) restrictions.push('Manual Approval');
                  if (!g.active) restrictions.push('Disabled');
                  return (
                    <tr key={g.group} className="border-b last:border-0">
                      <td className="py-2.5 font-medium flex items-center gap-2">
                        <div className={`flex size-7 items-center justify-center rounded-md ${g.active ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}><Users size={13} /></div>
                        {g.group}
                      </td>
                       <td className="py-2.5 text-muted-foreground">{(g.accessibleStockCount ?? 0)} of {(categories ?? []).length} categories</td>
                      <td className="py-2.5 text-right font-medium">{(g.maxQty ?? 0).toLocaleString()} units</td>
                      <td className="py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {restrictions.length > 0 ? restrictions.map(r => (
                            <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                          )) : <Badge variant="outline" className="text-[10px]">No Restrictions</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
