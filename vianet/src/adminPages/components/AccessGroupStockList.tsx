import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Package, Plus, Edit3, Trash2 } from 'lucide-react';

interface StockAccessItem {
  sku: string;
  name: string;
  brand: string;
  qty: number;
  price: number;
}

interface StockAccessListProps {
  stocks: StockAccessItem[];
  groupName: string;
  onEdit: (sku: string, qty: number, price: number) => void;
  onAdd: (sku: string, qty: number, price: number) => void;
  onRemove: (sku: string) => void;
}

export function AccessGroupStockList({ stocks, groupName, onEdit, onAdd, onRemove }: StockAccessListProps) {
  const [editTarget, setEditTarget] = useState<{ sku: string; qty: number; price: number } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<{ sku: string; qty: string; price: string } | null>(null);

  const allowed = stocks.filter(s => s.qty > 0);
  const blocked = stocks.filter(s => s.qty === 0);

  const openEdit = (s: StockAccessItem) => setEditTarget({ sku: s.sku, qty: s.qty, price: s.price });
  const saveEdit = () => {
    if (editTarget) { onEdit(editTarget.sku, editTarget.qty, editTarget.price); setEditTarget(null); }
  };
  const saveAdd = () => {
    if (addTarget) { onAdd(addTarget.sku, Number(addTarget.qty), Number(addTarget.price)); setAddOpen(false); setAddTarget(null); }
  };
  const handleRemove = (sku: string) => { onRemove(sku); };

  if (allowed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
        <Package size={40} />
        <span className="text-sm">No stocks accessible to this group yet.</span>
        <Button size="default" onClick={() => setAddOpen(true)}><Plus size={16} /> Add Access</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{allowed.length} stock{allowed.length > 1 ? 's' : ''} accessible</p>
        <Button size="default" onClick={() => setAddOpen(true)}><Plus size={16} /> Add</Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground border-b">
          <div className="col-span-3">Stock Name</div>
          <div className="col-span-2">Brand</div>
          <div className="col-span-2 text-right">Quantity</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-center">Access</div>
          <div className="col-span-1 text-center">Action</div>
        </div>
        {allowed.map((s, i) => (
          <div key={s.sku} className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b last:border-0 items-center hover:bg-muted/30 transition-colors ${i % 2 === 0 ? 'bg-muted/10' : ''}`}>
            <div className="col-span-3 font-medium">
              <span className="font-mono text-[10px] text-muted-foreground mr-1.5">{s.sku}</span>
              {s.name}
            </div>
            <div className="col-span-2 text-muted-foreground">{s.brand}</div>
            <div className="col-span-2 text-right font-medium">{s.qty}</div>
            <div className="col-span-2 text-right">₹{s.price.toLocaleString()}</div>
            <div className="col-span-2 text-center">
              <Badge variant="default" className="text-[10px] gap-1"><ShieldCheck size={10} /> Granted</Badge>
            </div>
            <div className="col-span-1 flex items-center justify-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" onClick={() => openEdit(s)} title="Edit"><Edit3 size={13} /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => handleRemove(s.sku)} title="Revoke access"><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Access — {editTarget?.sku}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                <Input type="number" value={editTarget?.qty ?? 0} onChange={e => setEditTarget(p => p ? { ...p, qty: Number(e.target.value) } : p)} className="text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                <Input type="number" value={editTarget?.price ?? 0} onChange={e => setEditTarget(p => p ? { ...p, price: Number(e.target.value) } : p)} className="text-sm" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Set qty to 0 to revoke access.</span>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setAddTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Access — {groupName}</DialogTitle></DialogHeader>
          {blocked.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <ShieldCheck size={28} className="text-green-600" />
              <span className="text-sm">All stocks already have access to this group.</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {blocked.map(s => (
                  <label key={s.sku} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${addTarget?.sku === s.sku ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-400' : 'border-muted hover:bg-muted'}`} onClick={() => setAddTarget({ sku: s.sku, qty: '1', price: String(s.price || 0) })}>
                    <input type="radio" name="add-stock" checked={addTarget?.sku === s.sku} onChange={() => {}} className="accent-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.sku} — {s.brand} — ₹{s.price.toLocaleString()}</div>
                    </div>
                  </label>
                ))}
              </div>
              {addTarget && (
                <div className="grid grid-cols-2 gap-3 border-t pt-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                    <Input type="number" value={addTarget.qty} onChange={e => setAddTarget(p => p ? { ...p, qty: e.target.value } : p)} className="text-sm" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                    <Input type="number" value={addTarget.price} onChange={e => setAddTarget(p => p ? { ...p, price: e.target.value } : p)} className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddTarget(null); }}>Cancel</Button>
            <Button onClick={saveAdd} disabled={!addTarget} className="gap-1.5"><Plus size={14} /> Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
