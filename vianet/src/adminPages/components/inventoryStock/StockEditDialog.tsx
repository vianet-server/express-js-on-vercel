import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';

interface StockEditDialogProps {
  item: any | null;
  form: any | null;
  onFormChange: (form: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const editFields = [
  { key: 'name', label: 'Stock Name', type: 'text' },
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'variant', label: 'Variant', type: 'text' },
  { key: 'color', label: 'Color', type: 'text' },
  { key: 'qty', label: 'Quantity', type: 'number' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'gst', label: 'GST %', type: 'number' },
  { key: 'min', label: 'Min Stock', type: 'number' },
  { key: 'max', label: 'Max Stock', type: 'number' },
];

export function StockEditDialog({ item, form, onFormChange, onClose, onSave }: StockEditDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit All — {item?.name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {editFields.map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              <Input
                type={f.type}
                value={form ? String(form[f.key]) : ''}
                onChange={e => onFormChange(form ? { ...form, [f.key]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } : form)}
                className="text-sm h-8"
              />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}><X size={14} /> Cancel</Button>
          <Button size="sm" onClick={onSave}><Check size={14} /> Save All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
