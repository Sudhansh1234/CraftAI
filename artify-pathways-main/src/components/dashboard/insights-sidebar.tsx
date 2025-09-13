import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, TrendingUp, Users, Star, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
  actionable?: boolean;
}

const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'trend',
    title: 'Holiday Season Boost',
    description: 'Handmade ornaments are trending 65% higher this month. Consider expanding your seasonal collection.',
    priority: 'high',
    date: '2024-01-15',
    actionable: true
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'New Market Opening',
    description: 'Local farmers market added artisan section. Applications due next week.',
    priority: 'high',
    date: '2024-01-14',
    actionable: true
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Pricing Optimization',
    description: 'Your ceramic bowls are priced 15% below market average. Consider adjusting pricing.',
    priority: 'medium',
    date: '2024-01-13',
    actionable: true
  },
  {
    id: '4',
    type: 'alert',
    title: 'Inventory Alert',
    description: 'Running low on popular items: handwoven scarves (2 left).',
    priority: 'medium',
    date: '2024-01-12',
    actionable: false
  }
];

const getInsightIcon = (type: Insight['type']) => {
  switch (type) {
    case 'trend':
      return <TrendingUp className="w-4 h-4 text-ai-success" />;
    case 'opportunity':
      return <Star className="w-4 h-4 text-ai-warning" />;
    case 'alert':
      return <Bell className="w-4 h-4 text-destructive" />;
    case 'recommendation':
      return <Users className="w-4 h-4 text-ai-primary" />;
  }
};

const getPriorityColor = (priority: Insight['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'medium':
      return 'bg-ai-warning/10 text-ai-warning border-ai-warning/20';
    case 'low':
      return 'bg-ai-success/10 text-ai-success border-ai-success/20';
  }
};

interface InsightsSidebarProps {
  className?: string;
}

export function InsightsSidebar({ className }: InsightsSidebarProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">AI Insights</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Calendar className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {mockInsights.map((insight) => (
          <Card key={insight.id} className="group hover:shadow-medium transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getPriorityColor(insight.priority))}
                >
                  {insight.priority}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {insight.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(insight.date).toLocaleDateString()}
                </span>
                
                {insight.actionable && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-auto py-1 px-2 text-ai-primary hover:text-ai-primary hover:bg-ai-primary/10"
                  >
                    Take Action
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-primary text-primary-foreground border-0">
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold mb-2">Weekly Summary</h3>
          <p className="text-sm opacity-90 mb-3">
            Your business grew 12% this week with 3 new opportunities identified.
          </p>
          <Button variant="secondary" size="sm" className="w-full">
            View Full Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}