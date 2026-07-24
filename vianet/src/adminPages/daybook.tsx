import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, ChevronDown, ChevronRight, TrendingUp, TrendingDown, DollarSign, Receipt, ArrowUpDown, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { api } from '@/lib/api';

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

export function Daybook() {
  const [transactionsData, setTransactionsData] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const toggle = (id: number) => setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  useEffect(() => {
    api.get(`/api/admin/reports/daybook?from_date=${fromDate}&to_date=${toDate}`)
      .then(res => {
        const txns = Array.isArray(res) ? res : [];
        setTransactionsData(txns);
        const daily: Record<string, { income: number; expense: number }> = {};
        for (const t of txns) {
          const day = t.date ? t.date.split('T')[0] : 'Unknown';
          if (!daily[day]) daily[day] = { income: 0, expense: 0 };
          if (t.type === 'Sale' || t.type === 'Payment') daily[day].income += t.amount ?? 0;
          else daily[day].expense += t.amount ?? 0;
        }
        setDailyTotals(Object.entries(daily).map(([day, v]) => ({ day, income: v.income, expense: v.expense })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  const filtered = transactionsData.filter((t: any) =>
    (t.customer ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.ref ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.salesman ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = transactionsData.filter((t: any) => t.type === 'Sale').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const totalPayments = transactionsData.filter((t: any) => t.type === 'Payment').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const totalExpenses = transactionsData.filter((t: any) => t.type === 'Expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const netCash = totalSales + totalPayments - totalExpenses;

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
        <h1 className="text-3xl font-bold tracking-tight">Daybook</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <Input placeholder="Search ref, customer or salesman..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
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
              <CardContent><div className="text-2xl font-bold text-green-600">\u20b9{totalSales.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Receipt size={14} /> Total Payments</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">\u20b9{totalPayments.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingDown size={14} /> Total Expenses</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600">\u20b9{totalExpenses.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><DollarSign size={14} /> Net Cash Flow</CardTitle></CardHeader>
              <CardContent><div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>\u20b9{netCash.toLocaleString()}</div></CardContent>
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
                          <span className="text-sm font-medium w-24 text-right">\u20b9{total.toLocaleString()}</span>
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
                    <th className="pb-2 font-medium text-right">Avg per Transaction</th>
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
                      <td className="py-2.5 font-medium">{name}</td>
                      <td className="py-2.5 text-right">{data.count}</td>
                      <td className="py-2.5 text-right">\u20b9{data.total.toLocaleString()}</td>
                      <td className="py-2.5 text-right">\u20b9{Math.round(data.total / data.count).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          <div className="flex flex-col gap-3">
            {filtered.map((t: any) => {
              const open = openIds.includes(t.id);
              return (
                <Collapsible key={t.id} open={open} onOpenChange={() => toggle(t.id)}>
                  <div className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted/30 cursor-pointer">
                    <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left">
                      {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                      <span className="text-xs text-muted-foreground w-22">{t.date}</span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[t.type] || ''}`}>{t.type}</span>
                      <span className="text-sm font-medium">{t.customer}</span>
                      <span className="text-xs text-muted-foreground">{t.ref}</span>
                      <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                        <ArrowUpDown size={10} /> {t.salesman}
                      </span>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">\u20b9{(t.amount ?? 0).toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{t.mode}</span>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="ml-10 pl-4 border-l-2 border-muted">
                      {(t.subs ?? []).length === 0 ? (
                        <p className="py-2 text-xs text-muted-foreground">No line items</p>
                      ) : (
                        <div className="py-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pb-1">
                            <span>Item</span>
                            <div className="flex gap-4">
                              <span className="w-12 text-right">Qty</span>
                              <span className="w-16 text-right">Rate</span>
                              <span className="w-20 text-right">Amount</span>
                            </div>
                          </div>
                          {(t.subs ?? []).map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-1 text-sm text-muted-foreground border-b last:border-0">
                              <span>{s.item}</span>
                              <div className="flex gap-4">
                                <span className="w-12 text-right">{s.qty}</span>
                                <span className="w-16 text-right">\u20b9{s.rate}</span>
                                <span className="w-20 text-right">\u20b9{(s.amount ?? 0).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
