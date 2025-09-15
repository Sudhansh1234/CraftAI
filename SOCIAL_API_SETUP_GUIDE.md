# Instagram & Facebook Graph API Setup Guide

## 🎯 Overview
This guide will help you set up Instagram and Facebook Graph APIs for your Social Playground feature, allowing artisans to post content directly to their social media accounts.

## 📋 Prerequisites
- **Business Requirements**: You need Instagram Business or Creator accounts (not personal accounts)
- **Facebook Page**: Instagram Business accounts must be connected to a Facebook Page
- **Meta Developer Account**: Required for API access
- **App Review**: Some features require Meta's app review process

## 🚀 Step-by-Step Setup

### 1. Create Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Get Started" and sign up with your Facebook account
3. Complete the developer verification process

### 2. Create a New App
1. Go to [App Dashboard](https://developers.facebook.com/apps/)
2. Click "Create App"
3. Choose "Business" as the app type
4. Fill in app details:
   - **App Name**: "Craft AI - Artisan Social Platform"
   - **App Contact Email**: Your email
   - **App Purpose**: Select "Other" and describe your artisan platform

### 3. Add Required Products
In your app dashboard, add these products:

#### Instagram Graph API
- Go to "Add a Product" → "Instagram"
- This allows posting content to Instagram Business accounts

#### Facebook Login
- Go to "Add a Product" → "Facebook Login"
- Required for user authentication

#### Facebook Graph API
- Automatically included
- Allows posting to Facebook Pages

### 4. Configure Instagram Graph API
1. Go to "Products" → "Instagram" → "Basic Display"
2. Add your redirect URIs:
   ```
   http://localhost:8080/auth/instagram/callback
   https://yourdomain.com/auth/instagram/callback
   ```
3. Note down your **App ID** and **App Secret**

### 5. Configure Facebook Login
1. Go to "Products" → "Facebook Login" → "Settings"
2. Add redirect URIs:
   ```
   http://localhost:8080/auth/facebook/callback
   https://yourdomain.com/auth/facebook/callback
   ```
3. Enable "Client OAuth Login" and "Web OAuth Login"

### 6. Set Up Instagram Business Account
1. **Convert to Business**: If using personal Instagram, convert to Business account
2. **Connect to Facebook Page**: Link your Instagram Business account to a Facebook Page
3. **Verify Connection**: Ensure the connection is active in Instagram settings

## 🔑 Required Permissions

### Instagram Graph API Permissions
```javascript
const instagramPermissions = [
  'instagram_basic',           // Basic profile info
  'instagram_content_publish', // Post content
  'instagram_manage_comments', // Manage comments
  'instagram_manage_insights', // View analytics
  'pages_show_list',          // List connected pages
  'pages_read_engagement'     // Read page engagement
];
```

### Facebook Graph API Permissions
```javascript
const facebookPermissions = [
  'pages_manage_posts',       // Post to pages
  'pages_read_engagement',    // Read engagement
  'pages_show_list',          // List pages
  'publish_to_groups',        // Post to groups (optional)
  'user_posts'                // Access user posts
];
```

## 💻 Implementation Code

### Environment Variables
Create `.env.local` file:
```env
# Meta App Credentials
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here

# Redirect URLs
INSTAGRAM_REDIRECT_URI=http://localhost:8080/auth/instagram/callback
FACEBOOK_REDIRECT_URI=http://localhost:8080/auth/facebook/callback

# Base URLs
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

### OAuth Flow Implementation
```typescript
// server/routes/social-auth.ts
import { RequestHandler } from "express";

export const initiateInstagramAuth: RequestHandler = (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  const scope = 'instagram_basic,instagram_content_publish,pages_show_list';
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scope}&` +
    `response_type=code&` +
    `state=${req.session.id}`;
  
  res.redirect(authUrl);
};

export const handleInstagramCallback: RequestHandler = async (req, res) => {
  const { code } = req.query;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Get user's Instagram Business account
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    
    const accountData = await accountResponse.json();
    
    // Find Instagram account connected to Facebook page
    const instagramAccount = accountData.data.find(account => 
      account.instagram_business_account
    );
    
    if (instagramAccount) {
      // Store tokens in database
      // Redirect to success page
      res.redirect('/social-playground?connected=instagram');
    } else {
      res.redirect('/social-playground?error=no_instagram');
    }
  } catch (error) {
    console.error('Instagram auth error:', error);
    res.redirect('/social-playground?error=auth_failed');
  }
};
```

### Post Content to Instagram
```typescript
// server/routes/instagram-posts.ts
import { RequestHandler } from "express";

export const postToInstagram: RequestHandler = async (req, res) => {
  const { 
    accessToken, 
    instagramAccountId, 
    imageUrl, 
    caption 
  } = req.body;
  
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        })
      }
    );
    
    const containerData = await containerResponse.json();
    const containerId = containerData.id;
    
    // Step 2: Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken
        })
      }
    );
    
    const publishData = await publishResponse.json();
    
    res.json({
      success: true,
      postId: publishData.id,
      message: 'Content posted successfully to Instagram'
    });
    
  } catch (error) {
    console.error('Instagram post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to post to Instagram'
    });
  }
};
```

### Post Content to Facebook
```typescript
// server/routes/facebook-posts.ts
import { RequestHandler } from "express";

export const postToFacebook: RequestHandler = async (req, res) => {
  const { 
    accessToken, 
    pageId, 
    message, 
    imageUrl 
  } = req.body;
  
  try {
    const postData: any = {
      message: message,
      access_token: accessToken
    };
    
    if (imageUrl) {
      postData.link = imageUrl;
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      }
    );
    
    const result = await response.json();
    
    res.json({
      success: true,
      postId: result.id,
      message: 'Content posted successfully to Facebook'
    });
    
  } catch (error) {
    console.error('Facebook post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to post to Facebook'
    });
  }
};
```

## 🔒 Security Best Practices

### 1. Token Storage
```typescript
// Store tokens securely in database
interface SocialAccount {
  id: string;
  userId: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  accountId: string; // Instagram/Facebook account ID
  username: string;
  connected: boolean;
  lastSync: Date;
}
```

### 2. Token Refresh
```typescript
// Implement token refresh logic
const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `fb_exchange_token=${refreshToken}`
  );
  
  return response.json();
};
```

### 3. Rate Limiting
```typescript
// Implement rate limiting
const rateLimiter = new Map();

const checkRateLimit = (platform: string, userId: string) => {
  const key = `${platform}-${userId}`;
  const now = Date.now();
  const userLimit = rateLimiter.get(key) || { count: 0, resetTime: now + 3600000 };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + 3600000;
  }
  
  if (userLimit.count >= 25) { // 25 posts per hour
    throw new Error('Rate limit exceeded');
  }
  
  userLimit.count++;
  rateLimiter.set(key, userLimit);
};
```

## 📊 Testing Your Integration

### 1. Use Graph API Explorer
- Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- Test your API calls with sample data
- Verify permissions and endpoints

### 2. Test with Sample Data
```typescript
// Test Instagram posting
const testInstagramPost = async () => {
  const testData = {
    accessToken: 'your_test_token',
    instagramAccountId: 'your_instagram_account_id',
    imageUrl: 'https://example.com/test-image.jpg',
    caption: 'Test post from Craft AI! 🎨✨'
  };
  
  const response = await fetch('/api/instagram/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });
  
  console.log(await response.json());
};
```

## 🚨 Important Considerations

### 1. App Review Process
- **Basic Permissions**: Available immediately
- **Advanced Permissions**: Require Meta's app review
- **Review Time**: 7-14 business days
- **Requirements**: Detailed app description, privacy policy, terms of service

### 2. Business Account Requirements
- **Instagram**: Must be Business or Creator account
- **Facebook**: Must have a connected Facebook Page
- **Verification**: Some features require verified accounts

### 3. Rate Limits
- **Instagram**: 25 posts per hour per account
- **Facebook**: 200 posts per hour per page
- **API Calls**: 200 calls per hour per user

### 4. Content Guidelines
- Follow Meta's Community Standards
- Respect copyright and intellectual property
- No spam or misleading content
- Appropriate content for all audiences

## 🎯 Next Steps

1. **Set up Meta Developer Account** (5 minutes)
2. **Create your app** (10 minutes)
3. **Configure products and permissions** (15 minutes)
4. **Test with Graph API Explorer** (10 minutes)
5. **Implement OAuth flow** (30 minutes)
6. **Add posting functionality** (45 minutes)
7. **Test with real accounts** (15 minutes)
8. **Submit for app review** (if needed)

## 📚 Additional Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Meta Platform Policies](https://developers.facebook.com/policy/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review/)

## 🆘 Troubleshooting

### Common Issues:
1. **"App Not Setup"**: Ensure all products are properly configured
2. **"Invalid Token"**: Check token expiration and refresh logic
3. **"Permission Denied"**: Verify required permissions are granted
4. **"Rate Limit Exceeded"**: Implement proper rate limiting
5. **"Business Account Required"**: Convert personal accounts to business

### Support:
- [Meta Developer Community](https://developers.facebook.com/community/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/facebook-graph-api)
- [Meta Developer Support](https://developers.facebook.com/support/)

---

**Ready to implement?** Start with step 1 and work through each section. The entire setup should take about 2-3 hours for a basic implementation! 🚀
