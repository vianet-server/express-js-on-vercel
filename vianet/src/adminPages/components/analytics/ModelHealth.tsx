import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ModelHealthCard = () => (
  <Card>
    <CardHeader><CardTitle>Model Health</CardTitle></CardHeader>
    <CardContent>
      <div className="flex flex-col gap-4">
        {[
          { label: 'Training Epochs', value: '500', sub: 'Loss: 0.0042' },
          { label: 'Validation Score', value: 'R² = 0.91', sub: 'High confidence' },
          { label: 'Last Retrained', value: '2h ago', sub: 'Auto-retrain daily' },
          { label: 'Data Points', value: '24,582', sub: 'Last 12 months' },
        ].map((m) => (
          <div key={m.label} className="flex justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
            <span className="text-muted-foreground">{m.label}</span>
            <div className="text-right">
              <div className="font-medium">{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
