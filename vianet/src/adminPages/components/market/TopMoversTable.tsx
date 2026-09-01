import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface TopMoversTableProps {
  topMovers: any[];
}

export function TopMoversTable({ topMovers }: TopMoversTableProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package size={16} /> Top Movers</CardTitle>
      </CardHeader>
      <CardContent>
        {topMovers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No top movers data available</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium text-right">Avg Price</th>
                <th className="pb-2 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {topMovers.map((m: any, i: number) => (
                <tr key={m.rank ?? i} className="border-b last:border-0">
                  <td className="py-2.5 text-muted-foreground">{m.rank ?? i + 1}</td>
                  <td className="py-2.5 font-medium">{m.product ?? m.name}</td>
                  <td className="py-2.5 text-right font-mono">₹{(m.price ?? 0).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 text-right font-mono">₹{Math.round(m.total_value ?? 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
