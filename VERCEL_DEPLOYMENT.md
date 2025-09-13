# 🚀 Vercel Full-Stack Deployment Guide for Craft AI

## 📋 **Prerequisites**
- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com)
- Your Craft AI project pushed to GitHub

## 🔧 **Step-by-Step Deployment**

### **1. Prepare Your Repository**
```bash
# Make sure your project is on GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### **2. Deploy to Vercel**

#### **Option A: Vercel Dashboard (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of project)
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

#### **Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set root directory to current folder
# - Confirm build settings
```

### **3. Environment Variables Setup**

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### **Firebase Config**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

#### **Google Cloud Config**
```
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=your_service_account_json_content
IMAGEN_MODEL_ID=imagen-4.0-generate-001
```

### **4. Build Configuration**

Vercel will automatically:
- Build your React frontend from `client/` directory
- Deploy your Express backend as serverless functions
- Route `/api/*` requests to your backend
- Serve static files from your frontend build

### **5. Custom Domain (Optional)**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## 🌐 **Deployment Structure**

```
Your App (vercel.app)
├── Frontend (React SPA)
│   ├── / (home page)
│   ├── /auth (login/signup)
│   └── /business-flow (AI assistant)
└── Backend (Express API)
    ├── /api/ai/chat (AI responses)
    ├── /api/speech/recognize (voice)
    └── /api/speech/health (health check)
```

## 🔍 **Troubleshooting**

### **Build Errors**
- Check Node.js version (Vercel uses 18.x by default)
- Ensure all dependencies are in `client/package.json`
- Verify build command works locally

### **API Errors**
- Check environment variables are set correctly
- Verify Google Cloud credentials are valid
- Check function timeout (set to 60s in vercel.json)

### **Frontend Issues**
- Ensure client builds successfully
- Check routing configuration
- Verify static assets are served correctly

## 📱 **Post-Deployment**

1. **Test all features**:
   - User authentication
   - AI chat functionality
   - Image generation
   - Voice recognition

2. **Monitor performance**:
   - Vercel Analytics
   - Function execution times
   - API response times

3. **Set up monitoring**:
   - Error tracking
   - Performance monitoring
   - Uptime alerts

## 🎯 **Benefits of Vercel Deployment**

- ✅ **Automatic scaling** for both frontend and backend
- ✅ **Global CDN** for fast loading worldwide
- ✅ **Serverless functions** for cost-effective backend
- ✅ **Automatic deployments** on Git push
- ✅ **Built-in analytics** and monitoring
- ✅ **Edge functions** for low-latency API calls

## 🚀 **Ready to Deploy?**

Your project is now configured for Vercel! Just push to GitHub and deploy through the Vercel dashboard. The AI image generation, voice recognition, and all features will work seamlessly in production.

**Happy Deploying! 🎉**

