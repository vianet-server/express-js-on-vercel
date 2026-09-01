import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MarketSummaryProps {
  marketSummary: any[];
}

export function MarketSummary({ marketSummary }: MarketSummaryProps) {
  return (
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
  );
}
