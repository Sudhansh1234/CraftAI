// Simplified Firebase configuration for Vercel
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

let app = null;
let db = null;

const getFirebaseConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
  };
};

const initializeFirebase = () => {
  if (!app) {
    try {
      const config = getFirebaseConfig();
      app = initializeApp(config);
      db = getFirestore(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
  return { app, db };
};

const isFirebaseConfigured = () => {
  return !!(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);
};

const healthCheck = async () => {
  try {
    if (!isFirebaseConfigured()) {
      return false;
    }
    
    const { db } = initializeFirebase();
    if (!db) {
      return false;
    }
    
    // Try to read from a test collection
    const testQuery = query(collection(db, 'test'), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.error('Firebase health check failed:', error);
    return false;
  }
};

// Simple data models
const FirebaseModels = {
  businessMetrics: {
    async create(data) {
      const { db } = initializeFirebase();
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      const docRef = await addDoc(collection(db, 'business_metrics'), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: docRef.id, ...data };
    },
    
    async findByUserId(userId, metricType = null, limitCount = 100) {
      const { db } = initializeFirebase();
      if (!db) {
        return [];
      }
      
      try {
        let q = query(
          collection(db, 'business_metrics'),
          where('user_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        );
        
        if (metricType) {
          q = query(
            collection(db, 'business_metrics'),
            where('user_id', '==', userId),
            where('metric_type', '==', metricType),
            orderBy('created_at', 'desc'),
            limit(limitCount)
          );
        }
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching business metrics:', error);
        return [];
      }
    }
  },
  
  products: {
    async create(data) {
      const { db } = initializeFirebase();
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      const docRef = await addDoc(collection(db, 'products'), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: docRef.id, ...data };
    },
    
    async findByUserId(userId) {
      const { db } = initializeFirebase();
      if (!db) {
        return [];
      }
      
      try {
        const q = query(
          collection(db, 'products'),
          where('user_id', '==', userId),
          orderBy('created_at', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    }
  },
  
  sales: {
    async create(data) {
      const { db } = initializeFirebase();
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      const docRef = await addDoc(collection(db, 'sales'), {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return { id: docRef.id, ...data };
    },
    
    async findByUserId(userId) {
      const { db } = initializeFirebase();
      if (!db) {
        return [];
      }
      
      try {
        const q = query(
          collection(db, 'sales'),
          where('user_id', '==', userId),
          orderBy('created_at', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching sales:', error);
        return [];
      }
    }
  }
};

export {
  initializeFirebase,
  isFirebaseConfigured,
  healthCheck,
  FirebaseModels
};
