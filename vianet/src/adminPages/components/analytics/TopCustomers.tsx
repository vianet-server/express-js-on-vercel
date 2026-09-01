import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopCustomersCardProps {
  data: any[];
}

export const TopCustomersCard = ({ data }: TopCustomersCardProps) => (
  <Card className="flex-1 lg:w-3/4">
    <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
    <CardContent>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium text-right">Orders</th>
            <th className="pb-2 font-medium text-right">Total Spent</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.rank} className="border-b last:border-0">
              <td className="py-2.5">{c.rank}</td>
              <td className="py-2.5 font-medium">{c.name}</td>
              <td className="py-2.5 text-right">{c.orders}</td>
              <td className="py-2.5 text-right tabular-nums">₹{Math.round(Number(c.spent ?? 0)).toLocaleString('en-IN')}</td>
              <td className="py-2.5">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'VIP' ? 'bg-blue-100 text-blue-700' : c.status === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);
