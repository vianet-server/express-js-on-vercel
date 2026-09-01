import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';

interface SearchRowProps {
  item: any;
}

function SearchRow({ item }: SearchRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 font-medium">{item.label}</td>
      <td className="py-2.5 text-right">{formatIndianCurrency(item.amount)}</td>
      <td className="py-2.5">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {(item.type ?? '').charAt(0).toUpperCase() + (item.type ?? '').slice(1)}
        </span>
      </td>
    </tr>
  );
}

interface SearchTabProps {
  filteredData: any[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

export function SearchTab({ filteredData, searchQuery, onSearchChange }: SearchTabProps) {
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
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any, i: number) => <SearchRow key={i} item={item} />)}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}