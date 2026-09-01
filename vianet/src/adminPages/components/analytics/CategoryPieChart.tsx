import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

interface CategoryPieChartCardProps {
  data: any[];
}

export const CategoryPieChartCard = ({ data }: CategoryPieChartCardProps) => (
  <Card className="lg:w-1/4">
    <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={{}} className="h-64 w-full">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-1.5 mt-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {item.name}
            </div>
            <span className="font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
