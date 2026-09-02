import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, BarChart3, ShoppingCart } from 'lucide-react';

interface MarketIndexCardsProps {
  marketIndex: {
    value?: string;
    change?: number;
    changePct?: string;
    dayChange?: number;
    dayChangePct?: string;
    volume?: number;
    volumeChange?: number;
  };
}

export function MarketIndexCards({ marketIndex }: MarketIndexCardsProps) {
  return (
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
          <div className={`flex items-center gap-1 text-xs mt-1 ${Number(marketIndex.dayChangePct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
  );
}
