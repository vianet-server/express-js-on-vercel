import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  income: { label: 'Income', color: '#16a34a' },
  expense: { label: 'Expense', color: '#ef4444' },
  net: { label: 'Net', color: '#2563eb' },
};

interface DailyChartProps {
  dailyTotals: { day: string; income: number; expense: number }[];
}

export function DailyChart({ dailyTotals }: DailyChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Daily Income vs Expense</CardTitle></CardHeader>
      <CardContent>
        {dailyTotals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No daily data available</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={dailyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
