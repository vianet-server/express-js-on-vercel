import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserCheck, CheckCircle, Copy, Check, Loader2 } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  createdLink: string;
  onCopyLink: () => void;
  copied: boolean;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  submitting,
  createdLink,
  onCopyLink,
  copied,
}: CreateGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Access Group</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {createdLink ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg border p-3 bg-green-50">
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">Access group created!</span>
              </div>
              <div className="flex items-center gap-2">
                <Input value={window.location.origin + createdLink} readOnly className="text-xs" />
                <Button variant="secondary" size="sm" className="gap-1.5 shrink-0" onClick={onCopyLink}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Group Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => onFormChange({ ...form, name: e.target.value })} placeholder="e.g. Warehouse Mgrs" />
              </div>
            </>
          )}
        </div>
        {!createdLink && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={!form.name.trim() || submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              {submitting ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        )}
        {createdLink && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { onOpenChange(false); }}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
