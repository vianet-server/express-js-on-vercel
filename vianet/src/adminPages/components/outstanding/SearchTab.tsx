import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { AgeFilterDropdown } from './AgeFilterDropdown';

interface SearchTabProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  ageFilter: string;
  onAgeFilterChange: (v: string) => void;
  ageBuckets: { label: string; min: number; max: number; color: string }[];
  filteredData: any[];
  data: any[];
}

export function SearchTab({ searchQuery, onSearchChange, ageFilter, onAgeFilterChange, ageBuckets, filteredData, data }: SearchTabProps) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Search size={16} className="text-muted-foreground" />
        <Input placeholder="Search by customer name..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="max-w-sm" />
        <AgeFilterDropdown ageBuckets={ageBuckets} ageFilter={ageFilter} data={data} onAgeFilterChange={onAgeFilterChange} />
      </div>
      <Card>
        <CardContent>
          {filteredData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No entries match your criteria.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Days</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2.5 font-medium">{item.customer}</td>
                    <td className="py-2.5 text-right">₹{item.amount.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{item.days}d</td>
                    <td className="py-2.5">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}