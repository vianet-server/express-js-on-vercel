import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Loader2, Plus } from 'lucide-react';

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  searchResults: any[];
  searching: boolean;
  newQty: string;
  onNewQtyChange: (v: string) => void;
  newPrice: string;
  onNewPriceChange: (v: string) => void;
  adding: number | null;
  onAddStock: (stock: any) => void;
}

export function AddStockDialog({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  searchResults,
  searching,
  newQty,
  onNewQtyChange,
  newPrice,
  onNewPriceChange,
  adding,
  onAddStock,
}: AddStockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: '70vw' }} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search stock by name, brand... (Enter to search)" value={searchQuery} onChange={e => onSearchChange(e.target.value)} onKeyDown={onSearchKeyDown} autoFocus />
          </div>
          {searching && <div className="text-sm text-muted-foreground text-center py-2"><Loader2 className="animate-spin inline size-4 mr-1" />Searching...</div>}
          {!searching && searchQuery && searchResults.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">No stocks found.</div>
          )}
          {searchResults.length > 0 && (
            <div className="text-xs text-muted-foreground mb-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>
          )}
          {searchResults.map((stock) => (
            <div key={stock.id} className="flex flex-wrap items-center gap-2 border rounded-lg p-3">
              <div className="flex-1 min-w-0 basis-full sm:basis-0">
                <div className="text-sm font-medium truncate">{stock.name}</div>
                {stock.brand && <div className="text-xs text-muted-foreground">{stock.brand}{stock.model ? ` / ${stock.model}` : ''}</div>}
              </div>
              <Input type="number" placeholder="Qty" className="w-16 h-8 text-xs" value={adding === stock.id ? (newQty || '') : ''} onChange={e => onNewQtyChange(e.target.value)} />
              <Input type="number" placeholder="Price" className="w-20 h-8 text-xs" value={adding === stock.id ? (newPrice || '') : ''} onChange={e => onNewPriceChange(e.target.value)} />
              <Button size="sm" className="h-8 text-xs" disabled={adding === stock.id} onClick={() => onAddStock(stock)}>
                {adding === stock.id ? <Loader2 className="animate-spin size-3" /> : <Plus size={12} />} Add
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
