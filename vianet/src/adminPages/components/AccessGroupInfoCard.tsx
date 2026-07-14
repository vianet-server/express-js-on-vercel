import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InfoCardProps {
  sku: string;
  name: string;
  brand: string;
  status: string;
}

export function AccessGroupInfoCard({ sku, name, brand, status }: InfoCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Product Info</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-xs text-muted-foreground">SKU</span><div className="font-mono text-sm mt-0.5">{sku}</div></div>
          <div><span className="text-xs text-muted-foreground">Name</span><div className="font-medium text-sm mt-0.5">{name}</div></div>
          <div><span className="text-xs text-muted-foreground">Brand</span><div className="text-sm mt-0.5">{brand}</div></div>
          <div><span className="text-xs text-muted-foreground">Status</span><div className="text-sm mt-0.5">{status}</div></div>
        </div>
      </CardContent>
    </Card>
  );
}
