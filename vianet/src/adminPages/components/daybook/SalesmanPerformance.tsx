import { formatIndianCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesmanPerformanceProps {
  transactionsData: any[];
}

export function SalesmanPerformance({ transactionsData }: SalesmanPerformanceProps) {
  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>Salesman Performance</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Salesman</th>
              <th className="pb-2 font-medium text-right">Transactions</th>
              <th className="pb-2 font-medium text-right">Total Sales</th>
              <th className="pb-2 font-medium text-right">Avg/Trans</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              transactionsData.filter((t: any) => t.type === 'Sale').reduce((acc: any, t: any) => {
                acc[t.salesman] = acc[t.salesman] || { count: 0, total: 0 };
                acc[t.salesman].count++;
                acc[t.salesman].total += t.amount ?? 0;
                return acc;
              }, {} as Record<string, { count: number; total: number }>)
            ).map(([name, data]: [string, any], i: number) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2.5 font-medium">{name || '-'}</td>
                <td className="py-2.5 text-right">{data.count}</td>
                <td className="py-2.5 text-right">{formatIndianCurrency(data.total)}</td>
                <td className="py-2.5 text-right">{formatIndianCurrency(Math.round(data.total / data.count))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
