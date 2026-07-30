import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, BarChart3, Loader2, Package, ShoppingCart } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdminQuery } from '@/hooks/useAdminQuery';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function CandlestickChart({ data }: { data: any[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">No candlestick data</p>;

  const vals = data.flatMap(function(d) { return [d.high, d.low, d.open, d.close]; });
  const min = Math.min.apply(null, vals);
  const max = Math.max.apply(null, vals);
  const range = max - min || 1;
  const W = 700, H = 320, PL = 60, PR = 20, PT = 20, PB = 40;
  const cw = W - PL - PR;
  const ch = H - PT - PB;

  function xs(i: number) { return PL + (i + 0.5) * cw / data.length; }
  function ys(v: number) { return PT + ch - ((v - min) / range) * ch; }

  const yTicks: number[] = [];
  for (let i = 0; i <= 5; i++) yTicks.push(min + (range * i) / 5);

  return (
    <div className="w-full">
      <svg viewBox={'0 0 ' + W + ' ' + H} className="w-full h-full max-h-80">
        {yTicks.map(function(t) {
          const y = ys(t);
          return (
            <g key={String(t)}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="currentColor" className="stroke-muted/30" strokeWidth={1} />
              <text x={PL - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                {'\u20b9'}{Math.round(t).toLocaleString('en-IN')}
              </text>
            </g>
          );
        })}
        {data.map(function(d, i) {
          const x = xs(i);
          const o = ys(d.open);
          const c = ys(d.close);
          const h = ys(d.high);
          const l = ys(d.low);
          const isUp = d.close >= d.open;
          const color = isUp ? '#22c55e' : '#ef4444';
          const bw = Math.max(3, cw / data.length * 0.5);
          const by = Math.min(o, c);
          const bh = Math.max(Math.abs(c - o), 1.5);
          const isHovered = hovered === i;
          return (
            <g key={d.weekStart || i}>
              <line x1={x} y1={h} x2={x} y2={l} stroke={color} strokeWidth={1.5} />
              <rect x={x - bw / 2} y={by} width={bw} height={bh} fill={color} rx={1}
                onMouseEnter={function() { setHovered(i); }}
                onMouseLeave={function() { setHovered(null); }}
              />
              {isHovered && (
                <g>
                  <rect x={Math.min(x + 10, W - PR - 140)} y={Math.max(PT, h - 85)} width={138} height={78} rx={4} fill="#1e293b" opacity={0.95} />
                  <text x={Math.min(x + 16, W - PR - 134)} y={Math.max(PT + 14, h - 71)} fill="#fff" fontSize={11} fontWeight={600}>
                    {new Date(d.weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </text>
                  {[['O', d.open], ['H', d.high], ['L', d.low], ['C', d.close]].map(function(p, j) {
                    const label = p[0] as string;
                    const val = p[1] as number;
                    return (
                      <text key={label} x={Math.min(x + 16, W - PR - 134)} y={Math.max(PT + 30 + j * 14, h - 57 + j * 14)}
                        fill={label === 'O' || label === 'C' ? (label === 'C' ? '#22c55e' : '#94a3b8') : '#94a3b8'}
                        fontSize={10} fontFamily="monospace">
                        {label + '  \u20b9' + Math.round(val).toLocaleString('en-IN')}
                      </text>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}
        {data.map(function(d, i) {
          if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
          return (
            <text key={'x' + i} x={xs(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
              {new Date(d.weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function Market() {
  const { data: raw, loading } = useAdminQuery<any>('market', '/api/admin/market');
  const { data: trendRaw } = useAdminQuery<any>('market-trend', '/api/admin/market/sales-trend');
  const { data: catRaw } = useAdminQuery<any>('market-cat', '/api/admin/market/category-data');
  const { data: candleRaw } = useAdminQuery<any>('market-candle', '/api/admin/market/candlestick');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  const marketIndex = raw?.marketIndex ?? {};
  const topMovers: any[] = raw?.topMovers ?? [];
  const marketSummary: any[] = raw?.marketSummary ?? [];
  const trend: any[] = trendRaw ?? [];
  const catData: any[] = catRaw ?? [];
  const candleData: any[] = candleRaw ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Market</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BarChart3 size={14} /> Market Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketIndex.value ?? 'N/A'}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${(marketIndex.change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(marketIndex.change ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {(marketIndex.change ?? 0) >= 0 ? '+' : ''}{(marketIndex.changePct ?? marketIndex.change) ?? '0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity size={14} /> Today's Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(marketIndex.dayChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.round(marketIndex.dayChange ?? 0).toLocaleString('en-IN')}
            </div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${(marketIndex.dayChangePct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} /> {marketIndex.dayChangePct ?? '0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingCart size={14} /> Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(marketIndex.volume ?? 0).toLocaleString('en-IN')}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${(marketIndex.volumeChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} /> {(marketIndex.volumeChange ?? 0) >= 0 ? '+' : ''}{marketIndex.volumeChange ?? '0'}% vs yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trend">Sales Trend</TabsTrigger>
          <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
          <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package size={16} /> Top Movers</CardTitle>
              </CardHeader>
              <CardContent>
                {topMovers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No top movers data available</p>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium text-right">Avg Price</th>
                        <th className="pb-2 font-medium text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMovers.map((m: any, i: number) => (
                        <tr key={m.rank ?? i} className="border-b last:border-0">
                          <td className="py-2.5 text-muted-foreground">{m.rank ?? i + 1}</td>
                          <td className="py-2.5 font-medium">{m.product ?? m.name}</td>
                          <td className="py-2.5 text-right font-mono">₹{(m.price ?? 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 text-right font-mono">₹{Math.round(m.total_value ?? 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketSummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No summary data</p>
                ) : (
                  marketSummary.map((item: any) => (
                    <div key={item.label ?? item.name} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label ?? item.name}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp size={16} /> Sales Trend — Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No trend data available</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return d.getDate() + '/' + (d.getMonth() + 1);
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => '₹' + (v / 1000).toFixed(0) + 'K'} />
                      <Tooltip
                        formatter={(value: any) => ['₹' + Number(value).toLocaleString('en-IN'), 'Sales']}
                        labelFormatter={(label: any) => new Date(label).toLocaleDateString('en-IN')}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-lg font-bold">₹{trend.reduce((s: number, d: any) => s + (d.sales ?? 0), 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">{trend.reduce((s: number, d: any) => s + (d.orders ?? 0), 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Daily Sales</p>
                  <p className="text-lg font-bold">₹{trend.length > 0 ? Math.round(trend.reduce((s: number, d: any) => s + (d.sales ?? 0), 0) / trend.length).toLocaleString('en-IN') : '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package size={16} /> Stock by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {catData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No category data available</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={catData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }: any) => `${name} ${value}%`}
                        >
                          {catData.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [Number(value) + '%', 'Share']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                {catData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-3">
                    {catData.map((c: any, i: number) => (
                      <div key={c.name} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm flex-1">{c.name}</span>
                        <span className="text-sm font-medium">{c.value}%</span>
                        <span className="text-xs text-muted-foreground">{c.count} items</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candlestick" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp size={16} /> Weekly Sales Candlestick — Last 12 Weeks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">Each candle shows Open, High, Low, Close weekly sales. Green = week closed higher, Red = week closed lower.</p>
              <CandlestickChart data={candleData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
