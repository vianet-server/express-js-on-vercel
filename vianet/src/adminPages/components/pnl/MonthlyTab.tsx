import { Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';

function formatMonth(yyyyMm: string) {
  if (!yyyyMm) return '';
  const [y, m] = yyyyMm.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
}

interface MonthlyChildRowProps {
  label: string;
  child: string;
  monthlyData: any[];
  type: string;
}

function MonthlyChildRow({ label, child, monthlyData, type }: MonthlyChildRowProps) {
  return (
    <tr key={`${label}-${child}`} className="border-b last:border-0 hover:bg-muted/30 text-xs text-muted-foreground">
      <td className="py-1.5 pr-4 pl-8 sticky left-0 z-10 bg-background z-10 whitespace-nowrap">↳ {child}</td>
      {monthlyData.map(m => {
        const sub = m.data
          .find((d: any) => d.label === label && d.type === type)
          ?.subs?.find((s: any) => s.label === child);
        return <td key={formatMonth(m.month)} className="py-1.5 px-3 text-right whitespace-nowrap">{sub ? `₹${sub.amount.toLocaleString()}` : '-'}</td>;
      })}
    </tr>
  );
}

interface MonthlyCategoryRowProps {
  label: string;
  type: string;
  monthlyData: any[];
  childLabels: string[];
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
}

function MonthlyCategoryRow({ label, type, monthlyData, childLabels, isExpanded, hasChildren, onToggle }: MonthlyCategoryRowProps) {
  return (
    <Fragment key={label}>
      <tr
        className={`border-b last:border-0 hover:bg-muted/30 ${hasChildren ? 'cursor-pointer select-none' : ''}`}
        onClick={() => hasChildren && onToggle()}
      >
        <td className="py-2.5 pr-4 pl-4 font-medium sticky left-0 z-10 bg-background z-10 whitespace-nowrap">
          {hasChildren && (isExpanded ? <ChevronDown size={14} className="mr-1 inline shrink-0" /> : <ChevronRight size={14} className="mr-1 inline shrink-0" />)}
          {label}
          {hasChildren && <span className="ml-2 text-xs font-normal text-muted-foreground">({childLabels.length})</span>}
        </td>
        {monthlyData.map(m => {
          const row = m.data.find((d: any) => d.label === label && d.type === type);
          return <td key={formatMonth(m.month)} className="py-2.5 px-3 text-right whitespace-nowrap">{row ? `${formatIndianCurrency(row.amount)}` : '-'}</td>;
        })}
      </tr>
      {isExpanded && childLabels.map(child => (
        <MonthlyChildRow key={child} label={label} child={child} monthlyData={monthlyData} type={type} />
      ))}
    </Fragment>
  );
}

interface MonthlyGroupProps {
  type: string;
  monthlyData: any[];
  expandedMonthly: Set<string>;
  onToggleExpand: (key: string) => void;
}

function MonthlyGroup({ type, monthlyData, expandedMonthly, onToggleExpand }: MonthlyGroupProps) {
  const totals: Record<string, number> = {};
  const childLabels: Record<string, string[]> = {};
  monthlyData.forEach(m => m.data.filter((d: any) => d.type === type).forEach((d: any) => {
    totals[d.label] = (totals[d.label] || 0) + d.amount;
    (d.subs ?? []).forEach((s: any) => {
      childLabels[d.label] = childLabels[d.label] ?? [];
      if (!childLabels[d.label].includes(s.label)) childLabels[d.label].push(s.label);
    });
  }));
  const labels = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(e => e[0]);

  return (
    <>
      {labels.map(label => {
        const expandKey = `${type}:${label}`;
        const open = expandedMonthly.has(expandKey);
        const hasChildren = (childLabels[label] ?? []).length > 0;
        return (
          <MonthlyCategoryRow
            key={label}
            label={label}
            type={type}
            monthlyData={monthlyData}
            childLabels={childLabels[label] ?? []}
            isExpanded={open}
            hasChildren={hasChildren}
            onToggle={() => onToggleExpand(expandKey)}
          />
        );
      })}
    </>
  );
}

interface MonthlyTabProps {
  monthlyData: any[];
  expandedMonthly: Set<string>;
  onToggleExpand: (key: string) => void;
}

export function MonthlyTab({ monthlyData, expandedMonthly, onToggleExpand }: MonthlyTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Month-over-Month Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-2">
            <p>No historical monthly data available yet.</p>
            <p className="text-xs">Ensure your Tally sync pushes to the /api/admin/reports/pnl-monthly endpoint.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[600px] border rounded-md">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2.5 pr-4 pl-4 font-medium whitespace-nowrap sticky left-0 z-10 top-0 z-30 bg-background border-b shadow-sm">Category</th>
                  {monthlyData.map(m => (
                    <th key={formatMonth(m.month)} className="pb-2.5 px-3 font-medium text-right whitespace-nowrap">{formatMonth(m.month)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-muted/50">
                  <td colSpan={monthlyData.length + 1} className="py-2 px-2 pl-4 font-semibold text-green-700 sticky left-0 z-10">Income</td>
                </tr>
                <MonthlyGroup type="income" monthlyData={monthlyData} expandedMonthly={expandedMonthly} onToggleExpand={onToggleExpand} />
                <tr className="bg-muted/50">
                  <td colSpan={monthlyData.length + 1} className="py-2 px-2 pl-4 font-semibold text-red-700 sticky left-0 z-10 border-t">Expenses</td>
                </tr>
                <MonthlyGroup type="expense" monthlyData={monthlyData} expandedMonthly={expandedMonthly} onToggleExpand={onToggleExpand} />
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}