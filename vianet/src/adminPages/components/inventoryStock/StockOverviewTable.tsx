import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface StockOverviewTableProps {
  items: any[];
  loading: boolean;
  onRowClick: (id: number) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  virtualizer: any;
  spacers: { top: number; bottom: number };
}

export function StockOverviewTable({ items, loading, onRowClick, scrollRef, virtualizer, spacers }: StockOverviewTableProps) {
  return (
    <>
      {loading && (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <Loader2 className="animate-spin size-4 mr-2" /> Loading...
        </div>
      )}
      <Card className="mt-4">
        <CardHeader><CardTitle>Stock Levels</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div ref={scrollRef} className="overflow-auto relative max-h-[60vh]">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="sticky top-0 bg-background z-10 shadow-sm">
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pl-2.5 pr-2 font-medium">Product</th>
                  <th className="py-3 px-2 font-medium">Group</th>
                  <th className="py-3 px-2 font-medium">Brand</th>
                  <th className="py-3 px-2 font-medium text-right">Stock</th>
                  <th className="py-3 px-2 font-medium text-right">Min</th>
                  <th className="py-3 px-2 font-medium text-right">Max</th>
                  <th className="py-3 px-2 font-medium text-right">Price</th>
                  <th className="py-3 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {spacers.top > 0 && <tr style={{ height: spacers.top }}><td colSpan={8} /></tr>}
                {virtualizer.getVirtualItems().map((vi: any) => {
                  const p = items[vi.index];
                  return (
                    <tr key={p.id} data-index={vi.index} ref={virtualizer.measureElement} className="border-b last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(p.id)}>
                      <td className="py-2.5 pl-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5 text-muted-foreground">{p.group}</td>
                      <td className="py-2.5 text-muted-foreground">{p.brand}</td>
                      <td className="py-2.5 text-right">{p.qty}</td>
                      <td className="py-2.5 text-right">{p.min}</td>
                      <td className="py-2.5 text-right">{p.max}</td>
                      <td className="py-2.5 text-right">₹{p.price}</td>
                      <td className="py-2.5">
                        <Badge variant={p.qty <= p.min ? 'destructive' : p.qty >= p.max * 0.9 ? 'secondary' : 'default'}>
                          {p.qty <= p.min ? 'Low' : p.qty >= p.max * 0.9 ? 'Excess' : 'Normal'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {spacers.bottom > 0 && <tr style={{ height: spacers.bottom }}><td colSpan={8} /></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
