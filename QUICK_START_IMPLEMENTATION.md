# Quick Start Implementation Guide - Phase 1

## 🚀 **Get Started in 1 Hour**

This guide will help you implement the first phase of AI features for your CraftAI platform. Follow these steps to transform your basic chatbot into an intelligent AI assistant.

---

## 📋 **Prerequisites Checklist**

- [ ] Firebase project set up (follow `FIREBASE_SETUP.md`)
- [ ] OpenAI API key (or Claude API key)
- [ ] Basic understanding of React/TypeScript
- [ ] Development environment ready

---

## 🔑 **Step 1: Set Up Google Cloud Project (10 minutes)**

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or "Select Project"
3. Enter project name (e.g., "craft-ai-platform")
4. Click "Create"

### 2. Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search and enable these APIs:
   - **Vertex AI API** (for AI models)
   - **Cloud Speech-to-Text API** (for voice processing)
   - **Cloud Text-to-Speech API** (for voice generation)
   - **Cloud Translation API** (for multilingual support)
   - **Cloud Vision API** (for image analysis)
   - **Natural Language API** (for text processing)

### 3. Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: "craft-ai-service"
4. Grant roles: "Vertex AI User", "Cloud Speech Admin", "Cloud Translation Admin"
5. Create and download JSON key file

---

## ⚙️ **Step 2: Set Up Environment Variables (5 minutes)**

Create a `.env.local` file in your project root:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Firebase Config (from your Firebase project)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

---

## 🧠 **Step 3: Install AI Dependencies (5 minutes)**

```bash
# Install Google Cloud AI packages
pnpm add @google-cloud/aiplatform @google-cloud/speech @google-cloud/translate @google-cloud/vision @google-cloud/language

# Install additional UI components
pnpm add @radix-ui/react-tabs @radix-ui/react-progress
```

---

## 🔧 **Step 4: Create AI Service (15 minutes)**

Create `client/lib/ai-service.ts`:

```typescript
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { SpeechClient } from '@google-cloud/speech';
import { Translate } from '@google-cloud/translate';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { LanguageServiceClient } from '@google-cloud/language';

// Google Cloud configuration
const PROJECT_ID = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = 'us-central1'; // or your preferred region

// Initialize Google Cloud AI clients
const predictionClient = new PredictionServiceClient({
  projectId: PROJECT_ID,
  location: LOCATION,
});

const speechClient = new SpeechClient();
const translateClient = new Translate({ projectId: PROJECT_ID });
const visionClient = new ImageAnnotatorClient();
const languageClient = new LanguageServiceClient();

export interface AIResponse {
  content: string;
  suggestions: string[];
  actions: AIAction[];
  language: string;
}

export interface AIAction {
  type: 'create_post' | 'write_story' | 'suggest_price' | 'enhance_photo';
  title: string;
  description: string;
  icon: string;
}

export interface ArtisanContext {
  craft: string;
  language: string;
  businessSize: string;
  location: string;
  products: string[];
}

export class AIService {
  private async generateWithVertexAI(prompt: string): Promise<string> {
    try {
      // Using PaLM 2 model for text generation
      const request = {
        endpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/text-bison`,
        instances: [
          {
            prompt: `You are CraftAI, an AI assistant for Indian artisans. Provide helpful, culturally-aware advice in a friendly tone. Always respond in the user's preferred language.

User request: ${prompt}

Please provide a helpful response:`
          }
        ],
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      };

      const [response] = await predictionClient.predict(request);
      const prediction = response.predictions?.[0];
      
      if (prediction && 'stringValue' in prediction) {
        return prediction.stringValue || "I'm sorry, I couldn't generate a response.";
      }
      
      return "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Vertex AI API error:', error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    try {
      // Using Gemini Pro model as fallback
      const request = {
        endpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-pro`,
        instances: [
          {
            prompt: `You are CraftAI, an AI assistant for Indian artisans. Provide helpful, culturally-aware advice in a friendly tone. Always respond in the user's preferred language.

User request: ${prompt}

Please provide a helpful response:`
          }
        ],
        parameters: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      };

      const [response] = await predictionClient.predict(request);
      const prediction = response.predictions?.[0];
      
      if (prediction && 'stringValue' in prediction) {
        return prediction.stringValue || "I'm sorry, I couldn't generate a response.";
      }
      
      return "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  async generateResponse(message: string, context: ArtisanContext): Promise<AIResponse> {
    const enhancedPrompt = `
      Context: You're helping an artisan who:
      - Crafts: ${context.craft}
      - Speaks: ${context.language}
      - Business size: ${context.businessSize}
      - Location: ${context.location}
      - Products: ${context.products.join(', ')}

      User message: ${message}

      Please provide:
      1. A helpful response in ${context.language}
      2. 2-3 actionable suggestions
      3. Relevant next steps they can take
    `;

    // Use Vertex AI (PaLM 2) as primary, Gemini Pro as fallback
    let content: string;
    try {
      content = await this.generateWithVertexAI(enhancedPrompt);
    } catch (error) {
      content = await this.generateWithGemini(enhancedPrompt);
    }

    // Extract suggestions and actions (simplified for now)
    const suggestions = this.extractSuggestions(content);
    const actions = this.generateActions(message, context);

    return {
      content,
      suggestions,
      actions,
      language: context.language
    };
  }

  private extractSuggestions(content: string): string[] {
    // Simple extraction - look for numbered or bulleted items
    const lines = content.split('\n');
    const suggestions: string[] = [];
    
    lines.forEach(line => {
      if (line.match(/^\d+\.|^[-•*]/) && line.length > 10) {
        suggestions.push(line.replace(/^\d+\.|^[-•*]\s*/, '').trim());
      }
    });

    return suggestions.slice(0, 3);
  }

  private generateActions(message: string, context: ArtisanContext): AIAction[] {
    const actions: AIAction[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('social media') || lowerMessage.includes('instagram') || lowerMessage.includes('post')) {
      actions.push({
        type: 'create_post',
        title: 'Create Social Media Post',
        description: 'Generate engaging content for your social media',
        icon: '📱'
      });
    }

    if (lowerMessage.includes('story') || lowerMessage.includes('narrative') || lowerMessage.includes('heritage')) {
      actions.push({
        type: 'write_story',
        title: 'Write Product Story',
        description: 'Create compelling stories about your craft',
        icon: '📖'
      });
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('value')) {
      actions.push({
        type: 'suggest_price',
        title: 'Get Pricing Advice',
        description: 'Get smart pricing recommendations',
        icon: '💰'
      });
    }

    if (lowerMessage.includes('photo') || lowerMessage.includes('image') || lowerMessage.includes('picture')) {
      actions.push({
        type: 'enhance_photo',
        title: 'Photo Enhancement Tips',
        description: 'Learn how to take better product photos',
        icon: '📸'
      });
    }

    return actions.slice(0, 3);
  }
}

export const aiService = new AIService();
```

---

## 🎯 **Step 5: Update Chat Component (20 minutes)**

Update your `client/pages/Chat.tsx` to use the AI service:

```typescript
// Add this import at the top
import { aiService, type AIResponse, type AIAction } from "@/lib/ai-service";

// Add this interface to your existing interfaces
interface EnhancedMessage extends Message {
  suggestions?: string[];
  actions?: AIAction[];
}

// Update your state
const [messages, setMessages] = useState<EnhancedMessage[]>([]);

// Replace your getAIResponse function with this:
const getAIResponse = async (userMessage: string): Promise<AIResponse> => {
  const context = {
    craft: "handicrafts", // You can make this dynamic based on user profile
    language: selectedLanguage || 'en',
    businessSize: "individual",
    location: "India",
    products: ["handwoven", "pottery", "jewelry"]
  };

  try {
    return await aiService.generateResponse(userMessage, context);
  } catch (error) {
    console.error('AI service error:', error);
    return {
      content: "I'm sorry, I'm experiencing technical difficulties. Please try again.",
      suggestions: ["Try rephrasing your question", "Check your internet connection"],
      actions: [],
      language: selectedLanguage || 'en'
    };
  }
};

// Update your handleSend function:
const handleSend = async (message?: string) => {
  const messageToSend = message || input.trim();
  if (!messageToSend) return;

  // Add user message
  const userMessage: EnhancedMessage = {
    id: Date.now().toString(),
    content: messageToSend,
    sender: 'user',
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsTyping(true);

  try {
    // Get AI response
    const aiResponse = await getAIResponse(messageToSend);
    
    const aiMessage: EnhancedMessage = {
      id: (Date.now() + 1).toString(),
      content: aiResponse.content,
      suggestions: aiResponse.suggestions,
      actions: aiResponse.actions,
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    const errorMessage: EnhancedMessage = {
      id: (Date.now() + 1).toString(),
      content: "I'm sorry, I encountered an error. Please try again.",
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};
```

---

## 🎨 **Step 6: Add Action Buttons (10 minutes)**

Add this component below your chat messages to display AI suggestions:

```typescript
// Add this after your messages mapping in the chat interface
{messages.map((message) => (
  <div key={message.id}>
    {/* Existing message display */}
    
    {/* AI Actions */}
    {message.sender === 'ai' && message.actions && message.actions.length > 0 && (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          {message.actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleActionClick(action)}
              className="text-xs h-8"
            >
              <span className="mr-1">{action.icon}</span>
              {action.title}
            </Button>
          ))}
        </div>
      </div>
    )}
    
    {/* AI Suggestions */}
    {message.sender === 'ai' && message.suggestions && message.suggestions.length > 0 && (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">Suggestions:</p>
        <div className="space-y-1">
          {message.suggestions.map((suggestion, index) => (
            <div key={index} className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
              💡 {suggestion}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
))}

// Add this function to handle action clicks
const handleActionClick = (action: AIAction) => {
  let query = '';
  
  switch (action.type) {
    case 'create_post':
      query = `Help me create a social media post for my ${selectedLanguage === 'hi' ? 'हस्तशिल्प' : 'handicrafts'}`;
      break;
    case 'write_story':
      query = `Help me write a story about my ${selectedLanguage === 'hi' ? 'शिल्प' : 'craft'}`;
      break;
    case 'suggest_price':
      query = `Help me price my ${selectedLanguage === 'hi' ? 'उत्पाद' : 'products'}`;
      break;
    case 'enhance_photo':
      query = `Give me tips for taking better photos of my ${selectedLanguage === 'hi' ? 'शिल्प' : 'crafts'}`;
      break;
  }
  
  if (query) {
    handleSend(query);
  }
};
```

---

## 🧪 **Step 7: Test Your AI Integration (5 minutes)**

1. **Start your development server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to `/auth` and sign in**

3. **Go to `/chat` and test:**
   - Type: "Help me create an Instagram post for my handwoven scarf"
   - Type: "How should I price my pottery?"
   - Type: "Tell me a story about my craft heritage"

4. **Expected Results:**
   - Intelligent, contextual responses
   - Action buttons for quick access
   - Helpful suggestions
   - Multi-language support

---

## 🎉 **Congratulations! You've Successfully Implemented Phase 1**

### What You've Built:
✅ **Intelligent AI Chat** with OpenAI/Claude integration  
✅ **Context-Aware Responses** based on artisan profile  
✅ **Quick Action Buttons** for common tasks  
✅ **Smart Suggestions** for next steps  
✅ **Multi-language Support** for Indian artisans  

### What's Working:
- AI generates contextual responses
- Suggests relevant actions
- Provides helpful tips
- Understands artisan context
- Supports multiple languages

---

## 🚀 **Next Steps to Phase 2**

1. **Content Generation**: Implement social media post creation
2. **Story Writing**: Build storytelling templates
3. **Photo Enhancement**: Add image analysis features
4. **User Profiles**: Create artisan profile management

---

## 🆘 **Troubleshooting**

### Common Issues:

**"API key not working"**
- Check your `.env.local` file
- Ensure the key is correct and has credits
- Restart your development server

**"AI responses are generic"**
- Improve your prompt engineering
- Add more context to artisan profiles
- Fine-tune the system message

**"Actions not showing"**
- Check the `generateActions` function
- Ensure message types are correct
- Verify the UI rendering logic

---

## 📚 **Resources**

- [Google Cloud AI Documentation](https://cloud.google.com/ai/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google Cloud Speech API](https://cloud.google.com/speech/docs)
- [Google Cloud Translation API](https://cloud.google.com/translate/docs)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**You're now ready to build the next phase of your AI-powered artisan platform!** 🎨✨
