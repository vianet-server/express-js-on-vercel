import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Upload, Image, Video, Tag, Link, FileText, Hash, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface StockItem {
  id: number; name: string; brand: string; model: string; variant: string; color: string;
  qty: number; price: number; gst: number; min: number; max: number;
  description: string; details: string; tags: string; url: string; id_no: string;
}

const mainFields = [
  { key: 'name', label: 'Stock Name', icon: FileText },
  { key: 'id_no', label: 'ID No', icon: Hash },
  { key: 'brand', label: 'Brand', icon: null },
  { key: 'model', label: 'Model', icon: null },
  { key: 'variant', label: 'Variant', icon: null },
  { key: 'color', label: 'Color', icon: null },
  { key: 'qty', label: 'Quantity', type: 'number', icon: null },
  { key: 'price', label: 'Price', type: 'number', icon: null },
  { key: 'gst', label: 'GST %', type: 'number', icon: null },
  { key: 'min', label: 'Min Stock', type: 'number', icon: null },
  { key: 'max', label: 'Max Stock', type: 'number', icon: null },
  { key: 'url', label: 'URL', icon: Link },
];

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
      await api.put(`/api/admin/inventory/stock/${id}`, form);
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
          <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/20">
                    {i === 1 ? <Image size={24} /> : i === 2 ? <Video size={24} /> : <Image size={24} />}
                    <span className="text-xs">{i === 1 ? 'Image' : i === 2 ? 'Video' : 'Image'}</span>
                    <span className="text-[10px]">No media</span>
                  </div>
                ))}
                <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <Upload size={24} />
                  <span className="text-xs">Add Media</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mainFields.map(f => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      {f.icon && <f.icon size={12} />} {f.label}
                    </label>
                    <Input
                      type={f.type || 'text'}
                      value={String(form[f.key as keyof StockItem] ?? '')}
                      onChange={e => updateField(f.key, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><FileText size={12} /> Description</label>
                  <Textarea
                    value={form.description ?? ''}
                    onChange={e => updateField('description', e.target.value)}
                    className="text-sm min-h-20"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><FileText size={12} /> Details</label>
                  <Textarea
                    value={form.details ?? ''}
                    onChange={e => updateField('details', e.target.value)}
                    className="text-sm min-h-20"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Tag size={12} /> Tags</label>
                  <Input
                    value={form.tags ?? ''}
                    onChange={e => updateField('tags', e.target.value)}
                    className="text-sm"
                    placeholder="comma-separated tags"
                  />
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {(form.tags || '').split(',').filter(Boolean).map((tag, i) => (
                      <span key={i} className="inline-block rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stock Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock</span>
                  <span className="font-bold text-lg">{form.qty}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Level</span>
                  <span>{form.min}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Level</span>
                  <span>{form.max}</span>
                </div>
                <div className="mt-1">
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${form.qty <= form.min ? 'bg-red-500' : form.qty >= form.max * 0.9 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (form.qty / Math.max(1, form.max)) * 100)}%` }}
                    />
                  </div>
                </div>
                <Badge variant={form.qty <= form.min ? 'destructive' : form.qty >= form.max * 0.9 ? 'secondary' : 'default'} className="self-start">
                  {form.qty <= form.min ? 'Low Stock' : form.qty >= form.max * 0.9 ? 'Overstocked' : 'In Stock'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pricing</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-bold">\u20b9{(form.price ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST</span>
                  <span>{form.gst}%</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Stock Value</span>
                  <span className="font-bold">\u20b9{(form.qty * (form.price ?? 0)).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
  );
}
