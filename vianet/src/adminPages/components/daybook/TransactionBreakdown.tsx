import { formatIndianCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TransactionBreakdownProps {
  transactionsData: any[];
  typeColors: Record<string, string>;
}

export function TransactionBreakdown({ transactionsData, typeColors }: TransactionBreakdownProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Transaction Breakdown</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {Object.entries(typeColors).map(([type, color]) => {
            const total = transactionsData.filter((t: any) => t.type === type).reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
            const count = transactionsData.filter((t: any) => t.type === type).length;
            const grandTotal = transactionsData.reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
            const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{type}</span>
                  <span className="text-xs text-muted-foreground">({count} entries)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color.match(/text-\w+-\d+/)?.[0]?.replace('text', 'bg') ? undefined : '#888' }} />
                  </div>
                  <span className="text-sm font-medium w-24 text-right">{formatIndianCurrency(total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
