import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, Download, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  BasicStatsCards,
  RevenueOrdersChartCard,
  CategoryPieChartCard,
  MonthlyComparisonCard,
  TopCustomersCard,
  DailySalesCard,
  SalesByRegionCard,
  OrdersByChannelCard,
  AdvancedStatsCards,
  DeepLearningForecastCard,
  PredictiveInsightsCard,
  ModelHealthCard,
} from './components/analytics';

export function Analytics() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>({});
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [salesByRegion, setSalesByRegion] = useState<any[]>([]);
  const [ordersByChannel, setOrdersByChannel] = useState<any[]>([]);

  const [activePeriod, setActivePeriod] = useState('This Year');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/analytics/stats').catch(() => ({})),
      api.get('/api/admin/analytics/monthly-trend').catch(() => []),
      api.get('/api/admin/analytics/category-data').catch(() => []),
      api.get('/api/admin/analytics/top-customers').catch(() => []),
      api.get('/api/admin/analytics/daily-sales').catch(() => []),
      api.get('/api/admin/analytics/sales-by-region').catch(() => []),
      api.get('/api/admin/analytics/orders-by-channel').catch(() => []),
    ]).then(([s, mt, cd, tc, ds, sbr, obc]: any[]) => {
      setStats(s);
      setMonthlyTrend((mt ?? []).map((m: any) => ({ ...m, revenue: m.sales, orders: m.profit })));
      setCategoryData(cd ?? []);
      setTopCustomers(tc ?? []);
      setDailySales(ds ?? []);
      setSalesByRegion((sbr ?? []).map((r: any) => ({ month: r.region, sales: r.sales })));
      setOrdersByChannel((obc ?? []).map((o: any) => ({ name: o.month, direct: o.direct, online: o.online, phone: o.phone })));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCustomApply = useCallback(() => {
    if (dateFrom && dateTo) {
      setActivePeriod(`${dateFrom} — ${dateTo}`);
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
              <Calendar size={14} className="mr-2" /> {activePeriod}
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
            <Download size={14} className="mr-2" /> Export
          </Button>
        </div>
      </div>

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

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Data</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowExport(false)}>
              <div className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700"><FileSpreadsheet size={18} /></div>
              <div className="flex-1"><div className="text-sm font-medium">Excel (.xlsx)</div><div className="text-xs text-muted-foreground">Export all analytics data as an Excel spreadsheet</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowExport(false)}>
              <div className="flex size-10 items-center justify-center rounded-md bg-red-100 text-red-700"><FileDown size={18} /></div>
              <div className="flex-1"><div className="text-sm font-medium">PDF (.pdf)</div><div className="text-xs text-muted-foreground">Export a PDF report with charts and tables</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowExport(false)}>
              <div className="flex size-10 items-center justify-center rounded-md bg-green-100 text-green-700"><FileSpreadsheet size={18} /></div>
              <div className="flex-1"><div className="text-sm font-medium">CSV (.csv)</div><div className="text-xs text-muted-foreground">Export raw data as a comma-separated values file</div></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExport(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabsContent value="basic" className="mt-0 flex flex-col gap-6">
        <BasicStatsCards stats={stats} />

        <div className="flex flex-col lg:flex-row gap-4">
          <RevenueOrdersChartCard data={monthlyTrend} />
          <CategoryPieChartCard data={categoryData} />
        </div>

        <MonthlyComparisonCard data={monthlyTrend} />

        <div className="flex flex-col lg:flex-row gap-4">
          <TopCustomersCard data={topCustomers} />
          <DailySalesCard data={dailySales} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SalesByRegionCard data={salesByRegion} />
          <OrdersByChannelCard data={ordersByChannel} />
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="mt-0 flex flex-col gap-6">
        <AdvancedStatsCards />
        <DeepLearningForecastCard />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PredictiveInsightsCard />
          <ModelHealthCard />
        </div>
      </TabsContent>

    </Tabs>
  );
}
