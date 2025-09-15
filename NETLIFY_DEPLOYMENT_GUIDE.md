# Netlify Deployment Guide for ArtisAI

This guide will help you deploy your React + Vite application with Firebase backend to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Firebase Project**: Set up Firebase project with Firestore and Authentication
4. **Google Cloud API Keys**: For Gemini AI and other Google services

## Project Structure

Your project is configured as:
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js serverless functions for Netlify
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI Services**: Google Gemini API

## Step 1: Prepare Your Project

### 1.1 Environment Variables

Create a `.env.production` file in your project root with the following variables:

```env
# Firebase Client Configuration (for frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Firebase Admin Configuration (for serverless functions)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com

# Google Cloud API Keys
GOOGLE_CLOUD_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_CLOUD_CLIENT_ID=your_client_id
GOOGLE_CLOUD_LOCATION=us-central1
```

### 1.2 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable Authentication (Google Sign-in)
4. Enable Firestore Database
5. Get your Firebase configuration from Project Settings > General > Your apps
6. Create a service account key from Project Settings > Service Accounts

### 1.3 Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the following APIs:
   - Gemini API
   - Google Cloud Translation API
   - Google Cloud Vision API
   - Google Cloud Speech-to-Text API
3. Create a service account and download the JSON key
4. Get your API key from APIs & Services > Credentials

## Step 2: Deploy to Netlify

### Method 1: Git Integration (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Choose your Git provider and authorize access
   - Select your repository

3. **Configure Build Settings**
   - Build command: `npm run build:netlify`
   - Publish directory: `dist/spa`
   - Functions directory: `netlify/functions`

4. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add all the environment variables from your `.env.production` file
   - **Important**: Make sure to set both client-side (VITE_*) and server-side variables

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete

### Method 2: Drag and Drop

1. **Build Locally**
   ```bash
   npm install
   npm run build:netlify
   ```

2. **Upload to Netlify**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the `dist/spa` folder to the drop zone
   - Set up environment variables in Site settings

## Step 3: Configure Netlify Functions

Your serverless functions are already configured in `netlify/functions/api.js`. The functions will be automatically deployed when you push to your repository.

### Available API Endpoints

- `GET /api/health` - Health check
- `GET /api/ping` - Simple ping
- `GET /api/dashboard/test` - Dashboard test
- `GET /api/dashboard/:userId` - Get dashboard data
- `POST /api/dashboard/:userId/add-metric` - Add business metric
- `GET /api/dashboard/:userId/products` - Get user products
- `GET /api/business-flow/charts/:userId` - Get business flow charts
- `GET /api/business-flow/:userId/latest` - Get latest business flow
- `GET /api/social/platforms` - Get social platforms

## Step 4: Post-Deployment Configuration

### 4.1 Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

### 4.2 Firebase Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4.3 CORS Configuration

Your API is already configured with CORS for cross-origin requests.

## Step 5: Testing Your Deployment

1. **Test Frontend**
   - Visit your Netlify URL
   - Check if the React app loads correctly
   - Test navigation between pages

2. **Test API Endpoints**
   - Visit `https://your-site.netlify.app/api/health`
   - Test other endpoints with Postman or curl

3. **Test Authentication**
   - Try signing in with Google
   - Check if user data is saved to Firestore

4. **Test Database Operations**
   - Add some test data through your app
   - Verify it appears in Firebase Console

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (should be 18)
   - Verify all dependencies are in package.json
   - Check build logs in Netlify dashboard

2. **Environment Variables Not Working**
   - Ensure variables are set in Netlify dashboard
   - Check variable names (VITE_* for client-side)
   - Restart the build after adding variables

3. **API Endpoints Not Working**
   - Check function logs in Netlify dashboard
   - Verify Firebase configuration
   - Test functions locally first

4. **Firebase Connection Issues**
   - Verify service account credentials
   - Check Firebase project ID
   - Ensure Firestore is enabled

### Debug Commands

```bash
# Test build locally
npm run build:netlify

# Test serverless functions locally
netlify dev

# Check environment variables
netlify env:list
```

## Performance Optimization

1. **Enable Netlify Analytics** (optional)
2. **Set up form handling** if needed
3. **Configure redirects** for better SEO
4. **Enable compression** (already configured)

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Firebase Rules**: Implement proper security rules
3. **CORS**: Configure CORS properly for your domain
4. **Headers**: Security headers are already configured

## Monitoring and Maintenance

1. **Netlify Analytics**: Monitor site performance
2. **Function Logs**: Check serverless function logs
3. **Firebase Console**: Monitor database usage
4. **Error Tracking**: Consider adding error tracking service

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

---

## Quick Start Checklist

- [ ] Set up Firebase project
- [ ] Get Google Cloud API keys
- [ ] Push code to Git repository
- [ ] Connect repository to Netlify
- [ ] Set environment variables in Netlify
- [ ] Deploy and test
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring

Your ArtisAI application should now be live on Netlify! 🚀
