import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  search: string;
  onSearchChange: (v: string) => void;
}

export function SearchBar({ search, onSearchChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-md">
      <Search size={14} className="text-muted-foreground shrink-0" />
      <Input placeholder="Search by SKU, product or brand..." value={search} onChange={e => onSearchChange(e.target.value)} className="border-0 p-0 h-auto text-sm focus-visible:ring-0" />
    </div>
  );
}