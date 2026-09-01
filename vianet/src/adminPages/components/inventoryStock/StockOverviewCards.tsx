import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StockOverviewCardsProps {
  total: number;
  totalStock: number;
  lowStockCount: number;
  stockValue: number;
}

export function StockOverviewCards({ total, totalStock, lowStockCount, stockValue }: StockOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Stock Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stockValue.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
