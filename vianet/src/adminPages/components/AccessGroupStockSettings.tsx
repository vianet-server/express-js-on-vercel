import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AccessConfig {
  maxQty: number;
  allowDiscount: boolean;
  autoApprove: boolean;
  notes: string;
}

interface StockAccessSettingsProps {
  groupName: string;
  stockName: string;
  config: AccessConfig;
  onSave: (config: AccessConfig) => void;
}

export function AccessGroupStockSettings({ groupName, stockName, config, onSave }: StockAccessSettingsProps) {
  const [local, setLocal] = useState<AccessConfig>(config);

  const save = () => { onSave(local); };

  return (
    <Card>
      <CardHeader><CardTitle>Access Settings — {groupName} on {stockName}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Quantity Limit</label>
            <Input type="number" value={local.maxQty} onChange={e => setLocal(p => ({ ...p, maxQty: Number(e.target.value) }))} className="text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Price Override (₹)</label>
            <Input type="number" value={local.allowDiscount ? 0 : 0} onChange={() => {}} className="text-sm" placeholder="Leave blank to use default" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Input value={local.notes} onChange={e => setLocal(p => ({ ...p, notes: e.target.value }))} className="text-sm" placeholder="Optional notes" />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={local.allowDiscount} onChange={e => setLocal(p => ({ ...p, allowDiscount: e.target.checked }))} className="accent-blue-600" />
            Allow Discount
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={local.autoApprove} onChange={e => setLocal(p => ({ ...p, autoApprove: e.target.checked }))} className="accent-blue-600" />
            Auto Approve Orders
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save}>Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}
