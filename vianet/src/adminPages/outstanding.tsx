import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { SummaryCards, AgeFilterDropdown, SummaryTable, DetailTab, SearchTab, DatewiseTab } from './components/outstanding';

const AGE_BUCKETS = [
  { label: '0-30 days', min: -Infinity, max: 30, color: 'bg-blue-500' },
  { label: '31-60 days', min: 30, max: 60, color: 'bg-amber-500' },
  { label: '61-90 days', min: 60, max: 90, color: 'bg-orange-400' },
  { label: '91-120 days', min: 90, max: 120, color: 'bg-orange-600' },
  { label: '121-150 days', min: 120, max: 150, color: 'bg-red-400' },
  { label: '151-180 days', min: 150, max: 180, color: 'bg-red-600' },
  { label: '180+ days', min: 180, max: Infinity, color: 'bg-red-700' },
];

export function Outstanding() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('This Month');
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [datewisePick, setDatewisePick] = useState('');
  const [datewiseCols, setDatewiseCols] = useState<string[]>([]);

  useEffect(() => {
    api.get('/api/admin/reports/outstanding')
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
    if (!match) return false;
    if (ageFilter === 'all') return true;
    const bucket = AGE_BUCKETS.find(b => b.label === ageFilter);
    if (!bucket) return true;
    return i.days > bucket.min && i.days <= bucket.max;
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
          <SummaryCards
            stats={[
              { title: 'Total Outstanding', value: `₹${totalOutstanding.toLocaleString()}` },
              { title: 'Overdue (>30 days)', value: `₹${overdueTotal.toLocaleString()}`, color: 'text-amber-600' },
              { title: 'Critical (>60 days)', value: `₹${criticalTotal.toLocaleString()}`, color: 'text-red-600' },
              { title: 'Total Customers', value: data.length },
            ]}
          />
          <div className="mt-4 flex items-center gap-3">
            <AgeFilterDropdown ageBuckets={AGE_BUCKETS} ageFilter={ageFilter} data={data} onAgeFilterChange={setAgeFilter} />
          </div>
          <SummaryTable data={data} ageFilter={ageFilter} ageBuckets={AGE_BUCKETS} />
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          <DetailTab data={data} ageBuckets={AGE_BUCKETS} />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <SearchTab
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            ageFilter={ageFilter}
            onAgeFilterChange={setAgeFilter}
            ageBuckets={AGE_BUCKETS}
            filteredData={filteredData}
            data={data}
          />
        </TabsContent>

        <TabsContent value="datewise" className="mt-6">
          <DatewiseTab
            data={data}
            datewisePick={datewisePick}
            onDatewisePickChange={setDatewisePick}
            datewiseCols={datewiseCols}
            onAddDateColumn={handleAddDateColumn}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}