import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TypeBadgeProps {
  type: string;
}

function TypeBadge({ type }: TypeBadgeProps) {
  const colors: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-700',
    liability: 'bg-amber-100 text-amber-700',
    equity: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] ?? ''}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

interface SummaryRowProps {
  item: any;
}

function SummaryRow({ item }: SummaryRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 font-medium">{item.label}</td>
      <td className="py-2.5 text-right pr-6">₹{item.amount.toLocaleString()}</td>
      <td className="py-2.5 pl-6">
        <TypeBadge type={item.type} />
      </td>
    </tr>
  );
}

interface SummaryTableProps {
  data: any[];
}

export function SummaryTable({ data }: SummaryTableProps) {
  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>Balance Overview</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium w-1/2">Item</th>
              <th className="pb-2 font-medium text-right pr-6 w-1/4">Amount</th>
              <th className="pb-2 font-medium pl-6 w-1/4">Type</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  No balance sheet data found. Please run your Tally sync tool and ensure it exports the Balance Sheet.
                </td>
              </tr>
            ) : (
              data.map((item: any, i: number) => <SummaryRow key={i} item={item} />)
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}