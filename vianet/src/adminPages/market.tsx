import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useAdminQuery } from '@/hooks/useAdminQuery';
import { CandlestickChart, MarketIndexCards, TopMoversTable, MarketSummary, SalesTrendChart, CategoryBreakdown } from './components/market';

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

      <MarketIndexCards marketIndex={marketIndex} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trend">Sales Trend</TabsTrigger>
          <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
          <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TopMoversTable topMovers={topMovers} />
            <MarketSummary marketSummary={marketSummary} />
          </div>
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <SalesTrendChart trend={trend} />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoryBreakdown catData={catData} />
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
