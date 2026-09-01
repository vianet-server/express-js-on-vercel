import { formatIndianCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';

interface SummaryCardsProps {
  totalSales: number;
  totalPayments: number;
  totalExpenses: number;
  netCash: number;
}

export function SummaryCards({ totalSales, totalPayments, totalExpenses, netCash }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingUp size={14} /> Total Sales</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-green-600">{formatIndianCurrency(totalSales)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Receipt size={14} /> Total Payments</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-blue-600">{formatIndianCurrency(totalPayments)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingDown size={14} /> Total Expenses</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-red-600">{formatIndianCurrency(totalExpenses)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><DollarSign size={14} /> Net Cash Flow</CardTitle></CardHeader>
        <CardContent><div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatIndianCurrency(netCash)}</div></CardContent>
      </Card>
    </div>
  );
}
