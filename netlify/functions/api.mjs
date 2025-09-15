// Netlify function for API routes - Using Firebase Client SDK (ES Modules)

import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

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

        // Fetch insights
        console.log('🔍 Fetching insights for user:', userId);
        const insightsRef = collection(firestore, 'insights');
        const insightsQuery = query(
          insightsRef, 
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        console.log('📊 Executing insights query...');
        const insightsSnapshot = await getDocs(insightsQuery);
        console.log('📊 Insights query completed, found', insightsSnapshot.docs.length, 'documents');
        const insights = insightsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Insights processed:', insights.length);

        // Fetch business metrics
        console.log('📈 Fetching business metrics for user:', userId);
        const metricsRef = collection(firestore, 'businessMetrics');
        const metricsQuery = query(
          metricsRef, 
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        console.log('📊 Executing metrics query...');
        const metricsSnapshot = await getDocs(metricsQuery);
        console.log('📊 Metrics query completed, found', metricsSnapshot.docs.length, 'documents');
        const businessMetrics = metricsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ Business metrics processed:', businessMetrics.length);

        console.log('🔧 Building dashboard data object...');
        const dashboardData = {
          userId: userId,
          insights: insights,
          summary: {
            totalInsights: insights.length,
            highPriorityCount: insights.filter(i => i.priority === 'high').length,
            actionableCount: insights.filter(i => i.actionable).length,
            weeklyGrowth: 0, // Calculate this based on your data
            topCategories: [...new Set(insights.map(i => i.category))].slice(0, 5)
          },
          recommendations: {
            immediate: insights.filter(i => i.priority === 'high').map(i => i.title),
            shortTerm: insights.filter(i => i.priority === 'medium').map(i => i.title),
            longTerm: insights.filter(i => i.priority === 'low').map(i => i.title)
          },
          marketTrends: {
            trendingProducts: [],
            seasonalOpportunities: [],
            competitorInsights: []
          },
          businessMetrics: businessMetrics,
          timestamp: new Date().toISOString(),
          dataSource: "firebase",
          platform: "netlify"
        };

        console.log('✅ Dashboard data built successfully:', {
          insightsCount: insights.length,
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

  try {
    const userId = req.params.userId;
    const metricData = req.body;

    if (!metricData.metricType || !metricData.value) {
      return res.status(400).json({ error: 'Missing metricType or value' });
    }

    console.log('🔥 Calling initializeFirebase for add-metric...');
    const { firestore } = await initializeFirebase();
    if (!firestore) {
      console.log('⚠️ Firestore not available, cannot add metric');
      return res.status(500).json({ error: 'Firebase not initialized, cannot add metric' });
    }

    console.log('📦 Using Firebase Client SDK for add-metric...');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    const metricDataWithTimestamp = {
      ...metricData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('💾 Adding metric to Firestore:', metricDataWithTimestamp);
    const docRef = await addDoc(collection(firestore, 'businessMetrics'), metricDataWithTimestamp);
    console.log('✅ Metric added with ID:', docRef.id);

    res.status(201).json({ 
      message: 'Metric added successfully', 
      id: docRef.id,
      userId: userId,
      metric: metricDataWithTimestamp,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Add metric API error:', error);
    res.status(500).json({ error: 'Failed to add metric', details: error.message });
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
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('✅ Products fetched:', products.length);
    res.json({ products, dataSource: 'firebase' });
  } catch (error) {
    console.error('❌ Get products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
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
        charts: [
          { id: 'sample-chart-1', name: 'Sample Business Flow', nodes: [], edges: [], dataSource: 'sample' }
        ],
        dataSource: 'sample'
      });
    }

    console.log('🔍 Fetching charts for user:', userId);
    const chartsSnapshot = await firestore.collection('businessFlowCharts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const charts = chartsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('✅ Charts fetched:', charts.length);
    res.json({ charts, dataSource: 'firebase' });
  } catch (error) {
    console.error('❌ Business flow charts API error:', error);
    res.status(500).json({ error: 'Failed to fetch charts', details: error.message });
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
        id: 'sample-latest-1',
        name: 'Sample Latest Business Flow',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        dataSource: 'sample'
      });
    }

    console.log('🔍 Fetching latest business flow for user:', userId);
    const latestSnapshot = await firestore.collection('businessFlowCharts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (latestSnapshot.empty) {
      console.log('📭 No business flows found for user');
      return res.json({
        message: 'No business flows found',
        dataSource: 'firebase'
      });
    }

    const latestFlow = { id: latestSnapshot.docs[0].id, ...latestSnapshot.docs[0].data() };
    console.log('✅ Latest business flow fetched:', latestFlow.id);
    res.json({ ...latestFlow, dataSource: 'firebase' });
  } catch (error) {
    console.error('❌ Business flow latest API error:', error);
    res.status(500).json({ error: 'Failed to fetch latest business flow', details: error.message });
  }
});

// Social platforms endpoint
app.get("/api/social/platforms", (req, res) => {
  console.log('📱 Social platforms endpoint called');
  res.json([
    { id: 'instagram', name: 'Instagram', enabled: false },
    { id: 'facebook', name: 'Facebook', enabled: false },
    { id: 'twitter', name: 'Twitter', enabled: false }
  ]);
  console.log('✅ Social platforms response sent');
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
console.log('  - GET /api/business-flow/charts/:userId');
console.log('  - GET /api/business-flow/:userId/latest');
console.log('  - GET /api/social/platforms');
console.log('✅ Ready to handle requests on Netlify!');

// Configure serverless with timeout
const serverlessHandler = serverless(app, {
  timeout: 30 // 30 seconds timeout
});

export const handler = serverlessHandler;
