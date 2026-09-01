import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface SkuTableProps {
  filtered: any[];
  visibleGroups: string[];
  accessGroupNames: string[];
  mounted: boolean;
  virtualizer: any;
  onEdit: (sku: string, group: string, field: string) => void;
  onContextMenu: (e: React.MouseEvent, row: any) => void;
  onRowClick: (sku: string) => void;
}

export function SkuTable({ filtered, visibleGroups, mounted, virtualizer, onEdit, onContextMenu }: SkuTableProps) {
  const navigate = useNavigate();

  return (
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b">
            <th rowSpan={2} className="sticky left-0 z-10 bg-white dark:bg-gray-900 pb-2 pt-3 px-3 font-medium text-left text-muted-foreground min-w-[72px]">DB ID</th>
            <th colSpan={4} className="pb-1 pt-3 px-3 font-semibold text-center text-xs text-muted-foreground border-x bg-muted/30">Inventory</th>
            {visibleGroups.map(g => (
              <th key={g} colSpan={3} className="pb-1 pt-3 px-2 font-semibold text-center text-[10px] text-muted-foreground border-x bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors min-w-[120px]" onClick={() => { navigate(`/admin/inventory/access-group/${encodeURIComponent(g)}`); }}>
                <div className="flex items-center justify-center gap-1"><Users size={10} />{g}</div>
              </th>
            ))}
            <th rowSpan={2} className="pb-2 pt-3 px-3 font-medium text-left text-muted-foreground min-w-[72px]">Status</th>
          </tr>
          <tr className="border-b">
            <th className="pb-2 px-3 font-medium text-left text-muted-foreground text-[11px] min-w-[120px]">Name</th>
            <th className="pb-2 px-3 font-medium text-left text-muted-foreground text-[11px] min-w-[80px]">Brand</th>
            <th className="pb-2 px-3 font-medium text-right text-muted-foreground text-[11px] min-w-[56px]">Qty</th>
            <th className="pb-2 px-3 font-medium text-right text-muted-foreground text-[11px] border-r min-w-[64px]">Price</th>
            {visibleGroups.map(g => (
              <Fragment key={g}>
                <th className="pb-2 px-2 font-medium text-left text-muted-foreground text-[11px] min-w-[80px]">P-SKU</th>
                <th className="pb-2 px-2 font-medium text-right text-muted-foreground text-[11px]">Qty</th>
                <th className="pb-2 px-2 font-medium text-right text-muted-foreground text-[11px] border-r">Price</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {mounted && filtered.length > 0 && (() => {
            const items = virtualizer.getVirtualItems();
            const totalSize = virtualizer.getTotalSize();
            const colSpan = 2 + 4 + visibleGroups.length * 3;
            const lead = items[0]?.start ?? 0;
            const tail = totalSize - (items[items.length - 1]?.end ?? 0);
            return (
              <Fragment>
                {lead > 0 && (
                  <tr style={{ height: lead }}>
                    <td colSpan={colSpan} />
                  </tr>
                )}
                {items.map((virtualRow: any) => {
                  const s = filtered[virtualRow.index];
                  return (
                    <tr key={virtualRow.key} data-index={virtualRow.index} ref={virtualizer.measureElement} className="border-b last:border-0 hover:bg-muted/20 relative" onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, s); }}>
                      <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 py-2.5 px-3 font-mono text-xs text-muted-foreground truncate">{s.sku}</td>
                      <td className="py-2.5 px-3 font-medium truncate">{s.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate">{s.brand}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">{s.qty}</td>
                      <td className="py-2.5 px-3 text-right border-r whitespace-nowrap">₹{(s.price ?? 0).toLocaleString()}</td>
                      {visibleGroups.map(g => {
                        const ag = (s.accessGroups ?? []).find((a: any) => a.group === g);
                        return (
                          <Fragment key={g}>
                            <td className="py-2.5 px-2 text-left cursor-pointer whitespace-nowrap text-[11px] text-muted-foreground" onClick={() => onEdit(s.sku, g, 'partnerSkuName')}>
                              {ag && ag.partnerSkuName ? ag.partnerSkuName : '-'}
                            </td>
                            <td className="py-2.5 px-2 text-right cursor-pointer whitespace-nowrap" onClick={() => onEdit(s.sku, g, 'qty')}>
                              {ag && ag.qty > 0 ? ag.qty : <span className="text-amber-600 font-medium">Blocked</span>}
                            </td>
                            <td className="py-2.5 px-2 text-right border-r cursor-pointer whitespace-nowrap" onClick={() => onEdit(s.sku, g, 'price')}>
                              {ag && ag.qty > 0 ? `₹${ag.price.toLocaleString()}` : <span className="text-amber-600 font-medium">Blocked</span>}
                            </td>
                          </Fragment>
                        );
                      })}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant={s.status === 'Active' ? 'default' : s.status === 'Inactive' ? 'secondary' : 'destructive'}>{s.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {tail > 0 && (
                  <tr style={{ height: tail }}>
                    <td colSpan={colSpan} />
                  </tr>
                )}
              </Fragment>
            );
          })()}
        </tbody>
      </table>
  );
}
