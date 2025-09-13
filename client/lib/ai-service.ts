// AI Service for generating real insights and suggestions
export interface AIInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'alert' | 'recommendation' | 'market' | 'pricing' | 'inventory';
  title: string;
  description: string;
  detailedDescription?: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
  actionable: boolean;
  category: 'marketing' | 'sales' | 'operations' | 'finance' | 'growth';
  confidence: number; // 0-100
  source: 'ai_analysis' | 'market_data' | 'user_behavior' | 'external_trends';
  tags: string[];
  suggestedActions?: string[];
  estimatedImpact?: 'high' | 'medium' | 'low';
  timeframe?: 'immediate' | 'short_term' | 'long_term';
}

export interface AIDashboardData {
  insights: AIInsight[];
  summary: {
    totalInsights: number;
    highPriorityCount: number;
    actionableCount: number;
    weeklyGrowth: number;
    topCategories: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  marketTrends: {
    trendingProducts: string[];
    seasonalOpportunities: string[];
    competitorInsights: string[];
  };
  businessMetrics?: any[]; // Real business metrics from the database
}

// Real AI service that connects to Firebase database
export class AIService {
  private static instance: AIService;
  private insights: AIInsight[] = [];
  private lastUpdate: Date = new Date();

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateInsights(userId?: string): Promise<AIInsight[]> {
    try {
      // Use provided userId or fallback to default for testing
      const targetUserId = userId || '00000000-0000-0000-0000-000000000001';
      
      // Fetch insights from the database API
      const response = await fetch(`/api/dashboard/${targetUserId}/insights`);
      if (!response.ok) {
        throw new Error('Failed to fetch insights from database');
      }
      
      const insights = await response.json();
      this.insights = insights;
      this.lastUpdate = new Date();
      
      // If no insights from database, return empty array
      if (!insights || insights.length === 0) {
        return [];
      }
      
      return insights;
    } catch (error) {
      // Return empty array instead of mock data
      return [];
    }
  }

  private getMockInsights(): AIInsight[] {
    const currentDate = new Date();
    const insights: AIInsight[] = [
      {
        id: 'ai-insight-1',
        type: 'trend',
        title: 'Handmade Ceramics Trending',
        description: 'Ceramic home decor items are seeing 40% increased demand in your region. Consider expanding your pottery collection.',
        detailedDescription: 'Market analysis shows ceramic vases, bowls, and decorative pieces are trending strongly in urban areas. Social media mentions increased 65% in the past month. Target demographic: 25-45 year olds with disposable income.',
        priority: 'high',
        date: currentDate.toISOString(),
        actionable: true,
        category: 'marketing',
        confidence: 87,
        source: 'market_data',
        tags: ['ceramics', 'home-decor', 'trending', 'pottery'],
        suggestedActions: [
          'Create a new ceramic collection',
          'Update product photography',
          'Target Instagram marketing',
          'Partner with home decor influencers'
        ],
        estimatedImpact: 'high',
        timeframe: 'short_term'
      },
      {
        id: 'ai-insight-2',
        type: 'opportunity',
        title: 'Local Craft Fair Application',
        description: 'Spring Artisan Market opens applications next week. High foot traffic and perfect for your target audience.',
        detailedDescription: 'The Spring Artisan Market at Central Park attracts 5,000+ visitors over 3 days. Previous vendors report 200-500 sales per event. Application fee: $150. Deadline: March 15th.',
        priority: 'high',
        date: currentDate.toISOString(),
        actionable: true,
        category: 'sales',
        confidence: 92,
        source: 'external_trends',
        tags: ['craft-fair', 'local-market', 'sales-opportunity', 'spring'],
        suggestedActions: [
          'Prepare application materials',
          'Plan booth layout and display',
          'Create special event pricing',
          'Order business cards and signage'
        ],
        estimatedImpact: 'high',
        timeframe: 'immediate'
      },
      {
        id: 'ai-insight-3',
        type: 'pricing',
        title: 'Pricing Optimization Opportunity',
        description: 'Your handwoven scarves are priced 20% below market average. Consider increasing prices by 15-25%.',
        detailedDescription: 'Competitor analysis shows similar handwoven scarves sell for $45-65. Your current price of $38 leaves room for 20-30% increase while maintaining competitiveness.',
        priority: 'medium',
        date: currentDate.toISOString(),
        actionable: true,
        category: 'finance',
        confidence: 78,
        source: 'ai_analysis',
        tags: ['pricing', 'scarf', 'revenue-optimization', 'market-analysis'],
        suggestedActions: [
          'Research competitor pricing',
          'Test price increase on 2-3 items',
          'Update pricing strategy',
          'Communicate value proposition'
        ],
        estimatedImpact: 'medium',
        timeframe: 'short_term'
      },
      {
        id: 'ai-insight-4',
        type: 'inventory',
        title: 'Inventory Replenishment Alert',
        description: 'Running low on popular items: ceramic bowls (3 left), handwoven scarves (1 left).',
        detailedDescription: 'Your best-selling ceramic bowls and handwoven scarves are nearly out of stock. These items account for 35% of your monthly revenue.',
        priority: 'medium',
        date: currentDate.toISOString(),
        actionable: true,
        category: 'operations',
        confidence: 95,
        source: 'user_behavior',
        tags: ['inventory', 'restock', 'popular-items', 'revenue-critical'],
        suggestedActions: [
          'Order ceramic bowl materials',
          'Weave additional scarves',
          'Update inventory tracking',
          'Consider bulk ordering'
        ],
        estimatedImpact: 'high',
        timeframe: 'immediate'
      },
      {
        id: 'ai-insight-5',
        type: 'recommendation',
        title: 'Social Media Strategy Enhancement',
        description: 'Your Instagram engagement increased 30% this month. Double down on video content and behind-the-scenes posts.',
        detailedDescription: 'Video posts receive 3x more engagement than static images. Behind-the-scenes content showing your creative process gets 40% more saves and shares.',
        priority: 'medium',
        date: currentDate.toISOString(),
        actionable: true,
        category: 'marketing',
        confidence: 82,
        source: 'user_behavior',
        tags: ['social-media', 'instagram', 'video-content', 'engagement'],
        suggestedActions: [
          'Create weekly process videos',
          'Post behind-the-scenes content',
          'Use trending hashtags',
          'Engage with artisan community'
        ],
        estimatedImpact: 'medium',
        timeframe: 'short_term'
      },
      {
        id: 'ai-insight-6',
        type: 'market',
        title: 'Seasonal Opportunity: Wedding Season',
        description: 'Wedding season starts in 2 months. Custom ceramic gifts and decorations are in high demand.',
        detailedDescription: 'March-June is peak wedding season. Custom ceramic centerpieces, guest favors, and decorative items see 200% demand increase. Average order value: $300-800.',
        priority: 'high',
        date: currentDate.toISOString(),
        actionable: true,
        category: 'sales',
        confidence: 89,
        source: 'market_data',
        tags: ['wedding', 'seasonal', 'custom-orders', 'high-value'],
        suggestedActions: [
          'Create wedding collection',
          'Update website with custom options',
          'Reach out to wedding planners',
          'Prepare sample packages'
        ],
        estimatedImpact: 'high',
        timeframe: 'short_term'
      }
    ];

    this.insights = insights;
    this.lastUpdate = currentDate;
    return insights;
  }

  async getDashboardData(userId?: string): Promise<AIDashboardData> {
    try {
      // Use provided userId or fallback to default for testing
      const targetUserId = userId || '00000000-0000-0000-0000-000000000001';
      
      // Fetch dashboard data from the database API
      const response = await fetch(`/api/dashboard/${targetUserId}`);
      
      if (response.status === 429) {
        // Quota exceeded
        throw new Error('QUOTA_EXCEEDED');
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data from database');
      }
      
      const dashboardData = await response.json();
      this.insights = dashboardData.insights || [];
      this.lastUpdate = new Date();
      return dashboardData;
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error.message === 'QUOTA_EXCEEDED') {
        throw error; // Re-throw quota exceeded error
      }
      
      // Return empty data structure if database is unavailable
      return {
        insights: [],
        summary: {
          totalInsights: 0,
          highPriorityCount: 0,
          actionableCount: 0,
          weeklyGrowth: 0,
          topCategories: []
        },
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        },
        marketTrends: {
          trendingProducts: [],
          seasonalOpportunities: [],
          competitorInsights: []
        }
      };
    }
  }

  async generatePersonalizedInsight(category: string, context?: any): Promise<AIInsight> {
    // Simulate AI generating a personalized insight
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const insight: AIInsight = {
      id: `ai-insight-${Date.now()}`,
      type: 'recommendation',
      title: `AI-Generated ${category} Insight`,
      description: `Based on your business data, here's a personalized recommendation for ${category}.`,
      priority: 'medium',
      date: new Date().toISOString(),
      actionable: true,
      category: category as any,
      confidence: 75,
      source: 'ai_analysis',
      tags: [category, 'ai-generated', 'personalized'],
      suggestedActions: ['Review recommendation', 'Consider implementation', 'Track results'],
      estimatedImpact: 'medium',
      timeframe: 'short_term'
    };

    return insight;
  }

  getInsights(): AIInsight[] {
    return this.insights;
  }

  getLastUpdate(): Date {
    return this.lastUpdate;
  }
}

export const aiService = AIService.getInstance();