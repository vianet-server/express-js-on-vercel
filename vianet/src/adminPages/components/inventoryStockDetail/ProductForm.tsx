import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Hash, Link, Tag } from 'lucide-react';

interface ProductFormProps {
  form: any;
  onUpdateField: (key: string, value: string) => void;
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

export function ProductForm({ form, onUpdateField }: ProductFormProps) {
  return (
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
                value={String(form[f.key as keyof typeof form] ?? '')}
                onChange={e => onUpdateField(f.key, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><FileText size={12} /> Description</label>
            <Textarea
              value={form.description ?? ''}
              onChange={e => onUpdateField('description', e.target.value)}
              className="text-sm min-h-20"
            />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><FileText size={12} /> Details</label>
            <Textarea
              value={form.details ?? ''}
              onChange={e => onUpdateField('details', e.target.value)}
              className="text-sm min-h-20"
            />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Tag size={12} /> Tags</label>
            <Input
              value={form.tags ?? ''}
              onChange={e => onUpdateField('tags', e.target.value)}
              className="text-sm"
              placeholder="comma-separated tags"
            />
            <div className="flex gap-1.5 flex-wrap mt-1">
              {(form.tags || '').split(',').filter(Boolean).map((tag: string, i: number) => (
                <span key={i} className="inline-block rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-medium">{tag.trim()}</span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
