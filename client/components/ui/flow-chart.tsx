import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle, Circle, Play, Users, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowNode {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  category: string;
  insights?: string[];
  actions?: string[];
}

const mockFlowData: FlowNode[] = [
  {
    id: '1',
    title: 'Business Foundation',
    description: 'Define your artisan business core values and mission',
    status: 'completed',
    category: 'Setup',
    insights: ['Strong brand identity increases customer trust by 73%', 'Clear mission statements improve team alignment'],
    actions: ['Update mission statement', 'Review brand guidelines']
  },
  {
    id: '2', 
    title: 'Product Catalog',
    description: 'Organize and showcase your handcrafted products',
    status: 'active',
    category: 'Products',
    insights: ['High-quality photos increase sales by 40%', 'Seasonal products drive 25% more engagement'],
    actions: ['Add new products', 'Update product photos', 'Set seasonal pricing']
  },
  {
    id: '3',
    title: 'Market Research',
    description: 'Understand your target audience and competitors',
    status: 'pending',
    category: 'Strategy',
    insights: ['Local artisan markets growing 15% annually', 'Social media drives 60% of artisan discovery'],
    actions: ['Analyze competitors', 'Survey customers', 'Identify trends']
  },
  {
    id: '4',
    title: 'Marketing Campaigns',
    description: 'Create compelling campaigns to reach your audience',
    status: 'pending',
    category: 'Marketing',
    insights: ['Video content gets 3x more engagement', 'Email marketing has 42:1 ROI for small businesses'],
    actions: ['Create social content', 'Start email campaign', 'Plan seasonal promotions']
  }
];

interface FlowChartProps {
  className?: string;
}

export function FlowChart({ className }: FlowChartProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const getStatusIcon = (status: FlowNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-ai-success" />;
      case 'active':
        return <Play className="w-5 h-5 text-ai-primary" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Setup':
        return <Target className="w-4 h-4" />;
      case 'Products':
        return <Users className="w-4 h-4" />;
      case 'Strategy':
        return <TrendingUp className="w-4 h-4" />;
      case 'Marketing':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {mockFlowData.map((node, index) => (
        <div key={node.id} className="relative">
          {/* Connector Line */}
          {index < mockFlowData.length - 1 && (
            <div className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-border to-transparent" />
          )}
          
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-medium",
              expandedNode === node.id && "shadow-strong",
              node.status === 'active' && "ring-2 ring-primary/20 bg-gradient-subtle"
            )}
            onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-ai-surface-elevated">
                  {getStatusIcon(node.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{node.title}</h3>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getCategoryIcon(node.category)}
                      {node.category}
                    </Badge>
                    <ChevronRight 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200 ml-auto",
                        expandedNode === node.id && "rotate-90"
                      )} 
                    />
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3">{node.description}</p>
                  
                  {expandedNode === node.id && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-border">
                      {/* AI Insights */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-ai-primary">AI Insights</h4>
                        <div className="space-y-2">
                          {node.insights?.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-ai-primary mt-2 flex-shrink-0" />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-accent">Quick Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          {node.actions?.map((action, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs hover:bg-gradient-primary hover:text-primary-foreground hover:border-transparent transition-all"
                            >
                              {action}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
