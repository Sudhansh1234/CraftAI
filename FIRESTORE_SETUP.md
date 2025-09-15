# 🔥 Firestore Database Setup Guide

## **Step 1: Enable Authentication Methods**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `craft-ai-70b27`
3. Go to **Authentication** in the left sidebar
4. Click **Get started**
5. Go to **Sign-in method** tab
6. Enable **Email/Password**:
   - Click on **Email/Password**
   - Toggle **Enable** to ON
   - Click **Save**
7. Enable **Google** (if not already enabled):
   - Click on **Google**
   - Toggle **Enable** to ON
   - Add your project support email
   - Click **Save**

## **Step 2: Enable Firestore Database**

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location: **us-central1** (same as your other services)
5. Click **Done**

## **Step 3: Configure Firestore Security Rules**

Go to **Firestore Database** > **Rules** and update with:

```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Users can only access their own history items
      match /userHistory/{document} {
        allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      }
      
      // Users can only access their own history sessions
      match /historySessions/{document} {
        allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    }
  }
```

## **Step 4: Test Your Setup**

1. **Start your app**: `npm run dev`
2. **Test Email/Password Auth**:
   - Go to `/auth` page
   - Create a new account with email/password
   - Sign in with the new account
3. **Test Google Auth**:
   - Sign out and try Google sign-in
   - Verify both methods work
4. **Test History Features**:
   - Send a message in chat
   - Create a story in storytelling page
   - Generate an image in image studio
5. **Check Firestore**: Go to Firebase Console > Firestore Database
6. **Verify data**: You should see collections `userHistory` and `historySessions`

## **📊 Database Structure**

### **userHistory Collection (Unified)**
```javascript
{
  userId: "user-uid-here",
  feature: "chat" | "storytelling" | "image-studio" | "marketing" | "voice",
  type: "chat" | "story" | "image" | "marketing" | "voice",
  timestamp: Timestamp,
  
  // Chat History
  userMessage?: "Hello, I need help with marketing",
  aiResponse?: "I'd be happy to help you with marketing...",
  generatedImages?: [
    {
      prompt: "Traditional pottery on white background",
      imageUrl: "base64-image-data",
      isGenerated: true
    }
  ],
  
  // Story History
  originalPrompt?: "A potter making beautiful clay pots",
  enhancedPrompt?: "A skilled artisan crafting elegant ceramic vessels...",
  videoUrl?: "https://storage.googleapis.com/...",
  status?: "enhanced" | "completed" | "failed",
  
  // Image History
  prompt?: "Modern handmade bracelet, cool tones, studio setting",
  imageUrl?: "base64-image-data",
  operation?: "generate" | "enhance" | "background-swap",
  settings?: {
    brightness: 1.2,
    saturation: 1.1,
    hue: 0,
    blur: 0,
    sharpen: 0.5
  },
  
  // Marketing History
  content?: "Instagram post for handmade jewelry",
  platform?: "instagram" | "facebook" | "twitter",
  contentType?: "post" | "caption" | "hashtags",
  generatedContent?: "✨ Handcrafted with love...",
  hashtags?: ["#handmade", "#jewelry", "#artisan"],
  
  // Voice History
  audioUrl?: "https://storage.googleapis.com/...",
  transcript?: "I make traditional pottery in Rajasthan",
  language?: "hi",
  translatedText?: "I make traditional pottery in Rajasthan",
  action?: "upload" | "transcribe" | "translate",
  
  metadata: {
    language: "en",
    sessionId: "1234567890",
    [key: string]: any
  }
}
```

### **historySessions Collection**
```javascript
{
  userId: "user-uid-here",
  feature: "chat" | "storytelling" | "image-studio" | "marketing" | "voice",
  title: "Marketing help for pottery business",
  createdAt: Timestamp,
  lastActivityAt: Timestamp,
  itemCount: 5,
  items: [/* Array of history items */]
}
```

## **🎯 Features Implemented**

### **Chat Page**
- ✅ **Automatic message saving** - Every chat message is saved to Firestore
- ✅ **Chat history loading** - Previous conversations load when you open the chat
- ✅ **Show/Hide History** button in header
- ✅ **Generated images** saved with chat messages

### **Storytelling Page**
- ✅ **Story prompt saving** - Original and enhanced prompts saved
- ✅ **Video generation tracking** - Status and URLs saved
- ✅ **History panel** with load functionality
- ✅ **Session management** for story projects

### **Image Studio Page**
- ✅ **Generated images** saved with prompts
- ✅ **Image history gallery** with thumbnails
- ✅ **Reuse prompts** functionality
- ✅ **Download images** from history
- ✅ **Operation tracking** (generate, enhance, background-swap)

### **Unified System**
- ✅ **User-specific data** - Each user only sees their own history
- ✅ **Cross-feature sessions** - Organized by feature type
- ✅ **Metadata tracking** - Language, feature, and session info stored
- ✅ **Scalable architecture** - Ready for Marketing and Voice pages

## **🔧 How It Works**

1. **User sends message** → Saved to Firestore immediately
2. **AI responds** → Response also saved to Firestore
3. **User reopens chat** → Previous messages load automatically
4. **Sessions created** → Daily sessions for better organization
5. **Security enforced** → Users can only access their own data

## **📱 UI Features**

- **Show/Hide History** button in chat header
- **Loading indicator** when fetching chat history
- **Automatic scroll** to latest messages
- **Seamless experience** - no interruption to chat flow

## **🚀 Production Considerations**

### **Security Rules (Production)**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatMessages/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && request.time < timestamp.date(2025, 12, 31); // Add expiration
    }
  }
}
```

### **Data Retention**
- Consider implementing data retention policies
- Add message deletion functionality
- Implement data export for users

### **Performance**
- Add pagination for large chat histories
- Implement message search functionality
- Add conversation archiving

## **🔍 Troubleshooting**

### **"Permission denied" errors**
- Check Firestore security rules
- Ensure user is authenticated
- Verify user ID matches in rules

### **Messages not saving**
- Check browser console for errors
- Verify Firestore is enabled
- Check network connectivity

### **History not loading**
- Check authentication status
- Verify Firestore rules allow reading
- Check for JavaScript errors in console

## **✅ Ready to Use!**

Your chat history is now fully integrated with Firebase Firestore! Users will have a seamless experience with persistent chat history across sessions.

