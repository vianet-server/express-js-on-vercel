import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartLine } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GRAPH_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function formatCompactINR(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

interface GraphLineProps {
  label: string;
  color: string;
}

function GraphLine({ label, color }: GraphLineProps) {
  return (
    <Line type="monotone" dataKey={label} stroke={color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
  );
}

interface TrendChartProps {
  title: string;
  majors: string[];
  points: any[];
}

function TrendChart({ title, majors, points }: TrendChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => formatCompactINR(v)} />
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} labelFormatter={(l: any) => `Month: ${l}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {majors.map((label, i) => (
                <GraphLine key={label} label={label} color={GRAPH_COLORS[i % GRAPH_COLORS.length]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface GraphTabProps {
  monthlyData: any[];
  incomeGraph: { majors: string[]; points: any[] };
  expenseGraph: { majors: string[]; points: any[] };
}

export function GraphTab({ monthlyData, incomeGraph, expenseGraph }: GraphTabProps) {
  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <ChartLine size={28} />
            <p>No historical monthly data available yet.</p>
            <p className="text-xs">Ensure your Tally sync pushes to the /api/admin/reports/pnl-monthly endpoint.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <TrendChart title="Major Income Categories — Monthly Trend" majors={incomeGraph.majors} points={incomeGraph.points} />
      <TrendChart title="Major Expense Categories — Monthly Trend" majors={expenseGraph.majors} points={expenseGraph.points} />
    </div>
  );
}