import { useState, useEffect, useCallback, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Download, FileDown, FileSpreadsheet, Search, TrendingUp, TrendingDown, ChevronRight, ChevronDown, Plus, Loader2, ChartLine } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '@/lib/api';

function DetailSection({ title, items, icon }: { title: string; items: any[]; icon: React.ReactNode }) {
  const [openIds, setOpenIds] = useState<number[]>([]);
  const toggle = (id: number) => setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">{icon}{title}</h3>
      {items.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">
          No data available.
        </div>
      ) : (
        items.map((item: any) => {
          const open = openIds.includes(item.id);
          return (
            <Collapsible key={item.id} open={open} onOpenChange={() => toggle(item.id)}>
              <div className="flex items-center justify-between border-b py-2.5 px-2 hover:bg-muted/30 rounded-sm cursor-pointer">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium flex-1 text-left">
                  {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  {item.label}
                </CollapsibleTrigger>
                <span className="text-sm font-medium">₹{item.amount.toLocaleString()}</span>
              </div>
              <CollapsibleContent>
                <div className="ml-7 pl-3 border-l-2 border-muted">
                  {(item.subs ?? []).map((sub: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm text-muted-foreground border-b last:border-0">
                      <span>{sub.label}</span>
                      <span>₹{sub.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2 text-sm font-medium border-t">
                    <span>Total</span>
                    <span>₹{(item.subs ?? []).reduce((s: number, s2: any) => s + s2.amount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })
      )}
    </div>
  );
}

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

  const GRAPH_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  /** ₹1.23Cr / ₹45.6L / ₹9,876 compact axis formatter */
  const formatCompactINR = (v: number) => {
    if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
    if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
  };

  /**
   * Builds month-ASC chart points for one P&L side, keeping only the top
   * N major categories (by total amount across all months).
   */
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

  /**
   * Renders one section of the Month-over-Month table (income or expense):
   * a collapsible row per category across all months; expanding a category
   * reveals its indented child (ledger-level) rows from each month's `subs`.
   */
  const toggleMonthlyExpand = (key: string) =>
    setExpandedMonthly(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderMonthlyGroup = (type: string) => {
    const totals: Record<string, number> = {};
    const childLabels: Record<string, string[]> = {};
    monthlyData.forEach(m => m.data.filter((d: any) => d.type === type).forEach((d: any) => {
      totals[d.label] = (totals[d.label] || 0) + d.amount;
      (d.subs ?? []).forEach((s: any) => {
        childLabels[d.label] = childLabels[d.label] ?? [];
        if (!childLabels[d.label].includes(s.label)) childLabels[d.label].push(s.label);
      });
    }));
    const labels = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    return (
      <>
        {labels.map(label => {
          const expandKey = `${type}:${label}`;
          const open = expandedMonthly.has(expandKey);
          const hasChildren = (childLabels[label] ?? []).length > 0;
          return (
            <Fragment key={label}>
              <tr
                className={`border-b last:border-0 hover:bg-muted/30 ${hasChildren ? 'cursor-pointer select-none' : ''}`}
                onClick={() => hasChildren && toggleMonthlyExpand(expandKey)}
              >
                <td className="py-2.5 pr-4 pl-4 font-medium sticky left-0 bg-background whitespace-nowrap">
                  {hasChildren && (open ? <ChevronDown size={14} className="mr-1 inline shrink-0" /> : <ChevronRight size={14} className="mr-1 inline shrink-0" />)}
                  {label}
                  {hasChildren && <span className="ml-2 text-xs font-normal text-muted-foreground">({childLabels[label].length})</span>}
                </td>
                {monthlyData.map(m => {
                  const row = m.data.find((d: any) => d.label === label && d.type === type);
                  return <td key={m.month} className="py-2.5 px-3 text-right whitespace-nowrap">{row ? `₹${row.amount.toLocaleString()}` : '-'}</td>;
                })}
              </tr>
              {open && (childLabels[label] ?? []).map(child => (
                <tr key={`${label}-${child}`} className="border-b last:border-0 hover:bg-muted/30 text-xs text-muted-foreground">
                  <td className="py-1.5 pr-4 pl-8 sticky left-0 bg-background whitespace-nowrap">↳ {child}</td>
                  {monthlyData.map(m => {
                    const sub = m.data
                      .find((d: any) => d.label === label && d.type === type)
                      ?.subs?.find((s: any) => s.label === child);
                    return <td key={m.month} className="py-1.5 px-3 text-right whitespace-nowrap">{sub ? `₹${sub.amount.toLocaleString()}` : '-'}</td>;
                  })}
                </tr>
              ))}
            </Fragment>
          );
        })}
      </>
    );
  };

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
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="datewise">Datewise</TabsTrigger>
          <TabsTrigger value="monthly">Month-over-Month</TabsTrigger>
          <TabsTrigger value="graph"><ChartLine size={14} className="mr-1 inline" /> Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600 flex items-center gap-1"><TrendingUp size={18} /> ₹{totalIncome.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600 flex items-center gap-1"><TrendingDown size={18} /> ₹{totalExpenses.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</CardTitle></CardHeader>
              <CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{Math.abs(netProfit).toLocaleString()}</div></CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle>P&L Overview</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium w-1/2">Item</th>
                    <th className="pb-2 font-medium text-right pr-6 w-1/4">Amount</th>
                    <th className="pb-2 font-medium pl-6 w-1/4">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        No P&L data found. Please run your Tally sync tool and ensure it exports the P&L statement.
                      </td>
                    </tr>
                  ) : (
                    data.map((item: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{item.label}</td>
                        <td className="py-2.5 text-right pr-6">₹{item.amount.toLocaleString()}</td>
                        <td className="py-2.5 pl-6">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {(item.type ?? '').charAt(0).toUpperCase() + (item.type ?? '').slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Income (Profit)</CardTitle></CardHeader>
              <CardContent>
                <DetailSection title="Revenue & Income" items={data.filter((i: any) => i.type === 'income')} icon={<TrendingUp size={16} className="text-green-600" />} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Expenses (Loss)</CardTitle></CardHeader>
              <CardContent>
                <DetailSection title="Costs & Expenses" items={data.filter((i: any) => i.type === 'expense')} icon={<TrendingDown size={16} className="text-red-600" />} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-muted-foreground" />
                <Input placeholder="Search entries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm" />
              </div>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No entries match your search.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{item.label}</td>
                        <td className="py-2.5 text-right">₹{item.amount.toLocaleString()}</td>
                        <td className="py-2.5">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {(item.type ?? '').charAt(0).toUpperCase() + (item.type ?? '').slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datewise" className="mt-6">
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Input type="date" value={datewisePick} onChange={(e) => setDatewisePick(e.target.value)} className="w-48" />
                <Button size="sm" onClick={handleAddDateColumn} disabled={!datewisePick}><Plus size={14} /> Fetch</Button>
              </div>
            </CardHeader>
          </Card>
          {datewiseCols.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Select a date and click Fetch to add a P&L column.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2.5 pr-4 font-medium whitespace-nowrap sticky left-0 bg-background">Item</th>
                    {datewiseCols.map(date => <th key={date} className="pb-2.5 px-3 font-medium text-right whitespace-nowrap">{date}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium sticky left-0 bg-background">{item.label}</td>
                      {datewiseCols.map(date => (
                        <td key={date} className="py-2.5 px-3 text-right whitespace-nowrap">
                          ₹{item.date <= date ? item.amount.toLocaleString() : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 font-medium">
                    <td className="py-2.5 pr-4 sticky left-0 bg-background">Total</td>
                    {datewiseCols.map(date => (
                      <td key={date} className="py-2.5 px-3 text-right whitespace-nowrap">
                        ₹{data.filter((i: any) => i.date <= date).reduce((s: number, i: any) => s + i.amount, 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Month-over-Month Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-2">
                  <p>No historical monthly data available yet.</p>
                  <p className="text-xs">Ensure your Tally sync pushes to the /api/admin/reports/pnl-monthly endpoint.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2.5 pr-4 font-medium whitespace-nowrap sticky left-0 bg-background">Category</th>
                        {monthlyData.map(m => (
                          <th key={m.month} className="pb-2.5 px-3 font-medium text-right whitespace-nowrap">{m.month}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* INCOMES */}
                      <tr className="bg-muted/50">
                        <td colSpan={monthlyData.length + 1} className="py-2 px-2 font-semibold text-green-700 sticky left-0">Income</td>
                      </tr>
                      {renderMonthlyGroup('income')}
                      {/* EXPENSES */}
                      <tr className="bg-muted/50">
                        <td colSpan={monthlyData.length + 1} className="py-2 px-2 font-semibold text-red-700 sticky left-0 border-t">Expenses</td>
                      </tr>
                      {renderMonthlyGroup('expense')}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="mt-6">
          {monthlyData.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ChartLine size={28} />
                  <p>No historical monthly data available yet.</p>
                  <p className="text-xs">Ensure your Tally sync pushes to the /api/admin/reports/pnl-monthly endpoint.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader><CardTitle>Major Income Categories — Monthly Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={incomeGraph.points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => formatCompactINR(v)} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} labelFormatter={(l: any) => `Month: ${l}`} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {incomeGraph.majors.map((label, i) => (
                          <Line key={label} type="monotone" dataKey={label} stroke={GRAPH_COLORS[i % GRAPH_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Major Expense Categories — Monthly Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={expenseGraph.points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => formatCompactINR(v)} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} labelFormatter={(l: any) => `Month: ${l}`} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {expenseGraph.majors.map((label, i) => (
                          <Line key={label} type="monotone" dataKey={label} stroke={GRAPH_COLORS[i % GRAPH_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
