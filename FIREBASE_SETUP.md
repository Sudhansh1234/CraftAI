# Firebase Setup for CraftAI Authentication

## Prerequisites
- A Google account
- Node.js and pnpm installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "craft-ai-auth")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Enable it and configure:
   - Project support email: Choose your email
   - Project public-facing name: "CraftAI"
6. Click "Save"

## Step 3: Get Firebase Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (</>)
5. Register your app with a nickname (e.g., "CraftAI Web")
6. Copy the Firebase configuration object

## Step 4: Update Firebase Config

1. Open `client/lib/firebase.ts`
2. Replace the placeholder values with your actual Firebase config:

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

## Step 5: Test the Authentication

1. Run your development server: `pnpm dev`
2. Navigate to `/auth` route
3. Try signing in with Google
4. Check the browser console for any errors

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)":**
   - Go to Firebase Console > Authentication > Settings > Authorized domains
   - Add your domain (localhost for development)

2. **"Firebase: Error (auth/popup-closed-by-user)":**
   - This is normal if user closes the popup
   - Make sure popup blockers are disabled

3. **"Firebase: Error (auth/network-request-failed)":**
   - Check your internet connection
   - Verify Firebase project is active

### Security Rules:

For production, consider setting up proper security rules in Firebase Console > Firestore Database > Rules.

## Next Steps

After successful authentication setup:

1. Implement user profile management
2. Add role-based access control
3. Set up user data storage in Firestore
4. Add email/password authentication as backup
5. Implement password reset functionality

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Verify your configuration values
3. Check browser console for detailed error messages
4. Ensure all dependencies are properly installed

