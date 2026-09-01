import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Globe, Search } from 'lucide-react';

const methodStyles: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

interface EndpointsTableProps {
  endpoints: { method: string; path: string; description: string }[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
}

export function EndpointsTable({ endpoints, searchTerm, onSearchChange }: EndpointsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={16} /> Endpoints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 max-w-sm">
          <Search size={14} className="text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-0 p-0 h-auto text-sm focus-visible:ring-0"
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Method</th>
              <th className="pb-2 font-medium">Endpoint</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.filter(ep =>
              !searchTerm || ep.path?.toLowerCase().includes(searchTerm.toLowerCase()) || ep.description?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((ep) => (
              <tr key={ep.method + ep.path} className="border-b last:border-0">
                <td className="py-2.5">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${methodStyles[ep.method]}`}>
                    {ep.method}
                  </span>
                </td>
                <td className="py-2.5 font-mono text-sm">{ep.path}</td>
                <td className="py-2.5 text-muted-foreground">{ep.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
