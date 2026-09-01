import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';

const chartConfig = {
  revenue: { label: 'Revenue', color: '#2563eb' },
  orders: { label: 'Orders', color: '#16a34a' },
};

interface MonthlyComparisonCardProps {
  data: any[];
}

export const MonthlyComparisonCard = ({ data }: MonthlyComparisonCardProps) => (
  <Card>
    <CardHeader><CardTitle>Monthly Comparison</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  </Card>
);
