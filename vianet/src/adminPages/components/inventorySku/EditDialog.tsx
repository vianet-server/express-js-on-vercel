import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EditDialogProps {
  editTarget: { sku: string; group: string; field: string; value: string | number } | null;
  onEditTargetChange: (v: any) => void;
  onSave: () => void;
}

export function EditDialog({ editTarget, onEditTargetChange, onSave }: EditDialogProps) {
  return (
    <Dialog open={!!editTarget} onOpenChange={open => !open && onEditTargetChange(null)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {editTarget?.field === 'qty' ? 'Quantity' : editTarget?.field === 'price' ? 'Price' : 'Partner SKU Name'} &mdash; {editTarget?.group}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-sm">{editTarget?.sku}</span>
          <span className="text-sm text-muted-foreground">({editTarget?.group})</span>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{editTarget?.field === 'qty' ? 'Quantity' : editTarget?.field === 'price' ? 'Price (₹)' : 'Partner SKU Name'}</label>
          <Input
            type={editTarget?.field === 'partnerSkuName' ? 'text' : 'number'}
            value={editTarget?.value ?? ''}
            onChange={(e) => onEditTargetChange(editTarget ? { ...editTarget, value: editTarget.field === 'partnerSkuName' ? e.target.value : Number(e.target.value) } : null)}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onEditTargetChange(null)}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
