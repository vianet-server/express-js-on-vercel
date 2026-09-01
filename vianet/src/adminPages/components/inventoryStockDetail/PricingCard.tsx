import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PricingCardProps {
  price: number;
  qty: number;
  gst: number;
}

export function PricingCard({ price, qty, gst }: PricingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pricing</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Unit Price</span>
            <span className="font-bold">\u20b9{(price ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST</span>
            <span>{gst}%</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">Stock Value</span>
            <span className="font-bold">\u20b9{(qty * (price ?? 0)).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
