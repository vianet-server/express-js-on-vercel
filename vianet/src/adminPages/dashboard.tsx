import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatIndianCurrency } from "@/lib/utils";
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

const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartConfig = {
  sales: { label: 'Sales', color: '#2563eb' },
  profit: { label: 'Profit', color: '#16a34a' },
};

const defaultStats = { todaySale: 0, saleChangePercent: 0, totalProfit: 0, profitChangePercent: 0, totalSpend: 0, spendChangePercent: 0, topSalesman: null as { name: string; amount: number } | null, totalOrders: 0 };

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-full">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => {}}><FileDown size={14} /> Export to PDF</ContextMenuItem>
        <ContextMenuItem onClick={() => {}}><FileSpreadsheet size={14} /> Export to Excel</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => {}}><Eye size={14} /> Detail</ContextMenuItem>
        <ContextMenuItem onClick={() => {}}><Settings size={14} /> Settings</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
            <Calendar size={14} /> {activePeriod}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuItem onClick={() => setActivePeriod('Today')}>Today</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePeriod('Yesterday')}>Yesterday</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivePeriod('This Month')}>This Month</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowDateRange(true)}>Specific Period</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showDateRange} onOpenChange={setShowDateRange}>
          <DialogContent>
            <DialogHeader><DialogTitle>Select Date Range</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDateRange(false)}>Cancel</Button>
              <Button onClick={handleCustomApply} disabled={!dateFrom || !dateTo}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="sales">Sales & Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="executive" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard>
          <Card className="h-full hover:shadow-md transition-shadow cursor-context-menu">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{formatIndianCurrency(stats.todaySale ?? 0)}</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowUpRight size={14} /> +{stats.saleChangePercent}% <span className="text-muted-foreground ml-1">vs yesterday</span>
              </div>
              <div className="pt-1 border-t">
                <span className="text-xs text-muted-foreground">Orders Today</span>
                <div className="text-sm font-medium">{stats.totalOrders} orders</div>
              </div>
            </CardContent>
          </Card>
        </StatCard>

        <StatCard>
          <Card className="h-full hover:shadow-md transition-shadow cursor-context-menu">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{formatIndianCurrency(stats.totalProfit ?? 0)}</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowUpRight size={14} /> +{stats.profitChangePercent}% <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StatCard>

        <StatCard>
          <Card className="h-full hover:shadow-md transition-shadow cursor-context-menu">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Salesmen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {topSalesmen.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm">{(s.name ?? '').split(' ')[0]}</span>
                  </div>
                  <span className="text-sm font-medium">{formatIndianCurrency(s.sales ?? 0)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </StatCard>

        <StatCard>
          <Card className="h-full hover:shadow-md transition-shadow cursor-context-menu">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{formatIndianCurrency(stats.totalSpend ?? 0)}</div>
              <div className="flex items-center gap-1 text-xs text-red-500">
                <ArrowDownRight size={14} /> {stats.spendChangePercent}% <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StatCard>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1 lg:w-3/4">
          <CardHeader><CardTitle>Sales & Profit Overview</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:w-1/4">
          <CardHeader><CardTitle>Product Share</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80 w-full">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
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
        </TabsContent>
        <TabsContent value="sales" className="flex flex-col gap-6 mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">30-Day Sales</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{salesSemantic ? formatIndianCurrency(salesSemantic.overview?.total_sales) : '...'}</div>
                  <div className="text-sm text-muted-foreground">{salesSemantic?.overview?.total_orders} Orders</div>
                </CardContent>
              </Card>
            </StatCard>
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
            <StatCard>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventorySemantic ? formatIndianCurrency(inventorySemantic.overview?.total_value) : '...'}</div>
                  <div className="text-sm text-muted-foreground">{inventorySemantic?.overview?.total_qty?.toLocaleString()} Items</div>
                </CardContent>
              </Card>
            </StatCard>
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
  );
}