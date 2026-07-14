import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldOff } from 'lucide-react';

interface AccessItem {
  group: string;
  qty: number;
  price: number;
}

interface ComparisonTableProps {
  items: AccessItem[];
  currentGroup: string;
  productName: string;
  onGroupClick: (group: string) => void;
}

export function AccessGroupComparisonTable({ items, currentGroup, productName, onGroupClick }: ComparisonTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground border-b">
        <div className="col-span-3">Group</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">Value</div>
        <div className="col-span-3">Status</div>
      </div>
      {items.map(a => {
        const acc = a.qty > 0;
        return (
          <div
            key={a.group}
            className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b last:border-0 items-center cursor-pointer transition-colors ${
              a.group === currentGroup ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/50'
            } ${!acc ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
            onClick={() => onGroupClick(a.group)}
          >
            <div className="col-span-3 font-medium flex items-center gap-1.5">
              {acc ? <ShieldCheck size={14} className="text-green-600" /> : <ShieldOff size={14} className="text-amber-600" />}
              {a.group}
              {a.group === currentGroup && <Badge variant="outline" className="text-[9px] ml-1">Current</Badge>}
            </div>
            <div className="col-span-2 text-right">{acc ? a.qty : '-'}</div>
            <div className="col-span-2 text-right">{acc ? `₹${a.price.toLocaleString()}` : '-'}</div>
            <div className="col-span-2 text-right">{acc ? `₹${(a.qty * a.price).toLocaleString()}` : '-'}</div>
            <div className="col-span-3">
              <Badge variant={acc ? 'default' : 'secondary'} className="text-[10px]">{acc ? 'Granted' : 'Blocked'}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
