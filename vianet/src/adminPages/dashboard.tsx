import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ArrowUpRight, ArrowDownRight, FileDown, FileSpreadsheet, Settings, Eye, Calendar, Loader2 } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import { api } from '@/lib/api';

const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartConfig = {
  sales: { label: 'Sales', color: '#2563eb' },
  profit: { label: 'Profit', color: '#16a34a' },
};

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => {}}>
          <FileDown size={14} /> Export to PDF
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {}}>
          <FileSpreadsheet size={14} /> Export to Excel
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => {}}>
          <Eye size={14} /> Detail
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {}}>
          <Settings size={14} /> Settings
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function Dashboard() {
  const [activePeriod, setActivePeriod] = useState('Today');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todaySale: 0, saleChangePercent: 0, totalProfit: 0, profitChangePercent: 0, totalSpend: 0, spendChangePercent: 0, topSalesman: null as { name: string, amount: number } | null, totalOrders: 0 });
  const [topSalesmen, setTopSalesmen] = useState<{ name: string, sales: number }[]>([]);
  const [chartData, setChartData] = useState<{ month: string, sales: number, profit: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<typeof stats>('/admin/dashboard/stats'),
      api.get<{ name: string, sales: number }[]>('/admin/dashboard/top-salesmen'),
      api.get<{ month: string, sales: number, profit: number }[]>('/admin/dashboard/monthly-trend'),
      api.get<{ name: string, value: number }[]>('/admin/dashboard/product-share'),
    ]).then(([s, sm, ct, pd]) => {
      setStats(s);
      setTopSalesmen(sm);
      setChartData(ct);
      setPieData(pd);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

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
            <DialogHeader>
              <DialogTitle>Select Date Range</DialogTitle>
            </DialogHeader>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard>
          <Card className="h-full hover:shadow-md transition-shadow cursor-context-menu">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">₹{stats.todaySale.toLocaleString()}</div>
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
              <div className="text-2xl font-bold">₹{stats.totalProfit.toLocaleString()}</div>
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
                    <span className="text-sm">{s.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-sm font-medium">₹{s.sales.toLocaleString()}</span>
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
              <div className="text-2xl font-bold">₹{stats.totalSpend.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-red-500">
                <ArrowDownRight size={14} /> {stats.spendChangePercent}% <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StatCard>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1 lg:w-3/4">
          <CardHeader>
            <CardTitle>Sales & Profit Overview</CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Product Share</CardTitle>
          </CardHeader>
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
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
