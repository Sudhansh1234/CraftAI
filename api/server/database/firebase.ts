import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Firebase configuration - read environment variables at runtime
const getFirebaseConfig = () => {
  console.log('🔍 Firebase config - Environment variables at runtime:');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'Set' : 'Not set');
  
  return {
    apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
  };
};

// Initialize Firebase lazily when first needed
let app: any = null;
let db: any = null;

const initializeFirebase = () => {
  if (!app) {
    const firebaseConfig = getFirebaseConfig();
    console.log('🔥 Firebase config being used:', firebaseConfig);
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  }
  return { app, db };
};

// Export Firebase models with lazy initialization
export { initializeFirebase };

// Helper function to convert Firestore timestamps
const convertTimestamps = (data: any) => {
  if (!data) return data;
  
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  return converted;
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return process.env.FIREBASE_API_KEY && 
         process.env.FIREBASE_AUTH_DOMAIN && 
         process.env.FIREBASE_PROJECT_ID;
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    if (!isFirebaseConfigured()) {
      return false;
    }
    
    // Try to read from a collection to test connection
    const { db } = initializeFirebase();
    const testQuery = query(collection(db, 'users'), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.error('Firebase health check failed:', error);
    return false;
  }
};

// Generic CRUD operations
export const createDocument = async (collectionName: string, data: any) => {
  const { db } = initializeFirebase();
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now()
  });
  return { id: docRef.id, ...data };
};

export const getDocument = async (collectionName: string, docId: string) => {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
  }
  return null;
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updated_at: Timestamp.now()
  });
  return { id: docId, ...data };
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
  return true;
};

export const getDocuments = async (collectionName: string, filters: any[] = [], orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc', limitCount?: number) => {
  const { db } = initializeFirebase();
  let q = query(collection(db, collectionName));
  
  // Apply filters
  filters.forEach(filter => {
    q = query(q, where(filter.field, filter.operator, filter.value));
  });
  
  // Apply ordering
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  
  // Apply limit
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  const documents: any[] = [];
  
  querySnapshot.forEach((doc) => {
    documents.push({ id: doc.id, ...convertTimestamps(doc.data()) });
  });
  
  return documents;
};

// Specific model operations for the dashboard
export const FirebaseModels = {
  // Users
  users: {
    create: (data: any) => createDocument('users', data),
    findById: (id: string) => getDocument('users', id),
    findAll: () => getDocuments('users'),
    update: (id: string, data: any) => updateDocument('users', id, data),
    delete: (id: string) => deleteDocument('users', id)
  },

  // AI Insights
  aiInsights: {
    create: (data: any) => createDocument('ai_insights', data),
    findById: (id: string) => getDocument('ai_insights', id),
    findByUserId: (userId: string, limitCount?: number) => 
      getDocuments('ai_insights', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', limitCount),
    findByType: (userId: string, type: string) => 
      getDocuments('ai_insights', [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'type', operator: '==', value: type }
      ]),
    update: (id: string, data: any) => updateDocument('ai_insights', id, data),
    delete: (id: string) => deleteDocument('ai_insights', id),
    
    getDashboardSummary: async (userId: string) => {
      const insights = await getDocuments('ai_insights', [{ field: 'user_id', operator: '==', value: userId }]);
      const activeInsights = insights.filter(insight => insight.status === 'active');
      
      return {
        totalInsights: activeInsights.length,
        highPriorityCount: activeInsights.filter(insight => insight.priority === 'high').length,
        actionableCount: activeInsights.filter(insight => insight.actionable).length,
        recentInsights: activeInsights.slice(0, 5)
      };
    }
  },

  // Products Collection
  products: {
    create: (data: any) => createDocument('products', data),
    findById: (id: string) => getDocument('products', id),
    findByUserId: (userId: string, limitCount?: number) => 
      getDocuments('products', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', limitCount),
    update: (id: string, data: any) => updateDocument('products', id, data),
    delete: (id: string) => deleteDocument('products', id),
    
    // Get products for dropdown (simplified format)
    getForDropdown: async (userId: string) => {
      const products = await getDocuments('products', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc');
      return products.map(product => ({
        id: product.id,
        name: product.product_name || 'Unnamed Product',
        price: product.selling_price || 0,
        quantity: product.quantity || 0,
        dateAdded: product.created_at,
        materialCost: product.material_cost || 0,
        sellingPrice: product.selling_price || 0
      }));
    },
    
    // Reduce product quantity when sold
    reduceQuantity: async (productId: string, quantitySold: number) => {
      const product = await getDocument('products', productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const currentQuantity = product.quantity || 0;
      if (currentQuantity < quantitySold) {
        throw new Error(`Insufficient inventory. Available: ${currentQuantity}, Requested: ${quantitySold}`);
      }
      
      const newQuantity = currentQuantity - quantitySold;
      return await updateDocument('products', productId, { quantity: newQuantity });
    },
    
    // Find product by name and user (for fallback to business_metrics)
    findByProductName: async (userId: string, productName: string) => {
      const products = await getDocuments('products', [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'product_name', operator: '==', value: productName }
      ]);
      return products[0] || null;
    }
  },

  // Sales Collection
  sales: {
    create: (data: any) => createDocument('sales', data),
    findById: (id: string) => getDocument('sales', id),
    findByUserId: (userId: string, limitCount?: number) => 
      getDocuments('sales', [{ field: 'user_id', operator: '==', value: userId }], 'sale_date', 'desc', limitCount),
    update: (id: string, data: any) => updateDocument('sales', id, data),
    delete: (id: string) => deleteDocument('sales', id),
    
    // Get sales data for charts
    getChartData: async (userId: string) => {
      const sales = await getDocuments('sales', [{ field: 'user_id', operator: '==', value: userId }], 'sale_date', 'asc');
      return sales.map(sale => ({
        date: sale.sale_date.split('T')[0],
        sales: sale.quantity || 0,
        revenue: (sale.price_per_unit || 0) * (sale.quantity || 0)
      }));
    },
    
    // Get total sales and growth
    getTotals: async (userId: string) => {
      const sales = await getDocuments('sales', [{ field: 'user_id', operator: '==', value: userId }], 'sale_date', 'desc');
      
      const totalProductsSold = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      const totalRevenue = sales.reduce((sum, sale) => sum + ((sale.price_per_unit || 0) * (sale.quantity || 0)), 0);
      
      // Calculate growth (last 7 days vs previous 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const recentSales = sales.filter(sale => new Date(sale.sale_date) >= sevenDaysAgo);
      const previousSales = sales.filter(sale => {
        const date = new Date(sale.sale_date);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
      });
      
      const recentTotal = recentSales.reduce((sum, sale) => sum + ((sale.price_per_unit || 0) * (sale.quantity || 0)), 0);
      const previousTotal = previousSales.reduce((sum, sale) => sum + ((sale.price_per_unit || 0) * (sale.quantity || 0)), 0);
      const salesGrowth = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
      
      return {
        totalProductsSold,
        totalRevenue,
        salesGrowth: Math.round(salesGrowth * 10) / 10
      };
    }
  },

  // Business Flow Collection
  businessFlow: {
    create: (data: any) => createDocument('business_flow', data),
    findById: (id: string) => getDocument('business_flow', id),
    findByUserId: (userId: string, limitCount?: number) => 
      getDocuments('business_flow', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', limitCount),
    update: (id: string, data: any) => updateDocument('business_flow', id, data),
    delete: (id: string) => deleteDocument('business_flow', id),
    
    // Get latest business flow for user
    getLatest: async (userId: string) => {
      const flows = await getDocuments('business_flow', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', 1);
      return flows.length > 0 ? flows[0] : null;
    },
    
    // Save or update business flow
    saveOrUpdate: async (userId: string, flowData: any) => {
      const existingFlow = await getDocuments('business_flow', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', 1);
      
      if (existingFlow.length > 0) {
        // Update existing flow
        return await updateDocument('business_flow', existingFlow[0].id, {
          ...flowData,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new flow
        return await createDocument('business_flow', {
          user_id: userId,
          ...flowData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  },

  // Business Metrics (keeping for backward compatibility)
  businessMetrics: {
    create: (data: any) => createDocument('business_metrics', data),
    findById: (id: string) => getDocument('business_metrics', id),
    findByUserId: (userId: string, metricType?: string, limitCount?: number) => {
      const filters = [{ field: 'user_id', operator: '==', value: userId }];
      if (metricType) {
        filters.push({ field: 'metric_type', operator: '==', value: metricType });
      }
      return getDocuments('business_metrics', filters, 'date_recorded', 'desc', limitCount);
    },
    update: (id: string, data: any) => updateDocument('business_metrics', id, data),
    delete: (id: string) => deleteDocument('business_metrics', id),
    
    getWeeklyGrowth: async (userId: string) => {
      const metrics = await getDocuments('business_metrics', [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'metric_type', operator: '==', value: 'revenue' }
      ], 'date_recorded', 'desc', 10);
      
      if (metrics.length < 2) return 0;
      
      const recent = metrics[0].value;
      const previous = metrics[1].value;
      
      if (previous === 0) return 0;
      
      return Math.round(((recent - previous) / previous) * 100 * 100) / 100;
    }
  },

  // Recommendations
  recommendations: {
    create: (data: any) => createDocument('recommendations', data),
    findById: (id: string) => getDocument('recommendations', id),
    findByUserId: (userId: string, timeframe?: string) => {
      const filters = [{ field: 'user_id', operator: '==', value: userId }];
      if (timeframe) {
        filters.push({ field: 'timeframe', operator: '==', value: timeframe });
      }
      return getDocuments('recommendations', filters, 'priority', 'desc');
    },
    update: (id: string, data: any) => updateDocument('recommendations', id, data),
    delete: (id: string) => deleteDocument('recommendations', id)
  },

  // Market Trends
  marketTrends: {
    create: (data: any) => createDocument('market_trends', data),
    findById: (id: string) => getDocument('market_trends', id),
    findActive: () => getDocuments('market_trends', [
      { field: 'valid_until', operator: '>=', value: new Date() }
    ], 'confidence_score', 'desc'),
    update: (id: string, data: any) => updateDocument('market_trends', id, data),
    delete: (id: string) => deleteDocument('market_trends', id)
  },

  // Business Profiles
  businessProfiles: {
    create: (data: any) => createDocument('business_profiles', data),
    findById: (id: string) => getDocument('business_profiles', id),
    findByUserId: (userId: string) => 
      getDocuments('business_profiles', [{ field: 'user_id', operator: '==', value: userId }]),
    update: (id: string, data: any) => updateDocument('business_profiles', id, data),
    delete: (id: string) => deleteDocument('business_profiles', id)
  },

  // Social Accounts
  socialAccounts: {
    create: (data: any) => createDocument('social_accounts', data),
    findById: (id: string) => getDocument('social_accounts', id),
    findByUserId: (userId: string) => 
      getDocuments('social_accounts', [{ field: 'user_id', operator: '==', value: userId }]),
    update: (id: string, data: any) => updateDocument('social_accounts', id, data),
    delete: (id: string) => deleteDocument('social_accounts', id)
  },

  // Content Posts
  contentPosts: {
    create: (data: any) => createDocument('content_posts', data),
    findById: (id: string) => getDocument('content_posts', id),
    findByUserId: (userId: string) => 
      getDocuments('content_posts', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc'),
    update: (id: string, data: any) => updateDocument('content_posts', id, data),
    delete: (id: string) => deleteDocument('content_posts', id)
  }
};
