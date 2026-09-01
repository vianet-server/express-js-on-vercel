import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';

const chartConfig = {
  revenue: { label: 'Revenue', color: '#2563eb' },
  orders: { label: 'Orders', color: '#16a34a' },
};

interface SalesByRegionCardProps {
  data: any[];
}

export const SalesByRegionCard = ({ data }: SalesByRegionCardProps) => (
  <Card>
    <CardHeader><CardTitle>Sales by Region</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="sales" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  </Card>
);
