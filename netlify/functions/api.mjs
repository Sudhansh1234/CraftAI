// Netlify function for API routes - Using Firebase Client SDK (ES Modules)

import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

// AI Recommendations Cache System
class RecommendationCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 15 * 60 * 1000; // 15 minutes
  }

  generateKey(userId, dataHash) {
    return `${userId}_${dataHash}`;
  }

  get(userId, dataHash) {
    const key = this.generateKey(userId, dataHash);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('📦 Cache hit for user', userId);
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set(userId, dataHash, data) {
    const key = this.generateKey(userId, dataHash);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 Cached recommendations for user', userId, `(TTL: ${this.ttl}ms)`);
  }

  invalidate(userId) {
    const keysToDelete = [];
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log('🗑️ Invalidated cache for user', userId);
  }

  clear() {
    this.cache.clear();
    console.log('🧹 Cleared all recommendation cache');
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

const recommendationCache = new RecommendationCache();

// AI Recommendations Generation Functions
function generateFutureProductRecommendations(products, sales, productProfits) {
  const recommendations = [];
  
  // Analyze current product categories and success patterns
  const productCategories = products.map(p => p.product_name.toLowerCase());
  const salesByProduct = sales.reduce((acc, sale) => {
    const productName = sale.product_name.toLowerCase();
    acc[productName] = (acc[productName] || 0) + (sale.quantity || 0);
    return acc;
  }, {});

  // Find best-selling products
  const bestSellingProducts = Object.entries(salesByProduct)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([product]) => product);

  // Find highest margin products
  const topMarginProducts = productProfits
    .filter(p => p.profitMargin > 30)
    .sort((a, b) => b.profitMargin - a.profitMargin)
    .slice(0, 2)
    .map(p => p.product_name.toLowerCase());

  // Generate recommendations based on patterns
  if (bestSellingProducts.length > 0) {
    const topProduct = bestSellingProducts[0];
    
    // Suggest variations of best-selling products
    if (topProduct.includes('bowl')) {
      recommendations.push('Ceramic Plate Set', 'Matching Ceramic Mugs');
    } else if (topProduct.includes('scarf')) {
      recommendations.push('Matching Gloves', 'Cozy Blanket');
    } else if (topProduct.includes('table')) {
      recommendations.push('Matching Chairs', 'Coffee Table');
    } else if (topProduct.includes('ceramic')) {
      recommendations.push('Ceramic Vase', 'Decorative Ceramic Tiles');
    } else if (topProduct.includes('wooden')) {
      recommendations.push('Wooden Cutting Board', 'Wooden Utensils');
    } else {
      recommendations.push(`${topProduct.charAt(0).toUpperCase() + topProduct.slice(1)} Gift Set`);
    }
  }

  // Suggest complementary products based on high-margin items
  if (topMarginProducts.length > 0) {
    const highMarginProduct = topMarginProducts[0];
    
    if (highMarginProduct.includes('bowl') || highMarginProduct.includes('ceramic')) {
      recommendations.push('Hand-painted Ceramic Art', 'Custom Ceramic Jewelry');
    } else if (highMarginProduct.includes('scarf') || highMarginProduct.includes('textile')) {
      recommendations.push('Handwoven Wall Hanging', 'Textile Art Piece');
    } else if (highMarginProduct.includes('wooden') || highMarginProduct.includes('table')) {
      recommendations.push('Hand-carved Wooden Art', 'Custom Wooden Sign');
    }
  }

  // Suggest seasonal products based on current time
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 || currentMonth <= 1) { // Winter months
    recommendations.push('Holiday Ornaments', 'Winter Accessories', 'Gift Sets');
  } else if (currentMonth >= 2 && currentMonth <= 4) { // Spring
    recommendations.push('Garden Decor', 'Spring Accessories', 'Fresh Flower Arrangements');
  } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
    recommendations.push('Beach Accessories', 'Summer Decor', 'Outdoor Items');
  } else { // Fall
    recommendations.push('Autumn Decor', 'Cozy Home Items', 'Harvest-themed Products');
  }

  // Suggest based on price range analysis
  const avgPrice = products.reduce((sum, p) => sum + (p.selling_price || 0), 0) / products.length;
  if (avgPrice < 100) {
    recommendations.push('Premium Collection (₹200-500 range)');
  } else if (avgPrice > 200) {
    recommendations.push('Budget-friendly Options (₹50-150 range)');
  }

  // Remove duplicates and limit to 3 recommendations
  const uniqueRecommendations = [...new Set(recommendations)].slice(0, 3);
  
  return uniqueRecommendations;
}

function generateAIRecommendations(products, sales, productProfits) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };

  // Calculate key metrics
  const totalProducts = products.length;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + ((sale.price_per_unit || 0) * (sale.quantity || 0)), 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const lowStockProducts = products.filter(p => (p.quantity || 0) < 5);
  const highMarginProducts = productProfits.filter(p => p.profitMargin > 50);

  // IMMEDIATE RECOMMENDATIONS (Next 1-7 days)
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

  // SHORT-TERM RECOMMENDATIONS (Next 1-4 weeks)
  if (averageOrderValue < 500) {
    recommendations.shortTerm.push({
      id: 'increase-aov',
      title: 'Increase: Average Order Value',
      description: `Current AOV is ₹${Math.round(averageOrderValue)}. Consider bundling products or upselling strategies.`,
      priority: 'medium',
      category: 'sales',
      timeframe: 'short_term',
      actionable: true
    });
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

  // FUTURE PRODUCT RECOMMENDATIONS (What to make next)
  const futureRecommendations = generateFutureProductRecommendations(products, sales, productProfits);
  if (futureRecommendations.length > 0) {
    recommendations.longTerm.push({
      id: 'future-products',
      title: 'Create: Future Products',
      description: `Based on your current success, consider making: ${futureRecommendations.join(', ')}`,
      priority: 'medium',
      category: 'product_development',
      timeframe: 'long_term',
      actionable: true,
      suggestedProducts: futureRecommendations
    });
  }

  if (products.length > 10) {
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

  return recommendations;
}

console.log('🚀 Netlify API starting up...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');

// Firebase Client SDK configuration
let firebaseApp = null;
let firestore = null;

// Initialize Firebase Client SDK
async function initializeFirebase() {
  console.log('🔥 initializeFirebase called');

  if (firebaseApp) {
    console.log('✅ Firebase already initialized, returning cached instance');
    return { firebaseApp, firestore };
  }

  console.log('🔧 Starting Firebase Client SDK initialization...');
  console.log('🔑 Firebase config check:');
  console.log('  - PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Not set');
  console.log('  - API_KEY:', process.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Not set');

  // Quick check if Firebase config is missing
  if (!process.env.VITE_FIREBASE_PROJECT_ID || !process.env.VITE_FIREBASE_API_KEY) {
    console.log('⚠️ Firebase config missing, using sample data');
    return { firebaseApp: null, firestore: null };
  }

  try {
    console.log('📦 Importing Firebase Client SDK...');
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    console.log('✅ Firebase Client SDK imported successfully');

    // Check if Firebase is already initialized
    console.log('🔍 Checking for existing Firebase apps...');
    const apps = getApps();
    console.log('📊 Found', apps.length, 'existing Firebase apps');

    if (apps.length > 0) {
      console.log('♻️ Using existing Firebase app');
      firebaseApp = apps[0];
    } else {
      console.log('🆕 Creating new Firebase app...');
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
      };

      console.log('🔧 Initializing Firebase with config:', {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set'
      });

      firebaseApp = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized successfully');
    }

    console.log('🗄️ Getting Firestore instance...');
    firestore = getFirestore(firebaseApp);
    console.log('✅ Firestore instance created');

    return { firebaseApp, firestore };
  } catch (error) {
    console.error('❌ Firebase Client SDK initialization failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { firebaseApp: null, firestore: null };
  }
}

const app = express();
console.log('✅ Express app created');

// Middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('✅ Middleware configured');

// Basic health check
app.get("/api/health", (req, res) => {
  console.log('🏥 Health check endpoint called');
  const response = {
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "API is working"
  };
  console.log('✅ Health check response:', response);
  res.json(response);
});

// Simple ping endpoint
app.get("/api/ping", (req, res) => {
  res.json({ message: "Hello from Netlify API (client-side Firebase)" });
});

// Dashboard test endpoint
app.get("/api/dashboard/test", async (req, res) => {
  console.log('🧪 Dashboard test endpoint called');
  console.log('📅 Request timestamp:', new Date().toISOString());

  try {
    const response = {
      message: 'Dashboard API is working (using client-side Firebase)',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      firebaseStatus: 'Client-side only',
      firebaseProjectId: process.env.VITE_FIREBASE_PROJECT_ID || 'Not set'
    };

    console.log('✅ Dashboard test response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Dashboard test error:', error);
    res.status(500).json({
      error: 'Dashboard test failed',
      details: error.message
    });
  }
});

// Dashboard data endpoint with Firebase Client SDK
app.get("/api/dashboard/:userId", async (req, res) => {
  console.log('📊 Dashboard endpoint called');
  console.log('👤 User ID:', req.params.userId);
  console.log('📅 Request timestamp:', new Date().toISOString());

  try {
    const userId = req.params.userId;
    console.log('🔥 Calling initializeFirebase for dashboard...');
    const { firebaseApp, firestore } = await initializeFirebase();
    console.log('✅ Firebase initialization result for dashboard:', {
      firebaseApp: firebaseApp ? 'Present' : 'Null',
      firestore: firestore ? 'Present' : 'Null'
    });

    if (!firestore) {
      console.log('⚠️ Firestore not available, using sample data');
      // Fallback to sample data if Firebase is not available
      const dashboardData = {
        userId: userId,
        insights: [
          {
            id: 1,
            title: "Sample Insight (Firebase not available)",
            priority: "high",
            category: "sales",
            description: "This is sample data because Firebase is not connected"
          }
        ],
        summary: {
          totalInsights: 1,
          highPriorityCount: 1,
          actionableCount: 1,
          weeklyGrowth: 0,
          topCategories: ["sales"]
        },
        recommendations: {
          immediate: ["Connect Firebase for real data"],
          shortTerm: ["Add more data"],
          longTerm: ["Scale your application"]
        },
        marketTrends: {
          trendingProducts: [],
          seasonalOpportunities: [],
          competitorInsights: []
        },
        businessMetrics: [
          {
            name: "API Status",
            value: "Working (Sample Data)",
            trend: "stable"
          }
        ],
        timestamp: new Date().toISOString(),
        dataSource: "sample",
        platform: "netlify"
      };

      console.log('✅ Returning sample dashboard data:', dashboardData);
      return res.json(dashboardData);
    }

    // Try to fetch real data from Firebase with timeout
    console.log('🔥 Starting Firebase data fetch...');
    const fetchPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('📦 Using Firebase Client SDK for Firestore operations...');
        const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
        console.log('✅ Firestore functions imported');

        // Fetch products
        console.log('🛍️ Fetching products for user:', userId);
        const productsRef = collection(firestore, 'products');
        const productsQuery = query(
          productsRef,
          where('user_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(20)
        );
        console.log('📊 Executing products query...');
        const productsSnapshot = await getDocs(productsQuery);
        console.log('📊 Products query completed, found', productsSnapshot.docs.length, 'documents');
        const products = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Products processed:', products.length);

        // Fetch sales
        console.log('💰 Fetching sales for user:', userId);
        const salesRef = collection(firestore, 'sales');
        const salesQuery = query(
          salesRef,
          where('user_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(50)
        );
        console.log('📊 Executing sales query...');
        const salesSnapshot = await getDocs(salesQuery);
        console.log('📊 Sales query completed, found', salesSnapshot.docs.length, 'documents');
        const sales = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Sales processed:', sales.length);

        // Calculate product profits for AI recommendations
        const productProfits = products.map(product => {
          const materialCost = product.material_cost || 0;
          const sellingPrice = product.selling_price || 0;
          const profitMargin = sellingPrice > 0 ? ((sellingPrice - materialCost) / sellingPrice) * 100 : 0;
          return {
            ...product,
            profitMargin: Math.round(profitMargin * 10) / 10
          };
        });

        // Combine as business metrics for backward compatibility
        const businessMetrics = [
          ...products.map(p => ({ ...p, metric_type: 'products' })),
          ...sales.map(s => ({ ...s, metric_type: 'sales' }))
        ];

        // Generate data hash for caching
        const dataHash = JSON.stringify({
          products: products.length,
          sales: sales.length,
          lastUpdate: Math.max(
            ...products.map(p => new Date(p.updated_at?.toDate?.() || p.created_at?.toDate?.() || p.created_at || 0).getTime()),
            ...sales.map(s => new Date(s.updated_at?.toDate?.() || s.created_at?.toDate?.() || s.created_at || 0).getTime())
          )
        });

        // Check cache for AI recommendations
        let aiRecommendations = recommendationCache.get(userId, dataHash);
        
        if (!aiRecommendations) {
          console.log('Generating new recommendations from Firestore data:', { products: products.length, sales: sales.length });
          aiRecommendations = generateAIRecommendations(products, sales, productProfits);
          recommendationCache.set(userId, dataHash, aiRecommendations);
          console.log('Generated and cached recommendations:', {
            immediate: aiRecommendations.immediate.length,
            shortTerm: aiRecommendations.shortTerm.length,
            longTerm: aiRecommendations.longTerm.length
          });
        } else {
          console.log('Using cached recommendations for user:', userId);
        }

        // Try fallback to business_metrics collection if no data found
        if (businessMetrics.length === 0) {
          console.log('📈 No products/sales found, trying business_metrics fallback...');
          const metricsRef = collection(firestore, 'business_metrics');
        const metricsQuery = query(
          metricsRef, 
            where('user_id', '==', userId),
            orderBy('date_recorded', 'desc'),
            limit(20)
          );
        const metricsSnapshot = await getDocs(metricsQuery);
          const fallbackMetrics = metricsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
          businessMetrics.push(...fallbackMetrics);
          console.log('✅ Fallback metrics processed:', fallbackMetrics.length);
        }

        console.log('🔧 Building dashboard data object...');
        
        // Calculate KPIs from real data
        const totalProductsSold = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
        const totalRevenue = sales.reduce((sum, sale) => sum + ((sale.price_per_unit || 0) * (sale.quantity || 0)), 0);
        const totalProducts = products.length;
        const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
        const inventoryValue = products.reduce((sum, product) => sum + ((product.material_cost || 0) * (product.quantity || 0)), 0);
        
        // Calculate growth (simple week-over-week)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentSales = sales.filter(sale => {
          const saleDate = sale.sale_date ? new Date(sale.sale_date) : new Date(sale.created_at?.toDate?.() || sale.created_at);
          return saleDate >= sevenDaysAgo;
        });
        const recentRevenue = recentSales.reduce((sum, sale) => sum + ((sale.price_per_unit || 0) * (sale.quantity || 0)), 0);
        const weeklyGrowth = sales.length > recentSales.length ? 
          ((recentRevenue / (totalRevenue - recentRevenue)) - 1) * 100 : 0;

        // Generate sales chart data from real sales
        const salesChartData = sales.slice(0, 7).map(sale => ({
          date: sale.sale_date || (sale.created_at?.toDate?.() || sale.created_at).toISOString().split('T')[0],
          sales: sale.quantity || 0,
          revenue: (sale.price_per_unit || 0) * (sale.quantity || 0)
        }));

        // Generate inventory data for table
        const inventoryData = products.map(product => ({
          id: product.id,
          product_name: product.product_name || 'Unnamed Product',
          quantity: product.quantity || 0,
          material_cost: product.material_cost || 0,
          selling_price: product.selling_price || 0,
          total_value: (product.selling_price || 0) * (product.quantity || 0),
          profit_margin: product.selling_price > 0 ? 
            (((product.selling_price - product.material_cost) / product.selling_price) * 100) : 0,
          last_updated: product.updated_at?.toDate?.() || product.updated_at || product.created_at?.toDate?.() || product.created_at || new Date().toISOString()
        }));

        const dashboardData = {
          userId: userId,
          // Empty insights - no AI insights implemented
          insights: [],
          summary: {
            totalInsights: 0,
            highPriorityCount: 0,
            actionableCount: 0,
            weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
            topCategories: []
          },
          // AI recommendations with caching
          recommendations: aiRecommendations,
          marketTrends: {
            trendingProducts: [],
            seasonalOpportunities: [],
            competitorInsights: []
          },
          // Real business data
          businessMetrics: businessMetrics,
          kpiData: {
            productsSold: totalProductsSold,
            totalSales: sales.length,
            totalRevenue: totalRevenue,
            topSeller: products.length > 0 ? products[0].product_name : 'No products',
            salesGrowth: Math.round(weeklyGrowth * 10) / 10,
            productGrowth: 0, // Could calculate from historical data
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            inventoryValue: Math.round(inventoryValue * 100) / 100
          },
          salesChartData: salesChartData,
          inventoryData: inventoryData,
          products: products,
          sales: sales,
          timestamp: new Date().toISOString(),
          dataSource: "firebase",
          platform: "netlify"
        };

        console.log('✅ Dashboard data built successfully:', {
          productsCount: products.length,
          salesCount: sales.length,
          metricsCount: businessMetrics.length,
          dataSource: 'firebase'
        });
        resolve(dashboardData);
      } catch (error) {
        console.error('❌ Error in Firebase fetch promise:', error);
        reject(error);
      }
    });

    // Set 15 second timeout for Firebase operations
    console.log('⏰ Setting 15-second timeout for Firebase operations...');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error('⏰ Firebase operation timeout after 15 seconds');
        reject(new Error('Firebase operation timeout'));
      }, 15000);
    });

    console.log('🏁 Racing Firebase fetch vs timeout...');
    const dashboardData = await Promise.race([fetchPromise, timeoutPromise]);
    console.log('✅ Firebase fetch completed successfully');
    console.log('📤 Sending dashboard response:', {
      insightsCount: dashboardData.insights.length,
      metricsCount: dashboardData.businessMetrics.length,
      dataSource: dashboardData.dataSource
    });
    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error.message,
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    });
  }
});

// Add metric endpoint with Firebase Client SDK
app.post("/api/dashboard/:userId/add-metric", async (req, res) => {
  console.log('➕ Add metric endpoint called');
  console.log('👤 User ID:', req.params.userId);
  console.log('🌐 Request origin:', req.headers.origin);
  console.log('📋 Content-Type:', req.headers['content-type']);
  console.log('📏 Content-Length:', req.headers['content-length']);

  try {
    const userId = req.params.userId;
    let metricData = req.body;

    // Handle case where body is received as Buffer
    if (Buffer.isBuffer(metricData)) {
      console.log('🔧 Body received as Buffer, parsing JSON...');
      try {
        metricData = JSON.parse(metricData.toString('utf8'));
        console.log('✅ Successfully parsed JSON from Buffer');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Buffer:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }

    console.log('🔍 Raw request details:', {
      method: req.method,
      headers: req.headers,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'No body',
      bodyContent: req.body,
      rawBody: req.body
    });

    console.log('📝 Add metric request data:', {
      userId,
      metricType: metricData.metricType,
      productName: metricData.productName,
      value: metricData.value,
      sellingPrice: metricData.sellingPrice,
      materialCost: metricData.materialCost,
      quantity: metricData.quantity,
      date: metricData.date,
      price: metricData.price
    });

    // Check if request body is empty or invalid
    if (!metricData || Object.keys(metricData).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Request body is empty or invalid. Please check your form data and try again.',
        debug: {
          bodyType: typeof req.body,
          bodyKeys: req.body ? Object.keys(req.body) : 'No body',
          contentType: req.headers['content-type']
        }
      });
    }

    if (!metricData.metricType) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing metricType' 
      });
    }

    // More specific validation based on metric type (matching server logic)
    if (metricData.metricType === 'products') {
      // For products, we need productName and either sellingPrice or value
      if (!metricData.productName) {
        return res.status(400).json({ 
          success: false,
          error: 'Product name is required' 
        });
      }
      // Check if we have a valid selling price (either sellingPrice or value)
      const sellingPrice = metricData.sellingPrice || metricData.value;
      if (!sellingPrice || isNaN(parseFloat(sellingPrice))) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid selling price is required' 
        });
      }
    } else if (metricData.metricType === 'sales') {
      // For sales, validate required fields (matching server validation)
      if (!metricData.productName || !metricData.quantity || metricData.quantity <= 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Product name and valid quantity are required for sales' 
        });
      }
    } else {
      // For other metric types, require value
      if (metricData.value === undefined) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing value for metric type: ' + metricData.metricType 
        });
      }
    }

    console.log('🔥 Calling initializeFirebase for add-metric...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, cannot add metric');
      return res.status(500).json({ error: 'Firebase not initialized, cannot add metric' });
    }

    console.log('📦 Using Firebase Client SDK for add-metric...');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    let docRef;
    let collectionName;

    if (metricData.metricType === 'products') {
      // Save to products collection
      collectionName = 'products';
      const productData = {
        user_id: userId,
        product_name: metricData.productName || '',
        material_cost: metricData.materialCost ? parseFloat(metricData.materialCost) : 0,
        selling_price: metricData.sellingPrice ? parseFloat(metricData.sellingPrice) : (metricData.value ? parseFloat(metricData.value) : 0),
        quantity: metricData.quantity ? parseInt(metricData.quantity) : 0,
        added_date: metricData.date || new Date().toISOString().split('T')[0],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      console.log('💾 Adding product to Firestore:', productData);
      docRef = await addDoc(collection(firestore, collectionName), productData);
      
    } else if (metricData.metricType === 'sales') {
      // Save to sales collection (matching server logic)
      collectionName = 'sales';
      const saleData = {
        user_id: userId,
        product_name: metricData.productName || '',
        quantity: metricData.quantity ? parseInt(metricData.quantity) : 0,
        price_per_unit: metricData.price ? parseFloat(metricData.price) : 0,
        sale_date: metricData.date || new Date().toISOString().split('T')[0],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      console.log('💾 Adding sale to Firestore:', saleData);
      docRef = await addDoc(collection(firestore, collectionName), saleData);
      
    } else {
      // Fallback to business_metrics collection
      collectionName = 'business_metrics';
      const metricDataWithTimestamp = {
        user_id: userId,
        metric_type: metricData.metricType,
        value: metricData.value,
        product_name: metricData.productName || null,
        quantity: metricData.quantity || null,
        date_recorded: metricData.date || new Date().toISOString().split('T')[0],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
    console.log('💾 Adding metric to Firestore:', metricDataWithTimestamp);
      docRef = await addDoc(collection(firestore, collectionName), metricDataWithTimestamp);
    }

    console.log('✅ Data added to', collectionName, 'with ID:', docRef.id);

    // Invalidate cache when new data is added
    recommendationCache.invalidate(userId);

    res.status(201).json({ 
      success: true,
      message: `${metricData.metricType} added successfully`,
      id: docRef.id,
      userId: userId,
      collection: collectionName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Add metric API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add metric', 
      details: error.message 
    });
  }
});

// Get products endpoint with Firebase Client SDK
app.get("/api/dashboard/:userId/products", async (req, res) => {
  console.log('🛍️ Get products endpoint called');
  console.log('👤 User ID:', req.params.userId);

  try {
    const userId = req.params.userId;
    console.log('🔥 Calling initializeFirebase for products...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, using sample products');
      return res.json({
        success: true,
        products: [
          { id: 'sample-1', name: 'Sample Product 1', price: 100, quantity: 5, dataSource: 'sample' }
        ],
        dataSource: 'sample'
      });
    }

    console.log('🔍 Fetching products for user:', userId);
    const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
    
    const productsRef = collection(firestore, 'products');
    const productsQuery = query(
      productsRef, 
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Transform to match expected format
      name: doc.data().product_name,
      price: doc.data().selling_price,
      materialCost: doc.data().material_cost,
      sellingPrice: doc.data().selling_price,
      dateAdded: doc.data().created_at?.toDate?.() || doc.data().created_at
    }));

    console.log('✅ Products fetched:', products.length);
    res.json({ 
      success: true,
      products, 
      dataSource: 'firebase' 
    });
  } catch (error) {
    console.error('❌ Get products API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products', 
      details: error.message 
    });
  }
});

// Edit product endpoint with Firebase Client SDK
app.put("/api/dashboard/:userId/products/:productId", async (req, res) => {
  console.log('✏️ Edit product endpoint called');
  console.log('👤 User ID:', req.params.userId);
  console.log('🛍️ Product ID:', req.params.productId);

  try {
    const userId = req.params.userId;
    const productId = req.params.productId;
    let productData = req.body;

    // Handle case where body is received as Buffer
    if (Buffer.isBuffer(productData)) {
      console.log('🔧 Body received as Buffer, parsing JSON...');
      try {
        productData = JSON.parse(productData.toString('utf8'));
        console.log('✅ Successfully parsed JSON from Buffer');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Buffer:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }

    console.log('📝 Edit product request data:', {
      userId,
      productId,
      productName: productData.product_name,
      sellingPrice: productData.selling_price,
      materialCost: productData.material_cost,
      quantity: productData.quantity
    });

    // Validate required fields
    if (!productData.product_name || !productData.selling_price || !productData.material_cost) {
      return res.status(400).json({ 
        success: false,
        error: 'Product name, selling price, and material cost are required' 
      });
    }

    console.log('🔥 Calling initializeFirebase for edit product...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, cannot edit product');
      return res.status(500).json({ error: 'Firebase not initialized, cannot edit product' });
    }

    console.log('📦 Using Firebase Client SDK for edit product...');
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');

    // Helper function to format date for storage
    function formatDateForStorage(dateString) {
      if (!dateString) return new Date().toISOString();
      
      // If it's already in ISO format, return as is
      if (dateString.includes('T') && dateString.includes('Z')) {
        return dateString;
      }
      
      // If it's in YYYY-MM-DD format, convert to ISO
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateString + 'T00:00:00.000Z').toISOString();
      }
      
      // Otherwise, try to parse as date
      return new Date(dateString).toISOString();
    }

    const updatedProductData = {
      product_name: productData.product_name,
      material_cost: parseFloat(productData.material_cost),
      selling_price: parseFloat(productData.selling_price),
      quantity: parseInt(productData.quantity) || 0,
      added_date: formatDateForStorage(productData.added_date),
      updated_at: serverTimestamp()
    };

    console.log('💾 Updating product in Firestore:', updatedProductData);
    const productRef = doc(firestore, 'products', productId);
    await updateDoc(productRef, updatedProductData);

    console.log('✅ Product updated successfully:', productId);

    // Invalidate cache when product is updated
    recommendationCache.invalidate(userId);

    res.status(200).json({ 
      success: true,
      message: 'Product updated successfully',
      id: productId,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Edit product API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to edit product', 
      details: error.message 
    });
  }
});

// Cache management endpoints
app.get("/api/dashboard/cache/stats", (req, res) => {
  console.log('📊 Cache stats endpoint called');
  const stats = recommendationCache.getStats();
  res.json({
    success: true,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/dashboard/cache/clear", (req, res) => {
  console.log('🧹 Clear cache endpoint called');
  recommendationCache.clear();
  res.json({
    success: true,
    message: 'All recommendation cache cleared',
    timestamp: new Date().toISOString()
  });
});

app.post("/api/dashboard/cache/invalidate/:userId", (req, res) => {
  console.log('🗑️ Invalidate user cache endpoint called');
  const userId = req.params.userId;
  recommendationCache.invalidate(userId);
  res.json({
    success: true,
    message: `Cache invalidated for user ${userId}`,
    userId: userId,
    timestamp: new Date().toISOString()
  });
});

// Business flow charts endpoint with Firebase Admin SDK
app.get("/api/business-flow/charts/:userId", async (req, res) => {
  console.log('📈 Business flow charts endpoint called');
  console.log('👤 User ID:', req.params.userId);

  try {
    const userId = req.params.userId;
    console.log('🔥 Calling initializeFirebase for charts...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, using sample charts');
      return res.json({
        success: true,
        charts: [
          { id: 'sample-chart-1', name: 'Sample Business Flow', nodes: [], edges: [], dataSource: 'sample' }
        ],
        dataSource: 'sample'
      });
    }

    console.log('🔍 Fetching charts for user:', userId);
    const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
    const chartsSnapshot = await getDocs(query(
      collection(firestore, 'business_flow'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    ));
    const charts = chartsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Transform to expected format
      name: doc.data().title || 'Business Flow',
      nodes: doc.data().nodes || [],
      edges: doc.data().edges || []
    }));

    console.log('✅ Charts fetched:', charts.length);
    res.json({ 
      success: true,
      charts, 
      dataSource: 'firebase' 
    });
  } catch (error) {
    console.error('❌ Business flow charts API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch charts', 
      details: error.message 
    });
  }
});

// Business flow latest endpoint with Firebase Admin SDK
app.get("/api/business-flow/:userId/latest", async (req, res) => {
  console.log('📈 Business flow latest endpoint called');
  console.log('👤 User ID:', req.params.userId);

  try {
    const userId = req.params.userId;
    console.log('🔥 Calling initializeFirebase for latest business flow...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, using sample latest flow');
      return res.json({
        success: true,
        hasFlow: true,
        data: {
        id: 'sample-latest-1',
        name: 'Sample Latest Business Flow',
        nodes: [],
        edges: [],
          created_at: new Date().toISOString(),
        dataSource: 'sample'
        }
      });
    }

    console.log('🔍 Fetching latest business flow for user:', userId);
    const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
    const latestSnapshot = await getDocs(query(
      collection(firestore, 'business_flow'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(1)
    ));
    
    if (latestSnapshot.empty) {
      console.log('📭 No business flows found for user');
      return res.json({
        success: false,
        message: 'No business flows found',
        hasFlow: false,
        dataSource: 'firebase'
      });
    }

    const latestFlow = { id: latestSnapshot.docs[0].id, ...latestSnapshot.docs[0].data() };
    console.log('✅ Latest business flow fetched:', latestFlow.id);
    res.json({ 
      success: true,
      hasFlow: true,
      data: latestFlow,
      dataSource: 'firebase' 
    });
  } catch (error) {
    console.error('❌ Business flow latest API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch latest business flow', 
      details: error.message 
    });
  }
});

// Business flow save endpoint with Firebase Client SDK
app.post("/api/business-flow/:userId/save", async (req, res) => {
  console.log('💾 Business flow save endpoint called');
  console.log('👤 User ID:', req.params.userId);

  try {
    const userId = req.params.userId;
    let flowData = req.body;

    // Handle case where body is received as Buffer
    if (Buffer.isBuffer(flowData)) {
      console.log('🔧 Body received as Buffer, parsing JSON...');
      try {
        flowData = JSON.parse(flowData.toString('utf8'));
        console.log('✅ Successfully parsed JSON from Buffer');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Buffer:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }

    console.log('📝 Business flow save request data:', {
      userId,
      title: flowData.title,
      nodesCount: flowData.nodes?.length || 0,
      edgesCount: flowData.edges?.length || 0,
      userLocation: flowData.userLocation,
      craftType: flowData.craftType,
      language: flowData.language
    });

    // Validate required fields (matching server validation)
    if (!flowData.title || !flowData.title.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Plan title is required' 
      });
    }

    console.log('🔥 Calling initializeFirebase for save business flow...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, cannot save business flow');
      return res.status(500).json({ 
        success: false,
        error: 'Firebase not initialized, cannot save business flow' 
      });
    }

    console.log('📦 Using Firebase Client SDK for save business flow...');
    const { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc, serverTimestamp } = await import('firebase/firestore');

    // Generate a unique title if none provided or if it's the default
    let finalTitle = flowData.title || 'Business Flow';
    
    // Check for duplicate plan names (matching server logic)
    const existingFlowsSnapshot = await getDocs(query(
      collection(firestore, 'business_flow'),
      where('user_id', '==', userId)
    ));
    
    const existingFlows = existingFlowsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('🔍 Checking for duplicate names:', {
      proposedTitle: finalTitle,
      existingTitles: existingFlows.map(f => f.title),
      existingFlowsCount: existingFlows.length
    });
    
    const duplicateName = existingFlows.find(flow => 
      flow.title && flow.title.toLowerCase().trim() === finalTitle.toLowerCase().trim()
    );

    if (duplicateName) {
      // Auto-generate a unique name instead of failing
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      finalTitle = `${finalTitle} (${timestamp})`;
      
      console.log('⚠️ Duplicate name found, using unique title:', finalTitle);
    }

    // Create new business flow (always create new, don't update existing - matching server)
    const businessFlowData = {
      user_id: userId,
      title: finalTitle,
      nodes: flowData.nodes || [],
      edges: flowData.edges || [],
      userLocation: flowData.userLocation || null,
      craftType: flowData.craftType || null,
      language: flowData.language || 'en',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    console.log('💾 Creating new business flow:', businessFlowData);
    const docRef = await addDoc(collection(firestore, 'business_flow'), businessFlowData);
    console.log('✅ Business flow created with ID:', docRef.id);

    res.status(200).json({
      success: true,
      message: 'Business flow saved successfully',
      data: {
        id: docRef.id,
        ...businessFlowData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Save business flow API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save business flow', 
      details: error.message 
    });
  }
});

// Location-based search endpoints
app.post("/api/location/search", async (req, res) => {
  console.log('📍 Location search endpoint called');
  
  try {
    const { query, location, radius = 50000, type } = req.body;

    if (!query || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: 'Missing required fields: query, location (lat, lng)',
        fallback: {
          content: "I need your location to find nearby businesses. Please enable location access or tell me your city name."
        }
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return res.status(500).json({
        error: 'Google Maps API not configured',
        fallback: {
          content: "Location services are temporarily unavailable. Please try again later or contact support."
        }
      });
    }

    // Search for places using Google Places API
    const placesResults = await searchPlaces(query, location, radius, apiKey);
    
    // Get detailed information for each place
    const detailedResults = await getPlaceDetails(placesResults, apiKey, location);
    
    // Use Gemini to generate intelligent response
    const aiResponse = await generateLocationAIResponse(query, location, detailedResults);

    res.json({
      content: aiResponse,
      locationData: {
        userLocation: location,
        searchQuery: query,
        resultsCount: detailedResults.length,
        searchRadius: radius
      },
      rawResults: detailedResults
    });

  } catch (error) {
    console.error('Location search error:', error);
    
    // Fallback response
    const fallbackContent = `I'm having trouble searching for "${req.body.query}" in your area. Here are some general suggestions:

🔍 How to find local suppliers:
- Check local business directories
- Visit wholesale markets in your city
- Join artisan groups on social media
- Contact local trade associations
- Ask other artisans for recommendations

📍 Popular wholesale areas in India:
- Delhi: Chandni Chowk, Karol Bagh
- Mumbai: Crawford Market, Zaveri Bazaar
- Bangalore: Commercial Street, Chickpet
- Chennai: T. Nagar, Parry's Corner

Would you like me to help you with specific search strategies for your craft?`;

    res.json({
      content: fallbackContent,
      error: 'Location search temporarily unavailable'
    });
  }
});

app.post("/api/location/insights", async (req, res) => {
  console.log('📍 Location insights endpoint called');
  
  try {
    const { location, coordinates, craftType, nodeTitle, nodeType } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Import Vertex AI for insights generation
    const { VertexAI } = await import('@google-cloud/vertexai');
    const { GoogleAuth } = await import('google-auth-library');
    
    // Create credentials object from environment variables
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN || 'googleapis.com'
    };
    
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        authClient: await auth.getClient()
      }
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. Generate location-specific business insights and suggest relevant ArtisAI services.

Context:
- Location: ${location}
- Coordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'Not available'}
- Craft Type: ${craftType || 'handicrafts'}
- Node Title: ${nodeTitle}
- Node Type: ${nodeType}

Generate location-specific insights as bullet points:
- Local market opportunities in ${location}
- Regional suppliers and wholesalers
- Local festivals and events for sales
- Cultural context and traditions
- Regional pricing strategies
- Local government schemes and support
- Location-specific marketing channels
- Seasonal opportunities
- Local competition insights
- Transportation and logistics tips
- Nearby business districts and commercial areas
- Local customer preferences and buying patterns

IMPORTANT: Include suggestions for ArtisAI services where relevant:
- "Use our AI Image Generator to create product photos for local market listings"
- "Try our AI Marketing Assistant to create social media content for local festivals"
- "Use our Business Plan Builder to create a detailed strategy for this location"
- "Generate product descriptions with our AI to attract local customers"
- "Create promotional videos with our AI Video Generator for local events"
- "Use our Pricing Calculator to set competitive prices for this market"

CRITICAL FORMATTING RULES:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- NO special characters except dashes for bullets
- Each line should start with a dash and space: "- Your content here"
- Do not use any other formatting symbols

Format as bullet points (-) with 6-8 specific, actionable insights for ${location}, including 2-3 ArtisAI service suggestions where relevant.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let text;
    if (typeof response.text === 'function') {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response structure from Gemini');
    }

    // Clean up any remaining markdown formatting
    text = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
      .replace(/^\s*\*\s+/gm, '- ') // Replace * with - at start of lines
      .replace(/^\s*•\s+/gm, '- ') // Replace • with - at start of lines
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    res.json({ insights: text });
  } catch (error) {
    console.error('Error generating location insights:', error);
    res.status(500).json({ error: 'Failed to generate location insights' });
  }
});

app.get("/api/location/reverse-geocode", async (req, res) => {
  console.log('📍 Reverse geocoding endpoint called');
  
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const { Client } = await import('@googlemaps/google-maps-services-js');
    const client = new Client({});

    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: parseFloat(lat), lng: parseFloat(lng) },
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const results = response.data.results;
    if (results.length === 0) {
      return res.json({ city: 'Unknown Location' });
    }

    // Find the most specific location (city level)
    let city = 'Unknown Location';
    for (const result of results) {
      const addressComponents = result.address_components;
      for (const component of addressComponents) {
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
          break;
        }
      }
      if (city !== 'Unknown Location') break;
    }

    res.json({ city });
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    res.status(500).json({ error: 'Failed to get location information' });
  }
});

// Helper functions for location search
async function searchPlaces(query, location, radius, apiKey) {
  try {
    const { Client } = await import('@googlemaps/google-maps-services-js');
    const mapsClient = new Client({});
    
    // Determine search type based on query
    const searchType = determineSearchType(query);
    
    const response = await mapsClient.placesNearby({
      params: {
        location: { lat: location.lat, lng: location.lng },
        radius: radius,
        keyword: query,
        type: searchType,
        key: apiKey,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('Places API error:', error);
    throw error;
  }
}

async function getPlaceDetails(places, apiKey, userLocation) {
  const { Client } = await import('@googlemaps/google-maps-services-js');
  const mapsClient = new Client({});
  const detailedResults = [];
  
  for (const place of places.slice(0, 10)) { // Limit to 10 results
    try {
      const detailsResponse = await mapsClient.placeDetails({
        params: {
          place_id: place.place_id,
          fields: ['name', 'formatted_address', 'rating', 'formatted_phone_number', 'website', 'types', 'opening_hours', 'photos'],
          key: apiKey,
        },
      });

      const details = detailsResponse.data.result;
      
      // Calculate distance using user's actual location
      const distance = calculateDistance(
        { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
        userLocation
      );

      detailedResults.push({
        name: details.name || 'Unknown',
        address: details.formatted_address || 'Address not available',
        distance: distance,
        rating: details.rating,
        phone: details.formatted_phone_number,
        website: details.website,
        types: details.types || [],
        place_id: place.place_id,
        opening_hours: details.opening_hours,
        photos: details.photos?.map((photo) => photo.photo_reference) || []
      });
    } catch (error) {
      console.error(`Error getting details for place ${place.place_id}:`, error);
      // Continue with other places
    }
  }

  return detailedResults.sort((a, b) => a.distance - b.distance);
}

function determineSearchType(query) {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('market') || queryLower.includes('fair') || queryLower.includes('bazaar')) {
    return 'shopping_mall';
  } else if (queryLower.includes('supplier') || queryLower.includes('wholesaler')) {
    return 'store';
  } else if (queryLower.includes('exhibition') || queryLower.includes('center')) {
    return 'establishment';
  } else {
    return 'establishment';
  }
}

function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function generateLocationAIResponse(query, location, results) {
  try {
    // Import Vertex AI
    const { VertexAI } = await import('@google-cloud/vertexai');
    const { GoogleAuth } = await import('google-auth-library');
    
    // Create credentials object from environment variables
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN || 'googleapis.com'
    };
    
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        authClient: await auth.getClient()
      }
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Prepare context for Gemini
    const context = {
      query,
      city: location.city,
      resultsCount: results.length,
      places: results.map(place => ({
        name: place.name,
        address: place.address,
        distance: place.distance,
        rating: place.rating,
        phone: place.phone,
        types: place.types
      }))
    };

    const prompt = `You are ArtisAI, an AI-powered marketplace assistant for Indian artisans. 

The user searched for: "${query}" in ${location.city}

Found ${results.length} places:
${JSON.stringify(context.places, null, 2)}

Generate a helpful, conversational response that:
1. Acknowledges the search and location
2. Lists the top 5 most relevant places with key details
3. Provides specific tips based on the query type (markets vs suppliers)
4. Suggests next steps for the artisan
5. Uses an encouraging, supportive tone
6. Keeps response under 300 words
7. Uses bullet points for easy reading

Remember: You're helping artisans grow their business, so be practical and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback to basic formatting
    return formatBasicLocationResponse(query, location, results);
  }
}

function formatBasicLocationResponse(query, location, results) {
  if (results.length === 0) {
    return `I couldn't find any ${query} in ${location.city}. Here are some alternative suggestions:

🔍 Try these search strategies:
- Expand your search radius
- Use different keywords (e.g., "suppliers" instead of "wholesalers")
- Check online directories and marketplaces
- Join local artisan groups for recommendations

Would you like me to help you with a different search or provide general guidance?`;
  }

  let response = `📍 Found ${results.length} ${query} near ${location.city}:\n\n`;

  results.slice(0, 5).forEach((result, index) => {
    response += `${index + 1}. ${result.name} (${result.distance.toFixed(1)} km away)\n`;
    response += `📍 ${result.address}\n`;
    if (result.rating) {
      response += `⭐ ${result.rating}/5 rating\n`;
    }
    if (result.phone) {
      response += `📞 ${result.phone}\n`;
    }
    response += `🏷️ ${result.types.slice(0, 3).join(', ')}\n\n`;
  });

  // Add specific tips based on query type
  const queryLower = query.toLowerCase();
  if (queryLower.includes('market') || queryLower.includes('fair') || queryLower.includes('selling')) {
    response += `💡 Tips for selling at these markets:
- Contact organizers to check availability and booth fees
- Ask about foot traffic and target audience
- Inquire about setup requirements and timing
- Check payment processing options (cash, card, UPI)

Would you like me to help you prepare a vendor application or pricing strategy?`;
  } else {
    response += `💡 Tips for contacting suppliers:
- Call during business hours (10 AM - 6 PM)
- Ask about minimum order quantities
- Inquire about bulk pricing and delivery
- Check payment terms and credit options

Would you like me to help you prepare questions to ask these suppliers?`;
  }

  return response;
}

// Questionnaire generate-flow endpoint
app.post("/api/questionnaire/generate-flow", async (req, res) => {
  console.log('🤖 Questionnaire generate-flow endpoint called');
  
  try {
    let requestData = req.body;

    // Handle Buffer parsing
    if (Buffer.isBuffer(requestData)) {
      console.log('🔧 Body received as Buffer, parsing JSON...');
      try {
        requestData = JSON.parse(requestData.toString('utf8'));
        console.log('✅ Successfully parsed JSON from Buffer');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Buffer:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }

    const { answers } = requestData;

    if (!answers) {
      return res.status(400).json({
        success: false,
        error: 'Missing answers in request body'
      });
    }

    console.log('📝 Generating flow for answers:', {
      craft: answers.craft,
      location: answers.location,
      answerCount: Object.keys(answers).length
    });

    // Import Google Cloud Vertex AI and Google Auth
    const { VertexAI } = await import('@google-cloud/vertexai');
    const { GoogleAuth } = await import('google-auth-library');
    
    // Force unset GOOGLE_APPLICATION_CREDENTIALS to prevent JSON file lookup
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // Debug: Check available credentials
    console.log('🔐 Checking Google Cloud credentials...');
    console.log('  - GOOGLE_CLOUD_PROJECT_ID:', !!process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('  - GOOGLE_CLOUD_CLIENT_EMAIL:', !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL);
    console.log('  - GOOGLE_CLOUD_PRIVATE_KEY:', !!process.env.GOOGLE_CLOUD_PRIVATE_KEY);
    console.log('  - GOOGLE_APPLICATION_CREDENTIALS (should be undefined):', process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Create credentials object from environment variables - using exact Google Cloud format
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
      token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN
    };

    console.log('🔑 Using explicit credentials for Vertex AI...');
    console.log('  - Project ID:', credentials.project_id);
    console.log('  - Client Email:', credentials.client_email);
    console.log('  - Has Private Key:', !!credentials.private_key);

    // Create Google Auth client with explicit credentials
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        authClient: await auth.getClient()
      }
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Create comprehensive prompt for flow generation
    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. You are now in FLOW GENERATION MODE.

Context: Flow Generation Mode
- Read the user's answers below
- Build a business flowchart that shows the artisan's journey
- Output in JSON with "nodes" and "edges"
- Each node must have the exact structure specified
- Do not add explanations, only return JSON

User Profile:
${JSON.stringify(answers, null, 2)}

Required JSON Structure:
{
  "nodes": [
    {
      "id": "string",
      "title": "string", 
      "description": "string",
      "detailedExplanation": "string - comprehensive explanation with specific steps, tips, and actionable advice for this artisan",
      "type": "milestone|action|resource",
      "quickActions": ["list of dynamic quick action suggestions"],
      "children": ["list of child node ids"]
    }
  ],
  "edges": [
    {"from": "string", "to": "string"}
  ]
}

Node Requirements:
- Create 6-10 nodes specific to this artisan's craft, location, and challenges
- Use only these node types: milestone, action, resource
- Each node must have actionable quickActions
- Connect nodes logically with edges
- Focus on Indian artisan business journey
- Each detailedExplanation should be formatted as bullet points with:
  - Specific steps and actionable advice (use - for each point)
  - Location-specific tips for ${answers.location || 'India'}
  - Local market insights and cultural context for ${answers.location || 'India'}
  - Regional suppliers, markets, and business opportunities
  - Local festivals, seasons, and events relevant to ${answers.craft || 'handicrafts'}
  - Regional pricing strategies and customer preferences
  - Local government schemes, grants, or support programs
  - Location-specific marketing channels and platforms
  - Practical implementation guidance for ${answers.location || 'India'}
  - Common challenges and how to overcome them locally
  - ArtisAI service suggestions where relevant (AI Image Generator, Marketing Assistant, Video Generator, etc.)
  - Format: Use bullet points (-) for each actionable item
  - Structure: 8-12 bullet points covering all aspects

CRITICAL FORMATTING RULES FOR detailedExplanation:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- NO special characters except dashes for bullets
- Each line should start with a dash and space: "- Your content here"
- Do not use any other formatting symbols
- Example: "- This is a proper bullet point" NOT "* This is wrong"

Craft Context:
- Craft type: ${answers.craft || 'handicrafts'}
- Location: ${answers.location || 'India'}
- Experience: ${answers.experience || 'beginner'}
- Goals: ${answers.goal || 'grow business'}

Generate a comprehensive business flow for this specific artisan profile.`;

    console.log('🤖 Calling Vertex AI to generate flow...');
    const response = await model.generateContent(prompt);
    
    // Handle different response structures
    let text;
    if (typeof response.text === 'function') {
      text = response.text().trim();
    } else if (response.response && response.response.candidates && response.response.candidates[0]) {
      // New structure: response.response.candidates[0].content.parts[0].text
      const candidate = response.response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        text = candidate.content.parts[0].text.trim();
      } else {
        console.error('Unexpected candidate structure:', candidate);
        throw new Error('Unexpected candidate structure from Gemini');
      }
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      // Old structure: response.candidates[0].content.parts[0].text
      text = response.candidates[0].content.parts[0].text.trim();
    } else if (response.text) {
      text = response.text.trim();
    } else {
      console.error('Unexpected response structure:', response);
      console.error('Response keys:', Object.keys(response));
      if (response.response) {
        console.error('Response.response keys:', Object.keys(response.response));
        if (response.response.candidates && response.response.candidates[0]) {
          console.error('First candidate keys:', Object.keys(response.response.candidates[0]));
        }
      }
      throw new Error('Unexpected response structure from Gemini');
    }

    // Clean up any remaining markdown formatting
    text = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
      .replace(/^\s*\*\s+/gm, '- ') // Replace * with - at start of lines
      .replace(/^\s*•\s+/gm, '- ') // Replace • with - at start of lines
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    // Clean up the response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let flowData;
    try {
      flowData = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed AI-generated flow');
    } catch (parseError) {
      console.error('❌ Error parsing Gemini flow response:', parseError);
      console.error('Raw response:', cleanedText);
      
      // Return error instead of fallback
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        message: 'Unable to create your personalized business roadmap. Please try again later.',
        details: parseError.message
      });
    }

    // Basic validation
    if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
      flowData.nodes = [];
    }
    if (!flowData.edges || !Array.isArray(flowData.edges)) {
      flowData.edges = [];
    }

    console.log('🔍 Raw flow data from AI:', {
      nodesCount: flowData.nodes.length,
      edgesCount: flowData.edges.length,
      firstNode: flowData.nodes[0],
      firstEdge: flowData.edges[0]
    });

    // Enhance flow data with positioning and meta information (matching server logic)
    console.log('🔧 Starting node positioning...');
    
    flowData.nodes = flowData.nodes.map((node, index) => {
      console.log(`📍 Processing node ${index}:`, { id: node.id, title: node.title, hasPosition: !!node.position });
      
      // Always create position - don't rely on AI to provide it
      let position;
      
      if (node.position && node.position.x !== undefined && node.position.y !== undefined) {
        // Use existing position if valid
        position = node.position;
        console.log(`  ✅ Using existing position:`, position);
      } else {
        // Create a simple grid layout - more reliable than hierarchical
        const row = Math.floor(index / 3);
        const col = index % 3;
        position = { 
          x: col * 350, // 350px spacing
          y: row * 200  // 200px vertical spacing
        };
        console.log(`  🆕 Generated position for node ${index}:`, position);
      }
      
      const enhancedNode = {
        ...node,
        position,
        meta: {
          status: 'not-started',
          ai_generated: true,
          tags: Array.isArray(node.tags) ? node.tags : [node.type || 'default'],
          priority: node.type === 'milestone' ? 'high' : 'medium',
          ...node.meta
        }
      };
      
      console.log(`  📦 Final node structure:`, {
        id: enhancedNode.id,
        title: enhancedNode.title,
        position: enhancedNode.position,
        type: enhancedNode.type
      });
      
      return enhancedNode;
    });

    console.log('✅ Flow generated successfully:', {
      nodesCount: flowData.nodes.length,
      edgesCount: flowData.edges.length,
      hasPositions: flowData.nodes.every(node => node.position),
      nodePositions: flowData.nodes.map(node => ({ id: node.id, position: node.position }))
    });

    res.json(flowData);
  } catch (error) {
    console.error('❌ Error generating flow:', error);
    
    res.status(500).json({ 
      error: 'Failed to generate business flow',
      message: 'Unable to create your personalized business roadmap. Please try again later.',
      details: error.message
    });
  }
});

// Social platforms endpoint
app.get("/api/social/platforms", (req, res) => {
  console.log('📱 Social platforms endpoint called');
  
  try {
    const platforms = [
      {
        id: 'instagram',
        name: 'Instagram',
        description: 'Visual content with hashtags and stories',
        icon: '📸',
        color: '#E4405F'
      },
      {
        id: 'facebook',
        name: 'Facebook',
        description: 'Community-focused posts with detailed descriptions',
        icon: '👥',
        color: '#1877F2'
      },
      {
        id: 'twitter',
        name: 'X (Twitter)',
        description: 'Concise posts with trending hashtags',
        icon: '🐦',
        color: '#1DA1F2'
      }
    ];

    res.json({ platforms });
  console.log('✅ Social platforms response sent');
  } catch (error) {
    console.error('❌ Error getting platforms:', error);
    res.status(500).json({ 
      error: "Failed to get platforms",
      details: error.message
    });
  }
});

// Social generate-post endpoint
app.post("/api/social/generate-post", async (req, res) => {
  console.log('🎨 Social generate-post endpoint called');
  
  try {
    let requestData = req.body;

    // Handle Buffer parsing
    if (Buffer.isBuffer(requestData)) {
      console.log('🔧 Body received as Buffer, parsing JSON...');
      try {
        requestData = JSON.parse(requestData.toString('utf8'));
        console.log('✅ Successfully parsed JSON from Buffer');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON from Buffer:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }

    const { prompt, platform, language, productImage } = requestData;

    if (!prompt || !platform) {
      return res.status(400).json({ 
        error: "Prompt and platform are required" 
      });
    }

    console.log(`🎨 Generating ${platform} post:`, { 
      prompt: prompt.substring(0, 50) + '...', 
      language, 
      hasImage: !!productImage 
    });

    // Import Google Cloud Vertex AI and Google Auth
    const { VertexAI } = await import('@google-cloud/vertexai');
    const { GoogleAuth } = await import('google-auth-library');
    
    // Force unset GOOGLE_APPLICATION_CREDENTIALS to prevent JSON file lookup
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // Debug: Check available credentials
    console.log('🔐 Checking Google Cloud credentials...');
    console.log('  - GOOGLE_CLOUD_PROJECT_ID:', !!process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('  - GOOGLE_CLOUD_CLIENT_EMAIL:', !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL);
    console.log('  - GOOGLE_CLOUD_PRIVATE_KEY:', !!process.env.GOOGLE_CLOUD_PRIVATE_KEY);
    console.log('  - GOOGLE_APPLICATION_CREDENTIALS (should be undefined):', process.env.GOOGLE_APPLICATION_CREDENTIALS);

    // Create credentials object from environment variables - using exact Google Cloud format
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
      token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN
    };

    console.log('🔑 Using explicit credentials for Vertex AI...');
    console.log('  - Project ID:', credentials.project_id);
    console.log('  - Client Email:', credentials.client_email);
    console.log('  - Has Private Key:', !!credentials.private_key);

    // Create Google Auth client with explicit credentials
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
      googleAuthOptions: {
        authClient: await auth.getClient()
      }
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Platform-specific content generation
    const platformContext = {
      instagram: "Instagram post with engaging visual content, trendy hashtags, and emojis",
      facebook: "Facebook post with detailed description, community-focused content, and relevant hashtags",
      twitter: "X (Twitter) post with concise, engaging text, trending hashtags, and character limit awareness"
    };

    console.log('Platform context for', platform, ':', platformContext[platform]);

    const systemPrompt = `You are a social media content creator specializing in ${platform} posts for artisans and craft businesses.

Platform: ${platform}
Language: ${language || 'English'}
Platform Guidelines: ${platformContext[platform]}

${productImage ? `Product Image: ${productImage.name} - Use this product as the main focus of the content.` : ''}

User Request: ${prompt}

Generate:
1. A compelling caption (2-3 sentences for Instagram, 1-2 sentences for Facebook, 1 sentence for Twitter)
2. 5-10 relevant hashtags for the platform and content

Format your response as JSON:
{
  "caption": "Your generated caption here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    console.log('🤖 Calling Vertex AI to generate social content...');
    const result = await model.generateContent(systemPrompt);
    
    // Handle different response structures
    let text;
    if (typeof result.response.text === 'function') {
      text = result.response.text().trim();
    } else if (result.response.candidates && result.response.candidates[0] && result.response.candidates[0].content) {
      text = result.response.candidates[0].content.parts[0].text.trim();
    } else if (result.response.text) {
      text = result.response.text.trim();
    } else {
      console.error('Unexpected response structure:', result.response);
      throw new Error('Unexpected response structure from Gemini');
    }

    let content;
    try {
      // Clean markdown code blocks from the response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      content = {
        caption: parsed.caption || 'Generated caption',
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      content = {
        caption: text || 'Generated caption',
        hashtags: ['artisan', 'handmade', 'craft']
      };
    }

    // Generate placeholder image if needed
    let image = null;
    if (!productImage) {
      const dimensions = platform === 'instagram' ? '400x400' : '600x400';
      const encodedText = encodeURIComponent(prompt.substring(0, 20));
      image = `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
    } else {
      // For now, return the original product image data
      // In a full implementation, you would use Vertex AI Imagen for image enhancement
      image = productImage.data;
    }

    const response = {
      image,
      video: null, // Video generation not implemented yet
      caption: content.caption,
      hashtags: content.hashtags,
      platform
    };

    console.log(`✅ Generated ${platform} post successfully`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating social post:', error);
    res.status(500).json({ 
      error: "Failed to generate social media post",
      details: error.message
    });
  }
});

// Get all business flows for user endpoint
app.get("/api/business-flow/:userId/all", async (req, res) => {
  console.log('📋 Get all business flows endpoint called');
  
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('👤 Fetching all business flows for user:', userId);

    console.log('🔥 Calling initializeFirebase for get all business flows...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, cannot fetch business flows');
      return res.status(500).json({ error: 'Firebase not initialized, cannot fetch business flows' });
    }

    console.log('📦 Using Firebase Client SDK for get all business flows...');
    const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');

    // Get all business flows for the user, ordered by creation date (newest first)
    const businessFlowsQuery = query(
      collection(firestore, 'business_flow'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(businessFlowsQuery);
    
    const flows = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      flows.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for frontend
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
      });
    });

    console.log('✅ Found business flows:', {
      userId,
      flowsCount: flows.length,
      flowTitles: flows.map(f => f.title)
    });

    res.json({ 
      success: true, 
      flows: flows 
    });
  } catch (error) {
    console.error('❌ Error fetching business flows:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business flows',
      details: error.message
    });
  }
});

// Catch-all for unmatched API routes
app.use((req, res) => {
  console.log('❓ Unmatched API route:', req.path);
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export the serverless handler with timeout configuration
console.log('🚀 API setup complete, exporting serverless handler');
console.log('📋 Available endpoints:');
console.log('  - GET /api/health');
console.log('  - GET /api/ping');
console.log('  - GET /api/dashboard/test');
console.log('  - GET /api/dashboard/:userId');
console.log('  - POST /api/dashboard/:userId/add-metric');
console.log('  - GET /api/dashboard/:userId/products');
console.log('  - PUT /api/dashboard/:userId/products/:productId');
console.log('  - GET /api/dashboard/cache/stats');
console.log('  - POST /api/dashboard/cache/clear');
console.log('  - POST /api/dashboard/cache/invalidate/:userId');
console.log('  - GET /api/business-flow/charts/:userId');
console.log('  - GET /api/business-flow/:userId/latest');
console.log('  - POST /api/business-flow/:userId/save');
console.log('  - GET /api/business-flow/:userId/all');
console.log('  - POST /api/questionnaire/generate-flow');
console.log('  - POST /api/location/search');
console.log('  - POST /api/location/insights');
console.log('  - GET /api/location/reverse-geocode');
console.log('  - GET /api/social/platforms');
console.log('  - POST /api/social/generate-post');
console.log('✅ Ready to handle requests on Netlify!');

// Configure serverless with timeout
const serverlessHandler = serverless(app, {
  timeout: 30 // 30 seconds timeout
});

export const handler = serverlessHandler;
