import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fmt = (v: any) => (v != null ? Number(v).toLocaleString('en-IN') : 'N/A');
const pct = (v: any, pos = true) =>
  v != null ? `${pos && Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}% vs last period` : '';

interface BasicStatsCardsProps {
  stats: any;
}

export const BasicStatsCards = ({ stats }: BasicStatsCardsProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹{fmt(stats.totalRevenue)}</div>
        <div className={`text-xs mt-1 ${(stats.revenueChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct(stats.revenueChange)}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{fmt(stats.totalOrders)}</div>
        <div className={`text-xs mt-1 ${(stats.ordersChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct(stats.ordersChange)}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹{stats.avgOrderValue != null ? Number(stats.avgOrderValue).toFixed(2) : 'N/A'}</div>
        <div className={`text-xs mt-1 ${(stats.avgOrderValueChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct(stats.avgOrderValueChange)}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.conversionRate != null ? `${Number(stats.conversionRate).toFixed(2)}%` : 'N/A'}</div>
        <div className={`text-xs mt-1 ${(stats.conversionRateChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct(stats.conversionRateChange)}</div>
      </CardContent>
    </Card>
  </div>
);
