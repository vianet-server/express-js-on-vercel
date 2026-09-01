import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface AgeBucket {
  label: string;
  min: number;
  max: number;
  color: string;
}

interface AgeFilterDropdownProps {
  ageBuckets: AgeBucket[];
  ageFilter: string;
  data: any[];
  onAgeFilterChange: (label: string) => void;
}

export function AgeFilterDropdown({ ageBuckets, ageFilter, data, onAgeFilterChange }: AgeFilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant={ageFilter !== 'all' ? 'default' : 'outline'} size="sm" className="gap-1.5" />}>
        <Filter size={14} />
        {ageFilter === 'all' ? 'Filter by Age' : ageFilter}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onAgeFilterChange('all')}>All</DropdownMenuItem>
        {ageBuckets.map(b => (
          <DropdownMenuItem key={b.label} onClick={() => onAgeFilterChange(b.label)}>
            {b.label} ({data.filter((i: any) => i.days > b.min && i.days <= b.max).length})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}