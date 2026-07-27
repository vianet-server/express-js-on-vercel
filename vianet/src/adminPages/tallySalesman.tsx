import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Plus, Search, UserCheck, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { api } from '@/lib/api';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2', '#db2777', '#ea580c', '#65a30d', '#4f46e5', '#94a3b8'];

export function Salesman() {
  const [data, setData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/admin/salesman').then(setData).catch(console.error).finally(() => setLoading(false));
    api.get('/api/admin/salesman-chart').then(setChartData).catch(console.error);
  }, []);

  const barData = useMemo(() => {
    const top10 = [...data].sort((a, b) => b.sales - a.sales).slice(0, 10).map(s => s.name);
    const grouped: Record<string, any> = {};
    chartData.forEach((d: any) => {
      if (!grouped[d.date]) grouped[d.date] = { date: d.date };
      const key = top10.includes(d.name) ? d.name : 'Others';
      grouped[d.date][key] = (grouped[d.date][key] || 0) + d.sales;
    });
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [chartData, data]);

  const pieData = useMemo(() => {
    const agg: Record<string, number> = {};
    chartData.forEach((d: any) => { agg[d.name] = (agg[d.name] || 0) + d.sales; });
    const sorted = Object.entries(agg).sort(([, a], [, b]) => b - a);
    const top = sorted.slice(0, 10).map(([name, value]) => ({ name, value }));
    const rest = sorted.slice(10).reduce((sum, [, v]) => sum + v, 0);
    if (rest > 0) top.push({ name: 'Others', value: rest });
    return top;
  }, [chartData]);

  const barConfig = useMemo(() => {
    const top10 = [...data].sort((a, b) => b.sales - a.sales).slice(0, 10).map(s => s.name);
    const cfg: Record<string, any> = {};
    [...top10, 'Others'].forEach((name, i) => { cfg[name] = { label: name, color: COLORS[i % COLORS.length] }; });
    return cfg;
  }, [data]);

  const filtered = data.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Salesman</h1>
        <Button size="sm"><Plus size={14} /> Add Salesman</Button>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="bar">Bar Graph</TabsTrigger>
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md mb-4">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <Input placeholder="Search salesmen..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
          </div>
          <Card>
            <CardHeader><CardTitle>Salesmen</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Region</th><th className="pb-2 font-medium text-right">Sales</th><th className="pb-2 font-medium text-right">Orders</th><th className="pb-2 font-medium">Status</th>
                </tr></thead>
                <tbody>{filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                    <td className="py-2.5 font-medium flex items-center gap-1.5"><div className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-700"><UserCheck size={12} /></div>{s.name}</td>
                    <td className="py-2.5 text-muted-foreground">{s.region}</td>
                    <td className="py-2.5 text-right">₹{s.sales?.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{s.orders}</td>
                    <td className="py-2.5"><Badge variant={s.status === 'Active' ? 'default' : s.status === 'On Leave' ? 'secondary' : 'outline'} className="text-[10px]">{s.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar">
          <Card>
            <CardHeader><CardTitle>Date-wise Sales (Top 10 + Others)</CardTitle></CardHeader>
            <CardContent>
              {barData.length === 0 ? (
                <div className="flex justify-center py-8 text-muted-foreground text-sm">No data</div>
              ) : (
              <ChartContainer config={barConfig} className="aspect-[2/1] w-full">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v?.slice(5) || ''} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  {Object.keys(barConfig).map((key) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={`var(--color-${key})`} />
                  ))}
                </BarChart>
              </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pie">
          <Card>
            <CardHeader><CardTitle>Sales Distribution</CardTitle></CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex justify-center py-8 text-muted-foreground text-sm">No data</div>
              ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ChartContainer config={barConfig} className="aspect-square w-full max-w-md">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="30%" paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-col gap-1.5 min-w-40">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="size-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="ml-auto font-mono">₹{(entry.value / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}