import { RequestHandler, Request, Response, NextFunction } from 'express';
import { createUserData } from '../database/firebase-seed';

// Extend Request interface to include userId
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware to extract user ID from request
export const extractUserId = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Try to get user ID from various sources
  let userId = req.params.userId || req.query.userId as string || req.headers['x-user-id'] as string;
  
  // If no user ID provided, use default for testing
  if (!userId || userId === 'default-user') {
    userId = '00000000-0000-0000-0000-000000000001';
  }
  
  // Validate user ID format (accept both UUIDs and Firebase UIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const firebaseUidRegex = /^[a-zA-Z0-9]{28}$/; // Firebase UIDs are 28 characters long
  
  if (!userId.match(uuidRegex) && !userId.match(firebaseUidRegex)) {
    userId = '00000000-0000-0000-0000-000000000001';
  }
  
  req.userId = userId;
  next();
};


// Get dashboard data for a user
export const getDashboardData: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Dashboard API called for user:', req.params.userId);
    
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    // Get user ID from the request (set by middleware)
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';

    // Simple quota check - for demo purposes, simulate quota exceeded for certain users
    const isQuotaExceeded = userId === 'quota-exceeded-user' || Math.random() < 0.1; // 10% chance for demo
    
    if (isQuotaExceeded) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        message: 'AI recommendations quota exceeded. Please try again tomorrow.'
      });
    }
    
    // Check if Firebase is configured and accessible
    console.log('Firebase configured:', isFirebaseConfigured());
    
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, returning empty data');
      const emptyData = {
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
      return res.json(emptyData);
    }
    
    const isHealthy = await healthCheck();
    console.log('Firebase health check:', isHealthy);
    
    if (!isHealthy) {
      console.log('Firebase not healthy, returning empty data');
      const emptyData = {
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
      return res.json(emptyData);
    }
    
    // Try to get data from separate collections first, fallback to business_metrics
    let products = [];
    let sales = [];
    let businessMetrics = [];
    
    try {
      products = await FirebaseModels.products.findByUserId(userId);
      sales = await FirebaseModels.sales.findByUserId(userId);
      
      // Combine all data for backward compatibility
      businessMetrics = [
        ...products.map(p => ({ ...p, metric_type: 'products' })),
        ...sales.map(s => ({ ...s, metric_type: 'sales' }))
      ];
    } catch (error) {
      
      // Fallback to business_metrics collection
      businessMetrics = await FirebaseModels.businessMetrics.findByUserId(userId);
    }
    
    // Get existing insights from stored metrics (no auto-generation)
    const insights = await getInsightsFromMetrics(userId);
    
    // Calculate summary from generated insights
    const totalInsights = insights.length;
    const highPriorityCount = insights.filter(i => i.priority === 'high').length;
    const actionableCount = insights.filter(i => i.actionable).length;
    
    // Get top categories
    const categoryCount = insights.reduce((acc: any, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category]) => category);
    
    // Calculate weekly growth from metrics
    const weeklyGrowth = await FirebaseModels.businessMetrics.getWeeklyGrowth(userId);
    
    // No automatic AI recommendations generation - only manual or after events
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };
    
    // Generate market trends based on metrics
    const marketTrends = generateMarketTrendsFromMetrics(businessMetrics);

    // Store insights as business metrics for persistence
    await storeInsightsAsMetrics(userId, insights);

    const dashboardData = {
      insights: insights,
      summary: {
        totalInsights,
        highPriorityCount,
        actionableCount,
        weeklyGrowth: weeklyGrowth || 0,
        topCategories
      },
      recommendations: recommendations,
      marketTrends: marketTrends,
      businessMetrics: businessMetrics // All data is now stored as business metrics
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get AI insights for a user
export const getInsights: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const userId = req.params.userId || '00000000-0000-0000-0000-000000000001';
    const { type, limit = 50, offset = 0 } = req.query;
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      // Return empty array when Firebase is not configured or not accessible
      return res.json([]);
    }
    
    let insights;
    if (type) {
      insights = await FirebaseModels.aiInsights.findByType(userId, type as string);
    } else {
      const limitCount = limit ? parseInt(limit as string) : 50;
      insights = await FirebaseModels.aiInsights.findByUserId(userId, limitCount);
    }
    
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
};

// Create a new AI insight
export const createInsight: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const userId = req.params.userId || '00000000-0000-0000-0000-000000000001';
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    const insightData = {
      ...req.body,
      user_id: userId,
      status: 'active'
    };
    
    const insight = await FirebaseModels.aiInsights.create(insightData);
    res.status(201).json(insight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create insight' });
  }
};

// Update insight status
export const updateInsightStatus: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const { insightId } = req.params;
    const { status } = req.body;
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    const insight = await FirebaseModels.aiInsights.update(insightId, { status });
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json(insight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update insight status' });
  }
};

// Manually generate new AI insights
export const generateInsights: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const userId = req.params.userId || '00000000-0000-0000-0000-000000000001';
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    // Get current business metrics
    let products = [];
    let sales = [];
    let businessMetrics = [];
    
    try {
      products = await FirebaseModels.products.findByUserId(userId);
      sales = await FirebaseModels.sales.findByUserId(userId);
      
      // Combine all data for backward compatibility
      businessMetrics = [
        ...products.map(p => ({ ...p, metric_type: 'products' })),
        ...sales.map(s => ({ ...s, metric_type: 'sales' }))
      ];
    } catch (error) {
      
      // Fallback to business_metrics collection
      businessMetrics = await FirebaseModels.businessMetrics.findByUserId(userId);
    }
    
    // Generate new AI insights based on current business metrics
    const newInsights = await generateInsightsFromMetrics(userId, businessMetrics);
    
    // Store the new insights in the database
    const storedInsights = [];
    for (const insight of newInsights) {
      try {
        const storedInsight = await FirebaseModels.aiInsights.create({
          ...insight,
          user_id: userId,
          status: 'active',
          generated_at: new Date().toISOString()
        });
        storedInsights.push(storedInsight);
      } catch (error) {
        // Skip storing this insight if it fails
      }
    }
    
    res.json({
      message: 'AI insights generated successfully',
      insights: storedInsights,
      count: storedInsights.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
};

// Get business metrics
export const getBusinessMetrics: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const userId = req.params.userId || '00000000-0000-0000-0000-000000000001';
    const { metricType, limit = 100 } = req.query;
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.json([]);
    }
    
    const limitCount = limit ? parseInt(limit as string) : 100;
    const metrics = await FirebaseModels.businessMetrics.findByUserId(
      userId, 
      metricType as string, 
      limitCount
    );
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business metrics' });
  }
};

// Create business metric
export const createBusinessMetric: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const userId = req.params.userId || '00000000-0000-0000-0000-000000000001';
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    const metricData = {
      ...req.body,
      user_id: userId
    };
    
    const metric = await FirebaseModels.businessMetrics.create(metricData);
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create business metric' });
  }
};

// Get recommendations
export const getRecommendations: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const userId = req.params.userId || '00000000-0000-0000-0000-000000000001';
    const { timeframe } = req.query;
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.json([]);
    }
    
    const recommendations = await FirebaseModels.recommendations.findByUserId(
      userId, 
      timeframe as string
    );
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};

// Update recommendation status
export const updateRecommendationStatus: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const { recommendationId } = req.params;
    const { status } = req.body;
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    const recommendation = await FirebaseModels.recommendations.update(recommendationId, { status });
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recommendation status' });
  }
};

// Get market trends
export const getMarketTrends: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.json([]);
    }
    
    const trends = await FirebaseModels.marketTrends.findActive();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market trends' });
  }
};

// Simple test endpoint for debugging
export const testEndpoint: RequestHandler = async (req, res) => {
  try {
    res.json({ 
      message: 'Dashboard API is working',
      timestamp: new Date().toISOString(),
      userId: req.params.userId,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ error: 'Test endpoint failed', details: error.message });
  }
};

// Firebase connection test endpoint
export const testFirebaseConnection: RequestHandler = async (req, res) => {
  try {
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    const config = {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not set',
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not set',
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? 'Set' : 'Not set'
    };
    
    const isConfigured = isFirebaseConfigured();
    const isHealthy = isConfigured ? await healthCheck() : false;
    
    res.json({
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      config,
      isConfigured,
      isHealthy,
      error: isHealthy ? null : 'Firebase connection failed'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Firebase test failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Health check
export const healthCheckEndpoint: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    if (!isFirebaseConfigured()) {
      return res.status(503).json({ 
        status: 'unhealthy', 
        reason: 'Firebase not configured',
        timestamp: new Date().toISOString() 
      });
    }
    
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
};

// Seed database with sample data
export const seedDatabase: RequestHandler = async (req, res) => {
  try {
    // Lazy import Firebase modules after environment variables are loaded
    const { isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    // Check if Firebase is configured and accessible
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    const { seedFirebaseDatabase } = await import('../database/firebase-seed');
    await seedFirebaseDatabase();
    res.json({ message: 'Firebase database seeded successfully with sample data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed Firebase database' });
  }
};

// Create user data endpoint
export const createUserDataEndpoint: RequestHandler = async (req, res) => {
  try {
    const { userId, userInfo } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!userInfo || !userInfo.email) {
      return res.status(400).json({ error: 'User info with email is required' });
    }
    
    const result = await createUserData(userId, userInfo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user data' });
  }
};

// Add business metric endpoint
export const addBusinessMetric: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { metricType, value, date, productName, price, quantity, materialCost, sellingPrice } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!metricType || value === undefined) {
      return res.status(400).json({ error: 'Metric type and value are required' });
    }
    
    // Lazy import Firebase modules
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    let result;
    
    if (metricType === 'products') {
      // Save to products collection
      const productData = {
        user_id: userId,
        product_name: productName || '',
        quantity: quantity ? parseInt(quantity) : 0,
        material_cost: materialCost ? parseFloat(materialCost) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0,
        added_date: date || new Date().toISOString()
      };
      
      result = await FirebaseModels.products.create(productData);
    } else if (metricType === 'sales') {
      // Validate required fields for sales
      if (!productName || !quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: 'Product name and valid quantity are required for sales' 
        });
      }
      
      // Find the product to reduce inventory
      let productToUpdate = null;
      
      try {
        // Try to find product in products collection first
        productToUpdate = await FirebaseModels.products.findByProductName(userId, productName);
        
        if (!productToUpdate) {
          // Fallback: find in business_metrics collection
          const fallbackProducts = await FirebaseModels.businessMetrics.findByUserId(userId, 'products');
          productToUpdate = fallbackProducts.find(p => p.product_name === productName);
        }
        
        if (!productToUpdate) {
          return res.status(400).json({ 
            error: `Product "${productName}" not found in inventory` 
          });
        }
        
        // Check if sufficient inventory
        const currentQuantity = productToUpdate.quantity || 0;
        const quantityToSell = parseInt(quantity);
        
        if (currentQuantity < quantityToSell) {
          return res.status(400).json({ 
            error: `Insufficient inventory. Available: ${currentQuantity}, Requested: ${quantityToSell}` 
          });
        }
        
        // Reduce inventory - check if it's from products collection or business_metrics
        if (productToUpdate.id && !productToUpdate.id.startsWith('metric_')) {
          // This is a products collection ID (Firebase auto-generated IDs don't start with 'metric_')
          await FirebaseModels.products.reduceQuantity(productToUpdate.id, quantityToSell);
        } else {
          // Update in business_metrics collection
          const newQuantity = currentQuantity - quantityToSell;
          await FirebaseModels.businessMetrics.update(productToUpdate.id, { 
            quantity: newQuantity 
          });
        }
        
      } catch (inventoryError) {
        return res.status(500).json({ 
          error: 'Failed to update inventory',
          details: inventoryError.message 
        });
      }
      
      // Save to sales collection
      const saleData = {
        user_id: userId,
        product_name: productName || '',
        quantity: quantity ? parseInt(quantity) : 0,
        price_per_unit: price ? parseFloat(price) : 0,
        sale_date: date || new Date().toISOString()
      };
      
      result = await FirebaseModels.sales.create(saleData);
    } else {
      // Fallback to business_metrics for other types
      const metricData = {
        user_id: userId,
        metric_type: metricType,
        value: parseFloat(value),
        date_recorded: date || new Date().toISOString(),
        product_name: productName || '',
        price: price ? parseFloat(price) : 0,
        quantity: quantity ? parseInt(quantity) : 0,
        material_cost: materialCost ? parseFloat(materialCost) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0
      };
      
      result = await FirebaseModels.businessMetrics.create(metricData);
    }
    
    res.json({ 
      success: true, 
      message: `${metricType === 'products' ? 'Product' : metricType === 'sales' ? 'Sale' : 'Metric'} added successfully`, 
      data: result 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add business metric' });
  }
};

// Get products for a user (for sales dropdown)
export const getUserProducts: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Lazy import Firebase modules
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    try {
      // Try to get products from the products collection first
      const products = await FirebaseModels.products.getForDropdown(userId);
      
      res.json({ 
        success: true, 
        products: products 
      });
    } catch (error) {
      
      // Fallback to business_metrics collection if products collection fails
      const fallbackProducts = await FirebaseModels.businessMetrics.findByUserId(userId, 'products');
      
      // Format products for dropdown
      const formattedProducts = fallbackProducts.map(product => ({
        id: product.id,
        name: product.product_name || 'Unnamed Product',
        price: product.selling_price || 0,
        quantity: product.quantity || 0,
        dateAdded: product.created_at,
        materialCost: product.material_cost || 0,
        sellingPrice: product.selling_price || 0
      }));
      
      res.json({ 
        success: true, 
        products: formattedProducts 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get all business metrics for a user
export const getAllBusinessMetrics: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Lazy import Firebase modules
    const { FirebaseModels, isFirebaseConfigured, healthCheck } = await import('../database/firebase');
    
    if (!isFirebaseConfigured() || !(await healthCheck())) {
      return res.status(503).json({ error: 'Firebase not available' });
    }
    
    // Get all business metrics for the user
    const businessMetrics = await FirebaseModels.businessMetrics.findByUserId(userId);
    
    // Separate regular metrics from AI insights
    const regularMetrics = businessMetrics.filter(metric => metric.metric_type !== 'ai_insight');
    const aiInsights = businessMetrics.filter(metric => metric.metric_type === 'ai_insight');
    
    res.json({
      success: true,
      data: {
        businessMetrics: regularMetrics,
        aiInsights: aiInsights,
        total: businessMetrics.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get business metrics' });
  }
};

// Helper function to generate AI insights from business metrics
async function generateInsightsFromMetrics(userId: string, metrics: any[]): Promise<any[]> {
  const insights = [];
  const currentDate = new Date().toISOString();
  
  // Filter out AI insight metrics to avoid circular generation
  const businessMetrics = metrics.filter(metric => metric.metric_type !== 'ai_insight');
  
  // Group metrics by type
  const metricsByType = businessMetrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = [];
    }
    acc[metric.metric_type].push(metric);
    return acc;
  }, {});
  
  // Generate revenue insights
  if (metricsByType.revenue && metricsByType.revenue.length > 0) {
    const revenueMetrics = metricsByType.revenue.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
    const latestRevenue = Number(revenueMetrics[0].value);
    const previousRevenue = Number(revenueMetrics[1]?.value || latestRevenue);
    const growthRate = previousRevenue > 0 ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    if (growthRate > 20) {
      insights.push({
        id: `insight_${userId}_revenue_growth_${Date.now()}`,
        type: 'trend',
        title: 'Strong Revenue Growth Detected',
        description: `Your revenue has grown by ${growthRate.toFixed(1)}% compared to the previous period. This is excellent growth!`,
        priority: 'high',
        date: currentDate,
        actionable: true,
        category: 'finance',
        confidence: 90,
        source: 'ai_analysis',
        tags: ['revenue', 'growth', 'positive'],
        suggestedActions: [
          'Analyze what drove this growth',
          'Consider scaling successful strategies',
          'Plan for continued growth'
        ],
        estimatedImpact: 'high',
        timeframe: 'short_term'
      });
    } else if (growthRate < -10) {
      insights.push({
        id: `insight_${userId}_revenue_decline_${Date.now()}`,
        type: 'alert',
        title: 'Revenue Decline Alert',
        description: `Your revenue has decreased by ${Math.abs(growthRate).toFixed(1)}% compared to the previous period. Immediate attention needed.`,
        priority: 'high',
        date: currentDate,
        actionable: true,
        category: 'finance',
        confidence: 85,
        source: 'ai_analysis',
        tags: ['revenue', 'decline', 'urgent'],
        suggestedActions: [
          'Review recent changes in strategy',
          'Analyze customer feedback',
          'Consider promotional campaigns'
        ],
        estimatedImpact: 'high',
        timeframe: 'immediate'
      });
    }
  }
  
  // Generate customer insights
  if (metricsByType.customers && metricsByType.customers.length > 0) {
    const customerMetrics = metricsByType.customers.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
    const latestCustomers = Number(customerMetrics[0].value);
    
    if (latestCustomers > 100) {
      insights.push({
        id: `insight_${userId}_customer_milestone_${Date.now()}`,
        type: 'opportunity',
        title: 'Customer Milestone Reached',
        description: `Congratulations! You've reached ${latestCustomers} customers. This is a significant milestone for your business.`,
        priority: 'medium',
        date: currentDate,
        actionable: true,
        category: 'growth',
        confidence: 95,
        source: 'ai_analysis',
        tags: ['customers', 'milestone', 'growth'],
        suggestedActions: [
          'Celebrate this achievement with your team',
          'Consider customer appreciation campaigns',
          'Plan for the next milestone'
        ],
        estimatedImpact: 'medium',
        timeframe: 'short_term'
      });
    }
  }
  
  // Generate sales insights
  if (metricsByType.sales && metricsByType.sales.length > 0) {
    const salesMetrics = metricsByType.sales.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
    const latestSales = Number(salesMetrics[0].value);
    const avgSales = salesMetrics.reduce((sum, m) => sum + Number(m.value), 0) / salesMetrics.length;
    
    if (latestSales > avgSales * 1.5) {
      insights.push({
        id: `insight_${userId}_sales_spike_${Date.now()}`,
        type: 'trend',
        title: 'Sales Spike Detected',
        description: `Your recent sales of ${latestSales} are significantly above your average of ${avgSales.toFixed(0)}. Great performance!`,
        priority: 'medium',
        date: currentDate,
        actionable: true,
        category: 'sales',
        confidence: 80,
        source: 'ai_analysis',
        tags: ['sales', 'spike', 'performance'],
        suggestedActions: [
          'Identify what caused this spike',
          'Replicate successful strategies',
          'Maintain momentum'
        ],
        estimatedImpact: 'medium',
        timeframe: 'short_term'
      });
    }
  }
  
  return insights;
}

// Helper function to generate AI-powered recommendations using Vertex AI
async function generateAIRecommendations(products: any[], sales: any[], businessMetrics: any[]): Promise<any> {
  try {
    // Import Vertex AI
    const { initializeVertexAI } = await import('./ai');
    const { model } = await initializeVertexAI();
    
    if (!model) {
      return generateRecommendationsFromData(products, sales, businessMetrics);
    }

    // Prepare business data for AI analysis
    const businessData = {
      products: products.map(p => ({
        name: p.product_name,
        materialCost: p.material_cost,
        sellingPrice: p.selling_price,
        quantity: p.quantity,
        profitMargin: p.selling_price > 0 ? ((p.selling_price - p.material_cost) / p.selling_price * 100).toFixed(1) : 0
      })),
      sales: sales.map(s => ({
        product: s.product_name,
        quantity: s.quantity,
        revenue: s.value || s.price_per_unit * s.quantity,
        date: s.sale_date || s.date_recorded
      })),
      totalRevenue: sales.reduce((sum, s) => sum + (s.value || s.price_per_unit * s.quantity), 0),
      totalProducts: products.length,
      totalSales: sales.reduce((sum, s) => sum + s.quantity, 0)
    };

    const prompt = `You are an AI business advisor for a local artisan marketplace. Analyze the following business data and provide personalized recommendations.

Business Data:
- Products: ${JSON.stringify(businessData.products, null, 2)}
- Recent Sales: ${JSON.stringify(businessData.sales, null, 2)}
- Total Revenue: $${businessData.totalRevenue}
- Total Products: ${businessData.totalProducts}
- Total Units Sold: ${businessData.totalSales}

Please provide recommendations in the following JSON format:
{
  "immediate": [
    {
      "id": "rec_1",
      "title": "Action Title",
      "description": "Detailed description of the recommendation",
      "priority": "high|medium|low",
      "category": "inventory|sales|pricing|growth|strategy|operations",
      "timeframe": "immediate|short_term|long_term",
      "actionable": true
    }
  ],
  "shortTerm": [...],
  "longTerm": [...]
}

Focus on:
1. Inventory management (low stock, high-value items)
2. Sales optimization (pricing, marketing)
3. Business growth opportunities
4. Operational improvements
5. Financial insights

Make recommendations specific, actionable, and based on the actual data provided.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const recommendations = JSON.parse(text);
      return recommendations;
    } catch (parseError) {
      // Fallback to basic recommendations
      return generateRecommendationsFromData(products, sales, businessMetrics);
    }
  } catch (error) {
    // Fallback to basic recommendations
    return generateRecommendationsFromData(products, sales, businessMetrics);
  }
}

// Helper function to generate data-driven recommendations (fallback)
function generateRecommendationsFromData(products: any[], sales: any[], businessMetrics: any[]): any {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };

  // Analyze inventory levels
  const lowStockProducts = products.filter(p => (p.quantity || 0) <= 5);
  const outOfStockProducts = products.filter(p => (p.quantity || 0) === 0);
  const highValueProducts = products.filter(p => (p.quantity || 0) * (p.material_cost || 0) > 1000);

  // Analyze sales performance
  const recentSales = sales.filter(s => {
    const saleDate = new Date(s.sale_date || s.date_recorded);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return saleDate >= sevenDaysAgo;
  });

  const totalRevenue = recentSales.reduce((sum, sale) => sum + ((sale.price_per_unit || sale.price || 0) * (sale.quantity || 0)), 0);
  const totalProductsSold = recentSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

  // Calculate profit margins
  const productProfits = products.map(p => {
    const sellingPrice = p.selling_price || 0;
    const materialCost = p.material_cost || 0;
    const margin = sellingPrice > 0 ? ((sellingPrice - materialCost) / sellingPrice) * 100 : 0;
    return { ...p, profitMargin: margin };
  });

  const lowMarginProducts = productProfits.filter(p => p.profitMargin < 20 && p.profitMargin > 0);
  const highMarginProducts = productProfits.filter(p => p.profitMargin > 50);

  // IMMEDIATE RECOMMENDATIONS (Critical actions needed now)
  if (outOfStockProducts.length > 0) {
    recommendations.immediate.push({
      id: 'restock-critical',
      title: 'Critical: Restock Out-of-Stock Products',
      description: `${outOfStockProducts.length} products are completely out of stock: ${outOfStockProducts.map(p => p.product_name).join(', ')}`,
      priority: 'high',
      category: 'inventory',
      timeframe: 'immediate',
      actionable: true
    });
  }

  if (lowStockProducts.length > 0) {
    recommendations.immediate.push({
      id: 'restock-low',
      title: 'Alert: Low Stock Warning',
      description: `${lowStockProducts.length} products are running low on stock. Consider restocking soon.`,
      priority: 'medium',
      category: 'inventory',
      timeframe: 'immediate',
      actionable: true
    });
  }

  if (totalRevenue === 0 && products.length > 0) {
    recommendations.immediate.push({
      id: 'no-sales',
      title: 'Action: No Recent Sales',
      description: 'You have products in inventory but no sales in the last 7 days. Consider marketing or pricing adjustments.',
      priority: 'high',
      category: 'sales',
      timeframe: 'immediate',
      actionable: true
    });
  }

  // SHORT-TERM RECOMMENDATIONS (Next 1-4 weeks)
  if (lowMarginProducts.length > 0) {
    recommendations.shortTerm.push({
      id: 'improve-margins',
      title: 'Improve: Profit Margins',
      description: `${lowMarginProducts.length} products have low profit margins (<20%). Consider increasing prices or reducing costs.`,
      priority: 'medium',
      category: 'pricing',
      timeframe: 'short_term',
      actionable: true
    });
  }

  if (highValueProducts.length > 0) {
    recommendations.shortTerm.push({
      id: 'optimize-inventory',
      title: 'Optimize: High-Value Inventory',
      description: `You have ₹${highValueProducts.reduce((sum, p) => sum + (p.quantity * p.material_cost), 0).toLocaleString()} tied up in high-value inventory. Consider sales strategies.`,
      priority: 'medium',
      category: 'inventory',
      timeframe: 'short_term',
      actionable: true
    });
  }

  if (recentSales.length > 0) {
    const avgOrderValue = totalRevenue / recentSales.length;
    if (avgOrderValue < 500) {
      recommendations.shortTerm.push({
        id: 'increase-aov',
        title: 'Increase: Average Order Value',
        description: `Current AOV is ₹${avgOrderValue.toFixed(0)}. Consider bundling products or upselling strategies.`,
        priority: 'medium',
        category: 'sales',
        timeframe: 'short_term',
        actionable: true
      });
    }
  }

  // LONG-TERM RECOMMENDATIONS (Next 1-3 months)
  if (highMarginProducts.length > 0) {
    recommendations.longTerm.push({
      id: 'scale-profitable',
      title: 'Scale: Profitable Products',
      description: `${highMarginProducts.length} products have excellent profit margins (>50%). Consider expanding production.`,
      priority: 'low',
      category: 'growth',
      timeframe: 'long_term',
      actionable: true
    });
  }

  if (products.length > 10) {
    recommendations.longTerm.push({
      id: 'diversify-portfolio',
      title: 'Analyze: Product Portfolio',
      description: `You have ${products.length} products. Consider analyzing which ones to focus on and which to phase out.`,
      priority: 'low',
      category: 'strategy',
      timeframe: 'long_term',
      actionable: true
    });
  }

  if (totalProductsSold > 0) {
    const inventoryTurnover = totalProductsSold / products.reduce((sum, p) => sum + (p.quantity || 0), 1);
    if (inventoryTurnover < 0.5) {
      recommendations.longTerm.push({
        id: 'improve-turnover',
        title: 'Improve: Inventory Turnover',
        description: 'Your inventory turnover is low. Consider better demand forecasting and inventory management.',
        priority: 'medium',
        category: 'operations',
        timeframe: 'long_term',
        actionable: true
      });
    }
  }

  // Add general business recommendations if no specific data
  if (products.length === 0) {
    recommendations.immediate.push({
      id: 'add-products',
      title: 'Add: Your First Products',
      description: 'Start by adding products to your inventory to begin tracking your business metrics.',
      priority: 'high',
      category: 'onboarding',
      timeframe: 'immediate',
      actionable: true
    });
  }

  return recommendations;
}

// Helper function to generate market trends from metrics
function generateMarketTrendsFromMetrics(metrics: any[]): any {
  const trends = {
    trendingProducts: [],
    seasonalOpportunities: [],
    competitorInsights: []
  };
  
  // Analyze metrics to generate trends
  const revenueMetrics = metrics.filter(m => m.metric_type === 'revenue');
  if (revenueMetrics.length > 0) {
    const avgRevenue = revenueMetrics.reduce((sum, m) => sum + Number(m.value), 0) / revenueMetrics.length;
    if (avgRevenue > 1000) {
      trends.trendingProducts.push('Premium products showing strong demand');
    }
  }
  
  const customerMetrics = metrics.filter(m => m.metric_type === 'customers');
  if (customerMetrics.length > 0) {
    const latestCustomers = Number(customerMetrics.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime())[0].value);
    if (latestCustomers > 50) {
      trends.seasonalOpportunities.push('Customer base growing - consider seasonal promotions');
    }
  }
  
  return trends;
}

// Helper function to store insights as business metrics
async function storeInsightsAsMetrics(userId: string, insights: any[]): Promise<void> {
  try {
    const { FirebaseModels } = await import('../database/firebase');
    
    for (const insight of insights) {
      // Store each insight as a business metric
      const insightMetric = {
        id: `insight_metric_${insight.id}`,
        user_id: userId,
        metric_type: 'ai_insight',
        value: insight.confidence || 0, // Use confidence as the numeric value
        description: insight.description,
        date_recorded: insight.date,
        metadata: {
          insight_id: insight.id,
          type: insight.type,
          title: insight.title,
          priority: insight.priority,
          actionable: insight.actionable,
          category: insight.category,
          source: insight.source,
          tags: insight.tags || [],
          suggestedActions: insight.suggestedActions || [],
          estimatedImpact: insight.estimatedImpact,
          timeframe: insight.timeframe
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Check if this insight already exists as a metric
      try {
        const existingMetric = await FirebaseModels.businessMetrics.findById(insightMetric.id);
        if (!existingMetric) {
          await FirebaseModels.businessMetrics.create(insightMetric);
        }
      } catch (error) {
        // If metric doesn't exist, create it
        await FirebaseModels.businessMetrics.create(insightMetric);
      }
    }
  } catch (error) {
    // Don't throw error as this is not critical for the main flow
  }
}

// Helper function to get insights from business metrics
async function getInsightsFromMetrics(userId: string): Promise<any[]> {
  try {
    const { FirebaseModels } = await import('../database/firebase');
    
    // Get all AI insight metrics for the user
    const insightMetrics = await FirebaseModels.businessMetrics.findByUserId(userId, 'ai_insight');
    
    // Convert metrics back to insights
    const insights = insightMetrics.map(metric => ({
      id: metric.metadata?.insight_id || metric.id,
      type: metric.metadata?.type || 'insight',
      title: metric.metadata?.title || 'AI Insight',
      description: metric.description,
      priority: metric.metadata?.priority || 'medium',
      date: metric.date_recorded,
      actionable: metric.metadata?.actionable || false,
      category: metric.metadata?.category || 'general',
      confidence: metric.value,
      source: metric.metadata?.source || 'ai_analysis',
      tags: Array.isArray(metric.metadata?.tags) ? metric.metadata.tags : [],
      suggestedActions: Array.isArray(metric.metadata?.suggestedActions) ? metric.metadata.suggestedActions : [],
      estimatedImpact: metric.metadata?.estimatedImpact || 'medium',
      timeframe: metric.metadata?.timeframe || 'short_term'
    }));
    
    return insights;
  } catch (error) {
    return [];
  }
}
