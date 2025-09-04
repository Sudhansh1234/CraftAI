# 🔥 Firebase Setup Guide

## **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `craft-ai` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## **Step 2: Enable Authentication**

1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Add your project support email
5. Click **Save**

## **Step 3: Get Configuration**

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web app** icon (`</>`)
4. Register your app with nickname: `craft-ai-web`
5. Copy the configuration object

## **Step 4: Create Environment File**

Create a `.env.local` file in your project root with:

```bash
# Firebase Configuration (VITE_ prefix required for frontend)
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Google Cloud Configuration (for AI features)
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

**Important:** The `VITE_` prefix is required for environment variables to be accessible in the frontend code.

## **Step 5: Update Firebase Config**

Replace the placeholder values in `client/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## **Step 6: Test Authentication**

1. Run your app: `npm run dev`
2. Try to access a protected page (Dashboard, Image Studio, etc.)
3. The login modal should appear
4. Click "Continue with Google"
5. Complete the Google sign-in flow

## **🔧 Troubleshooting**

### **Common Issues:**

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check your Firebase config values
   - Ensure `.env.local` file exists and has correct values

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to Firebase Auth settings
   - Go to Authentication > Settings > Authorized domains
   - Add `localhost` for development

3. **"Firebase: Error (auth/popup-closed-by-user)"**
   - User closed the popup before completing sign-in
   - This is normal behavior

### **Development vs Production:**

- **Development**: Use `localhost` in authorized domains
- **Production**: Add your deployed domain (e.g., `your-app.vercel.app`)

## **🚀 Ready to Deploy**

Once Firebase is configured:
1. Your login modal will work with real Google authentication
2. Users will be properly authenticated
3. Protected routes will work correctly
4. You can deploy to Vercel with the same environment variables

## **📱 Features Enabled**

With Firebase authentication, you get:
- ✅ **Real Google Sign-in**
- ✅ **Persistent sessions**
- ✅ **User profile data**
- ✅ **Secure authentication**
- ✅ **Production-ready auth system**