import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export const PredictiveInsightsCard = () => (
  <Card className="lg:col-span-2">
    <CardHeader><CardTitle>Predictive Insights</CardTitle></CardHeader>
    <CardContent>
      <div className="flex flex-col gap-3">
        {[
          { text: 'Revenue expected to increase by 18.4% next quarter based on LSTM model.', type: 'positive' },
          { text: 'Anomaly detected: Unusual spike in orders on Jul 15 (3σ above mean).', type: 'warning' },
          { text: 'Customer churn probability reduced by 6.2% after recent pricing changes.', type: 'positive' },
          { text: 'Demand forecast suggests stocking 15% more inventory for Electronics category.', type: 'info' },
        ].map((insight, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${insight.type === 'warning' ? 'bg-amber-50 border-amber-200' : insight.type === 'positive' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <Brain size={16} className={`mt-0.5 ${insight.type === 'warning' ? 'text-amber-600' : insight.type === 'positive' ? 'text-green-600' : 'text-blue-600'}`} />
            <span className="text-sm">{insight.text}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
