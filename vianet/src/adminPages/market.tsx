import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

// TODO: fetch from backend

const topMovers = [
  { rank: 1, product: 'Steel', category: 'Metals', price: 58400, change: 4.8 },
  { rank: 2, product: 'Cotton', category: 'Agriculture', price: 12500, change: 3.2 },
  { rank: 3, product: 'Silver', category: 'Metals', price: 74200, change: -2.6 },
  { rank: 4, product: 'Crude Oil', category: 'Energy', price: 6120, change: 5.1 },
  { rank: 5, product: 'Wheat', category: 'Agriculture', price: 2850, change: -1.8 },
  { rank: 6, product: 'Copper', category: 'Metals', price: 45800, change: 2.4 },
];

const marketSummary = [
  { label: 'Demand Index', value: '87.4' },
  { label: 'Supply Index', value: '62.1' },
  { label: 'Price Trend', value: 'Bullish' },
  { label: 'Competition Level', value: 'Moderate' },
  { label: 'Market Sentiment', value: 'Positive' },
];

export function Market() {
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
            <div className="text-2xl font-bold">24,582.40</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp size={14} /> +2.3% today
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
            <div className="text-2xl font-bold text-green-600">+563.20</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp size={14} /> +2.34% increase
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
            <div className="text-2xl font-bold">1,84,72,500</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendingUp size={14} /> +12.8% vs yesterday
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
                {topMovers.map((m) => (
                  <tr key={m.rank} className="border-b last:border-0">
                    <td className="py-2.5 text-muted-foreground">{m.rank}</td>
                    <td className="py-2.5 font-medium">{m.product}</td>
                    <td className="py-2.5">
                      <Badge variant="secondary" className="font-normal">
                        {m.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right font-mono">₹{m.price.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-medium ${
                          m.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {m.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {m.change >= 0 ? '+' : ''}
                        {m.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
