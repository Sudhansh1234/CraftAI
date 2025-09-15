// Vercel API entry point - Single serverless function
// This file handles ALL API routes to stay within the 12 function limit
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Basic routes
app.get("/api/ping", (req, res) => {
  res.json({ message: "Hello from Vercel API with server folder" });
});

// Debug endpoint
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
    message: 'Dashboard API is working with server folder',
    timestamp: new Date().toISOString(),
    userId: req.params.userId || 'test-user',
    environment: process.env.NODE_ENV
  });
});

// Dashboard data endpoint (placeholder)
app.get("/api/dashboard/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const dashboardData = {
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

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

// Add business metric endpoint (placeholder)
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
    
    const result = {
      success: true,
      message: `${metricType === 'products' ? 'Product' : metricType === 'sales' ? 'Sale' : 'Metric'} added successfully`,
      data: {
        id: `temp_${Date.now()}`,
        user_id: userId,
        metric_type: metricType,
        value: parseFloat(value),
        date_recorded: date || new Date().toISOString(),
        product_name: productName || '',
        price: price ? parseFloat(price) : 0,
        quantity: quantity ? parseInt(quantity) : 0,
        material_cost: materialCost ? parseFloat(materialCost) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Add metric error:', error);
    res.status(500).json({ 
      error: 'Failed to add business metric',
      details: error.message
    });
  }
});

// Get products endpoint (placeholder)
app.get("/api/dashboard/:userId/products", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    res.json({ 
      success: true, 
      products: []
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Business Flow endpoints (placeholder)
app.get("/api/business-flow/charts/:userId", (req, res) => {
  res.json([]);
});

app.get("/api/business-flow/:userId/latest", (req, res) => {
  res.json(null);
});

app.post("/api/business-flow/:userId/save", (req, res) => {
  res.json({ success: true, message: 'Business flow saved' });
});

// AI endpoints (placeholder)
app.post("/api/ai/chat", (req, res) => {
  res.json({ 
    message: "AI chat functionality - server folder version",
    response: "This is a placeholder response from the server folder API."
  });
});

app.get("/api/ai/health", (req, res) => {
  res.json({ status: 'healthy', message: 'AI service is running' });
});

// Speech endpoints (placeholder)
app.post("/api/speech/recognize", (req, res) => {
  res.json({ 
    message: "Speech recognition - server folder version",
    transcript: "This is a placeholder transcript."
  });
});

app.get("/api/speech/health", (req, res) => {
  res.json({ status: 'healthy', message: 'Speech service is running' });
});

// Image endpoints (placeholder)
app.post("/api/images/generate", (req, res) => {
  res.json({ 
    message: "Image generation - server folder version",
    imageUrl: "https://via.placeholder.com/400x300?text=Server+Folder+API"
  });
});

// Location endpoints (placeholder)
app.post("/api/location/search", (req, res) => {
  res.json({ 
    message: "Location search - server folder version",
    results: []
  });
});

// Social Media endpoints (placeholder)
app.post("/api/social/generate-post", (req, res) => {
  res.json({ 
    message: "Social media post generation - server folder version",
    post: "This is a placeholder social media post from server folder."
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
app.get("*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found", path: req.path });
});

// Export the serverless handler
export default serverless(app);