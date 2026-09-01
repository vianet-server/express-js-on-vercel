import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatIndianCurrency } from '@/lib/utils';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ArrowUpRight, ArrowDownRight, FileDown, FileSpreadsheet, Settings, Eye, Calendar, Loader2 } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { useAdminQuery } from '@/hooks/useAdminQuery';
import { DateFilter } from './DateFilter';
import { StatCard } from './StatCard';
import { ChartsOverview } from './ChartsOverview';

const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartConfig = {
  sales: { label: 'Sales', color: '#2563eb' },
  profit: { label: 'Profit', color: '#16a34a' },
};

const defaultStats = {
  todaySale: 0,
  saleChangePercent: 0,
  totalProfit: 0,
  profitChangePercent: 0,
  totalSpend: 0,
  spendChangePercent: 0,
  topSalesman: null as { name: string; amount: number } | null,
  totalOrders: 0,
};

export function Dashboard() {
  const [activePeriod, setActivePeriod] = useState('Today');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: statsRaw } = useAdminQuery<typeof defaultStats>('dashboard-stats', '/api/admin/dashboard/stats');
  const { data: topSalesmenRaw } = useAdminQuery<{ name: string; sales: number }[]>('dashboard-top-salesmen', '/api/admin/dashboard/top-salesmen');
  const { data: chartDataRaw } = useAdminQuery<{ month: string; sales: number; profit: number }[]>('dashboard-monthly-trend', '/api/admin/dashboard/monthly-trend');
  const { data: pieDataRaw } = useAdminQuery<{ name: string; value: number }[]>('dashboard-product-share', '/api/admin/dashboard/product-share');

  const stats = statsRaw ?? defaultStats;
  const topSalesmen = topSalesmenRaw ?? [];
  const chartData = chartDataRaw ?? [];
  const pieData = pieDataRaw ?? [];
  const pieTotal = useMemo(() => pieData.reduce((s, i) => s + i.value, 0), [pieData]);
  const loading = !statsRaw;

  const handleCustomApply = useCallback(() => {
    if (dateFrom && dateTo) {
      setActivePeriod(`${dateFrom} — ${dateTo}`);
      setShowDateRange(false);
    }
  }, [dateFrom, dateTo]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-svh">
      <Loader2 size={32} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <DateFilter
        activePeriod={activePeriod}
        setActivePeriod={setActivePeriod}
        showDateRange={showDateRange}
        setShowDateRange={setShowDateRange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        handleCustomApply={handleCustomApply}
      />

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="sales">Sales & Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="executive" className="flex flex-col gap-6 mt-0">
          <ChartsOverview
            chartData={chartData}
            pieData={pieData}
            pieColors={pieColors}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Today's Sale"
              value={stats.todaySale ?? 0}
              change={stats.saleChangePercent}
              changeLabel="+{stats.saleChangePercent}% vs yesterday"
              icon={<ArrowUpRight size={14} />}
              variant="positive"
            />

            <StatCard
              title="Total Profit"
              value={stats.totalProfit ?? 0}
              change={stats.profitChangePercent}
              changeLabel="+{stats.profitChangePercent}% vs last month"
              icon={<ArrowUpRight size={14} />}
              variant="positive"
            />

            <StatCard
              title="Top Salesmen"
              value={topSalesmen.length}
              change={0}
              changeLabel=""
              icon={<FileSpreadsheet size={14} />}
              variant="neutral"
            >
              {topSalesmen.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm text-muted-foreground">{(s.name ?? '').split(' ')[0]}</span>
                  </div>
                  <span className="text-sm font-medium">{formatIndianCurrency(s.sales ?? 0)}</span>
                </div>
              ))}
            </StatCard>

            <StatCard
              title="Total Spend"
              value={stats.totalSpend ?? 0}
              change={stats.spendChangePercent}
              changeLabel="{stats.spendChangePercent}% vs last month"
              icon={<ArrowDownRight size={14} />}
              variant="negative"
            />
          </div>
        </TabsContent>
        <TabsContent value="sales" className="flex flex-col gap-6 mt-0">
          <Card>
            <CardHeader><CardTitle>Sales Leaderboard & Trends</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">More detailed sales metrics, territory tracking, and target vs achievement will be populated here.</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="flex flex-col gap-6 mt-0">
          <Card>
            <CardHeader><CardTitle>Inventory Health & Ageing</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Detailed warehouse stock, fast/slow moving items, and reorder alerts will be populated here.</div>
            </CardContent>
          </Card>
        </Tabs>
      </Tabs>
    </div>
  );
}