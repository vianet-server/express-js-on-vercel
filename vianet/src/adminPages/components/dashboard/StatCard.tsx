import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  variant?: 'positive' | 'negative' | 'neutral';
  children?: React.ReactNode;
}

export function StatCard({ title, value, change, changeLabel, icon, variant = 'neutral', children }: StatCardProps) {
  const changeClass = variant === 'positive' ? 'text-green-600' : variant === 'negative' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? `₹${value.toLocaleString()}` : value}</div>
        {change !== 0 && (
          <div className={`text-xs mt-1 ${changeClass}`}>
            {change > 0 ? '+' : ''}{change}% {changeLabel}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}