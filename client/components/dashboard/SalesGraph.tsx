import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}

interface SalesGraphProps {
  data: SalesData[];
}

export function SalesGraph({ data }: SalesGraphProps) {
  // Calculate growth rate
  const currentPeriod = data[0]?.sales || 0;
  const previousPeriod = data[1]?.sales || 0;
  const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;
  
  // Get max value for scaling
  const maxSales = Math.max(...data.map(d => d.sales), 1);
  
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-ai-primary" />
            Sales Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            {growthRate > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${growthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(growthRate).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between gap-2">
          {data.slice(0, 7).map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-gradient-to-t from-ai-primary to-ai-primary/60 rounded-t transition-all hover:from-ai-primary/80 hover:to-ai-primary/40"
                style={{ height: `${(item.sales / maxSales) * 200}px` }}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs font-medium text-foreground">
                {item.sales}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Sales:</span>
            <span className="ml-2 font-semibold">{data.reduce((sum, d) => sum + d.sales, 0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="ml-2 font-semibold">₹{data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
