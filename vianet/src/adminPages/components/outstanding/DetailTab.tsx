import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { DetailSection } from './DetailSection';

interface AgeBucket {
  label: string;
  min: number;
  max: number;
  color: string;
}

interface DetailTabProps {
  data: any[];
  ageBuckets: AgeBucket[];
}

function DetailCategory({ title, data, ageBuckets }: { title: string; data: any[]; ageBuckets: AgeBucket[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>On Time</CardTitle></CardHeader>
        <CardContent>
          <DetailSection title={ageBuckets[0].label} items={data.filter((i: any) => i.days <= ageBuckets[0].max)} icon={<span className={`size-2.5 rounded-full ${ageBuckets[0].color} inline-block`} />} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Overdue</CardTitle></CardHeader>
        <CardContent>
          {ageBuckets.slice(1).map(b => (
            <DetailSection key={b.label} title={b.label} items={data.filter((i: any) => i.days > b.min && i.days <= b.max)} icon={<span className={`size-2.5 rounded-full ${b.color} inline-block`} />} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function DetailTab({ data, ageBuckets }: DetailTabProps) {
  const receivableCount = data.filter((i: any) => i.category === 'receivable').length;
  const payableCount = data.filter((i: any) => i.category === 'payable').length;

  return (
    <Tabs defaultValue="receivable">
      <TabsList>
        <TabsTrigger value="receivable" className="gap-2"><ArrowUpCircle size={14} />Bills Receivable ({receivableCount})</TabsTrigger>
        <TabsTrigger value="payable" className="gap-2"><ArrowDownCircle size={14} />Bills Payable ({payableCount})</TabsTrigger>
      </TabsList>
      <TabsContent value="receivable" className="mt-4">
        <DetailCategory title="Receivable" data={data.filter((i: any) => i.category === 'receivable')} ageBuckets={ageBuckets} />
      </TabsContent>
      <TabsContent value="payable" className="mt-4">
        <DetailCategory title="Payable" data={data.filter((i: any) => i.category === 'payable')} ageBuckets={ageBuckets} />
      </TabsContent>
    </Tabs>
  );
}