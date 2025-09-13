import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, TrendingUp, Users, Star, ExternalLink, Calendar, RefreshCw, Sparkles, DollarSign, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService, AIInsight } from '@/lib/ai-service';
import { useAuth } from '@/contexts/AuthContext';

interface Insight {
  id: string;
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation' | 'market' | 'pricing' | 'inventory';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
  actionable?: boolean;
  confidence?: number;
  category?: string;
  tags?: string[];
  suggestedActions?: string[];
  estimatedImpact?: 'high' | 'medium' | 'low';
  timeframe?: 'immediate' | 'short_term' | 'long_term';
}

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
    case 'market':
      return <TrendingUp className="w-4 h-4 text-ai-secondary" />;
    case 'pricing':
      return <DollarSign className="w-4 h-4 text-ai-warning" />;
    case 'inventory':
      return <Package className="w-4 h-4 text-destructive" />;
    default:
      return <Sparkles className="w-4 h-4 text-ai-primary" />;
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
  const { currentUser } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadInsights();
    }
  }, [currentUser]);

  const loadInsights = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const aiInsights = await aiService.generateInsights(currentUser.uid);
      setInsights(aiInsights);
    } catch (error) {
      // Silently handle loading errors
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    if (!currentUser) return;
    
    try {
      setRefreshing(true);
      // Call the manual insight generation endpoint
      const response = await fetch(`/api/dashboard/${currentUser.uid}/insights/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Reload insights after generation
        await loadInsights();
      } else {
        throw new Error('Failed to generate insights');
      }
    } catch (error) {
      // Silently handle refresh errors
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeframeColor = (timeframe?: string) => {
    switch (timeframe) {
      case 'immediate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'short_term':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'long_term':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">AI Insights</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">AI Insights</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshInsights}
            disabled={refreshing}
            className="text-muted-foreground"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className="group hover:shadow-medium transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getPriorityColor(insight.priority))}
                  >
                    {insight.priority}
                  </Badge>
                  {insight.confidence && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {insight.confidence}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {insight.description}
              </p>
              
              {/* Additional AI metadata */}
              <div className="space-y-2 mb-3">
                {insight.timeframe && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getTimeframeColor(insight.timeframe))}
                  >
                    {insight.timeframe.replace('_', ' ')}
                  </Badge>
                )}
                {insight.estimatedImpact && (
                  <span className={cn("text-xs font-medium", getImpactColor(insight.estimatedImpact))}>
                    {insight.estimatedImpact} impact
                  </span>
                )}
                {insight.category && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                    {insight.category}
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {insight.tags && insight.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {insight.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-gray-100 text-gray-600">
                      {tag}
                    </Badge>
                  ))}
                  {insight.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                      +{insight.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
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
