import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';

interface OrdersByChannelCardProps {
  data: any[];
}

export const OrdersByChannelCard = ({ data }: OrdersByChannelCardProps) => (
  <Card>
    <CardHeader><CardTitle>Orders by Channel</CardTitle></CardHeader>
    <CardContent>
      <ChartContainer config={{ direct: { label: 'Direct', color: '#2563eb' }, online: { label: 'Online', color: '#16a34a' }, phone: { label: 'Phone', color: '#f59e0b' } }} className="h-72 w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="direct" stroke="var(--color-direct)" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="online" stroke="var(--color-online)" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="phone" stroke="var(--color-phone)" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ChartContainer>
    </CardContent>
  </Card>
);
