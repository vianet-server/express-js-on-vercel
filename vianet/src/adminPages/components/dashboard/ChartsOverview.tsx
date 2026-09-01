import { BarChart, Bar, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export interface ChartOverviewProps {
  chartData: { month: string; sales: number; profit: number }[];
  pieData: { name: string; value: number }[];
  pieColors: string[];
}

export function ChartsOverview({ chartData, pieData, pieColors }: ChartOverviewProps) {
  const pieTotal = pieData.reduce((s, i) => s + i.value, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="lg:w-3/4">
        <Card>
          <CardHeader><CardTitle>Sales & Profit Overview</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer className="h-80 w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="profit" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="lg:w-1/4">
        <Card>
          <CardHeader><CardTitle>Product Share</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer className="h-80 w-full">
              <PieChart>
                <Pie cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    {item.name}
                  </div>
                  <span className="font-medium">{pieTotal > 0 ? ((item.value / pieTotal) * 100).toFixed(1) : '0'}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}