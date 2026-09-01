import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CreateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onKeyNameChange: (v: string) => void;
  group: string;
  onGroupChange: (v: string) => void;
  permissions: string[];
  onTogglePerm: (id: string) => void;
  duration: string;
  onDurationChange: (v: string) => void;
  allPermissions: { id: string; label: string }[];
  accessGroups: { id: number; name: string }[];
  durationOptions: { value: string; label: string }[];
  onSubmit: () => void;
}

export function CreateKeyDialog({
  open, onOpenChange,
  keyName, onKeyNameChange,
  group, onGroupChange,
  permissions, onTogglePerm,
  duration, onDurationChange,
  allPermissions, accessGroups, durationOptions,
  onSubmit,
}: CreateKeyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Generate New API Key</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label>Key Name</Label>
            <Input placeholder="e.g. Production Key" value={keyName} onChange={e => onKeyNameChange(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Associated Access Group</Label>
            <Select value={group} onValueChange={(v) => v && onGroupChange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select access group..." />
              </SelectTrigger>
              <SelectContent>
                {accessGroups.map(g => (
                  <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={permissions.includes(p.id)} onCheckedChange={() => onTogglePerm(p.id)} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Max User Active Duration</Label>
            <Select value={duration} onValueChange={(v) => v && onDurationChange(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration..." />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!keyName || !group || permissions.length === 0}>Generate Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
