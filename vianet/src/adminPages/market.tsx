import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, BarChart3, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function Market() {
  const [loading, setLoading] = useState(true);
  const [topMovers, setTopMovers] = useState<any[]>([]);
  const [marketSummary, setMarketSummary] = useState<any[]>([]);
  const [marketIndex, setMarketIndex] = useState<any>({});

  useEffect(() => {
    api.get('/api/admin/market').then(res => {
      setTopMovers(res.topMovers ?? []);
      setMarketSummary(res.marketSummary ?? []);
      setMarketIndex(res.marketIndex ?? {});
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Market</h1>

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
              {(marketIndex.dayChange ?? 0) >= 0 ? '+' : ''}{marketIndex.dayChange ?? 'N/A'}
            </div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${(marketIndex.dayChangePct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} /> {(marketIndex.dayChangePct ?? 0) >= 0 ? '+' : ''}{marketIndex.dayChangePct ?? '0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={14} /> Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(marketIndex.volume ?? 0).toLocaleString()}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${(marketIndex.volumeChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} /> {(marketIndex.volumeChange ?? 0) >= 0 ? '+' : ''}{marketIndex.volumeChange ?? '0'}% vs yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Movers</CardTitle>
          </CardHeader>
          <CardContent>
            {topMovers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No top movers data available</p>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Current Price</th>
                  <th className="pb-2 font-medium text-right">Change (%)</th>
                </tr>
              </thead>
              <tbody>
                {topMovers.map((m, i) => (
                  <tr key={m.rank ?? i} className="border-b last:border-0">
                    <td className="py-2.5 text-muted-foreground">{m.rank ?? i + 1}</td>
                    <td className="py-2.5 font-medium">{m.product ?? m.name}</td>
                    <td className="py-2.5">
                      <Badge variant="secondary" className="font-normal">
                        {m.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right font-mono">\u20b9{(m.price ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-medium ${
                          (m.change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {(m.change ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {(m.change ?? 0) >= 0 ? '+' : ''}
                        {m.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
