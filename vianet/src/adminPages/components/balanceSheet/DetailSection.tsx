import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface DetailSectionProps {
  title: string;
  items: any[];
  typeColor: string;
}

export function DetailSection({ title, items, typeColor }: DetailSectionProps) {
  const [openIds, setOpenIds] = useState<number[]>([]);

  const toggle = (id: number) => {
    setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className={`size-3 rounded-full inline-block ${typeColor}`} />
        {title}
      </h3>
      {items.map((item: any) => {
        const open = openIds.includes(item.id);
        return (
          <Collapsible key={item.id} open={open} onOpenChange={() => toggle(item.id)}>
            <div className="flex items-center justify-between border-b py-2.5 px-2 hover:bg-muted/30 rounded-sm cursor-pointer">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium flex-1 text-left">
                {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                {item.label}
              </CollapsibleTrigger>
              <span className="text-sm font-medium">₹{item.amount.toLocaleString()}</span>
            </div>
            <CollapsibleContent>
              <div className="ml-7 pl-3 border-l-2 border-muted">
                {(item.subs ?? []).map((sub: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm text-muted-foreground border-b last:border-0">
                    <span>{sub.label}</span>
                    <span>₹{sub.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 text-sm font-medium border-t">
                  <span>Total</span>
                  <span>₹{(item.subs ?? []).reduce((s: number, s2: any) => s + s2.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
