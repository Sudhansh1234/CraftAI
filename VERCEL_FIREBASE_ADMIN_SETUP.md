# 🚀 Vercel + Firebase Admin SDK Deployment Guide

## **Prerequisites**
- Vercel account and CLI installed
- Firebase project with Admin SDK service account
- Environment variables configured

## **1. Environment Variables Setup**

### **Required Environment Variables in Vercel Dashboard:**

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_PROJECT_ID=craft-ai-70b27
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@craft-ai-70b27.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=craft-ai-70b27.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=craft-ai-70b27
VITE_FIREBASE_STORAGE_BUCKET=craft-ai-70b27.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Cloud (for AI features)
GOOGLE_CLOUD_PROJECT_ID=craft-ai-70b27
GOOGLE_CLOUD_API_KEY=your_google_ai_studio_api_key
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Application
NODE_ENV=production
PING_MESSAGE=ping from Vercel
```

## **2. Deployment Steps**

### **Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables via CLI
vercel env add FIREBASE_ADMIN_PROJECT_ID
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL
vercel env add FIREBASE_ADMIN_PRIVATE_KEY
```

### **Option B: GitHub Integration**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch for automatic deployment

## **3. Firebase Admin SDK Configuration**

### **Environment Variables Only**
Your app uses environment variables for Firebase Admin SDK authentication. No JSON files are needed in production.

**Required Environment Variables:**
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL` 
- `FIREBASE_ADMIN_PRIVATE_KEY`

## **4. Testing Deployment**

### **Debug Endpoints:**
- `https://your-app.vercel.app/api/debug/firebase-admin` - Firebase Admin SDK status
- `https://your-app.vercel.app/api/debug/firebase` - Firebase Client SDK status
- `https://your-app.vercel.app/api/dashboard/test-firebase` - Dashboard Firebase test

### **Check Logs:**
```bash
# View real-time logs
vercel logs --follow

# View specific function logs
vercel logs --follow --function=server/index.ts
```

## **5. Troubleshooting**

### **Common Issues:**

1. **Firebase Admin SDK not initializing:**
   - Check environment variables are set correctly in Vercel dashboard
   - Verify private key format (with `\n` for newlines)
   - Ensure all 3 required env vars are present
   - Check Vercel function logs

2. **CORS errors:**
   - Update `CORS_ALLOWED_ORIGINS` environment variable
   - Check your frontend URL is included

3. **Function timeout:**
   - Increase `maxDuration` in `vercel.json` if needed
   - Optimize database queries

### **Debug Commands:**
```bash
# Check environment variables
vercel env ls

# Test locally with Vercel
vercel dev

# View function details
vercel inspect
```

## **6. Production Checklist**

- [ ] Environment variables set in Vercel dashboard
- [ ] Firebase Admin SDK credentials configured
- [ ] CORS settings updated for production domain
- [ ] Debug endpoints working
- [ ] Database operations functioning
- [ ] Logs showing successful initialization

## **7. Monitoring**

### **Vercel Analytics:**
- Monitor function performance
- Check error rates
- View function execution times

### **Firebase Console:**
- Monitor Firestore usage
- Check authentication logs
- Review security rules

## **8. Security Notes**

- Use environment variables for production (no JSON files)
- Never commit sensitive keys to version control
- Regularly rotate service account keys
- Monitor Firebase usage and costs
- Keep environment variables secure in Vercel dashboard

---

**Need Help?** Check the debug endpoints and Vercel logs for detailed error information!
