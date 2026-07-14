import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PricingCardsProps {
  qty: number;
  price: number;
  hasAccess: boolean;
}

export function AccessGroupPricingCards({ qty, price, hasAccess }: PricingCardsProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Access & Pricing</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center rounded-lg border p-4 gap-1">
            <span className="text-xs text-muted-foreground">Quantity Allowed</span>
            <span className="text-3xl font-bold">{hasAccess ? qty : <span className="text-amber-600">—</span>}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-4 gap-1">
            <span className="text-xs text-muted-foreground">Price</span>
            <span className="text-3xl font-bold">{hasAccess ? `₹${price.toLocaleString()}` : <span className="text-amber-600">—</span>}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-4 gap-1">
            <span className="text-xs text-muted-foreground">Stock Value</span>
            <span className="text-3xl font-bold">{hasAccess ? `₹${(qty * price).toLocaleString()}` : <span className="text-amber-600">—</span>}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
