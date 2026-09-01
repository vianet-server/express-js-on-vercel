import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Save, Loader2 } from 'lucide-react';

interface StockGridProps {
  items: any[];
  editing: Record<number, { qty: number; price: number; gst: number }>;
  onEdit: (item: any) => void;
  onCancelEdit: (id: number) => void;
  onSave: (item: any) => void;
  onRemove: (item: any) => void;
  onEditingChange: (id: number, field: string, value: number) => void;
  saving: number | null;
}

export function StockGrid({ items, editing, onEdit, onCancelEdit, onSave, onRemove, onEditingChange, saving }: StockGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground border-b">
        <div className="col-span-3">Stock Name</div>
        <div className="col-span-1 font-mono">SKU</div>
        <div className="col-span-2">Brand / Model</div>
        <div className="col-span-1 text-right">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-1 text-right">GST</div>
        <div className="col-span-2 text-center"></div>
      </div>
      {items.map((item) => {
        const isEditing = editing[item.id] != null;
        const edit = editing[item.id];
        return (
          <div key={item.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b last:border-0 items-center hover:bg-muted/30 transition-colors">
            <div className="col-span-3 font-medium truncate cursor-pointer hover:underline" onClick={() => onEdit(item)}>{item.name}</div>
            <div className="col-span-1 text-muted-foreground font-mono text-xs truncate">{item.sku || '-'}</div>
            <div className="col-span-2 text-muted-foreground truncate">{item.brand}{item.brand && item.model ? ' / ' : ''}{item.model}</div>
            <div className="col-span-1 text-right">
              {isEditing ? (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="icon" className="size-5" onClick={() => onEditingChange(item.id, 'qty', Math.max(0, edit.qty - 1))}>-</Button>
                  <Input type="number" className="w-12 h-7 text-xs text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={edit.qty} onChange={e => onEditingChange(item.id, 'qty', Math.max(0, parseInt(e.target.value) || 0))} />
                  <Button variant="outline" size="icon" className="size-5" onClick={() => onEditingChange(item.id, 'qty', edit.qty + 1)}>+</Button>
                </div>
              ) : (
                <span className="font-semibold cursor-pointer hover:underline" onClick={() => onEdit(item)}>{Number(item.qty).toLocaleString()}</span>
              )}
            </div>
            <div className="col-span-2 text-right">
              {isEditing ? (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="icon" className="size-5" onClick={() => onEditingChange(item.id, 'price', Math.max(0, edit.price - 1))}>-</Button>
                  <Input type="number" className="w-16 h-7 text-xs text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" value={edit.price} onChange={e => onEditingChange(item.id, 'price', Math.max(0, parseFloat(e.target.value) || 0))} />
                  <Button variant="outline" size="icon" className="size-5" onClick={() => onEditingChange(item.id, 'price', edit.price + 1)}>+</Button>
                </div>
              ) : (
                <span className="font-semibold cursor-pointer hover:underline" onClick={() => onEdit(item)}>{Number(item.price).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
              )}
            </div>
            <div className="col-span-1 text-right">
              {isEditing ? (
                <Input type="number" className="w-14 h-7 text-xs text-right" value={edit.gst} onChange={e => onEditingChange(item.id, 'gst', parseFloat(e.target.value) || 0)} />
              ) : (
                <span className="cursor-pointer hover:underline text-muted-foreground" onClick={() => onEdit(item)}>{item.gst != null ? `${item.gst}%` : '-'}</span>
              )}
            </div>
            <div className="col-span-2 flex items-center justify-center gap-1">
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-600" onClick={() => onRemove(item)} title="Remove"><Trash2 size={13} /></Button>
              {isEditing && (
                <>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={() => onCancelEdit(item.id)} title="Cancel">X</Button>
                  <Button size="icon" className="size-7" onClick={() => onSave(item)} disabled={saving === item.id} title="Save">
                    {saving === item.id ? <Loader2 className="animate-spin size-3" /> : <Save size={12} />}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
