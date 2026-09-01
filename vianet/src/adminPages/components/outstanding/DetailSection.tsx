import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown } from 'lucide-react';

const statusStyles: Record<string, string> = {
  due: 'bg-blue-100 text-blue-700',
  overdue: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

interface DetailSectionProps {
  title: string;
  items: any[];
  icon: React.ReactNode;
}

export function DetailSection({ title, items, icon }: DetailSectionProps) {
  const [openIds, setOpenIds] = useState<number[]>([]);
  const toggle = (id: number) => setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">{icon}{title} ({items.length})</h3>
      {items.map((item: any) => {
        const open = openIds.includes(item.id);
        return (
          <Collapsible key={item.id} open={open} onOpenChange={() => toggle(item.id)}>
            <div className="flex items-center justify-between border-b py-2.5 px-2 hover:bg-muted/30 rounded-sm cursor-pointer">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium flex-1 text-left">
                {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                {item.customer}
              </CollapsibleTrigger>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">₹{item.amount.toLocaleString()}</span>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                  {(item.status ?? '').charAt(0).toUpperCase() + (item.status ?? '').slice(1)}
                </span>
              </div>
            </div>
            <CollapsibleContent>
              <div className="ml-7 pl-3 border-l-2 border-muted">
                <div className="flex items-center justify-between py-1.5 text-xs text-muted-foreground font-medium">
                  <span>Invoice</span>
                  <span className="flex gap-4">
                    <span>Amount</span>
                    <span>Due Date</span>
                  </span>
                </div>
                {(item.subs ?? []).map((sub: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-sm text-muted-foreground border-b last:border-0">
                    <span>{sub.invoice}</span>
                    <span className="flex gap-4">
                      <span className="w-20 text-right">₹{sub.amount.toLocaleString()}</span>
                      <span className="w-24 text-right">{sub.due}</span>
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 text-sm font-medium border-t">
                  <span>Total</span>
                  <span className="flex gap-4">
                    <span className="w-20 text-right">₹{(item.subs ?? []).reduce((s: number, s2: any) => s + s2.amount, 0).toLocaleString()}</span>
                    <span className="w-24 text-right">{item.days}d overdue</span>
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
