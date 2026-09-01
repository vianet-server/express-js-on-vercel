import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, FileDown, FileSpreadsheet, Loader2, ChartLine } from 'lucide-react';
import { api } from '@/lib/api';
import { SummaryTab, DetailTab, SearchTab, DatewiseTab, MonthlyTab, GraphTab } from './components/pnl';

export function Pnl() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('This Month');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [datewisePick, setDatewisePick] = useState('');
  const [datewiseCols, setDatewiseCols] = useState<string[]>([]);
  const [showMonthPick, setShowMonthPick] = useState(false);
  const [monthPick, setMonthPick] = useState('');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [expandedMonthly, setExpandedMonthly] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/api/admin/reports/pnl')
      .then(res => {
        const sortedData = [...res].sort((a: any, b: any) => b.amount - a.amount);
        sortedData.forEach(item => {
          if (item.subs) {
            item.subs.sort((a: any, b: any) => b.amount - a.amount);
          }
        });
        setData(sortedData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/api/admin/reports/pnl-monthly')
      .then(res => {
        setMonthlyData(res || []);
      })
      .catch(console.error);
  }, []);

  const handleCustomApply = useCallback(() => {
    if (dateFrom && dateTo) {
      setActivePeriod(`${dateFrom} — ${dateTo}`);
      setShowDateRange(false);
    }
  }, [dateFrom, dateTo]);

  const handleMonthApply = useCallback(() => {
    if (monthPick) {
      const d = new Date(monthPick);
      setActivePeriod(d.toLocaleDateString('default', { month: 'long', year: 'numeric' }));
      setShowMonthPick(false);
    }
  }, [monthPick]);

  const handleAddDateColumn = () => {
    if (datewisePick && !datewiseCols.includes(datewisePick)) {
      setDatewiseCols(prev => [...prev, datewisePick].sort());
      setDatewisePick('');
    }
  };

  const totalIncome = data.filter((i: any) => i.type === 'income').reduce((s: number, i: any) => s + i.amount, 0);
  const totalExpenses = data.filter((i: any) => i.type === 'expense').reduce((s: number, i: any) => s + i.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const filteredData = data.filter((i: any) => i.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const buildGraphSeries = (type: string, topN = 5) => {
    const totals: Record<string, number> = {};
    monthlyData.forEach(m => m.data.filter((d: any) => d.type === type).forEach((d: any) => {
      totals[d.label] = (totals[d.label] || 0) + d.amount;
    }));
    const majors = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, topN).map(e => e[0]);
    const points = [...monthlyData]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => {
        const p: any = { month: m.month };
        majors.forEach(label => {
          const row = m.data.find((d: any) => d.label === label && d.type === type);
          p[label] = Math.round(row?.amount ?? 0);
        });
        return p;
      });
    return { majors, points };
  };

  const incomeGraph = buildGraphSeries('income');
  const expenseGraph = buildGraphSeries('expense');

  const toggleMonthlyExpand = (key: string) =>
    setExpandedMonthly(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
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
              <DropdownMenuItem onClick={() => setShowMonthPick(true)}>Select Month</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>Select Date Range</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">From</label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">To</label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDateRange(false)}>Cancel</Button>
            <Button onClick={handleCustomApply} disabled={!dateFrom || !dateTo}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMonthPick} onOpenChange={setShowMonthPick}>
        <DialogContent>
          <DialogHeader><DialogTitle>Select Month</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Month</label><Input type="month" value={monthPick} onChange={(e) => setMonthPick(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMonthPick(false)}>Cancel</Button>
            <Button onClick={handleMonthApply} disabled={!monthPick}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Data</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
              <div className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700"><FileSpreadsheet size={18} /></div>
              <div className="flex-1"><div className="text-sm font-medium">Excel (.xlsx)</div><div className="text-xs text-muted-foreground">Export as Excel spreadsheet</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
              <div className="flex size-10 items-center justify-center rounded-md bg-red-100 text-red-700"><FileDown size={18} /></div>
              <div className="flex-1"><div className="text-sm font-medium">PDF (.pdf)</div><div className="text-xs text-muted-foreground">Export as PDF report</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setShowExport(false); }}>
              <div className="flex size-10 items-center justify-center rounded-md bg-green-100 text-green-700"><FileSpreadsheet size={18} /></div>
              <div className="flex-1"><div className="text-sm font-medium">CSV (.csv)</div><div className="text-xs text-muted-foreground">Export raw data as CSV</div></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowExport(false)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="summary">
        <TabsList>
          
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          
          <TabsTrigger value="monthly">Month-over-Month</TabsTrigger>
          <TabsTrigger value="graph"><ChartLine size={14} className="mr-1 inline" /> Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <SummaryTab data={data} totalIncome={totalIncome} totalExpenses={totalExpenses} netProfit={netProfit} />
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          <DetailTab data={data} />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <SearchTab filteredData={filteredData} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </TabsContent>

        <TabsContent value="datewise" className="mt-6">
          <DatewiseTab data={data} datewisePick={datewisePick} onDatewisePickChange={setDatewisePick} datewiseCols={datewiseCols} onAddDateColumn={handleAddDateColumn} />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyTab monthlyData={monthlyData} expandedMonthly={expandedMonthly} onToggleExpand={toggleMonthlyExpand} />
        </TabsContent>

        <TabsContent value="graph" className="mt-6">
          <GraphTab monthlyData={monthlyData} incomeGraph={incomeGraph} expenseGraph={expenseGraph} />
        </TabsContent>
      </Tabs>
    </div>
  );
}