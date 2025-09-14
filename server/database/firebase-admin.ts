import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

const initializeAdminSDK = () => {
  if (!adminApp) {
    try {
      console.log('🚀 [FIREBASE ADMIN] Starting initialization...');
      console.log('🔍 [FIREBASE ADMIN] Environment check:', {
        FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID ? '✅ Set' : '❌ Not set',
        FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? '✅ Set' : '❌ Not set',
        FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? '✅ Set' : '❌ Not set',
        NODE_ENV: process.env.NODE_ENV || 'undefined'
      });
      
      // Use environment variables from .env.local (preferred method)
      if (process.env.FIREBASE_ADMIN_PROJECT_ID && 
          process.env.FIREBASE_ADMIN_PRIVATE_KEY && 
          process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        
        console.log('🔐 [FIREBASE ADMIN] Using environment variables for authentication');
        console.log('📊 [FIREBASE ADMIN] Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
        console.log('📧 [FIREBASE ADMIN] Client Email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
        
        const credential = admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        });
        
        console.log('🔑 [FIREBASE ADMIN] Credential created successfully');
        
        adminApp = admin.initializeApp({
          credential,
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
        });
        
        console.log('✅ [FIREBASE ADMIN] App initialized with environment variables');
        
      } else {
        // Fallback to service account key file (for development)
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH || 
                                 path.join(process.cwd(), 'adminkey.json');
        
        console.log('📁 [FIREBASE ADMIN] Using service account key file:', serviceAccountPath);
        console.log('🔍 [FIREBASE ADMIN] Checking if file exists...');
        
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          projectId: 'craft-ai-70b27'
        });
        
        console.log('✅ [FIREBASE ADMIN] App initialized with service account file');
      }
      
      console.log('🔗 [FIREBASE ADMIN] Initializing Firestore...');
      adminDb = admin.firestore();
      console.log('✅ [FIREBASE ADMIN] Firestore initialized');
      
      console.log('🔐 [FIREBASE ADMIN] Initializing Auth...');
      adminAuth = admin.auth();
      console.log('✅ [FIREBASE ADMIN] Auth initialized');
      
      console.log('🎉 [FIREBASE ADMIN] Firebase Admin SDK initialized successfully!');
      console.log('📊 [FIREBASE ADMIN] Project ID:', adminApp.options.projectId);
      console.log('🌍 [FIREBASE ADMIN] Environment:', process.env.NODE_ENV || 'undefined');
      
    } catch (error) {
      console.error('❌ [FIREBASE ADMIN] Failed to initialize Firebase Admin SDK');
      console.error('🔍 [FIREBASE ADMIN] Error type:', error.constructor.name);
      console.error('📝 [FIREBASE ADMIN] Error message:', error.message);
      console.error('📚 [FIREBASE ADMIN] Error code:', error.code || 'No code');
      console.error('📍 [FIREBASE ADMIN] Error stack:', error.stack);
      throw error;
    }
  } else {
    console.log('♻️ [FIREBASE ADMIN] Admin SDK already initialized, reusing existing instance');
  }
  
  return { adminApp, adminDb, adminAuth };
};

// Export initialized services
export const getAdminDB = () => {
  const { adminDb } = initializeAdminSDK();
  return adminDb!;
};

export const getAdminAuth = () => {
  const { adminAuth } = initializeAdminSDK();
  return adminAuth!;
};

export const getAdminApp = () => {
  const { adminApp } = initializeAdminSDK();
  return adminApp!;
};

// Helper function to convert Firestore timestamps
const convertTimestamps = (data: any) => {
  if (!data) return data;
  
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key] === 'object' && converted[key].toDate) {
      // This is a Firestore Timestamp
      converted[key] = converted[key].toDate();
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  return converted;
};

// Health check for Admin SDK
export const adminHealthCheck = async (): Promise<boolean> => {
  try {
    console.log('🏥 [FIREBASE ADMIN] Starting health check...');
    console.log('🔗 [FIREBASE ADMIN] Getting database connection...');
    
    const db = getAdminDB();
    console.log('✅ [FIREBASE ADMIN] Database connection established');
    
    // Try to read from a collection to test connection
    console.log('🔍 [FIREBASE ADMIN] Testing collection access: users');
    const testCollection = db.collection('users').limit(1);
    console.log('📊 [FIREBASE ADMIN] Executing test query...');
    
    const testSnapshot = await testCollection.get();
    console.log(`✅ [FIREBASE ADMIN] Health check passed. Test query returned ${testSnapshot.size} documents`);
    
    return true;
  } catch (error) {
    console.error('❌ [FIREBASE ADMIN] Health check failed');
    console.error('🔍 [FIREBASE ADMIN] Error type:', error.constructor.name);
    console.error('📝 [FIREBASE ADMIN] Error message:', error.message);
    console.error('📚 [FIREBASE ADMIN] Error code:', error.code || 'No code');
    console.error('📍 [FIREBASE ADMIN] Error stack:', error.stack);
    return false;
  }
};

// Generic CRUD operations using Admin SDK
export const adminCreateDocument = async (collectionName: string, data: any) => {
  try {
    console.log(`🔥 [FIREBASE ADMIN] Creating document in collection: ${collectionName}`);
    console.log(`📝 [FIREBASE ADMIN] Document data:`, JSON.stringify(data, null, 2));
    
    const db = getAdminDB();
    console.log('✅ [FIREBASE ADMIN] Database connection obtained');
    
    const docRef = await db.collection(collectionName).add({
      ...data,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ [FIREBASE ADMIN] Document created successfully with ID: ${docRef.id}`);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`❌ [FIREBASE ADMIN] Failed to create document in ${collectionName}`);
    console.error('🔍 [FIREBASE ADMIN] Error details:', error.message);
    throw error;
  }
};

export const adminGetDocument = async (collectionName: string, docId: string) => {
  try {
    console.log(`🔍 [FIREBASE ADMIN] Getting document: ${docId} from collection: ${collectionName}`);
    
    const db = getAdminDB();
    const docRef = db.collection(collectionName).doc(docId);
    console.log('📊 [FIREBASE ADMIN] Executing get query...');
    
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
      console.log(`✅ [FIREBASE ADMIN] Document found:`, JSON.stringify(data, null, 2));
      return data;
    }
    
    console.log(`❌ [FIREBASE ADMIN] Document not found: ${docId} in collection: ${collectionName}`);
    return null;
  } catch (error) {
    console.error(`❌ [FIREBASE ADMIN] Failed to get document ${docId} from ${collectionName}`);
    console.error('🔍 [FIREBASE ADMIN] Error details:', error.message);
    throw error;
  }
};

export const adminUpdateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    console.log(`🔄 [FIREBASE ADMIN] Updating document: ${docId} in collection: ${collectionName}`);
    console.log(`📝 [FIREBASE ADMIN] Update data:`, JSON.stringify(data, null, 2));
    
    const db = getAdminDB();
    const docRef = db.collection(collectionName).doc(docId);
    console.log('📊 [FIREBASE ADMIN] Executing update query...');
    
    await docRef.update({
      ...data,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ [FIREBASE ADMIN] Document updated successfully: ${docId}`);
    return { id: docId, ...data };
  } catch (error) {
    console.error(`❌ [FIREBASE ADMIN] Failed to update document ${docId} in ${collectionName}`);
    console.error('🔍 [FIREBASE ADMIN] Error details:', error.message);
    throw error;
  }
};

export const adminDeleteDocument = async (collectionName: string, docId: string) => {
  try {
    console.log(`🗑️ [FIREBASE ADMIN] Deleting document: ${docId} from collection: ${collectionName}`);
    
    const db = getAdminDB();
    const docRef = db.collection(collectionName).doc(docId);
    console.log('📊 [FIREBASE ADMIN] Executing delete query...');
    
    await docRef.delete();
    
    console.log(`✅ [FIREBASE ADMIN] Document deleted successfully: ${docId}`);
    return true;
  } catch (error) {
    console.error(`❌ [FIREBASE ADMIN] Failed to delete document ${docId} from ${collectionName}`);
    console.error('🔍 [FIREBASE ADMIN] Error details:', error.message);
    throw error;
  }
};

export const adminGetDocuments = async (
  collectionName: string, 
  filters: any[] = [], 
  orderByField?: string, 
  orderDirection: 'asc' | 'desc' = 'desc', 
  limitCount?: number
) => {
  try {
    console.log(`🔍 [FIREBASE ADMIN] Querying collection: ${collectionName}`);
    console.log(`🔧 [FIREBASE ADMIN] Filters:`, JSON.stringify(filters, null, 2));
    console.log(`📊 [FIREBASE ADMIN] Order by: ${orderByField} (${orderDirection})`);
    console.log(`📏 [FIREBASE ADMIN] Limit: ${limitCount || 'none'}`);
    
    const db = getAdminDB();
    let query: admin.firestore.Query = db.collection(collectionName);
    
    // Apply filters
    filters.forEach((filter, index) => {
      console.log(`🔍 [FIREBASE ADMIN] Applying filter ${index + 1}: ${filter.field} ${filter.operator} ${filter.value}`);
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    // Apply ordering
    if (orderByField) {
      console.log(`📊 [FIREBASE ADMIN] Applying ordering: ${orderByField} ${orderDirection}`);
      query = query.orderBy(orderByField, orderDirection);
    }
    
    // Apply limit
    if (limitCount) {
      console.log(`📏 [FIREBASE ADMIN] Applying limit: ${limitCount}`);
      query = query.limit(limitCount);
    }
    
    console.log('📊 [FIREBASE ADMIN] Executing query...');
    const querySnapshot = await query.get();
    const documents: any[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...convertTimestamps(doc.data()) });
    });
    
    console.log(`✅ [FIREBASE ADMIN] Query completed. Found ${documents.length} documents`);
    if (documents.length > 0) {
      console.log(`📄 [FIREBASE ADMIN] Sample document:`, JSON.stringify(documents[0], null, 2));
    }
    
    return documents;
  } catch (error) {
    console.error(`❌ [FIREBASE ADMIN] Failed to query collection ${collectionName}`);
    console.error('🔍 [FIREBASE ADMIN] Error details:', error.message);
    throw error;
  }
};

// Admin SDK Models (same interface as client SDK but with elevated privileges)
export const AdminFirebaseModels = {
  // Users
  users: {
    create: (data: any) => adminCreateDocument('users', data),
    findById: (id: string) => adminGetDocument('users', id),
    findAll: () => adminGetDocuments('users'),
    update: (id: string, data: any) => adminUpdateDocument('users', id, data),
    delete: (id: string) => adminDeleteDocument('users', id)
  },

  // AI Insights
  aiInsights: {
    create: (data: any) => adminCreateDocument('ai_insights', data),
    findById: (id: string) => adminGetDocument('ai_insights', id),
    findByUserId: (userId: string, limitCount?: number) => 
      adminGetDocuments('ai_insights', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', limitCount),
    findByType: (userId: string, type: string) => 
      adminGetDocuments('ai_insights', [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'type', operator: '==', value: type }
      ]),
    update: (id: string, data: any) => adminUpdateDocument('ai_insights', id, data),
    delete: (id: string) => adminDeleteDocument('ai_insights', id),
    
    getDashboardSummary: async (userId: string) => {
      const insights = await adminGetDocuments('ai_insights', [{ field: 'user_id', operator: '==', value: userId }]);
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
    create: (data: any) => adminCreateDocument('products', data),
    findById: (id: string) => adminGetDocument('products', id),
    findByUserId: (userId: string, limitCount?: number) => 
      adminGetDocuments('products', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc', limitCount),
    update: (id: string, data: any) => adminUpdateDocument('products', id, data),
    delete: (id: string) => adminDeleteDocument('products', id),
    
    getForDropdown: async (userId: string) => {
      const products = await adminGetDocuments('products', [{ field: 'user_id', operator: '==', value: userId }], 'created_at', 'desc');
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
    
    reduceQuantity: async (productId: string, quantitySold: number) => {
      const product = await adminGetDocument('products', productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const currentQuantity = product.quantity || 0;
      if (currentQuantity < quantitySold) {
        throw new Error(`Insufficient inventory. Available: ${currentQuantity}, Requested: ${quantitySold}`);
      }
      
      const newQuantity = currentQuantity - quantitySold;
      return await adminUpdateDocument('products', productId, { quantity: newQuantity });
    },
    
    findByProductName: async (userId: string, productName: string) => {
      const products = await adminGetDocuments('products', [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'product_name', operator: '==', value: productName }
      ]);
      return products[0] || null;
    }
  },

  // Sales Collection
  sales: {
    create: (data: any) => adminCreateDocument('sales', data),
    findById: (id: string) => adminGetDocument('sales', id),
    findByUserId: (userId: string, limitCount?: number) => 
      adminGetDocuments('sales', [{ field: 'user_id', operator: '==', value: userId }], 'sale_date', 'desc', limitCount),
    update: (id: string, data: any) => adminUpdateDocument('sales', id, data),
    delete: (id: string) => adminDeleteDocument('sales', id),
    
    getChartData: async (userId: string) => {
      const sales = await adminGetDocuments('sales', [{ field: 'user_id', operator: '==', value: userId }], 'sale_date', 'asc');
      return sales.map(sale => ({
        date: sale.sale_date.split('T')[0],
        sales: sale.quantity || 0,
        revenue: (sale.price_per_unit || 0) * (sale.quantity || 0)
      }));
    },
    
    getTotals: async (userId: string) => {
      const sales = await adminGetDocuments('sales', [{ field: 'user_id', operator: '==', value: userId }], 'sale_date', 'desc');
      
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

  // Business Metrics
  businessMetrics: {
    create: (data: any) => adminCreateDocument('business_metrics', data),
    findById: (id: string) => adminGetDocument('business_metrics', id),
    findByUserId: (userId: string, metricType?: string, limitCount?: number) => {
      const filters = [{ field: 'user_id', operator: '==', value: userId }];
      if (metricType) {
        filters.push({ field: 'metric_type', operator: '==', value: metricType });
      }
      return adminGetDocuments('business_metrics', filters, 'date_recorded', 'desc', limitCount);
    },
    update: (id: string, data: any) => adminUpdateDocument('business_metrics', id, data),
    delete: (id: string) => adminDeleteDocument('business_metrics', id),
    
    getWeeklyGrowth: async (userId: string) => {
      const metrics = await adminGetDocuments('business_metrics', [
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
    create: (data: any) => adminCreateDocument('recommendations', data),
    findById: (id: string) => adminGetDocument('recommendations', id),
    findByUserId: (userId: string, timeframe?: string) => {
      const filters = [{ field: 'user_id', operator: '==', value: userId }];
      if (timeframe) {
        filters.push({ field: 'timeframe', operator: '==', value: timeframe });
      }
      return adminGetDocuments('recommendations', filters, 'priority', 'desc');
    },
    update: (id: string, data: any) => adminUpdateDocument('recommendations', id, data),
    delete: (id: string) => adminDeleteDocument('recommendations', id)
  },

  // Market Trends
  marketTrends: {
    create: (data: any) => adminCreateDocument('market_trends', data),
    findById: (id: string) => adminGetDocument('market_trends', id),
    findActive: () => adminGetDocuments('market_trends', [
      { field: 'valid_until', operator: '>=', value: new Date() }
    ], 'confidence_score', 'desc'),
    update: (id: string, data: any) => adminUpdateDocument('market_trends', id, data),
    delete: (id: string) => adminDeleteDocument('market_trends', id)
  }
};

// Export the admin SDK initialization
export { initializeAdminSDK };
