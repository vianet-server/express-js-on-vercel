import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';

interface SummaryTableProps {
  data: any[];
  ageFilter: string;
  ageBuckets: { label: string; min: number; max: number }[];
}

export function SummaryTable({ data, ageFilter, ageBuckets }: SummaryTableProps) {
  const displayData = (ageFilter === 'all' ? data : data.filter((i: any) => {
    const b = ageBuckets.find(bk => bk.label === ageFilter);
    return b ? (i.days > b.min && i.days <= b.max) : true;
  })).slice(0, 5);

  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>Outstanding Overview</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Customer</th>
              <th className="pb-2 font-medium text-right">Amount</th>
              <th className="pb-2 font-medium text-right">Days</th>
              <th className="pb-2 font-medium">Due Date</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((item: any, i: number) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2.5 font-medium">{item.customer}</td>
                <td className="py-2.5 text-right">₹{item.amount.toLocaleString()}</td>
                <td className="py-2.5 text-right">{item.days}d</td>
                <td className="py-2.5">{item.date}</td>
                <td className="py-2.5">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}