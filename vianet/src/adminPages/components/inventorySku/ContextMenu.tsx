import { Eye, Plus, Edit3 } from 'lucide-react';

interface ContextMenuProps {
  contextMenu: { x: number; y: number; row: any } | null;
  onClose: () => void;
  onViewAccess: (group: string) => void;
  onAddAccess: (sku: string) => void;
  onEdit: (sku: string) => void;
  visibleGroups: string[];
  accessGroupNames: string[];
}

export function ContextMenu({ contextMenu, onClose, onViewAccess, onAddAccess, onEdit, visibleGroups, accessGroupNames }: ContextMenuProps) {
  if (!contextMenu) return null;

  const defaultGroup = (contextMenu.row.accessGroups ?? [])[0]?.group || visibleGroups[0] || accessGroupNames[0];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bg-white dark:bg-gray-900 rounded-lg border shadow-xl py-1 min-w-48"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center gap-2">
          <span className="font-mono text-[10px]">{contextMenu.row.sku}</span>
          <span className="truncate">{contextMenu.row.name}</span>
        </div>
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => { onViewAccess(defaultGroup); onClose(); }}
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-blue-700"><Eye size={14} /></div>
          View Access Details
        </button>
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => { onAddAccess(contextMenu.row.sku); onClose(); }}
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-green-100 text-green-700"><Plus size={14} /></div>
          Add Access
        </button>
        <div className="border-t mx-2" />
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => { onEdit(contextMenu.row.sku); onClose(); }}
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-amber-100 text-amber-700"><Edit3 size={14} /></div>
          Edit Price & Quantity
        </button>
      </div>
    </div>
  );
}
