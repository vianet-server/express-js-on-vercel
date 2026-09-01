import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DetailSection } from './DetailSection';

interface DetailTabProps {
  data: any[];
}

export function DetailTab({ data }: DetailTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Income (Profit)</CardTitle></CardHeader>
        <CardContent>
          <DetailSection title="Revenue & Income" items={data.filter((i: any) => i.type === 'income')} icon={<TrendingUp size={16} className="text-green-600" />} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Expenses (Loss)</CardTitle></CardHeader>
        <CardContent>
          <DetailSection title="Costs & Expenses" items={data.filter((i: any) => i.type === 'expense')} icon={<TrendingDown size={16} className="text-red-600" />} />
        </CardContent>
      </Card>
    </div>
  );
}