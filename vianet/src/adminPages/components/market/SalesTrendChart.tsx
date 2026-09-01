import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesTrendChartProps {
  trend: any[];
}

export function SalesTrendChart({ trend }: SalesTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp size={16} /> Sales Trend — Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        {trend.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No trend data available</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return d.getDate() + '/' + (d.getMonth() + 1);
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => '₹' + (v / 1000).toFixed(0) + 'K'} />
                <Tooltip
                  formatter={(value: any) => ['₹' + Number(value).toLocaleString('en-IN'), 'Sales']}
                  labelFormatter={(label: any) => new Date(label).toLocaleDateString('en-IN')}
                />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-lg font-bold">₹{trend.reduce((s: number, d: any) => s + (d.sales ?? 0), 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-lg font-bold">{trend.reduce((s: number, d: any) => s + (d.orders ?? 0), 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Daily Sales</p>
            <p className="text-lg font-bold">₹{trend.length > 0 ? Math.round(trend.reduce((s: number, d: any) => s + (d.sales ?? 0), 0) / trend.length).toLocaleString('en-IN') : '0'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
