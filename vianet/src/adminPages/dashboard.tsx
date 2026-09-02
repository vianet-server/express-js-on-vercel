import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatIndianCurrency } from '@/lib/utils';
import { useState, useCallback, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ArrowUpRight, ArrowDownRight, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Bar, BarChart, XAxis, CartesianGrid } from 'recharts';
import { useAdminQuery } from '@/hooks/useAdminQuery';

const DateFilter = lazy(() => import('./components/dashboard').then(m => ({ default: m.DateFilter })));
const StatCard = lazy(() => import('./components/dashboard').then(m => ({ default: m.StatCard })));
const ChartsOverview = lazy(() => import('./components/dashboard').then(m => ({ default: m.ChartsOverview })));

const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

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
  const { data: salesSemantic } = useAdminQuery('semantic-sales', '/api/admin/semantic/sales');
  const { data: inventorySemantic } = useAdminQuery('semantic-inventory', '/api/admin/semantic/inventory');
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
    <Suspense fallback={<Loader2 className="animate-spin size-8 text-muted-foreground" />}>
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
              changeLabel="vs yesterday"
              icon={<ArrowUpRight size={14} />}
              variant="positive"
            />

            <StatCard
              title="Total Profit"
              value={stats.totalProfit ?? 0}
              change={stats.profitChangePercent}
              changeLabel="vs last month"
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
              changeLabel="vs last month"
              icon={<ArrowDownRight size={14} />}
              variant="negative"
            />
          </div>
        </TabsContent>
        <TabsContent value="sales" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">30-Day Sales</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesSemantic ? formatIndianCurrency(salesSemantic.overview?.total_sales) : '...'}</div>
                <div className="text-sm text-muted-foreground">{salesSemantic?.overview?.total_orders} Orders</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1 lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Top Salespeople (30 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {(salesSemantic?.bySalesperson || []).slice(0, 5).map((sp: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{i+1}. {sp.name}</span>
                      <span className="text-sm">{formatIndianCurrency(sp.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>30-Day Daily Sales Trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ sales: { label: 'Sales', color: '#2563eb' }}} className="h-64 w-full">
                <BarChart data={salesSemantic?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-sales)" radius={[2,2,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventorySemantic ? formatIndianCurrency(inventorySemantic.overview?.total_value) : '...'}</div>
                <div className="text-sm text-muted-foreground">{inventorySemantic?.overview?.total_qty?.toLocaleString()} Items</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1 lg:col-span-2 overflow-auto max-h-64">
              <CardHeader className="pb-2 sticky top-0 bg-background"><CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock Alerts</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {(inventorySemantic?.outOfStock || []).map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-2 font-medium">{item.name}</td>
                        <td className="py-2 px-2 text-muted-foreground">{item.brand}</td>
                        <td className="py-2 pl-2 text-right text-red-600 font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                    {(inventorySemantic?.outOfStock || []).length === 0 && (
                      <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">No stock-outs detected.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Stock Value by Brand</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {(inventorySemantic?.byBrand || []).map((brand: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{brand.brand}</span>
                    <span className="text-sm">{formatIndianCurrency(brand.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Suspense>
  );
}