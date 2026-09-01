import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X, Shield } from 'lucide-react';

interface PermissionsDialogProps {
  user: any | null;
  onClose: () => void;
  editForm: {
    user_type: string;
    access_group_id: string;
    is_active: boolean;
  };
  onEditFormChange: (form: any) => void;
  onSave: () => void;
  saving: boolean;
  accessGroups: { id: number; name: string }[];
}

export function PermissionsDialog({ user, onClose, editForm, onEditFormChange, onSave, saving, accessGroups }: PermissionsDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={18} /> Permissions — {user?.email}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">User Type</label>
            <select value={editForm.user_type} onChange={e => onEditFormChange({ ...editForm, user_type: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Access Group</label>
            <select value={editForm.access_group_id} onChange={e => onEditFormChange({ ...editForm, access_group_id: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">None</option>
              {accessGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editForm.is_active} onChange={e => onEditFormChange({ ...editForm, is_active: e.target.checked })} />
            Active
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}><X size={14} /> Cancel</Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
