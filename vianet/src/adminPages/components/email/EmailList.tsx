import { Mail, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmailCampaign {
  id: number;
  dbId?: number;
  name: string;
  email: string;
  accessGroup: string;
  brand: string;
  schedule: string;
  includePrice: boolean;
  includeDetailed: boolean;
  lastSent: string | null;
}

const SCHEDULES = [
  { value: 'everyday', label: 'Everyday' },
  { value: 'every-week', label: 'Every Week' },
  { value: 'mid-week', label: 'Twice a Week (Mid Week)' },
  { value: 'every-month', label: 'Every Month' },
  { value: 'every-quarter', label: 'Every Quarter' },
];

const scheduleLabel = (v: string) => SCHEDULES.find(s => s.value === v)?.label ?? v;

interface EmailListProps {
  emails: EmailCampaign[];
  onSend: (id: number) => void;
}

export function EmailList({ emails, onSend }: EmailListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Mail size={28} />
            <p>No email campaigns yet. Create one from the "Create Email" tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="py-3 pl-4 pr-2 font-medium">Name</th>
                  <th className="py-3 px-2 font-medium">Email</th>
                  <th className="py-3 px-2 font-medium">Access Group</th>
                  <th className="py-3 px-2 font-medium">Brand</th>
                  <th className="py-3 px-2 font-medium">Schedule</th>
                  <th className="py-3 px-2 font-medium">Options</th>
                  <th className="py-3 px-2 font-medium">Last Sent</th>
                  <th className="py-3 px-2 font-medium text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {emails.map(e => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-3 pl-4 pr-2 font-medium">{e.name}</td>
                    <td className="py-3 px-2">{e.email || <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-3 px-2">{e.accessGroup}</td>
                    <td className="py-3 px-2">{e.brand}</td>
                    <td className="py-3 px-2">{scheduleLabel(e.schedule)}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1.5">
                        <Badge variant={e.includePrice ? 'default' : 'secondary'}>Price</Badge>
                        <Badge variant={e.includeDetailed ? 'default' : 'secondary'}>Detailed</Badge>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {e.lastSent ? new Date(e.lastSent).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-2 text-right pr-4">
                      <Button size="sm" variant="outline" onClick={() => onSend(e.id)}>
                        <Send size={14} /> Send
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
