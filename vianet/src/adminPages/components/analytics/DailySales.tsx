import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';

const chartConfig = {
  revenue: { label: 'Revenue', color: '#2563eb' },
  orders: { label: 'Orders', color: '#16a34a' },
};

interface DailySalesCardProps {
  data: any[];
}

export const DailySalesCard = ({ data }: DailySalesCardProps) => (
  <Card className="lg:w-1/4">
    <CardHeader><CardTitle>Daily Sales</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-80 w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="sales" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
    </CardContent>
  </Card>
);
