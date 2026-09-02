import { useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useAdminQuery } from '@/hooks/useAdminQuery';
import { DailyChart, TransactionBreakdown, SalesmanPerformance, SummaryCards, TransactionRow } from './components/daybook';

const typeColors: Record<string, string> = {
  Sale: 'bg-green-100 text-green-700',
  Payment: 'bg-blue-100 text-blue-700',
  Expense: 'bg-red-100 text-red-700',
  Purchase: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-700',
};

export function Daybook() {
  const [search, setSearch] = useState('');
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  
  const [fromDate, setFromDate] = useState(yesterday);
  const [toDate, setToDate] = useState(yesterday);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const toggle = (id: number) => setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
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
    getScrollElement: () => scrollEl,
    estimateSize: () => 56,
    getItemKey: (index: number) => (filtered[index] as any)?.id ?? index,
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
          <SummaryCards totalSales={totalSales} totalPayments={totalPayments} totalExpenses={totalExpenses} netCash={netCash} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <DailyChart dailyTotals={dailyTotals} />
            <TransactionBreakdown transactionsData={transactionsData} typeColors={typeColors} />
          </div>

          <SalesmanPerformance transactionsData={transactionsData} />
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          {mounted && (
            <div ref={setScrollEl} className="h-[72vh] overflow-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
              <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((virtualRow: any) => {
                  const t: any = filtered[virtualRow.index];
                  const rowId = t.id ?? virtualRow.index;
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      className="absolute top-0 left-0 w-full pr-3 pb-3"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <TransactionRow
                        transaction={t}
                        isOpen={openIds.includes(rowId)}
                        onToggle={() => toggle(rowId)}
                      />
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
