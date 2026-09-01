import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Brain } from 'lucide-react';
import { AreaChart, CartesianGrid, XAxis, YAxis, Area, Line } from 'recharts';

const forecastData = [
  { month: 'Jan', actual: 42000, predicted: 41500, upper: 44000, lower: 39000 },
  { month: 'Feb', actual: 38000, predicted: 38500, upper: 41000, lower: 36000 },
  { month: 'Mar', actual: 51000, predicted: 49500, upper: 53000, lower: 46000 },
  { month: 'Apr', actual: 46000, predicted: 47000, upper: 50000, lower: 44000 },
  { month: 'May', actual: 54000, predicted: 53000, upper: 57000, lower: 49000 },
  { month: 'Jun', actual: 48000, predicted: 47500, upper: 51000, lower: 44000 },
  { month: 'Jul', actual: 62000, predicted: 61000, upper: 65000, lower: 57000 },
  { month: 'Aug', actual: 58000, predicted: null, upper: null, lower: null },
  { month: 'Sep', predicted: 63000, upper: 67000, lower: 59000 },
  { month: 'Oct', predicted: 67000, upper: 71000, lower: 63000 },
  { month: 'Nov', predicted: 72000, upper: 76000, lower: 68000 },
  { month: 'Dec', predicted: 78000, upper: 82000, lower: 74000 },
];

export const DeepLearningForecastCard = () => (
  <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><Brain size={16} /> Deep Learning Forecast — Revenue Prediction</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={{ actual: { label: 'Actual', color: '#2563eb' }, predicted: { label: 'Predicted', color: '#16a34a' }, upper: { label: 'Upper Bound', color: '#86efac' }, lower: { label: 'Lower Bound', color: '#fecaca' } }} className="h-80 w-full">
        <AreaChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="upper" stroke="none" fill="var(--color-upper)" fillOpacity={0.2} />
          <Area type="monotone" dataKey="lower" stroke="none" fill="var(--color-lower)" fillOpacity={0.2} />
          <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line type="monotone" dataKey="predicted" stroke="var(--color-predicted)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
        </AreaChart>
      </ChartContainer>
    </CardContent>
  </Card>
);
