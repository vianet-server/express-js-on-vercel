import { useNavigate } from 'react-router-dom';

interface GroupPillsProps {
  visibleGroups: string[];
}

export function GroupPills({ visibleGroups }: GroupPillsProps) {
  const navigate = useNavigate();

  if (visibleGroups.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {visibleGroups.map(g => (
        <button
          key={g}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => navigate(`/admin/inventory/access-group/${encodeURIComponent(g)}`)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}