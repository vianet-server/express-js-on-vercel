import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StockStatusCardProps {
  qty: number;
  min: number;
  max: number;
}

export function StockStatusCard({ qty, min, max }: StockStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stock Status</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Stock</span>
            <span className="font-bold text-lg">{qty}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Min Level</span>
            <span>{min}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max Level</span>
            <span>{max}</span>
          </div>
          <div className="mt-1">
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${qty <= min ? 'bg-red-500' : qty >= max * 0.9 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, (qty / Math.max(1, max)) * 100)}%` }}
              />
            </div>
          </div>
          <Badge variant={qty <= min ? 'destructive' : qty >= max * 0.9 ? 'secondary' : 'default'} className="self-start">
            {qty <= min ? 'Low Stock' : qty >= max * 0.9 ? 'Overstocked' : 'In Stock'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
