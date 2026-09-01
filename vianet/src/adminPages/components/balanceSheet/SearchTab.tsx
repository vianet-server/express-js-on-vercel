import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TypeBadgeProps {
  type: string;
}

function TypeBadge({ type }: TypeBadgeProps) {
  const colors: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-700',
    liability: 'bg-amber-100 text-amber-700',
    equity: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] ?? ''}`}>
      {(type ?? '').charAt(0).toUpperCase() + (type ?? '').slice(1)}
    </span>
  );
}

interface SearchTabProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filteredData: any[];
}

export function SearchTab({ searchQuery, onSearchChange, filteredData }: SearchTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <Input placeholder="Search entries..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="max-w-sm" />
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No entries match your search.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium w-1/2">Item</th>
                <th className="pb-2 font-medium text-right pr-6 w-1/4">Amount</th>
                <th className="pb-2 font-medium pl-6 w-1/4">Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any, i: number) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2.5 font-medium">{item.label}</td>
                  <td className="py-2.5 text-right pr-6">₹{item.amount.toLocaleString()}</td>
                  <td className="py-2.5 pl-6">
                    <TypeBadge type={item.type} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}