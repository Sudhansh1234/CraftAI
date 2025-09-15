// Vercel API entry point - With Firebase and timeout prevention
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

console.log('🚀 API starting up...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');

const app = express();
console.log('✅ Express app created');

// Middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
console.log('✅ Middleware configured');

// Firebase configuration
let firebaseApp = null;
let firestore = null;

// Initialize Firebase with aggressive timeout protection
async function initializeFirebase() {
  console.log('🔥 initializeFirebase called');
  
  if (firebaseApp) {
    console.log('✅ Firebase already initialized, returning cached instance');
    return { firebaseApp, firestore };
  }
  
  console.log('🔧 Starting Firebase initialization...');
  console.log('🔑 Firebase config check:');
  console.log('  - API_KEY:', process.env.FIREBASE_API_KEY ? 'Set' : 'Not set');
  console.log('  - AUTH_DOMAIN:', process.env.FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set');
  console.log('  - PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set');
  console.log('  - STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not set');
  console.log('  - MESSAGING_SENDER_ID:', process.env.FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not set');
  console.log('  - APP_ID:', process.env.FIREBASE_APP_ID ? 'Set' : 'Not set');
  
  // Quick check if Firebase config is missing
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_API_KEY) {
    console.log('⚠️ Firebase config missing, returning null');
    return { firebaseApp: null, firestore: null };
  }
  
  try {
    // Set a very aggressive timeout for Firebase initialization
    const initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('📦 Importing Firebase modules...');
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        console.log('✅ Firebase modules imported successfully');
        
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
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
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
        
        resolve({ firebaseApp, firestore });
      } catch (error) {
        console.error('❌ Error in Firebase init promise:', error);
        reject(error);
      }
    });
    
    // Set 5 second timeout for Firebase initialization (very aggressive)
    console.log('⏰ Setting 5-second timeout for Firebase initialization...');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error('⏰ Firebase initialization timeout after 5 seconds');
        reject(new Error('Firebase initialization timeout'));
      }, 5000);
    });
    
    console.log('🏁 Racing Firebase init vs timeout...');
    const result = await Promise.race([initPromise, timeoutPromise]);
    console.log('✅ Firebase initialization completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { firebaseApp: null, firestore: null };
  }
}

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
  res.json({ message: "Hello from Vercel API with Firebase" });
});

// Dashboard test endpoint
app.get("/api/dashboard/test", async (req, res) => {
  console.log('🧪 Dashboard test endpoint called');
  console.log('📅 Request timestamp:', new Date().toISOString());
  
  try {
    console.log('🔥 Calling initializeFirebase...');
    const { firebaseApp, firestore } = await initializeFirebase();
    console.log('✅ Firebase initialization result:', {
      firebaseApp: firebaseApp ? 'Present' : 'Null',
      firestore: firestore ? 'Present' : 'Null'
    });
    
    const response = { 
      message: 'Dashboard API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      firebaseStatus: firebaseApp ? 'Connected' : 'Not connected',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'Not set'
    };
    
    console.log('✅ Dashboard test response:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Dashboard test error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    const errorResponse = { 
      error: 'Dashboard test failed',
      details: error.message
    };
    console.log('❌ Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Dashboard data endpoint with Firebase
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
        dataSource: "sample"
      };
      
      console.log('✅ Returning sample dashboard data:', dashboardData);
      return res.json(dashboardData);
    }
    
    // Try to fetch real data from Firebase with timeout
    console.log('🔥 Starting Firebase data fetch...');
    const fetchPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('📦 Importing Firestore functions...');
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
          dataSource: "firebase"
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
    
    // Set 8 second timeout for Firebase operations (more aggressive)
    console.log('⏰ Setting 8-second timeout for Firebase operations...');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error('⏰ Firebase operation timeout after 8 seconds');
        reject(new Error('Firebase operation timeout'));
      }, 8000);
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
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.params.userId
    });
    
    const errorResponse = { 
      error: 'Failed to fetch dashboard data',
      details: error.message,
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    };
    
    console.log('❌ Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Add metric endpoint with Firebase
app.post("/api/dashboard/:userId/add-metric", async (req, res) => {
  try {
    const userId = req.params.userId;
    const metricData = req.body;
    const { firebaseApp, firestore } = await initializeFirebase();
    
    if (!firestore) {
      return res.json({
        success: true,
        message: "Metric added successfully (Firebase not available)",
        userId: userId,
        metric: metricData,
        timestamp: new Date().toISOString(),
        dataSource: "sample"
      });
    }
    
    // Add to Firebase with timeout
    const addPromise = new Promise(async (resolve, reject) => {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        
        const metricsRef = collection(firestore, 'businessMetrics');
        const docRef = await addDoc(metricsRef, {
          ...metricData,
          userId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        resolve({ id: docRef.id });
      } catch (error) {
        reject(error);
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase operation timeout')), 10000);
    });
    
    const result = await Promise.race([addPromise, timeoutPromise]);
    
    res.json({
      success: true,
      message: "Metric added successfully",
      userId: userId,
      metric: { id: result.id, ...metricData },
      timestamp: new Date().toISOString(),
      dataSource: "firebase"
    });
    
  } catch (error) {
    console.error('Add metric API error:', error);
    res.status(500).json({ 
      error: 'Failed to add metric',
      details: error.message
    });
  }
});

// Products endpoint with Firebase
app.get("/api/dashboard/:userId/products", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { firebaseApp, firestore } = await initializeFirebase();
    
    if (!firestore) {
      const products = [
        {
          id: "sample-product-1",
          name: "Sample Product (Firebase not available)",
          category: "Electronics",
          price: 99.99,
          stock: 50,
          sales: 25
        }
      ];
      
      return res.json({
        userId: userId,
        products: products,
        total: products.length,
        timestamp: new Date().toISOString(),
        dataSource: "sample"
      });
    }
    
    // Fetch from Firebase with timeout
    const fetchPromise = new Promise(async (resolve, reject) => {
      try {
        const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
        
        const productsRef = collection(firestore, 'products');
        const productsQuery = query(
          productsRef, 
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        resolve(products);
      } catch (error) {
        reject(error);
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase operation timeout')), 10000);
    });
    
    const products = await Promise.race([fetchPromise, timeoutPromise]);
    
    res.json({
      userId: userId,
      products: products,
      total: products.length,
      timestamp: new Date().toISOString(),
      dataSource: "firebase"
    });
    
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

// Business flow endpoint with Firebase
app.get("/api/business-flow/charts/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { firebaseApp, firestore } = await initializeFirebase();
    
    if (!firestore) {
      const chartsData = {
        userId: userId,
        charts: [
          {
            id: "sample-chart",
            type: "line",
            title: "Sample Business Flow (Firebase not available)",
            data: [
              { x: "Week 1", y: 100 },
              { x: "Week 2", y: 120 },
              { x: "Week 3", y: 110 },
              { x: "Week 4", y: 140 }
            ]
          }
        ],
        timestamp: new Date().toISOString(),
        dataSource: "sample"
      };
      
      return res.json(chartsData);
    }
    
    // Fetch from Firebase with timeout
    const fetchPromise = new Promise(async (resolve, reject) => {
      try {
        const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
        
        const chartsRef = collection(firestore, 'businessFlowCharts');
        const chartsQuery = query(
          chartsRef, 
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const chartsSnapshot = await getDocs(chartsQuery);
        const charts = chartsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        resolve(charts);
      } catch (error) {
        reject(error);
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase operation timeout')), 10000);
    });
    
    const charts = await Promise.race([fetchPromise, timeoutPromise]);
    
    res.json({
      userId: userId,
      charts: charts,
      timestamp: new Date().toISOString(),
      dataSource: "firebase"
    });
    
  } catch (error) {
    console.error('Business flow API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business flow data',
      details: error.message
    });
  }
});

// Social platforms endpoint
app.get("/api/social/platforms", (req, res) => {
  res.json([
    { id: 'instagram', name: 'Instagram', enabled: false },
    { id: 'facebook', name: 'Facebook', enabled: false },
    { id: 'twitter', name: 'Twitter', enabled: false }
  ]);
});

// Catch-all for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: "API endpoint not found", 
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export the serverless handler
console.log('🚀 API setup complete, exporting serverless handler');
console.log('📋 Available endpoints:');
console.log('  - GET /api/health');
console.log('  - GET /api/ping');
console.log('  - GET /api/dashboard/test');
console.log('  - GET /api/dashboard/:userId');
console.log('  - POST /api/dashboard/:userId/add-metric');
console.log('  - GET /api/dashboard/:userId/products');
console.log('  - GET /api/business-flow/charts/:userId');
console.log('  - GET /api/social/platforms');
console.log('✅ Ready to handle requests!');

export default serverless(app);