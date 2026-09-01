import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AddAccessDialogProps {
  addAccess: { selectedSkus: string[]; group: string; qty: number; price: number } | null;
  onAddAccessChange: (v: any) => void;
  onClose: () => void;
  onSave: () => void;
  accessGroupNames: string[];
  filteredStocks: any[];
  pagedStocks: any[];
  stockFilter: string;
  onStockFilterChange: (v: string) => void;
  stockPage: number;
  onStockPageChange: (p: number) => void;
  stockTotalPages: number;
  showSelectedOnly: boolean;
  onShowSelectedOnlyChange: (v: boolean) => void;
  stocksLoading: boolean;
}

const STOCK_PAGE_SIZE = 10;

export function AddAccessDialog({
  addAccess,
  onAddAccessChange,
  onClose,
  onSave,
  accessGroupNames,
  filteredStocks,
  pagedStocks,
  stockFilter,
  onStockFilterChange,
  stockPage,
  onStockPageChange,
  stockTotalPages,
  showSelectedOnly,
  onShowSelectedOnlyChange,
  stocksLoading,
}: AddAccessDialogProps) {
  return (
    <Dialog open={!!addAccess} onOpenChange={open => !open && onClose()}>
      <DialogContent className="!max-w-[70vw] h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>Add Stock Access</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 py-2 overflow-hidden">
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <Select value={addAccess?.group ?? ''} onValueChange={v => onAddAccessChange(addAccess ? { ...addAccess, group: v ?? addAccess.group } : null)}>
              <SelectTrigger><SelectValue placeholder="Select access group" /></SelectTrigger>
              <SelectContent>
                {accessGroupNames.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Qty</label>
              <Input type="number" value={addAccess?.qty ?? 0} onChange={e => onAddAccessChange(addAccess ? { ...addAccess, qty: Number(e.target.value) } : null)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Price</label>
              <Input type="number" value={addAccess?.price ?? 0} onChange={e => onAddAccessChange(addAccess ? { ...addAccess, price: Number(e.target.value) } : null)} />
            </div>
            <Input placeholder="Search by SKU, name, brand or model..." className="h-9 text-xs" value={stockFilter} onChange={e => { onStockFilterChange(e.target.value); onStockPageChange(1); }} />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <Checkbox checked={showSelectedOnly} onCheckedChange={v => onShowSelectedOnlyChange(!!v)} />
                  Only selected
                </label>
                <label className="text-sm font-medium">{filteredStocks.length} stocks · {addAccess?.selectedSkus.length ?? 0} selected</label>
              </div>
            </div>
            <div className="border rounded-lg flex-1 overflow-y-auto min-h-0">
              {stocksLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : filteredStocks.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">No stocks found</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-background text-xs font-semibold text-muted-foreground border-b sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 shrink-0"><Checkbox checked={pagedStocks.every(s => addAccess?.selectedSkus.includes(s.sku)) && pagedStocks.length > 0} onCheckedChange={v => { if (addAccess) { const ids = pagedStocks.map(s => s.sku); onAddAccessChange({ ...addAccess, selectedSkus: v ? [...new Set([...addAccess.selectedSkus, ...ids])] : addAccess.selectedSkus.filter(sk => !ids.includes(sk)) }); } }} /></div>
                      <div className="w-16 shrink-0 text-center">SKU</div>
                      <div className="flex-1 min-w-0">Name</div>
                      <div className="w-24 shrink-0">Brand</div>
                      <div className="w-20 shrink-0">Model</div>
                      <div className="w-16 shrink-0 text-right">Qty</div>
                      <div className="w-20 shrink-0 text-right">Price</div>
                    </div>
                  </div>
                  {pagedStocks.map(s => {
                    const checked = addAccess?.selectedSkus.includes(s.sku) ?? false;
                    return (
                      <div key={s.sku} className={`flex items-center gap-2 px-3 py-2 text-sm border-b last:border-0 hover:bg-muted/20 cursor-pointer ${checked ? 'bg-muted/30' : ''}`} onClick={() => { if (addAccess) onAddAccessChange({ ...addAccess, selectedSkus: checked ? addAccess.selectedSkus.filter(sk => sk !== s.sku) : [...addAccess.selectedSkus, s.sku] }); }}>
                        <div className="w-8 shrink-0"><Checkbox checked={checked} /></div>
                        <div className="w-16 shrink-0 font-mono text-xs truncate text-center">{s.sku}</div>
                        <div className="flex-1 min-w-0 truncate font-medium">{s.name}</div>
                        <div className="w-24 shrink-0 truncate text-muted-foreground">{s.brand || '—'}</div>
                        <div className="w-20 shrink-0 truncate text-muted-foreground">{s.model || '—'}</div>
                        <div className="w-16 shrink-0 text-right whitespace-nowrap">{s.qty}</div>
                        <div className="w-20 shrink-0 text-right whitespace-nowrap">₹{(s.price ?? 0).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {filteredStocks.length > STOCK_PAGE_SIZE && (
              <div className="flex items-center justify-center gap-1.5 mt-3 shrink-0">
                <Button size="sm" variant="outline" disabled={stockPage <= 1} onClick={() => onStockPageChange(stockPage - 1)}>Prev</Button>
                <span className="text-xs text-muted-foreground px-2">Page {stockPage} of {stockTotalPages}</span>
                <Button size="sm" variant="outline" disabled={stockPage >= stockTotalPages} onClick={() => onStockPageChange(stockPage + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!addAccess?.group || (addAccess?.selectedSkus.length ?? 0) === 0}>
            {addAccess?.selectedSkus.length ? `Add Access (${addAccess.selectedSkus.length} stocks)` : 'Add Access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
