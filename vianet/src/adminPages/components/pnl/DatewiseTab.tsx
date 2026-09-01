import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';

interface DatewiseRowProps {
  item: any;
  datewiseCols: string[];
}

function DatewiseRow({ item, datewiseCols }: DatewiseRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 pr-4 font-medium sticky left-0 z-10 bg-background z-10">{item.label}</td>
      {datewiseCols.map(date => (
        <td key={date} className="py-2.5 px-3 text-right whitespace-nowrap">
          {item.date <= date ? formatIndianCurrency(item.amount) : '-'}
        </td>
      ))}
    </tr>
  );
}

interface DatewiseTotalRowProps {
  data: any[];
  datewiseCols: string[];
}

function DatewiseTotalRow({ data, datewiseCols }: DatewiseTotalRowProps) {
  return (
    <tr className="border-t-2 font-medium">
      <td className="py-2.5 pr-4 sticky left-0 z-10 bg-background z-10">Total</td>
      {datewiseCols.map(date => (
        <td key={date} className="py-2.5 px-3 text-right whitespace-nowrap">
          {formatIndianCurrency(data.filter((i: any) => i.date <= date).reduce((s: number, i: any) => s + i.amount, 0))}
        </td>
      ))}
    </tr>
  );
}

interface DatewiseTabProps {
  data: any[];
  datewisePick: string;
  onDatewisePickChange: (v: string) => void;
  datewiseCols: string[];
  onAddDateColumn: () => void;
}

export function DatewiseTab({ data, datewisePick, onDatewisePickChange, datewiseCols, onAddDateColumn }: DatewiseTabProps) {
  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Input type="date" value={datewisePick} onChange={(e) => onDatewisePickChange(e.target.value)} className="w-48" />
            <Button size="sm" onClick={onAddDateColumn} disabled={!datewisePick}><Plus size={14} /> Fetch</Button>
          </div>
        </CardHeader>
      </Card>
      {datewiseCols.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Select a date and click Fetch to add a P&L column.</div>
      ) : (
        <div className="overflow-auto max-h-[600px] border rounded-md">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2.5 pr-4 font-medium whitespace-nowrap sticky left-0 z-10 bg-background z-10">Item</th>
                {datewiseCols.map(date => <th key={date} className="pb-2.5 px-3 font-medium text-right whitespace-nowrap">{date}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((item: any, i: number) => <DatewiseRow key={i} item={item} datewiseCols={datewiseCols} />)}
              <DatewiseTotalRow data={data} datewiseCols={datewiseCols} />
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}