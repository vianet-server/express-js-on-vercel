import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Download, FileDown, FileSpreadsheet, Search, AlertTriangle, ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const statusStyles = {
  due: 'bg-blue-100 text-blue-700',
  overdue: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

function DetailSection({ title, items, icon }: { title: string; items: any[]; icon: React.ReactNode }) {
  const [openIds, setOpenIds] = useState<number[]>([]);
  const toggle = (id: number) => setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">{icon}{title} ({items.length})</h3>
      {items.map((item: any) => {
        const open = openIds.includes(item.id);
        return (
          <Collapsible key={item.id} open={open} onOpenChange={() => toggle(item.id)}>
            <div className="flex items-center justify-between border-b py-2.5 px-2 hover:bg-muted/30 rounded-sm cursor-pointer">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium flex-1 text-left">
                {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                {item.customer}
              </CollapsibleTrigger>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">₹{item.amount.toLocaleString()}</span>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                  {(item.status ?? '').charAt(0).toUpperCase() + (item.status ?? '').slice(1)}
                </span>
              </div>
            </div>
            <CollapsibleContent>
              <div className="ml-7 pl-3 border-l-2 border-muted">
                <div className="flex items-center justify-between py-1.5 text-xs text-muted-foreground font-medium">
                  <span>Invoice</span>
                  <span className="flex gap-4">
                    <span>Amount</span>
                    <span>Due Date</span>
                  </span>
                </div>
                {(item.subs ?? []).map((sub: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-sm text-muted-foreground border-b last:border-0">
                    <span>{sub.invoice}</span>
                    <span className="flex gap-4">
                      <span className="w-20 text-right">₹{sub.amount.toLocaleString()}</span>
                      <span className="w-24 text-right">{sub.due}</span>
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 text-sm font-medium border-t">
                  <span>Total</span>
                  <span className="flex gap-4">
                    <span className="w-20 text-right">₹{(item.subs ?? []).reduce((s: number, s2: any) => s + s2.amount, 0).toLocaleString()}</span>
                    <span className="w-24 text-right">{item.days}d overdue</span>
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

export function Outstanding() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('This Month');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [show60plus, setShow60plus] = useState(false);
  const [datewisePick, setDatewisePick] = useState('');
  const [datewiseCols, setDatewiseCols] = useState<string[]>([]);

  useEffect(() => {
    api.get('/api/admin/reports/outstanding')
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCustomApply = useCallback(() => {
    if (dateFrom && dateTo) {
      setActivePeriod(`${dateFrom} — ${dateTo}`);
      setShowDateRange(false);
    }
  }, [dateFrom, dateTo]);

  const handleAddDateColumn = () => {
    if (datewisePick && !datewiseCols.includes(datewisePick)) {
      setDatewiseCols(prev => [...prev, datewisePick].sort());
      setDatewisePick('');
    }
  };

  const totalOutstanding = data.reduce((s: number, i: any) => s + i.amount, 0);
  const overdueTotal = data.filter((i: any) => i.days > 30).reduce((s: number, i: any) => s + i.amount, 0);
  const criticalTotal = data.filter((i: any) => i.days > 60).reduce((s: number, i: any) => s + i.amount, 0);

  const filteredData = data.filter((i: any) => {
    const match = i.customer.toLowerCase().includes(searchQuery.toLowerCase());
    if (!show60plus) return match;
    return match && i.days > 60;
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
        <h1 className="text-3xl font-bold tracking-tight">Outstanding</h1>
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
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue (&gt;30 days)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-amber-600">₹{overdueTotal.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Critical (&gt;60 days)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600">₹{criticalTotal.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.length}</div></CardContent>
            </Card>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant={show60plus ? 'default' : 'outline'} size="sm" onClick={() => setShow60plus(!show60plus)} className="gap-1.5">
              <AlertTriangle size={14} />
              More than 60 Days ({data.filter((i: any) => i.days > 60).length})
            </Button>
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle>Outstanding Overview</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Days</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(show60plus ? data.filter((i: any) => i.days > 60) : data).slice(0, 5).map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{item.customer}</td>
                      <td className="py-2.5 text-right">₹{item.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-right">{item.days}d</td>
                      <td className="py-2.5">{item.date}</td>
                      <td className="py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                          {(item.status ?? '').charAt(0).toUpperCase() + (item.status ?? '').slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>On Time</CardTitle></CardHeader>
              <CardContent>
                <DetailSection title="Due (&le;30 days)" items={data.filter((i: any) => i.days <= 30)} icon={<span className="size-2.5 rounded-full bg-blue-500 inline-block" />} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Overdue</CardTitle></CardHeader>
              <CardContent>
                <DetailSection title="Overdue (31-60 days)" items={data.filter((i: any) => i.days > 30 && i.days <= 60)} icon={<span className="size-2.5 rounded-full bg-amber-500 inline-block" />} />
                <DetailSection title="Critical (&gt;60 days)" items={data.filter((i: any) => i.days > 60)} icon={<span className="size-2.5 rounded-full bg-red-500 inline-block" />} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <Input placeholder="Search by customer name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm" />
            <Button variant={show60plus ? 'default' : 'outline'} size="sm" onClick={() => setShow60plus(!show60plus)} className="gap-1.5 ml-2">
              <AlertTriangle size={14} /> &gt;60 Days
            </Button>
          </div>
          <Card>
            <CardContent>
              {filteredData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No entries match your criteria.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Customer</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium text-right">Days</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item: any, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{item.customer}</td>
                        <td className="py-2.5 text-right">₹{item.amount.toLocaleString()}</td>
                        <td className="py-2.5 text-right">{item.days}d</td>
                        <td className="py-2.5">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                            {(item.status ?? '').charAt(0).toUpperCase() + (item.status ?? '').slice(1)}
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
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Select a date and click Fetch to add an outstanding column.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2.5 pr-4 font-medium whitespace-nowrap sticky left-0 bg-background">Customer</th>
                    {datewiseCols.map(date => <th key={date} className="pb-2.5 px-3 font-medium text-right whitespace-nowrap">{date}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium sticky left-0 bg-background">{item.customer}</td>
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
      </Tabs>
    </div>
  );
}
