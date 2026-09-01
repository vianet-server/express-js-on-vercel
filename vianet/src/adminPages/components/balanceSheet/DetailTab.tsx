import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailSection } from './DetailSection';

interface DetailTabProps {
  data: any[];
}

export function DetailTab({ data }: DetailTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
        <CardContent>
          <DetailSection
            title="Current & Fixed Assets"
            items={data.filter((i: any) => i.type === 'asset')}
            typeColor="bg-blue-500"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Liabilities & Equity</CardTitle></CardHeader>
        <CardContent>
          <DetailSection
            title="Liabilities"
            items={data.filter((i: any) => i.type === 'liability')}
            typeColor="bg-amber-500"
          />
          <DetailSection
            title="Equity"
            items={data.filter((i: any) => i.type === 'equity')}
            typeColor="bg-green-500"
          />
        </CardContent>
      </Card>
    </div>
  );
}