import { CalendarClock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmailFormProps {
  form: {
    name: string;
    email: string;
    accessGroup: string;
    brand: string;
    schedule: string;
    includePrice: boolean;
    includeDetailed: boolean;
  };
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  error: string;
  accessGroups: { id: number; name: string }[];
  brands: string[];
}

const SCHEDULES = [
  { value: 'everyday', label: 'Everyday' },
  { value: 'every-week', label: 'Every Week' },
  { value: 'mid-week', label: 'Twice a Week (Mid Week)' },
  { value: 'every-month', label: 'Every Month' },
  { value: 'every-quarter', label: 'Every Quarter' },
];

export function EmailForm({ form, onFormChange, onSubmit, error, accessGroups, brands }: EmailFormProps) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock size={18} /> New Email Campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Email Name</label>
          <Input
            placeholder="e.g. Weekly Stock Update"
            value={form.name}
            onChange={e => onFormChange({ ...form, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={form.email}
            onChange={e => onFormChange({ ...form, email: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Access Group</label>
          <Select value={form.accessGroup} onValueChange={val => onFormChange({ ...form, accessGroup: val ?? '' })}>
            <SelectTrigger>
              <SelectValue placeholder="Select access group" />
            </SelectTrigger>
            <SelectContent>
              {accessGroups.map(g => (
                <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Brand</label>
          <Select value={form.brand} onValueChange={val => onFormChange({ ...form, brand: val ?? '' })}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Schedule</label>
          <Select value={form.schedule} onValueChange={val => onFormChange({ ...form, schedule: val ?? 'everyday' })}>
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Include Price</div>
              <div className="text-xs text-muted-foreground">Show product prices in email</div>
            </div>
            <Switch
              checked={form.includePrice}
              onCheckedChange={v => onFormChange({ ...form, includePrice: !!v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Include Detailed</div>
              <div className="text-xs text-muted-foreground">Show detailed item breakdown</div>
            </div>
            <Switch
              checked={form.includeDetailed}
              onCheckedChange={v => onFormChange({ ...form, includeDetailed: !!v })}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={onSubmit}>
            <Plus size={14} /> Create Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
