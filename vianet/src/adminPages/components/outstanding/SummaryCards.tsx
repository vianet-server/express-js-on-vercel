import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatItem {
  title: string;
  value: string | number;
  color?: string;
}

interface SummaryCardsProps {
  stats: StatItem[];
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${s.color ?? ''}`}>{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}