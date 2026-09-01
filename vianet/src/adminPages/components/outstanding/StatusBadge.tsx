const statusStyles: Record<string, string> = {
  due: 'bg-blue-100 text-blue-700',
  overdue: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status] ?? ''}`}>
      {(status ?? '').charAt(0).toUpperCase() + (status ?? '').slice(1)}
    </span>
  );
}
