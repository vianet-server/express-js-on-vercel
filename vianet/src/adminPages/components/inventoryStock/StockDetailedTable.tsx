import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Edit3, ExternalLink, Loader2 } from 'lucide-react';

interface StockDetailedTableProps {
  items: any[];
  loading: boolean;
  onRowClick: (id: number) => void;
  onEdit: (item: any) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: any;
  spacers: { top: number; bottom: number };
}

export function StockDetailedTable({ items, loading, onRowClick, onEdit, scrollRef, virtualizer, spacers }: StockDetailedTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Stock View</CardTitle>
      </CardHeader>
      <CardContent className="relative p-0">
        {loading && (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground absolute inset-0 bg-background/50 z-20">
            <Loader2 className="animate-spin size-4 mr-2" /> Loading...
          </div>
        )}
        <div ref={scrollRef} className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="sticky top-0 bg-background z-10 shadow-sm">
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 font-medium whitespace-nowrap px-2 first:pl-0">Stock Name</th>
                <th className="py-3 font-medium whitespace-nowrap px-2">Group</th>
                <th className="py-3 font-medium whitespace-nowrap px-2">Brand</th>
                <th className="py-3 font-medium whitespace-nowrap px-2">Model</th>
                <th className="py-3 font-medium whitespace-nowrap px-2">Variant</th>
                <th className="py-3 font-medium whitespace-nowrap px-2">Color</th>
                <th className="py-3 font-medium whitespace-nowrap px-2 text-right">Qty</th>
                <th className="py-3 font-medium whitespace-nowrap px-2 text-right">Price</th>
                <th className="py-3 font-medium whitespace-nowrap px-2 text-right">GST %</th>
              </tr>
            </thead>
            <tbody>
              {spacers.top > 0 && <tr style={{ height: spacers.top }}><td colSpan={9} /></tr>}
              {virtualizer.getVirtualItems().map((vi: any) => {
                const p = items[vi.index];
                return (
                  <ContextMenu key={p.id}>
                    <ContextMenuTrigger className="contents">
                      <tr data-index={vi.index} ref={virtualizer.measureElement} className="border-b last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(p.id)}>
                        <td className="px-2 py-2.5 font-medium first:pl-0">{p.name}</td>
                        <td className="px-2 py-2.5">{p.group}</td>
                        <td className="px-2 py-2.5">{p.brand}</td>
                        <td className="px-2 py-2.5">{p.model}</td>
                        <td className="px-2 py-2.5">{p.variant}</td>
                        <td className="px-2 py-2.5">{p.color}</td>
                        <td className="px-2 py-2.5 text-right font-medium">{p.qty}</td>
                        <td className="px-2 py-2.5 text-right">₹{(p.price ?? 0).toLocaleString()}</td>
                        <td className="px-2 py-2.5 text-right">{p.gst}%</td>
                      </tr>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onEdit(p)}>
                        <Edit3 size={14} /> Edit All Fields
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onRowClick(p.id)}>
                        <ExternalLink size={14} /> Open Detail Page
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
              {spacers.bottom > 0 && <tr style={{ height: spacers.bottom }}><td colSpan={9} /></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
