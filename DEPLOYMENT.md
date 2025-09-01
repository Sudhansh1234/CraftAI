# 🚀 Deployment Guide - Craft AI

## **Option 1: Deploy to Vercel (Recommended)**

### **Step 1: Install Vercel CLI**
```bash
npm i -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Deploy**
```bash
vercel
```

### **Step 4: Set Environment Variables**
In your Vercel dashboard, add these environment variables:
- `GOOGLE_CLOUD_PROJECT_ID` - Your Google Cloud Project ID
- `GOOGLE_CLOUD_LOCATION` - Your Google Cloud Location (e.g., us-central1)

### **Step 5: Redeploy**
```bash
vercel --prod
```

---

## **Option 2: Deploy to Netlify (Frontend Only)**

### **Step 1: Remove netlify.toml conflicts**
Your current `netlify.toml` is fine for frontend-only deployment.

### **Step 2: Build and Deploy**
```bash
npm run build:netlify
```

### **Step 3: Deploy to Netlify**
- Drag and drop the `client/dist` folder to Netlify
- Or connect your GitHub repository

### **⚠️ Note: Backend APIs won't work with Netlify frontend-only deployment**

---

## **Option 3: Deploy to Railway**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login and Deploy**
```bash
railway login
railway init
railway up
```

### **Step 3: Set Environment Variables**
```bash
railway variables set GOOGLE_CLOUD_PROJECT_ID=your-project-id
railway variables set GOOGLE_CLOUD_LOCATION=us-central1
```

---

## **🔧 Environment Variables Required**

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

---

## **📁 Project Structure for Deployment**

```
craft-ai/
├── client/                 # React frontend
│   ├── package.json       # Client dependencies
│   └── dist/              # Built frontend
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   └── routes/            # API routes
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

---

## **🎯 Recommended: Vercel Deployment**

Vercel is the best choice because:
- ✅ **Full-stack support** (React + Express)
- ✅ **Automatic deployments** from GitHub
- ✅ **Free tier** with generous limits
- ✅ **Built-in environment variables**
- ✅ **Edge functions** for your APIs
- ✅ **Easy domain setup**

---

## **🚀 Quick Start with Vercel**

1. **Push your code to GitHub**
2. **Connect to Vercel**: Go to [vercel.com](https://vercel.com) and import your repository
3. **Set environment variables** in Vercel dashboard:
   - `GOOGLE_CLOUD_PROJECT_ID` = your-project-id
   - `GOOGLE_CLOUD_LOCATION` = us-central1
4. **Deploy automatically** - Vercel will build and deploy your app

Your app will be live at: `https://your-app-name.vercel.app`

## **🔧 Fixed Issues**

✅ **Fixed Vercel build error** - Updated configuration to use root package.json
✅ **Fixed index.html path** - Vercel now correctly finds the HTML file
✅ **Added vercel-build script** - Proper build command for Vercel
✅ **Updated routes** - Correct routing for SPA and API endpoints
