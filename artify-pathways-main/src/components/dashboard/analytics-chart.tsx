import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, BarChart3, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockData = [
  { month: 'Jan', sales: 1200, visitors: 2400, orders: 45, revenue: 3400 },
  { month: 'Feb', sales: 1800, visitors: 3200, orders: 67, revenue: 4100 },
  { month: 'Mar', sales: 2200, visitors: 2800, orders: 78, revenue: 5200 },
  { month: 'Apr', sales: 2600, visitors: 4100, orders: 89, revenue: 6800 },
  { month: 'May', sales: 3200, visitors: 3800, orders: 98, revenue: 7200 },
  { month: 'Jun', sales: 2800, visitors: 4500, orders: 112, revenue: 8100 },
  { month: 'Jul', sales: 3800, visitors: 5200, orders: 134, revenue: 9400 },
];

type MetricType = 'sales' | 'visitors' | 'orders' | 'revenue';

interface AnalyticsChartProps {
  className?: string;
}

const metricConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--ai-primary))',
    prefix: '$',
    change: '+12.5%',
    trend: 'up' as const
  },
  visitors: {
    label: 'Visitors',
    color: 'hsl(var(--ai-secondary))',
    prefix: '',
    change: '+8.2%',
    trend: 'up' as const
  },
  orders: {
    label: 'Orders',
    color: 'hsl(var(--ai-success))',
    prefix: '',
    change: '+15.3%',
    trend: 'up' as const
  },
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--ai-warning))',
    prefix: '$',
    change: '-2.1%',
    trend: 'down' as const
  }
};

export function AnalyticsChart({ className }: AnalyticsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('sales');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const currentMetric = metricConfig[selectedMetric];
  const currentValue = mockData[mockData.length - 1][selectedMetric];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-medium">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="font-semibold text-foreground">
            {currentMetric.prefix}{data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-ai-primary" />
              Business Analytics
            </CardTitle>
            <Badge variant="secondary" className="bg-ai-success/10 text-ai-success">
              Live Data
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
              className="h-8 px-3"
            >
              Area
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="h-8 px-3"
            >
              Line
            </Button>
          </div>
        </div>
        
        {/* Metric Selection */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(metricConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedMetric === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedMetric(key as MetricType)}
              className={cn(
                "h-auto p-3 flex-col items-start",
                selectedMetric === key && "bg-gradient-primary"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs font-medium">{config.label}</span>
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  config.trend === 'up' ? 'text-ai-success' : 'text-destructive'
                )}>
                  {config.trend === 'up' ? 
                    <ArrowUp className="w-3 h-3" /> : 
                    <ArrowDown className="w-3 h-3" />
                  }
                  {config.change}
                </div>
              </div>
              <div className="text-sm font-bold mt-1">
                {config.prefix}{currentValue?.toLocaleString()}
              </div>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${currentMetric.prefix}${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={currentMetric.color}
                  strokeWidth={3}
                  fill="url(#colorGradient)"
                  fillOpacity={1}
                />
              </AreaChart>
            ) : (
              <LineChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${currentMetric.prefix}${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={currentMetric.color}
                  strokeWidth={3}
                  dot={{ fill: currentMetric.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 p-4 bg-ai-surface-elevated rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}