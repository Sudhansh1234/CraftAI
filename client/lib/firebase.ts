import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "your-firebase-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

// Configure Firestore settings for better connection handling
import { connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';

// Add connection retry logic
export const initializeFirestore = async () => {
  try {
    // Enable network connection
    await enableNetwork(db);
    console.log('✅ Firestore connected successfully');
    return db;
  } catch (error) {
    console.warn('⚠️ Firestore connection issue, retrying...', error);
    // Retry after a short delay
    setTimeout(async () => {
      try {
        await enableNetwork(db);
        console.log('✅ Firestore reconnected successfully');
      } catch (retryError) {
        console.error('❌ Firestore connection failed after retry:', retryError);
      }
    }, 2000);
    return db;
  }
};

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

