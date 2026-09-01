import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';

export interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  variant?: 'positive' | 'negative' | 'neutral';
}

export function StatCard({ title, value, change, changeLabel, icon, variant = 'neutral' }: StatCardProps) {
  const changeClass = variant === 'positive' ? 'text-green-600' : variant === 'negative' ? 'text-red-500' : 'text-muted-foreground';
  const iconSvg = variant === 'positive' ? 'ArrowUpRight' : variant === 'negative' ? 'ArrowDownRight' : 'ArrowUpRight';

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-full">{icon}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => {}}><i18n key="export-pdf" /> Export to PDF</ContextMenuItem>
        <ContextMenuItem onClick={() => {}}><i18n key="export-excel" /> Export to Excel</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => {}}><i18n key="detail" /> Detail</ContextMenuItem>
        <ContextMenuItem onClick={() => {}}><i18n key="settings" /> Settings</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}