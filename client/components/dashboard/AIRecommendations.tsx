import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, Lightbulb, Target, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/lib/ai-service';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  timeframe: 'immediate' | 'short_term' | 'long_term';
  actionable?: boolean;
}

interface AIRecommendationsProps {
  className?: string;
}

export function AIRecommendations({ className }: AIRecommendationsProps) {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState({
    immediate: [],
    shortTerm: [],
    longTerm: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadRecommendations();
    }
  }, [currentUser]);

  const loadRecommendations = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const data = await aiService.getDashboardData(currentUser.uid);
      setRecommendations(data?.recommendations || {
        immediate: [],
        shortTerm: [],
        longTerm: []
      });
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
        setQuotaExceeded(true);
        setRecommendations({
          immediate: [],
          shortTerm: [],
          longTerm: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentUser) return;
    
    try {
      setRefreshing(true);
      setQuotaExceeded(false); // Reset quota exceeded state on refresh
      const data = await aiService.getDashboardData(currentUser.uid);
      setRecommendations(data?.recommendations || {
        immediate: [],
        shortTerm: [],
        longTerm: []
      });
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
        setQuotaExceeded(true);
        setRecommendations({
          immediate: [],
          shortTerm: [],
          longTerm: []
        });
      }
    } finally {
      setRefreshing(false);
    }
  };
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate':
        return 'bg-red-50 text-red-700';
      case 'short_term':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-green-50 text-green-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return '📦';
      case 'sales':
        return '📈';
      case 'pricing':
        return '💰';
      case 'growth':
        return '🚀';
      case 'strategy':
        return '🎯';
      case 'operations':
        return '🔄';
      case 'onboarding':
        return '📝';
      default:
        return '💡';
    }
  };

  // Flatten all recommendations into a single array for display
  const allRecommendations = [
    ...(recommendations.immediate || []),
    ...(recommendations.shortTerm || []),
    ...(recommendations.longTerm || [])
  ];

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ai-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading recommendations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ai-primary" />
            AI Recommendations
          </CardTitle>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            title="Refresh AI recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {quotaExceeded ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">AI Quota Exceeded</p>
            <p className="text-sm text-muted-foreground mb-4">
              You've reached your AI recommendations limit for today. Try again tomorrow or upgrade your plan for unlimited access.
            </p>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        ) : allRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No AI recommendations available</p>
            <p className="text-sm text-muted-foreground">AI recommendations are generated manually or after adding sales/products</p>
          </div>
        ) : (
          allRecommendations.map((rec) => (
            <div key={rec.id} className="p-4 border rounded-lg hover:shadow-soft transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getCategoryIcon(rec.category)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">
                        {rec.title.split(':').length > 1 ? (
                          <>
                            <span className="text-ai-primary font-bold">
                              {rec.title.split(':')[0]}:
                            </span>
                            <span className="text-foreground">
                              {rec.title.split(':').slice(1).join(':')}
                            </span>
                          </>
                        ) : (
                          rec.title
                        )}
                      </h4>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(rec.priority)}`}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {rec.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
