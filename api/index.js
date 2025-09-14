import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import Firebase configuration
import { initializeFirebase, isFirebaseConfigured, healthCheck, FirebaseModels } from './firebase-config.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Basic routes
app.get("/api/ping", (req, res) => {
  res.json({ message: "Hello from Vercel API" });
});

// Debug endpoint to check environment variables
app.get("/api/debug/env", (req, res) => {
  res.json({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set',
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not set',
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not set',
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV
  });
});

// Dashboard test endpoint
app.get("/api/dashboard/test", (req, res) => {
  res.json({ 
    message: 'Dashboard API is working',
    timestamp: new Date().toISOString(),
    userId: req.params.userId || 'test-user',
    environment: process.env.NODE_ENV,
    firebaseConfig: {
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set'
    }
  });
});

// Dashboard data endpoint with Firebase
app.get("/api/dashboard/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('Dashboard API called for user:', userId);
    
    // Check if Firebase is configured
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
        },
        businessMetrics: []
      };
      return res.json(emptyData);
    }
    
    // Initialize Firebase
    initializeFirebase();
    
    // Check Firebase health
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
        },
        businessMetrics: []
      };
      return res.json(emptyData);
    }
    
    // Get data from Firebase
    let products = [];
    let sales = [];
    let businessMetrics = [];
    
    try {
      products = await FirebaseModels.products.findByUserId(userId);
      sales = await FirebaseModels.sales.findByUserId(userId);
      businessMetrics = await FirebaseModels.businessMetrics.findByUserId(userId);
    } catch (error) {
      console.error('Error fetching data from Firebase:', error);
      // Continue with empty data
    }
    
    // Calculate summary
    const totalInsights = businessMetrics.filter(m => m.metric_type === 'ai_insight').length;
    const highPriorityCount = businessMetrics.filter(m => 
      m.metric_type === 'ai_insight' && m.metadata?.priority === 'high'
    ).length;
    const actionableCount = businessMetrics.filter(m => 
      m.metric_type === 'ai_insight' && m.metadata?.actionable
    ).length;
    
    // Get top categories
    const categoryCount = businessMetrics.reduce((acc, metric) => {
      if (metric.metric_type === 'ai_insight' && metric.metadata?.category) {
        acc[metric.metadata.category] = (acc[metric.metadata.category] || 0) + 1;
      }
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => (b) - (a))
      .slice(0, 3)
      .map(([category]) => category);
    
    const dashboardData = {
      insights: businessMetrics.filter(m => m.metric_type === 'ai_insight').map(metric => ({
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
      })),
      summary: {
        totalInsights,
        highPriorityCount,
        actionableCount,
        weeklyGrowth: 0, // TODO: Calculate from metrics
        topCategories
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
      },
      businessMetrics: businessMetrics
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message,
      debug: {
        userId: req.params.userId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        firebaseConfig: {
          FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set'
        }
      }
    });
  }
});

// Add business metric endpoint with Firebase
app.post("/api/dashboard/:userId/add-metric", async (req, res) => {
  try {
    const { userId } = req.params;
    const { metricType, value, date, productName, price, quantity, materialCost, sellingPrice } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!metricType || value === undefined) {
      return res.status(400).json({ error: 'Metric type and value are required' });
    }
    
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      return res.status(503).json({ error: 'Firebase not configured' });
    }
    
    // Initialize Firebase
    initializeFirebase();
    
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
      // Save to business_metrics collection
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
    console.error('Add metric error:', error);
    res.status(500).json({ 
      error: 'Failed to add business metric',
      details: error.message
    });
  }
});

// Get products endpoint with Firebase
app.get("/api/dashboard/:userId/products", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!isFirebaseConfigured()) {
      return res.json({ 
        success: true, 
        products: []
      });
    }
    
    // Initialize Firebase
    initializeFirebase();
    
    // Get products from Firebase
    const products = await FirebaseModels.products.findByUserId(userId);
    
    // Format products for dropdown
    const formattedProducts = products.map(product => ({
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
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Business Flow endpoints
app.get("/api/business-flow/charts/:userId", (req, res) => {
  res.json([]);
});

app.get("/api/business-flow/:userId/latest", (req, res) => {
  res.json(null);
});

app.post("/api/business-flow/:userId/save", (req, res) => {
  res.json({ success: true, message: 'Business flow saved' });
});

// AI endpoints (simplified)
app.post("/api/ai/chat", (req, res) => {
  res.json({ 
    message: "AI chat functionality not yet implemented in Vercel API",
    response: "This is a placeholder response. AI features will be added in the next phase."
  });
});

app.get("/api/ai/health", (req, res) => {
  res.json({ status: 'healthy', message: 'AI service is running' });
});

// Speech endpoints (simplified)
app.post("/api/speech/recognize", (req, res) => {
  res.json({ 
    message: "Speech recognition not yet implemented in Vercel API",
    transcript: "This is a placeholder transcript."
  });
});

app.get("/api/speech/health", (req, res) => {
  res.json({ status: 'healthy', message: 'Speech service is running' });
});

// Image endpoints (simplified)
app.post("/api/images/generate", (req, res) => {
  res.json({ 
    message: "Image generation not yet implemented in Vercel API",
    imageUrl: "https://via.placeholder.com/400x300?text=Image+Generation+Coming+Soon"
  });
});

// Location endpoints (simplified)
app.post("/api/location/search", (req, res) => {
  res.json({ 
    message: "Location search not yet implemented in Vercel API",
    results: []
  });
});

// Social Media endpoints (simplified)
app.post("/api/social/generate-post", (req, res) => {
  res.json({ 
    message: "Social media post generation not yet implemented in Vercel API",
    post: "This is a placeholder social media post."
  });
});

app.get("/api/social/platforms", (req, res) => {
  res.json([
    { id: 'instagram', name: 'Instagram', enabled: false },
    { id: 'facebook', name: 'Facebook', enabled: false },
    { id: 'twitter', name: 'Twitter', enabled: false }
  ]);
});

// Catch-all for API routes
app.get("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found", path: req.path });
});

// Export the serverless handler
export default serverless(app);
