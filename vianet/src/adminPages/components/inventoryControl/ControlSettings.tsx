import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';

interface ControlSettingsProps {
  settings: any[];
  onToggle: (id: string) => void;
}

export function ControlSettings({ settings, onToggle }: ControlSettingsProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Control Settings</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {settings.map((s, i) => (
            <div key={s.id} className={`flex items-center justify-between py-3 ${i < settings.length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`flex size-9 items-center justify-center rounded-lg ${s.defaultEnabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
              </div>
              <Button
                variant={s.defaultEnabled ? 'default' : 'secondary'}
                size="sm"
                onClick={() => onToggle(s.id)}
                className="gap-1.5 text-xs"
              >
                {s.defaultEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {s.defaultEnabled ? 'Active' : 'Disabled'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
