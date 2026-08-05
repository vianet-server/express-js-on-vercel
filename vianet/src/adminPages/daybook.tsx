import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, ChevronDown, ChevronRight, TrendingUp, TrendingDown, DollarSign, Receipt, FileText, Loader2, BookOpen, PackageOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAdminQuery } from '@/hooks/useAdminQuery';

const typeColors: Record<string, string> = {
  Sale: 'bg-green-100 text-green-700',
  Payment: 'bg-blue-100 text-blue-700',
  Expense: 'bg-red-100 text-red-700',
  Purchase: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-700',
};

const chartConfig = {
  income: { label: 'Income', color: '#16a34a' },
  expense: { label: 'Expense', color: '#ef4444' },
  net: { label: 'Net', color: '#2563eb' },
};

function fmtDate(d: string) {
  if (!d) return '';
  const parts = d.split('T')[0].split('-');
  if (parts.length !== 3) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

export function Daybook() {
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const toggle = (id: number) => setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const daybookKey = `daybook-${fromDate}-${toDate}`;
  const { data: daybookRaw, loading } = useAdminQuery<any[]>(daybookKey, `/api/admin/reports/daybook?from_date=${fromDate}&to_date=${toDate}`);
  const transactionsData = Array.isArray(daybookRaw) ? daybookRaw : [];
  const dailyTotals = (() => {
    const daily: Record<string, { income: number; expense: number }> = {};
    for (const t of transactionsData) {
      const day = t.date ? t.date.split('T')[0] : 'Unknown';
      if (!daily[day]) daily[day] = { income: 0, expense: 0 };
      if (t.type === 'Sale') daily[day].income += t.amount ?? 0;
      else daily[day].expense += t.amount ?? 0;
    }
    return Object.entries(daily).map(([day, v]) => ({ day, income: v.income, expense: v.expense }));
  })();

  const filtered = transactionsData.filter((t: any) =>
    (t.customer ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.ref ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.salesman ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.narration ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    getItemKey: (index) => (filtered[index] as any)?.id ?? index,
    overscan: 10,
  });

  const totalSales = transactionsData.filter((t: any) => t.type === 'Sale').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const totalPayments = transactionsData.filter((t: any) => t.type === 'Payment').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const totalExpenses = transactionsData.filter((t: any) => t.type === 'Expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const totalPurchases = transactionsData.filter((t: any) => t.type === 'Purchase').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const netCash = totalSales - totalPayments - totalExpenses - totalPurchases;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Daybook</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0 w-32" />
          </div>
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36 text-sm" />
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36 text-sm" />
          <Button variant="outline" size="sm"><Filter size={14} /> Filter</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingUp size={14} /> Total Sales</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">₹{totalSales.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Receipt size={14} /> Total Payments</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">₹{totalPayments.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingDown size={14} /> Total Expenses</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><DollarSign size={14} /> Net Cash Flow</CardTitle></CardHeader>
              <CardContent><div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{netCash.toLocaleString()}</div></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Daily Income vs Expense</CardTitle></CardHeader>
              <CardContent>
                {dailyTotals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No daily data available</p>
                ) : (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={dailyTotals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Transaction Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {Object.entries(typeColors).map(([type, color]) => {
                    const total = transactionsData.filter((t: any) => t.type === type).reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
                    const count = transactionsData.filter((t: any) => t.type === type).length;
                    const grandTotal = transactionsData.reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
                    const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{type}</span>
                          <span className="text-xs text-muted-foreground">({count} entries)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color.match(/text-\w+-\d+/)?.[0]?.replace('text', 'bg') ? undefined : '#888' }} />
                          </div>
                          <span className="text-sm font-medium w-24 text-right">₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader><CardTitle>Salesman Performance</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Salesman</th>
                    <th className="pb-2 font-medium text-right">Transactions</th>
                    <th className="pb-2 font-medium text-right">Total Sales</th>
                    <th className="pb-2 font-medium text-right">Avg/Trans</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    transactionsData.filter((t: any) => t.type === 'Sale').reduce((acc: any, t: any) => {
                      acc[t.salesman] = acc[t.salesman] || { count: 0, total: 0 };
                      acc[t.salesman].count++;
                      acc[t.salesman].total += t.amount ?? 0;
                      return acc;
                    }, {} as Record<string, { count: number; total: number }>)
                  ).map(([name, data]: [string, any], i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{name || '-'}</td>
                      <td className="py-2.5 text-right">{data.count}</td>
                      <td className="py-2.5 text-right">₹{data.total.toLocaleString()}</td>
                      <td className="py-2.5 text-right">₹{Math.round(data.total / data.count).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          {mounted && (
            <div ref={scrollRef} className="h-[72vh] overflow-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
              <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const t: any = filtered[virtualRow.index];
                  const open = openIds.includes(t.id);
                  const hasInventory = (t.inventoryEntries ?? []).length > 0;
                  const hasLedger = (t.ledgerEntries ?? []).length > 0;
                  const hasNarration = t.narration && t.narration !== t.customer;
                  const hasDetail = hasInventory || hasLedger || hasNarration;
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      className="absolute top-0 left-0 w-full pr-3 pb-3"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <Collapsible key={t.id} open={open} onOpenChange={() => toggle(t.id)}>
                        <div className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted/30 cursor-pointer">
                          <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left min-w-0">
                            {hasDetail ? (
                              open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />
                            ) : (
                              <span className="w-3.5 shrink-0" />
                            )}
                            <span className="text-xs text-muted-foreground w-20 shrink-0">{fmtDate(t.date)}</span>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${typeColors[t.type] || ''}`}>{t.type}</span>
                            <span className="text-xs font-mono text-muted-foreground shrink-0">{t.ref}</span>
                            <span className="text-sm font-medium truncate min-w-0">{t.customer}</span>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-4 shrink-0">
                            {t.salesman ? <span className="text-xs text-muted-foreground hidden sm:inline">{t.salesman}</span> : null}
                            <span className="text-sm font-medium tabular-nums">₹{(t.amount ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                        {hasDetail && (
                          <CollapsibleContent>
                            <div className="ml-10 pl-4 border-l-2 border-muted space-y-4 py-3">
                              {hasNarration && (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <FileText size={14} className="mt-0.5 shrink-0" />
                                  <span>{t.narration}</span>
                                </div>
                              )}

                              {hasLedger && (
                                <div>
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                                    <BookOpen size={13} /> Ledger Entries
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    {(t.ledgerEntries ?? []).map((s: any, i: number) => {
                                      const amt = parseFloat(s.amount) || 0;
                                      const isDr = s.isDeemedPositive === 'Yes';
                                      const hasDesc = s.description && s.description !== s.ledgerName;
                                      return (
                                        <div key={i} className={`rounded border px-3 py-2 ${isDr ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}`}>
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium">{s.ledgerName}</span>
                                            <span className={`font-semibold tabular-nums ${isDr ? 'text-red-600' : 'text-green-600'}`}>
                                              {isDr ? 'Dr' : 'Cr'} ₹{Math.abs(amt).toLocaleString()}
                                            </span>
                                          </div>
                                          {hasDesc && <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {hasInventory && (
                                <div>
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                                    <PackageOpen size={13} /> Inventory Entries
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    {(t.inventoryEntries ?? []).map((s: any, i: number) => {
                                      const qty = parseFloat(s.qty) || 0;
                                      const rate = parseFloat(s.rate) || 0;
                                      const amt = parseFloat(s.amount) || 0;
                                      let serials: string[] = [];
                                      try {
                                        const p = typeof s.serialNo === 'string' ? JSON.parse(s.serialNo) : s.serialNo;
                                        if (Array.isArray(p)) serials = p;
                                      } catch {}
                                      return (
                                        <div key={i} className="rounded border px-3 py-2">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium">{s.item}</span>
                                            <span className="font-semibold tabular-nums">₹{amt.toLocaleString()}</span>
                                          </div>
                                          <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground">
                                            <span>Qty: <b>{qty > 0 ? qty.toLocaleString() : '-'}</b>{s.unit ? ` ${s.unit}` : ''}</span>
                                            <span>Rate: <b>₹{rate.toLocaleString()}</b></span>
                                          </div>
                                          {s.description ? (
                                            <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
                                          ) : null}
                                          {serials.length > 0 ? (
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                              Serial: {serials.join(', ')}
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
