import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Calendar, Download, FileDown, FileSpreadsheet, Brain, TrendingUp, Shield, Zap, Loader2 } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Area, AreaChart } from 'recharts';
import { api } from '@/lib/api';

const chartConfig = {
  revenue: { label: 'Revenue', color: '#2563eb' },
  orders: { label: 'Orders', color: '#16a34a' },
};

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: '', totalOrders: '', avgOrderValue: '', conversionRate: '' });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [salesByRegion, setSalesByRegion] = useState([]);
  const [ordersByChannel, setOrdersByChannel] = useState([]);
  const [activePeriod, setActivePeriod] = useState('This Year');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/analytics/stats') as any,
      api.get('/api/admin/analytics/monthly-trend') as any,
      api.get('/api/admin/analytics/category-data') as any,
      api.get('/api/admin/analytics/top-customers') as any,
      api.get('/api/admin/analytics/daily-sales') as any,
      api.get('/api/admin/analytics/sales-by-region') as any,
      api.get('/api/admin/analytics/orders-by-channel') as any,
    ]).then(([s, mt, cd, tc, ds, sbr, obc]: any[]) => {
      setStats({
        totalRevenue: `\u20b9${Number(s.totalRevenue).toLocaleString('en-IN')}`,
        totalOrders: Number(s.totalOrders).toLocaleString('en-IN'),
        avgOrderValue: `\u20b9${Number(s.avgOrderValue).toFixed(2)}`,
        conversionRate: `${Number(s.conversionRate).toFixed(2)}%`,
      });
      setMonthlyTrend(mt.map((m: any) => ({ ...m, revenue: m.sales, orders: m.profit })));
      setCategoryData(cd);
      setTopCustomers(tc);
      setDailySales(ds);
      setSalesByRegion(sbr.map((r: any) => ({ month: r.region, sales: r.sales })));
      setOrdersByChannel(obc.map((o: any) => ({ name: o.month, direct: o.direct, online: o.online, phone: o.phone })));
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  // TODO: Replace with ML model endpoint for Advanced tab data

  const handleCustomApply = useCallback(() => {
    if (dateFrom && dateTo) {
      setActivePeriod(`${dateFrom} \u2014 ${dateTo}`);
      setShowDateRange(false);
    }
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
              <Calendar size={14} /> {activePeriod}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuItem onClick={() => setActivePeriod('Today')}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePeriod('This Week')}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePeriod('This Month')}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePeriod('This Year')}>This Year</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDateRange(true)}>Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" size="sm" onClick={() => setShowExport(true)}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

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

        <Dialog open={showExport} onOpenChange={setShowExport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
                <div className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Excel (.xlsx)</div>
                  <div className="text-xs text-muted-foreground">Export all analytics data as an Excel spreadsheet</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
                <div className="flex size-10 items-center justify-center rounded-md bg-red-100 text-red-700">
                  <FileDown size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">PDF (.pdf)</div>
                  <div className="text-xs text-muted-foreground">Export a PDF report with charts and tables</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
                <div className="flex size-10 items-center justify-center rounded-md bg-green-100 text-green-700">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">CSV (.csv)</div>
                  <div className="text-xs text-muted-foreground">Export raw data as a comma-separated values file</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
                <div className="flex size-10 items-center justify-center rounded-md bg-purple-100 text-purple-700">
                  <Download size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">JSON (.json)</div>
                  <div className="text-xs text-muted-foreground">Export as JSON for programmatic use</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExport(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <TabsContent value="basic" className="mt-0 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue}</div>
              <div className="text-xs text-green-600 mt-1">+14.5% vs last period</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <div className="text-xs text-green-600 mt-1">+11.2% vs last period</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgOrderValue}</div>
              <div className="text-xs text-green-600 mt-1">+3.1% vs last period</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}</div>
              <div className="text-xs text-red-500 mt-1">-0.8% vs last period</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="flex-1 lg:w-3/4">
            <CardHeader><CardTitle>Revenue & Orders Trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:w-1/4">
            <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {categoryData.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i] }} />
                      {item.name}
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Monthly Comparison</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="flex-1 lg:w-3/4">
            <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2 font-medium">#</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium text-right">Orders</th><th className="pb-2 font-medium text-right">Total Spent</th><th className="pb-2 font-medium">Status</th></tr></thead>
                <tbody>{topCustomers.map((c: any) => (
                  <tr key={c.rank} className="border-b last:border-0">
                    <td className="py-2.5">{c.rank}</td><td className="py-2.5 font-medium">{c.name}</td><td className="py-2.5 text-right">{c.orders}</td><td className="py-2.5 text-right">\u20b9{c.spent.toLocaleString()}</td>
                    <td className="py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'VIP' ? 'bg-blue-100 text-blue-700' : c.status === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
          <Card className="lg:w-1/4">
            <CardHeader><CardTitle>Daily Sales</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="sales" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Sales by Region</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={salesByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Orders by Channel</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ direct: { label: 'Direct', color: '#2563eb' }, online: { label: 'Online', color: '#16a34a' }, phone: { label: 'Phone', color: '#f59e0b' } }} className="h-72 w-full">
                <LineChart data={ordersByChannel}>
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
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="mt-0 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Model Accuracy</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.7%</div>
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp size={10} />LSTM Neural Network</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Forecast Confidence</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">\u00b13.2%</div>
              <div className="text-xs text-blue-600 mt-1">95% confidence interval</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Anomalies Detected</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <div className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Shield size={10} />Auto-detected</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Next 30-Day Forecast</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">\u20b98.2L</div>
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><Zap size={10} />Deep Learning Prediction</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain size={16} /> Deep Learning Forecast \u2014 Revenue Prediction</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ actual: { label: 'Actual', color: '#2563eb' }, predicted: { label: 'Predicted', color: '#16a34a' }, upper: { label: 'Upper Bound', color: '#86efac' }, lower: { label: 'Lower Bound', color: '#fecaca' } }} className="h-80 w-full">
              <AreaChart data={[
                { month: 'Jan', actual: 42000, predicted: 41500, upper: 44000, lower: 39000 },
                { month: 'Feb', actual: 38000, predicted: 38500, upper: 41000, lower: 36000 },
                { month: 'Mar', actual: 51000, predicted: 49500, upper: 53000, lower: 46000 },
                { month: 'Apr', actual: 46000, predicted: 47000, upper: 50000, lower: 44000 },
                { month: 'May', actual: 54000, predicted: 53000, upper: 57000, lower: 49000 },
                { month: 'Jun', actual: 48000, predicted: 47500, upper: 51000, lower: 44000 },
                { month: 'Jul', actual: 62000, predicted: 61000, upper: 65000, lower: 57000 },
                { month: 'Aug', actual: 58000, predicted: null, upper: null, lower: null },
                { month: 'Sep', predicted: 63000, upper: 67000, lower: 59000 },
                { month: 'Oct', predicted: 67000, upper: 71000, lower: 63000 },
                { month: 'Nov', predicted: 72000, upper: 76000, lower: 68000 },
                { month: 'Dec', predicted: 78000, upper: 82000, lower: 74000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="var(--color-upper)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--color-lower)" fillOpacity={0.2} />
                <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="var(--color-predicted)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Predictive Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  { text: 'Revenue expected to increase by 18.4% next quarter based on LSTM model.', type: 'positive' },
                  { text: 'Anomaly detected: Unusual spike in orders on Jul 15 (3\u03c3 above mean).', type: 'warning' },
                  { text: 'Customer churn probability reduced by 6.2% after recent pricing changes.', type: 'positive' },
                  { text: 'Demand forecast suggests stocking 15% more inventory for Electronics category.', type: 'info' },
                ].map((insight, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${insight.type === 'warning' ? 'bg-amber-50 border-amber-200' : insight.type === 'positive' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                    <Brain size={16} className={`mt-0.5 ${insight.type === 'warning' ? 'text-amber-600' : insight.type === 'positive' ? 'text-green-600' : 'text-blue-600'}`} />
                    <span className="text-sm">{insight.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Model Health</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Training Epochs', value: '500', sub: 'Loss: 0.0042' },
                  { label: 'Validation Score', value: 'R\u00b2 = 0.91', sub: 'High confidence' },
                  { label: 'Last Retrained', value: '2h ago', sub: 'Auto-retrain daily' },
                  { label: 'Data Points', value: '24,582', sub: 'Last 12 months' },
                ].map((m) => (
                  <div key={m.label} className="flex justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                    <span className="text-muted-foreground">{m.label}</span>
                    <div className="text-right">
                      <div className="font-medium">{m.value}</div>
                      <div className="text-[10px] text-muted-foreground">{m.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
