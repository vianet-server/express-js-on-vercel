import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const MediaSection = lazy(() => import('./components/inventoryStockDetail').then(m => ({ default: m.MediaSection })));
const ProductForm = lazy(() => import('./components/inventoryStockDetail').then(m => ({ default: m.ProductForm })));
const StockStatusCard = lazy(() => import('./components/inventoryStockDetail').then(m => ({ default: m.StockStatusCard })));
const PricingCard = lazy(() => import('./components/inventoryStockDetail').then(m => ({ default: m.PricingCard })));

interface StockItem {
  id: number; name: string; brand: string; model: string; variant: string; color: string;
  qty: number; price: number; gst: number; min: number; max: number;
  description: string; details: string; tags: string; url: string; id_no: string;
}

export function InventoryStockDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StockItem | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    api.get(`/api/admin/inventory/stock/${id}`).then(res => {
      setForm(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const save = async () => {
    if (!form || !id) return;
    setSaving(true);
    try {
      await api.post(`/api/admin/inventory/stock/${id}`, form);
      setDirty(false);
    } catch (e) {
      console.error('Save failed', e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-64 p-6">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/admin/inventory/stock')}><ArrowLeft size={14} /> Back to Stock</Button>
      </div>
    );
  }

  const updateField = (key: string, value: string) => {
    setForm(prev => prev ? { ...prev, [key]: isNaN(Number(value)) ? value : Number(value) } : prev);
    setDirty(true);
  };

  const handleBack = () => {
    if (dirty) { setConfirmDiscard(true); return; }
    navigate('/admin/inventory/stock');
  };

  return (
    <Suspense fallback={<Loader2 className="animate-spin size-8 text-muted-foreground" />}>
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft size={16} /></Button>
          <h1 className="text-3xl font-bold tracking-tight">{form.name}</h1>
          <Badge className="text-xs">{form.brand} {form.model}</Badge>
          <Badge variant="outline" className="text-xs">{form.id_no || ''}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" className="gap-1.5">
            <Upload size={14} /> Upload Media
          </Button>
          {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/inventory/stock')}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MediaSection />
          <ProductForm form={form} onUpdateField={updateField} />
        </div>

        <div className="flex flex-col gap-4">
          <StockStatusCard qty={form.qty} min={form.min} max={form.max} />
          <PricingCard price={form.price} qty={form.qty} gst={form.gst} />
        </div>
      </div>

      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent>
          <DialogHeader><DialogTitle>Discard Changes?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">You have unsaved changes. Are you sure you want to go back?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>Stay</Button>
            <Button variant="destructive" onClick={() => { setDirty(false); navigate('/admin/inventory/stock'); }}>Discard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Suspense>
  );
}
