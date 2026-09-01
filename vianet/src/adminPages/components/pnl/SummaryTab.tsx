import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';

interface SummaryRowProps {
  item: any;
}

export function SummaryRow({ item }: SummaryRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 font-medium">{item.label}</td>
      <td className="py-2.5 text-right pr-6">{formatIndianCurrency(item.amount)}</td>
      <td className="py-2.5 pl-6">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {(item.type ?? '').charAt(0).toUpperCase() + (item.type ?? '').slice(1)}
        </span>
      </td>
    </tr>
  );
}

interface SummaryTabProps {
  data: any[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export function SummaryTab({ data, totalIncome, totalExpenses, netProfit }: SummaryTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600 flex items-center gap-1"><TrendingUp size={18} /> {formatIndianCurrency(totalIncome)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600 flex items-center gap-1"><TrendingDown size={18} /> {formatIndianCurrency(totalExpenses)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatIndianCurrency(netProfit)}</div></CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>P&L Overview</CardTitle></CardHeader>
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
                    No P&L data found. Please run your Tally sync tool and ensure it exports the P&L statement.
                  </td>
                </tr>
              ) : (
                data.map((item: any, i: number) => <SummaryRow key={i} item={item} />)
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}