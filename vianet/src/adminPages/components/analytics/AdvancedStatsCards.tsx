import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export const AdvancedStatsCards = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Model Accuracy</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">94.7%</div>
        <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp size={10} />LSTM Neural Network</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Forecast Confidence</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">±3.2%</div>
        <div className="text-xs text-blue-600 mt-1">95% confidence interval</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Anomalies Detected</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">2</div>
        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Shield size={10} />Auto-detected</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Next 30-Day Forecast</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹8.2L</div>
        <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><Zap size={10} />Deep Learning Prediction</div>
      </CardContent>
    </Card>
  </div>
);
