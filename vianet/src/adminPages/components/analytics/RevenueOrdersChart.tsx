import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';

const chartConfig = {
  revenue: { label: 'Revenue', color: '#2563eb' },
  orders: { label: 'Orders', color: '#16a34a' },
};

interface RevenueOrdersChartCardProps {
  data: any[];
}

export const RevenueOrdersChartCard = ({ data }: RevenueOrdersChartCardProps) => (
  <Card className="flex-1 lg:w-3/4">
    <CardHeader><CardTitle>Revenue & Orders Trend</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-80 w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
    </CardContent>
  </Card>
);
