import { RequestHandler } from "express";

// Context: QUESTIONNAIRE MODE - Handles general AI chat and location queries
// This route is for general AI assistance, not flow generation

// Lazy initialization of Vertex AI to avoid Vite build issues
let vertexAI: any = null;
let model: any = null;
let visionAI: any = null;
let imagenModel: any = null;
let googleGenAI: any = null;

// Helper function to validate Google Cloud credentials
function validateGoogleCloudCredentials(): boolean {
  const requiredVars = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_CLOUD_PRIVATE_KEY_ID', 
    'GOOGLE_CLOUD_PRIVATE_KEY',
    'GOOGLE_CLOUD_CLIENT_EMAIL',
    'GOOGLE_CLOUD_CLIENT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required Google Cloud environment variables:', missingVars);
    console.log('📝 Please add these to your .env.local file:');
    missingVars.forEach(varName => {
      console.log(`   ${varName}=your_value_here`);
    });
    return false;
  }
  
  return true;
}

// Helper function to create Google Cloud credentials object
function createGoogleCloudCredentials() {
  return {
    type: 'service_account',
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLOUD_CLIENT_EMAIL}`
  };
}

export async function initializeVertexAI() {
  if (!vertexAI) {
    if (!validateGoogleCloudCredentials()) {
      throw new Error('Google Cloud credentials validation failed');
    }
    
    const { VertexAI } = await import('@google-cloud/vertexai');
    vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      credentials: createGoogleCloudCredentials()
    });
    
    model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.8,
        topP: 0.9,
      },
      systemInstruction: `You are ArtisAI, an AI-powered marketplace assistant designed to help local artisans set up their profiles, list products, and grow their businesses.  
You must always be polite, supportive, and use simple conversational language.  
Your goal is to guide artisans step by step and adapt your questions dynamically based on missing information.  

## Core Functions
1. **Account Setup & Product Listing**
   - Collect artisan details (name, craft type, location, contact).
   - Collect product details (product name, category, material, price, stock, photos).
   - Ask only for missing information (dynamic questionnaire style).
   - Confirm and summarize details before saving.

2. **City Name Recognition & Location-Based Support**
   - Accept manual city input from the user.
   - Identify the artisan's location and store it.
   - Suggest nearby suppliers, wholesalers, and raw material markets using Google Maps API.
   - Discover local craft fairs or exhibitions.
   - Always sort search results by proximity.

3. **Smart Quick Actions (Dynamic Shortcuts)**
   - Contextual Buttons based on situation:
     - Location actions: "Find Suppliers", "Local Markets".
     - Business actions: "Pricing Help", "Marketing Tips".
     - Image actions: "Generate Images", "Photo Tips".
   - Recommend next steps clearly (like "Would you like me to suggest suppliers near you?").

4. **Marketing Support**
   - Give tips for using Instagram, Facebook, WhatsApp effectively.
   - Generate social media content (captions, post ideas, hashtags).
   - Suggest a marketing calendar (e.g., seasonal festivals, special offers).
   - Help with hashtag generation tailored to craft type.

5. **Pricing Assistance**
   - Suggest pricing strategies (cost-based, value-based).
   - Provide competitor pricing insights (approximate, market-based).
   - Help calculate profit margins.
   - Suggest bulk/wholesale pricing if artisan mentions wholesale.

6. **Business Insights**
   - Share local and global market trends relevant to crafts.
   - Suggest growth strategies (e.g., online shops, collaborations).
   - Provide customer engagement tips (loyalty, retention).
   - Recommend sales optimization tactics (better product descriptions, bundling).

## Behavior Rules
- Always remember previous answers in the current session (chat history).
- Summarize what's collected so far when the artisan seems confused.
- Keep responses short and conversational (2–4 sentences max).
- Use encouraging tone: "That's wonderful!", "Great choice!", "Perfect, let's move forward."
- When suggesting actions, always offer **clear next steps** or **quick buttons**.

## Example Flow
👩‍🎨 Artisan: "I want to sell handmade pottery."  
🤖 Bot: "That's wonderful! Can you tell me your city so I can suggest local markets and fairs?"  
👩‍🎨 Artisan: "Jaipur."  
🤖 Bot: "Great! I'll remember that. Would you like me to show nearby suppliers or start setting up your first product listing?"`
    });
  }
  return { vertexAI, model };
}

export async function initializeVisionAI() {
  if (!visionAI) {
    if (!validateGoogleCloudCredentials()) {
      throw new Error('Google Cloud credentials validation failed');
    }
    
    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    visionAI = new ImageAnnotatorClient({
      credentials: createGoogleCloudCredentials()
    });
  }
  return visionAI;
}

export async function initializeImagenAI() {
  if (!imagenModel) {
    if (!validateGoogleCloudCredentials()) {
      throw new Error('Google Cloud credentials validation failed');
    }
    
    const { VertexAI } = await import('@google-cloud/vertexai');
    const vertexAIInstance = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      credentials: createGoogleCloudCredentials()
    });
    
    imagenModel = vertexAIInstance.getGenerativeModel({
      model: 'imagen-3.0-generate-001',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.6,
        topP: 0.95,
      },
    });
  }
  return imagenModel;
}

// Removed Google GenAI initialization - using Vertex AI directly instead

export interface AIResponse {
  content: string;
  suggestions: string[];
  actions: AIAction[];
  language: string;
  needsMoreInfo?: boolean;
  followUpQuestions?: string[];
  conversationContext?: any;
  generatedImages?: GeneratedImage[];
  marketingCalendar?: MarketingEvent[];
  pricingAdvice?: PricingRecommendation;
  hashtags?: string[];
}

export interface GeneratedImage {
  id: string;
  description: string;
  prompt: string;
  style: string;
  platform: 'instagram' | 'facebook' | 'general';
  tags: string[];
  suggestedCaption: string;
  hashtags: string[];
  imageUrl?: string;
  isGenerated?: boolean;
  isGenerating?: boolean;
  creationTips?: string;
  dimensions?: string;
  bestTime?: string;
}

export interface AIAction {
  type: 'create_post' | 'write_story' | 'suggest_price' | 'enhance_photo' | 'marketing_tips' | 'business_advice' | 'festival_campaign' | 'hashtag_strategy';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ArtisanContext {
  craft: string;
  language: string;
  businessSize: string;
  location: string;
  products: string[];
  targetAudience?: string;
  currentChallenges?: string[];
  goals?: string[];
}

export interface MarketingEvent {
  date: string;
  event: string;
  opportunity: string;
  contentIdeas: string[];
  hashtags: string[];
}

export interface PricingRecommendation {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  factors: string[];
  competitorAnalysis: string;
  valueProposition: string[];
}

// Enhanced system prompts with specific expertise areas
const systemPrompts: { [key: string]: string } = {
  'en': `You are ArtisAI, the leading AI business advisor for Indian artisans and traditional craft businesses. Your expertise spans:

CORE COMPETENCIES:
• Digital Marketing Strategy & Social Media Growth
• Instagram/Facebook content optimization for crafts
• Pricing psychology for handmade products
• Festival marketing and seasonal campaigns
• E-commerce platform optimization
• Photography and visual storytelling
• Cultural storytelling and heritage marketing
• Export market guidance and international sales
• Business scaling and operational efficiency
• Customer relationship management

COMMUNICATION STYLE:
• Be direct, practical, and immediately actionable
• Skip repetitive greetings - get straight to valuable advice
• Use specific examples and case studies
• Provide step-by-step implementation guides
• Include relevant hashtags and marketing copy
• Consider current Indian festivals and seasonal trends

RESPONSE STRUCTURE:
• Start with immediate, implementable advice
• Include specific numbers, timeframes, and metrics
• Provide 3-5 concrete action items
• Add relevant hashtags and captions when requested
• Include festival/seasonal marketing angles
• Suggest pricing strategies with reasoning

Remember: Every response should help the artisan grow their business TODAY.`,

  'hi': `आप ArtisAI हैं, भारतीय कारीगरों और पारंपरिक शिल्प व्यवसायों के लिए अग्रणी AI व्यावसायिक सलाहकार। आपकी विशेषज्ञता में शामिल है:

मुख्य योग्यताएं:
• डिजिटल मार्केटिंग रणनीति और सोशल मीडिया विकास
• शिल्प के लिए Instagram/Facebook सामग्री अनुकूलन
• हस्तनिर्मित उत्पादों के लिए मूल्य निर्धारण मनोविज्ञान
• त्योहार मार्केटिंग और मौसमी अभियान
• ई-कॉमर्स प्लेटफॉर्म अनुकूलन
• फोटोग्राफी और दृश्य कहानी कहना
• सांस्कृतिक कहानी कहना और विरासत मार्केटिंग

संवाद शैली: सीधी, व्यावहारिक, और तुरंत कार्यान्वित करने योग्य सलाह दें। दोहराव वाले अभिवादन छोड़ें।

याद रखें: हर उत्तर कारीगर को आज ही अपना व्यवसाय बढ़ाने में मदद करना चाहिए।`,

  'bn': `আপনি ArtisAI, ভারতীয় কারিগর এবং ঐতিহ্যবাহী কারুশিল্প ব্যবসার জন্য নেতৃস্থানীয় AI ব্যবসায়িক পরামর্শদাতা। আপনার দক্ষতার ক্ষেত্র:

মূল দক্ষতা:
• ডিজিটাল বিপণন কৌশল এবং সোশ্যাল মিডিয়া বৃদ্ধি
• কারুশিল্পের জন্য Instagram/Facebook সামগ্রী অপ্টিমাইজেশন
• হস্তনির্মিত পণ্যের জন্য মূল্য নির্ধারণ মনোবিজ্ঞান
• উৎসব বিপণন এবং মৌসুমী প্রচারণা
• ই-কমার্স প্ল্যাটফর্ম অপ্টিমাইজেশন

যোগাযোগের ধরন: সরাসরি, ব্যবহারিক, এবং অবিলম্বে কার্যকর পরামর্শ দিন। পুনরাবৃত্তিমূলক অভিবাদন এড়িয়ে চলুন।

মনে রাখবেন: প্রতিটি উত্তর কারিগরকে আজই তাদের ব্যবসা বাড়াতে সাহায্য করবে।`
};

export const handleAIChat: RequestHandler = async (req, res) => {
  try {
    const { 
      message, 
      language = 'en', 
      context, 
      conversationHistory = [],
      requestType = 'general' // 'marketing', 'pricing', 'images', 'general'
    } = req.body;
    
    // Check if this is a location-based query
    const locationKeywords = ['near me', 'nearby', 'local', 'find', 'suppliers', 'wholesalers', 'markets', 'stores', 'craft fairs', 'selling', 'my area'];
    const isLocationQuery = locationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    // Also check if user mentioned a city name in their message
    const cityKeywords = ['mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'surat', 'dombivli', 'thane', 'navi mumbai'];
    const mentionedCity = cityKeywords.find(city => 
      message.toLowerCase().includes(city.toLowerCase())
    );
    
    console.log('Location query check:', { isLocationQuery, hasCoordinates: !!context?.coordinates, mentionedCity, message });
    
    // If it's a location query and user has location data OR mentioned a city, route to location search
    if (isLocationQuery && (context?.coordinates || mentionedCity)) {
      try {
        console.log('Routing to location search with context:', context);
        // Determine location data - use coordinates if available, otherwise use mentioned city
        let locationData;
        if (context?.coordinates) {
          locationData = {
            lat: parseFloat(context.coordinates.split(',')[0]),
            lng: parseFloat(context.coordinates.split(',')[1]),
            city: context.location
          };
        } else if (mentionedCity) {
          // Use default coordinates for major cities when user mentions city name
          const cityCoordinates: { [key: string]: { lat: number, lng: number } } = {
            'mumbai': { lat: 19.0760, lng: 72.8777 },
            'delhi': { lat: 28.7041, lng: 77.1025 },
            'bangalore': { lat: 12.9716, lng: 77.5946 },
            'chennai': { lat: 13.0827, lng: 80.2707 },
            'hyderabad': { lat: 17.3850, lng: 78.4867 },
            'pune': { lat: 18.5204, lng: 73.8567 },
            'kolkata': { lat: 22.5726, lng: 88.3639 },
            'ahmedabad': { lat: 23.0225, lng: 72.5714 },
            'jaipur': { lat: 26.9124, lng: 75.7873 },
            'surat': { lat: 21.1702, lng: 72.8311 },
            'dombivli': { lat: 19.2167, lng: 73.0833 },
            'thane': { lat: 19.2183, lng: 72.9781 },
            'navi mumbai': { lat: 19.0330, lng: 73.0297 }
          };
          
          const coords = cityCoordinates[mentionedCity.toLowerCase()];
          if (coords) {
            locationData = {
              lat: coords.lat,
              lng: coords.lng,
              city: mentionedCity
            };
          }
        }
        
        if (locationData) {
          const locationResponse = await fetch('http://localhost:8080/api/location/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: message,
              location: locationData
            })
          });
        
        if (locationResponse.ok) {
          const locationSearchData = await locationResponse.json();
          console.log('Location search successful:', locationSearchData);
          // Clean markdown from location search response
          if (locationSearchData.content) {
            locationSearchData.content = cleanMarkdown(locationSearchData.content);
          }
          return res.json(locationSearchData);
        } else {
          console.error('Location search failed:', locationResponse.status);
        }
        }
      } catch (error) {
        console.error('Location search error:', error);
        // Fall through to regular AI response
      }
    } else if (isLocationQuery && !context?.coordinates && !mentionedCity) {
      // If it's a location query but no location data or mentioned city, ask for location
      return res.json({
        content: "I'd love to help you find local markets and craft fairs! To give you the most accurate recommendations, I need to know your location. Please click the 'Enable Location' button in the top right corner, or tell me your city name.",
        needsMoreInfo: true,
        followUpQuestions: [
          "What city are you located in?",
          "Would you like to enable location access for better recommendations?",
          "Are you looking for markets in a specific area?"
        ]
      });
    }

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        suggestions: ['Try asking about social media marketing', 'Need pricing advice?', 'Want to create product images?']
      });
    }

    console.log(`🎯 Processing ${requestType} request:`, message.substring(0, 100));

    // Build enhanced context-aware prompt
    const enhancedPrompt = buildEnhancedPrompt(message, context, language, requestType, conversationHistory);
    
    // Generate AI response with improved model
    const { model: aiModel } = await initializeVertexAI();
    const result = await aiModel.generateContent(enhancedPrompt);
    const response = await result.response;
    
    let content = extractTextFromResponse(response);
    if (!content) {
      throw new Error('No content received from AI model');
    }

    // Process and enhance the response based on request type
    const processedResponse = await processAIResponse(content, message, context, language, requestType);
    
    console.log(`✅ Response processed. Content: ${processedResponse.content.length} chars, Images: ${processedResponse.generatedImages?.length || 0}`);
    
    res.json(processedResponse);

  } catch (error) {
    console.error('❌ AI Chat error:', error);
    
    const fallbackResponse = generateFallbackResponse(req.body.language || 'en', req.body.message || '');
    res.status(500).json({ 
      error: 'AI service temporarily unavailable',
      fallback: fallbackResponse
    });
  }
};

function buildEnhancedPrompt(message: string, context: ArtisanContext | undefined, language: string, requestType: string, history: any[]): string {
  const basePrompt = systemPrompts[language] || systemPrompts['en'];
  
  let enhancedPrompt = `${basePrompt}\n\nCONTEXT:\n`;
  
  if (context) {
    enhancedPrompt += `• Craft: ${context.craft}\n• Location: ${context.location}\n• Business Size: ${context.businessSize}\n`;
    if (context.products?.length) enhancedPrompt += `• Products: ${context.products.join(', ')}\n`;
    if (context.targetAudience) enhancedPrompt += `• Target Audience: ${context.targetAudience}\n`;
  }

  // Add current date and festival context
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const festivalContext = getFestivalContext(currentMonth, language);
  enhancedPrompt += `• Current Date: ${currentDate.toDateString()}\n• Festival Context: ${festivalContext}\n`;

  // Add request-specific instructions
  switch (requestType) {
    case 'marketing':
      enhancedPrompt += `\nSPECIAL FOCUS: Social Media Marketing
• Provide complete Instagram/Facebook strategy
• Include specific hashtags and captions
• Mention optimal posting times
• Include current festival marketing angles\n`;
      break;
    case 'pricing':
      enhancedPrompt += `\nSPECIAL FOCUS: Pricing Strategy
• Analyze material costs and time investment
• Consider market positioning
• Include competitor analysis approach
• Provide specific price ranges with reasoning\n`;
      break;
    case 'images':
      enhancedPrompt += `\nSPECIAL FOCUS: Visual Content Creation
• Provide detailed photography tips
• Include styling and composition advice
• Suggest multiple image styles for social media
• Include lighting and background recommendations\n`;
      break;
    case 'story_enhancement':
      enhancedPrompt += `\nSPECIAL FOCUS: Story Enhancement for Video Generation
• Transform the story into a cinematic, visual narrative
• Add specific visual details, camera movements, and scene descriptions
• Include emotional beats and storytelling elements
• Make it suitable for AI video generation with Veo 3
• Focus on visual storytelling rather than text-heavy content\n`;
      break;
    case 'business_insights':
      enhancedPrompt += `\nSPECIAL FOCUS: Business Insights and Recommendations
• Analyze the provided business data and metrics
• Provide specific, actionable business suggestions
• Focus on growth, risk management, and market opportunities
• Include data-driven insights and recommendations
• Format response as structured business advice\n`;
      break;
  }

  enhancedPrompt += `\nUSER QUESTION: ${message}\n\nRESPONSE REQUIREMENTS:
• Be specific and immediately actionable
• Include relevant numbers, prices, or metrics
• Provide step-by-step guidance
• Include hashtags if marketing-related
• Consider seasonal/festival opportunities
• Skip pleasantries - get straight to valuable advice`;

  return enhancedPrompt;
}

export function extractTextFromResponse(response: any): string {
  if (typeof response.text === 'function') {
    return response.text();
  } else if (typeof response.text === 'string') {
    return response.text;
  } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text;
  }
  return '';
}

// Function to clean markdown formatting from text
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown **text**
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown *text*
    .replace(/`(.*?)`/g, '$1') // Remove code markdown `text`
    .replace(/#{1,6}\s/g, '') // Remove heading markdown # ## ### etc
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link markdown [text](url)
    .replace(/^\s*[-*+]\s/gm, '• ') // Convert markdown lists to bullet points
    .replace(/^\s*\d+\.\s/gm, (match) => match.replace('.', '.')) // Keep numbered lists
    .trim();
}

async function processAIResponse(content: string, message: string, context: ArtisanContext | undefined, language: string, requestType: string): Promise<AIResponse> {
  console.log(`🔍 processAIResponse called with requestType: "${requestType}", message: "${message.substring(0, 100)}..."`);
  
  const aiResponse: AIResponse = {
    content: cleanMarkdown(content.trim()),
    suggestions: extractActionableSuggestions(content),
    actions: generateContextualActions(message, context, requestType),
    language,
    hashtags: extractHashtags(content)
  };

  // Special handling for story enhancement - don't redirect to Image Studio
  if (requestType === 'story_enhancement') {
    console.log('📖 Processing story enhancement request - keeping in storytelling context');
    // Don't redirect, let the AI process the story enhancement normally
    return aiResponse; // Return early to avoid other processing
  }

  // Add specialized processing based on request type
  if (isImageRequest(message) || requestType === 'images') {
    console.log('🎨 Image requests are routed to Image Studio. No generation inside chat.');
    aiResponse.generatedImages = [];
    aiResponse.needsMoreInfo = false;
    aiResponse.followUpQuestions = undefined;
    const item = extractSpecificItemFromMessage(message);
    aiResponse.content = `For generating images${item ? ` of ${item}` : ''}, please use the Image Studio: Go to /images. I can help you craft the perfect prompt here, then you can generate on the Image Studio page.`;
    return aiResponse;
  }

  if (isMarketingRequest(message) || requestType === 'marketing') {
    aiResponse.marketingCalendar = generateMarketingCalendar(language);
    aiResponse.content = enhanceMarketingContent(aiResponse.content, language);
  }

  if (isPricingRequest(message) || requestType === 'pricing') {
    aiResponse.pricingAdvice = generatePricingRecommendation(context, language);
  }



  if (requestType === 'business_insights') {
    // For business insights, extract structured suggestions from the AI response
    aiResponse.needsMoreInfo = false;
    aiResponse.followUpQuestions = undefined;
    // Keep the suggestions and actions as they are for business insights
  }

  // Add follow-up questions only for very vague requests
  const needsMoreInfo = shouldAskFollowUp(message, aiResponse.content);
  if (needsMoreInfo) {
    aiResponse.needsMoreInfo = true;
    aiResponse.followUpQuestions = generateSmartFollowUpQuestions(message, context, language);
  }

  return aiResponse;
}

function extractActionableSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  const lines = content.split('\n').map(line => line.trim());
  
  // Look for numbered lists, bullet points, or clear action items
  const actionPatterns = [
    /^\d+\.\s*(.+)/,
    /^[-•*]\s*(.+)/,
    /^→\s*(.+)/,
    /^✓\s*(.+)/,
    /^Step \d+:\s*(.+)/i
  ];

  for (const line of lines) {
    if (line.length > 15 && line.length < 120) {
      for (const pattern of actionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const cleaned = match[1].trim();
          if (cleaned && !cleaned.toLowerCase().includes('conclusion')) {
            suggestions.push(cleaned);
            break;
          }
        }
      }
    }
  }

  // If no structured suggestions, extract actionable sentences
  if (suggestions.length === 0) {
    const actionWords = ['should', 'can', 'try', 'consider', 'start', 'create', 'post', 'use', 'focus'];
    const sentences = content.split(/[.!?]+/).map(s => s.trim());
    
    for (const sentence of sentences) {
      if (sentence.length > 20 && sentence.length < 100) {
        const hasActionWord = actionWords.some(word => 
          sentence.toLowerCase().includes(` ${word} `) || sentence.toLowerCase().startsWith(word)
        );
        if (hasActionWord) {
          suggestions.push(sentence);
        }
      }
    }
  }

  return suggestions.slice(0, 4);
}

function generateContextualActions(message: string, context: ArtisanContext | undefined, requestType: string): AIAction[] {
  const actions: AIAction[] = [];
  const lowerMessage = message.toLowerCase();

  // High-priority actions based on request type
  if (requestType === 'marketing' || isMarketingRequest(message)) {
    actions.push({
      type: 'create_post',
      title: 'Create Social Media Post',
      description: 'Generate ready-to-post content for Instagram/Facebook',
      icon: '📱',
      priority: 'high'
    });
    actions.push({
      type: 'hashtag_strategy',
      title: 'Hashtag Strategy',
      description: 'Get targeted hashtag sets for maximum reach',
      icon: '#️⃣',
      priority: 'high'
    });
  }

  if (requestType === 'pricing' || isPricingRequest(message)) {
    actions.push({
      type: 'suggest_price',
      title: 'Smart Pricing Analysis',
      description: 'Get data-driven pricing recommendations',
      icon: '💰',
      priority: 'high'
    });
  }

  if (requestType === 'images' || isImageRequest(message)) {
    actions.push({
      type: 'enhance_photo',
      title: 'Professional Photography',
      description: 'Learn pro techniques for product photography',
      icon: '📸',
      priority: 'high'
    });
  }

  // Add festival-specific actions during festival seasons
  const currentMonth = new Date().getMonth() + 1;
  if ([9, 10, 11].includes(currentMonth)) { // Festival season
    actions.push({
      type: 'festival_campaign',
      title: 'Festival Marketing Campaign',
      description: 'Create compelling festival-themed marketing',
      icon: '🎉',
      priority: 'high'
    });
  }

  // General business growth actions
  if (lowerMessage.includes('grow') || lowerMessage.includes('business')) {
    actions.push({
      type: 'business_advice',
      title: 'Business Growth Strategy',
      description: 'Comprehensive growth plan for your craft business',
      icon: '🚀',
      priority: 'medium'
    });
  }

  return actions.slice(0, 3);
}

function extractSpecificItemFromMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Common craft items that users might request
  const craftItems = [
    'bracelet', 'necklace', 'earrings', 'ring', 'jewelry',
    'pot', 'vase', 'bowl', 'plate', 'mug', 'cup',
    'scarf', 'shawl', 'sari', 'dress', 'shirt', 'kurta',
    'rug', 'carpet', 'tapestry', 'wall hanging',
    'basket', 'box', 'container', 'storage',
    'lamp', 'candle holder', 'decorative item',
    'painting', 'drawing', 'artwork', 'sculpture',
    'toy', 'doll', 'figurine', 'statue',
    'bag', 'purse', 'wallet', 'pouch',
    'bookmark', 'card', 'invitation', 'gift wrap'
  ];
  
  // Look for specific craft items in the message
  for (const item of craftItems) {
    if (lowerMessage.includes(item)) {
      console.log(`🎨 Found craft item in message: ${item}`);
      return item;
    }
  }
  
  // If no specific item found, try to extract from common patterns
  const patterns = [
    /(?:image|photo|picture|generate|create)\s+(?:of|for)\s+([a-zA-Z\s]+)/i,
    /(?:show|give|make)\s+([a-zA-Z\s]+)\s+(?:image|photo)/i,
    /([a-zA-Z\s]+)\s+(?:image|photo|picture)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim().toLowerCase();
      if (extracted.length > 2 && extracted.length < 20) {
        console.log(`🎨 Extracted item using pattern: ${extracted}`);
        return extracted;
      }
    }
  }
  
  // Fallback to generic craft
  console.log('🎨 No specific item found, using generic craft');
  return 'traditional craft';
}

function shouldAskImageClarification(message: string, craftItem: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // If the message is very specific, no need for clarification
  const specificKeywords = [
    'traditional', 'modern', 'vintage', 'contemporary',
    'rustic', 'elegant', 'minimalist', 'ornate',
    'handmade', 'machine made', 'artisan', 'luxury',
    'simple', 'complex', 'detailed', 'abstract',
    'colorful', 'monochrome', 'bright', 'dark',
    'day', 'night', 'indoor', 'outdoor',
    'studio', 'natural', 'artificial', 'warm',
    'cool', 'soft', 'hard', 'textured', 'smooth',
    'tones', 'setting', 'mood', 'casual'
  ];
  
  // Check if user already provided specific details
  const hasSpecificDetails = specificKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Check if message is too vague - be more lenient
  const isVague = message.length < 20 || 
                  (lowerMessage.includes('image') && message.length < 40) || 
                  (lowerMessage.includes('photo') && message.length < 40) || 
                  (lowerMessage.includes('picture') && message.length < 40);
  
  // Ask for clarification only if message is very vague and lacks specific details
  // Be more generous - if they mention a specific item + any style/color/setting, proceed
  const hasCraftItem = craftItem && craftItem.length > 0;
  const shouldAsk = isVague && !hasSpecificDetails && !hasCraftItem;
  
  console.log(`🎨 Image clarification check: Message length: ${message.length}, Has specific details: ${hasSpecificDetails}, Has craft item: ${hasCraftItem}, Should ask: ${shouldAsk}`);
  
  return shouldAsk;
}

function generateImageClarificationQuestions(craftItem: string, language: string): string[] {
  const questions = {
    'en': [
      `🎨 **Style Preference**: What style would you like for your ${craftItem}? (Traditional/Modern/Vintage/Contemporary)`,
      `🎨 **Color Scheme**: Any specific colors or color theme? (Warm tones/Cool tones/Bright/Neutral)`,
      `🎨 **Setting**: Where should the ${craftItem} be displayed? (Studio/Home/Outdoor/Workshop)`,
      `🎨 **Mood**: What feeling should the image convey? (Elegant/Casual/Luxurious/Simple)`,
      `🎨 **Details**: Any specific features to highlight? (Texture/Pattern/Size/Finish)`
    ],
    'hi': [
      `🎨 **शैली**: आप अपने ${craftItem} के लिए किस शैली को पसंद करेंगे? (पारंपरिक/आधुनिक/विंटेज/समकालीन)`,
      `🎨 **रंग योजना**: कोई विशेष रंग या रंग थीम? (गर्म टोन/ठंडे टोन/चमकीले/तटस्थ)`,
      `🎨 **सेटिंग**: ${craftItem} कहाँ प्रदर्शित किया जाना चाहिए? (स्टूडियो/घर/बाहर/कार्यशाला)`,
      `🎨 **मूड**: छवि क्या भावना व्यक्त करनी चाहिए? (सुरुचिपूर्ण/आरामदायक/लक्जरी/सरल)`,
      `🎨 **विवरण**: कोई विशेष विशेषताएं जो हाइलाइट करनी हैं? (बनावट/पैटर्न/आकार/फिनिश)`
    ],
    'bn': [
      `🎨 **শৈলী**: আপনি আপনার ${craftItem} এর জন্য কোন শৈলী পছন্দ করবেন? (ঐতিহ্যগত/আধুনিক/ভিনটেজ/সমসাময়িক)`,
      `🎨 **রঙের স্কিম**: কোন নির্দিষ্ট রঙ বা রঙের থিম? (উষ্ণ টোন/শীতল টোন/উজ্জ্বল/নিরপেক্ষ)`,
      `🎨 **সেটিং**: ${craftItem} কোথায় প্রদর্শিত করা উচিত? (স্টুডিও/বাড়ি/বাইরে/ওয়ার্কশপ)`,
      `🎨 **মুড**: ছবিটি কী অনুভূতি প্রকাশ করবে? (মার্জিত/আরামদায়ক/বিলাসবহুল/সরল)`,
      `🎨 **বিস্তারিত**: হাইলাইট করার জন্য কোন নির্দিষ্ট বৈশিষ্ট্য? (টেক্সচার/প্যাটার্ন/আকার/ফিনিশ)`
    ]
  };
  
  return questions[language as keyof typeof questions] || questions['en'];
}

function hasImageClarificationDetails(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check if user provided specific style preferences
  const styleKeywords = [
    'traditional', 'modern', 'vintage', 'contemporary', 'rustic', 'elegant',
    'minimalist', 'ornate', 'handmade', 'luxury', 'simple', 'complex'
  ];
  
  // Check if user provided color preferences
  const colorKeywords = [
    'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown',
    'black', 'white', 'gray', 'gold', 'silver', 'warm', 'cool', 'bright',
    'dark', 'neutral', 'colorful', 'monochrome', 'tones'
  ];
  
  // Check if user provided setting preferences
  const settingKeywords = [
    'studio', 'home', 'outdoor', 'workshop', 'garden', 'kitchen', 'living room',
    'bedroom', 'office', 'market', 'street', 'nature', 'urban', 'settings'
  ];
  
  // Check if user provided mood preferences
  const moodKeywords = [
    'elegant', 'casual', 'luxurious', 'simple', 'romantic', 'professional',
    'playful', 'serious', 'peaceful', 'energetic', 'calm', 'dramatic', 'mood'
  ];
  
  // Count how many categories the user provided details for
  const hasStyle = styleKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasColor = colorKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasSetting = settingKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasMood = moodKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Consider it has clarification if user provided details in at least 1 category (be more lenient)
  const clarificationCount = [hasStyle, hasColor, hasSetting, hasMood].filter(Boolean).length;
  
  console.log(`🎨 Clarification details found: Style: ${hasStyle}, Color: ${hasColor}, Setting: ${hasSetting}, Mood: ${hasMood} (Total: ${clarificationCount})`);
  console.log(`🎨 Message analyzed: "${message}"`);
  
  // Also check if the message seems like a response to questions (contains multiple preferences)
  const hasMultiplePreferences = (lowerMessage.includes('style') || lowerMessage.includes('color') || 
                                lowerMessage.includes('setting') || lowerMessage.includes('mood') ||
                                lowerMessage.includes('tones') || lowerMessage.includes('casua'));
  
  // If user mentions multiple preferences or seems to be answering questions, consider it clarification
  if (hasMultiplePreferences && clarificationCount >= 1) {
    console.log('🎨 Detected as clarification based on multiple preferences mentioned');
    return true;
  }
  
  return clarificationCount >= 2;
}

async function generateComprehensiveImages(craft: string, context: string, language: string): Promise<GeneratedImage[]> {
  console.log('🎨 Starting comprehensive image generation...');
  console.log('🎨 Craft item to generate:', craft);
  console.log('🎨 User context:', context);
  
  const imageStrategies = [
    {
      style: 'Product Hero Shot',
      description: 'Professional product photography with clean background',
      prompt: `Professional product photograph of ${craft}, clean white background, studio lighting, high resolution, commercial quality, detailed texture, artisan craftsmanship, traditional Indian design, 4K quality${context.includes('traditional') ? ', traditional style' : ''}${context.includes('modern') ? ', modern contemporary style' : ''}${context.includes('vintage') ? ', vintage retro style' : ''}${context.includes('elegant') ? ', elegant sophisticated style' : ''}`,
      platform: 'instagram' as const,
      tags: ['product', 'professional', 'hero', 'clean'],
      dimensions: '1080x1080',
      bestTime: '7-9 PM IST'
    },
    {
      style: 'Lifestyle Context',
      description: 'Craft being used in real-life setting',
      prompt: `${craft} being used in daily Indian life, natural warm lighting, authentic home setting, hands interacting with craft, cultural context, cozy atmosphere, realistic lifestyle photography${context.includes('home') ? ', cozy home environment' : ''}${context.includes('outdoor') ? ', outdoor natural setting' : ''}${context.includes('studio') ? ', professional studio setting' : ''}${context.includes('warm') ? ', warm golden lighting' : ''}${context.includes('cool') ? ', cool natural lighting' : ''}`,
      platform: 'facebook' as const,
      tags: ['lifestyle', 'authentic', 'daily', 'cultural'],
      dimensions: '1200x630',
      bestTime: '8-10 AM IST'
    },
    {
      style: 'Artisan at Work',
      description: 'Behind-the-scenes crafting process',
      prompt: `Indian artisan hands creating ${craft}, traditional workspace, focused craftsmanship, cultural heritage, detailed hands working, warm natural lighting, traditional tools, authentic workshop setting`,
      platform: 'instagram' as const,
      tags: ['behind-the-scenes', 'artisan', 'process', 'heritage'],
      dimensions: '1080x1350',
      bestTime: '6-8 PM IST'
    }
  ];

  const generatedImages: GeneratedImage[] = [];

  for (const [index, strategy] of imageStrategies.entries()) {
    console.log(`🎨 Processing ${strategy.style} (${index + 1}/${imageStrategies.length})`);
    
    try {
      // Try to generate real image for first strategy only (quota management)
      let imageUrl: string | null = null;
      if (index === 0) {
        console.log('🎨 Attempting real image generation for hero shot...');
        imageUrl = await generateImageWithGemini25(strategy.prompt);
      }

      const caption = generateEnhancedCaption(craft, strategy.style, strategy.platform, language);
      const hashtags = generateRelevantHashtags(craft, strategy.style, language);
      const creationTips = generateCreationTips(strategy, language);

      generatedImages.push({
        id: `${strategy.style.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        description: strategy.description,
        prompt: strategy.prompt,
        style: strategy.style,
        platform: strategy.platform,
        tags: strategy.tags,
        suggestedCaption: caption,
        hashtags,
        imageUrl,
        isGenerated: !!imageUrl,
        creationTips,
        dimensions: strategy.dimensions,
        bestTime: strategy.bestTime
      });

    } catch (error) {
      console.error(`❌ Error processing ${strategy.style}:`, error);
      
      // Add fallback with creation guide
      const caption = generateEnhancedCaption(craft, strategy.style, strategy.platform, language);
      const hashtags = generateRelevantHashtags(craft, strategy.style, language);
      const creationTips = generateCreationTips(strategy, language);

      generatedImages.push({
        id: `fallback-${strategy.style.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        description: strategy.description,
        prompt: strategy.prompt,
        style: strategy.style,
        platform: strategy.platform,
        tags: strategy.tags,
        suggestedCaption: caption,
        hashtags,
        isGenerated: false,
        creationTips,
        dimensions: strategy.dimensions,
        bestTime: strategy.bestTime
      });
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`🎨 Image generation complete. Generated: ${generatedImages.filter(img => img.isGenerated).length}/${generatedImages.length}`);
  return generatedImages;
}

export async function generateImageWithGemini25(prompt: string, productImageData?: string): Promise<string | null> {
  try {
    console.log('🎨 Using Gemini 2.5 Flash Image Preview to generate image...');
    
    const { GoogleGenAI } = await import('@google/genai');
    
    // We need a proper API key for @google/genai package
    // For now, let's use a placeholder and show the user what's needed
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ GOOGLE_CLOUD_API_KEY not found. Please set up an API key for @google/genai package.');
      console.log('📝 To get an API key:');
      console.log('   1. Go to https://aistudio.google.com/app/apikey');
      console.log('   2. Create a new API key');
      console.log('   3. Add GOOGLE_CLOUD_API_KEY=your_api_key to your .env.local file');
      return null;
    }
    
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    const model = 'gemini-2.5-flash-image-preview';
    
    // Set up generation config
    const generationConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["TEXT", "IMAGE"],
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        }
      ],
    };

    // Prepare the request
    const parts: any[] = [{ text: prompt }];
    
    // If product image is provided, add it to the request
    if (productImageData) {
      const base64Data = productImageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const mimeType = productImageData.match(/^data:image\/([a-z]+);base64,/)?.[1] || 'jpeg';
      
      const imagePart = {
        inlineData: {
          mimeType: `image/${mimeType}`,
          data: base64Data
        }
      };
      
      parts.unshift(imagePart);
    }

    const req = {
      model: model,
      contents: [
        {
          role: 'user', 
          parts: parts
        }
      ],
      config: generationConfig,
    };

    const streamingResp = await ai.models.generateContentStream(req);
    
    let generatedImage: string | null = null;
    
     for await (const chunk of streamingResp) {
       if (chunk.text) {
         console.log('📝 Generated text:', chunk.text);
       }
       
       // Check for image data in various possible locations
       if ((chunk as any).candidates) {
         for (const candidate of (chunk as any).candidates) {
           if (candidate.content && candidate.content.parts) {
             for (const part of candidate.content.parts) {
               if (part.inlineData && part.inlineData.data) {
                 generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                 console.log('🖼️ Generated image received from candidate');
                 break;
               }
             }
           }
         }
       }
       
       // Also check direct image property
       if ((chunk as any).image) {
         if ((chunk as any).image.inlineData && (chunk as any).image.inlineData.data) {
           generatedImage = `data:image/png;base64,${(chunk as any).image.inlineData.data}`;
           console.log('🖼️ Generated image received from direct property');
         }
       }
       
       // Check for inlineData in the chunk itself
       if ((chunk as any).inlineData && (chunk as any).inlineData.data) {
         generatedImage = `data:image/png;base64,${(chunk as any).inlineData.data}`;
         console.log('🖼️ Generated image received from inlineData');
       }
     }
    
    return generatedImage;
  } catch (error) {
    console.error('❌ Gemini 2.5 Flash Image Preview generation failed:', error);
    return null;
  }
}

function generateEnhancedCaption(craft: string, style: string, platform: string, language: string): string {
  const templates = {
    'en': {
      'Product Hero Shot': `✨ Pure craftsmanship meets modern elegance in this ${craft}. Every detail tells a story of tradition and skill. Handmade with love, designed to last generations.`,
      'Lifestyle Context': `🏡 Beautiful ${craft} bringing warmth to everyday moments. This is how tradition lives in modern homes - functional, beautiful, meaningful.`,
      'Artisan at Work': `👐 The magic happens here - skilled hands shaping ${craft} using techniques passed down through generations. This is the heart of authentic craftsmanship.`
    },
    'hi': {
      'Product Hero Shot': `✨ इस ${craft} में शुद्ध शिल्पकारी और आधुनिक सुंदरता का मेल। हर विवरण परंपरा और कौशल की कहानी कहता है।`,
      'Lifestyle Context': `🏡 सुंदर ${craft} रोजमर्रा के पलों में गर्मजोशी लाता है। यही तो है परंपरा का आधुनिक रूप।`,
      'Artisan at Work': `👐 यहाँ जादू होता है - कुशल हाथ ${craft} को आकार देते हैं पीढ़ियों से चली आ रही तकनीकों से।`
    },
    'bn': {
      'Product Hero Shot': `✨ এই ${craft} এ বিশুদ্ধ কারুশিল্প এবং আধুনিক কমনীয়তার মিলন। প্রতিটি বিবরণ ঐতিহ্য ও দক্ষতার গল্প বলে।`,
      'Lifestyle Context': `🏡 সুন্দর ${craft} দৈনন্দিন মুহূর্তগুলিতে উষ্ণতা আনে। এভাবেই ঐতিহ্য আধুনিক ঘরে বাস করে।`,
      'Artisan at Work': `👐 এখানেই জাদু ঘটে - দক্ষ হাত ${craft} গড়ে তোলে প্রজন্মের পর প্রজন্ম ধরে চলা কৌশলে।`
    }
  };

  const languageTemplates = templates[language as keyof typeof templates] || templates['en'];
  return languageTemplates[style as keyof typeof languageTemplates] || languageTemplates['Product Hero Shot'];
}

function generateRelevantHashtags(craft: string, style: string, language: string): string[] {
  const baseHashtags = [
    '#HandmadeInIndia',
    '#ArtisanCraft',
    '#TraditionalCraft',
    `#${craft.replace(/\s+/g, '')}`,
    '#IndianArtisan'
  ];

  const styleHashtags: { [key: string]: string[] } = {
    'Product Hero Shot': ['#ProductPhotography', '#HandmadeDesign', '#CraftedWithLove'],
    'Lifestyle Context': ['#LifestyleDesign', '#HomeDécor', '#AuthenticLiving'],
    'Artisan at Work': ['#BehindTheScenes', '#ArtisanLife', '#TraditionalSkills']
  };

  const languageHashtags: { [key: string]: string[] } = {
    'hi': ['#भारतीयशिल्प', '#हस्तनिर्मित', '#पारंपरिक'],
    'bn': ['#ভারতীয়শিল্প', '#হস্তনির্মিত', '#ঐতিহ্যগত'],
    'en': ['#MadeInIndia', '#SupportArtisans', '#CulturalHeritage']
  };

  return [
    ...baseHashtags,
    ...(styleHashtags[style] || []),
    ...(languageHashtags[language] || languageHashtags['en'])
  ].slice(0, 10);
}

function generateCreationTips(strategy: any, language: string): string {
  const tips = {
    'en': {
      'Product Hero Shot': 'Use natural window light, white background, multiple angles, focus on texture details, shoot in square format for Instagram',
      'Lifestyle Context': 'Include hands using the product, warm home lighting, show scale with everyday objects, capture candid moments',
      'Artisan at Work': 'Focus on hands and tools, show process steps, use close-up details, natural workshop lighting, tell the story'
    },
    'hi': {
      'Product Hero Shot': 'प्राकृतिक खिड़की की रोशनी, सफेद बैकग्राउंड, कई कोण, बनावट की बारीकियां, Instagram के लिए स्क्वेयर फॉर्मेट',
      'Lifestyle Context': 'उत्पाद का उपयोग करते हुए हाथ, घर की गर्म रोशनी, रोजमर्रा की वस्तुओं के साथ आकार दिखाएं',
      'Artisan at Work': 'हाथों और उपकरणों पर ध्यान दें, प्रक्रिया के चरण दिखाएं, करीबी विवरण, प्राकृतिक कार्यशाला प्रकाश'
    },
    'bn': {
      'Product Hero Shot': 'প্রাকৃতিক জানালার আলো, সাদা পটভূমি, একাধিক কোণ, টেক্সচার বিবরণে ফোকাস, Instagram এর জন্য বর্গাকার ফরম্যাট',
      'Lifestyle Context': 'পণ্য ব্যবহার করা হাত অন্তর্ভুক্ত করুন, ঘরের উষ্ণ আলো, দৈনন্দিন বস্তুর সাথে স্কেল দেখান',
      'Artisan at Work': 'হাত এবং সরঞ্জামে ফোকাস করুন, প্রক্রিয়ার ধাপ দেখান, ক্লোজ-আপ বিবরণ, প্রাকৃতিক কর্মশালার আলো'
    }
  };

  const languageTips = tips[language as keyof typeof tips] || tips['en'];
  return languageTips[strategy.style as keyof typeof languageTips] || languageTips['Product Hero Shot'];
}

function generateMarketingCalendar(language: string): MarketingEvent[] {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  
  const events: MarketingEvent[] = [];
  
  // Generate next 30 days of marketing opportunities
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    
    const monthEvents = getMonthlyEvents(date.getMonth() + 1, language);
    if (monthEvents.length > 0) {
      const randomEvent = monthEvents[Math.floor(Math.random() * monthEvents.length)];
      if (Math.random() > 0.7) { // 30% chance to include each event
        events.push({
          date: date.toISOString().split('T')[0],
          ...randomEvent
        });
      }
    }
  }
  
  return events.slice(0, 5); // Return top 5 upcoming opportunities
}

function getMonthlyEvents(month: number, language: string): Omit<MarketingEvent, 'date'>[] {
  const eventsByMonth: { [key: number]: { [lang: string]: Omit<MarketingEvent, 'date'>[] } } = {
    1: {
      'en': [
        {
          event: 'Makar Sankranti',
          opportunity: 'Traditional kite themes and winter crafts',
          contentIdeas: ['Kite-making process', 'Winter festival crafts', 'Traditional sweets presentation'],
          hashtags: ['#MakarSankranti', '#KiteFestival', '#WinterCrafts']
        }
      ]
    },
    10: {
      'en': [
        {
          event: 'Diwali Preparation Week',
          opportunity: 'Festival decorations and gift items peak demand',
          contentIdeas: ['Diwali decor DIY', 'Traditional diyas', 'Festival gift sets', 'Rangoli patterns'],
          hashtags: ['#DiwaliDecor', '#FestivalCrafts', '#TraditionalGifts', '#DiwaliPrep']
        },
        {
          event: 'Navratri',
          opportunity: 'Colorful traditional wear and accessories',
          contentIdeas: ['Garba night accessories', 'Traditional jewelry', 'Colorful textiles'],
          hashtags: ['#Navratri', '#GarbaNight', '#TraditionalWear']
        }
      ]
    }
  };
  
  return eventsByMonth[month]?.[language] || eventsByMonth[month]?.['en'] || [];
}

function generatePricingRecommendation(context: ArtisanContext | undefined, language: string): PricingRecommendation {
  // Base pricing calculation (this would ideally use real market data)
  const baseMaterialCost = 100; // Example base cost
  const timeMultiplier = 50; // Per hour
  const skillPremium = 1.5;
  const marketPosition = 2.0; // Premium positioning
  
  const suggestedPrice = baseMaterialCost * skillPremium * marketPosition;
  
  return {
    suggestedPrice: Math.round(suggestedPrice),
    priceRange: {
      min: Math.round(suggestedPrice * 0.8),
      max: Math.round(suggestedPrice * 1.4)
    },
    factors: [
      'Material quality and sourcing',
      'Time investment and skill level',
      'Market positioning and brand value',
      'Seasonal demand fluctuations',
      'Competitor pricing analysis'
    ],
    competitorAnalysis: 'Position 15-20% above mass market, focus on craftsmanship story',
    valueProposition: [
      'Handmade authenticity',
      'Cultural heritage value',
      'Sustainable craftsmanship',
      'Unique design elements',
      'Artisan story and connection'
    ]
  };
}

function getFestivalContext(month: number, language: string): string {
  const contexts = {
    'en': {
      1: 'New Year resolutions, Makar Sankranti, Republic Day themes',
      2: 'Valentine\'s Day gifts, Basant Panchami spring themes',
      3: 'Holi colors, Women\'s Day empowerment',
      9: 'Ganesh Chaturthi, festive season beginning',
      10: 'Navratri, Dussehra, Diwali preparation peak',
      11: 'Diwali peak, post-festival, wedding season',
      12: 'Christmas, New Year preparation, winter themes'
    },
    'hi': {
      10: 'नवरात्रि, दशहरा, दीवाली की तैयारी का चरम समय',
      11: 'दीवाली का चरम, त्योहार के बाद, शादी का मौसम'
    }
  };
  
  const langContexts = contexts[language as keyof typeof contexts] || contexts['en'];
  return langContexts[month as keyof typeof langContexts] || 'Regular season - focus on quality and consistency';
}

function shouldAskFollowUp(message: string, content: string): boolean {
  const veryVaguePatterns = [
    /^help$/i,
    /^hi$/i,
    /^hello$/i,
    /^start.*business$/i,
    /^i need help$/i
  ];
  
  return veryVaguePatterns.some(pattern => pattern.test(message.trim())) && 
         message.length < 15;
}

function generateSmartFollowUpQuestions(message: string, context: ArtisanContext | undefined, language: string): string[] {
  const questions = {
    'en': [
      'What specific craft or art form do you work with?',
      'What\'s your main challenge right now - marketing, pricing, or something else?'
    ],
    'hi': [
      'आप किस विशिष्ट शिल्प या कला के साथ काम करते हैं?',
      'आपकी मुख्य चुनौती क्या है - मार्केटिंग, मूल्य निर्धारण, या कुछ और?'
    ],
    'bn': [
      'আপনি কোন নির্দিষ্ট কারুশিল্প বা শিল্পকলা নিয়ে কাজ করেন?',
      'আপনার মূল চ্যালেঞ্জ কী - মার্কেটিং, মূল্য নির্ধারণ, নাকি অন্য কিছু?'
    ]
  };
  
  return questions[language as keyof typeof questions] || questions['en'];
}

function isMarketingRequest(message: string): boolean {
  const marketingKeywords = [
    'instagram', 'facebook', 'social media', 'marketing', 'post', 'caption',
    'hashtag', 'content', 'promote', 'advertise', 'campaign', 'audience',
    'engagement', 'followers', 'viral', 'reach'
  ];
  
  return marketingKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

function isPricingRequest(message: string): boolean {
  const pricingKeywords = [
    'price', 'cost', 'pricing', 'charge', 'sell', 'value', 'worth', 'rate', 'fee'
  ];
  
  return pricingKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

function isImageRequest(message: string): boolean {
  const imageKeywords = [
    'image', 'photo', 'picture', 'visual', 'camera', 'shoot', 'photography', 'pic'
  ];
  
  // Don't trigger on story-related content that might contain image-like words
  const storyContext = message.toLowerCase().includes('story') || 
                      message.toLowerCase().includes('narrative') || 
                      message.toLowerCase().includes('video') ||
                      message.toLowerCase().includes('cinematic');
  
  // Only trigger if it's clearly an image request and not a story request
  if (storyContext) {
    return false;
  }
  
  return imageKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w\u0900-\u097F]+/g;
  const matches = content.match(hashtagRegex);
  return matches ? [...new Set(matches)].slice(0, 10) : [];
}

export async function generateImageWithGemini(prompt: string, productImageData: string): Promise<string | null> {
  try {
    console.log('🔌 Using Vertex AI Gemini to analyze product image...');
    
    // Use Vertex AI to analyze the uploaded image and enhance the prompt
    const { model } = await initializeVertexAI();

    // Convert base64 data to proper format
    const base64Data = productImageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = productImageData.match(/^data:image\/([a-z]+);base64,/)?.[1] || 'jpeg';
    
    const imagePart = {
      inlineData: {
        mimeType: `image/${mimeType}`,
        data: base64Data
      }
    };
    
    const analysisPrompt = `Analyze this product image and describe its key visual characteristics that should be preserved in professional product photography. Focus on:
    - Product design, shape, and form
    - Colors, patterns, and textures
    - Materials and craftsmanship details
    - Unique selling points and visual appeal
    
    Provide a detailed description that can be used to create professional product photography while preserving these exact characteristics.`;
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [imagePart, { text: analysisPrompt }]
      }]
    });
    const response = await result.response;
    const analysis = extractTextFromResponse(response);
    
    console.log('📝 Product analysis:', analysis);
    console.log('ℹ️ Using enhanced prompt with Imagen for generation');
    
    // Return null to use Imagen fallback, but the analysis helps with better prompts
    return null;

  } catch (error) {
    console.error('❌ Gemini image analysis failed:', error);
    return null;
  }
}

function enhanceMarketingContent(content: string, language: string): string {
  const currentTime = new Date().getHours();
  const bestPostingTime = currentTime < 19 ? '7-9 PM IST today' : '7-9 PM IST tomorrow';
  
  const enhancements = {
    'en': `\n\n📈 **Quick Action Plan:**\n• Post at optimal time: ${bestPostingTime}\n• Use 8-12 relevant hashtags\n• Engage with comments within 2 hours\n• Cross-post to Facebook and Instagram\n• Track engagement and adjust strategy`,
    'hi': `\n\n📈 **त्वरित कार्य योजना:**\n• इष्टतम समय पर पोस्ट करें: ${bestPostingTime}\n• 8-12 प्रासंगिक हैशटैग का उपयोग करें\n• 2 घंटे के भीतर टिप्पणियों के साथ जुड़ें\n• Facebook और Instagram पर क्रॉस-पोस्ट करें`,
    'bn': `\n\n📈 **দ্রুত কর্ম পরিকল্পনা:**\n• সর্বোত্তম সময়ে পোস্ট করুন: ${bestPostingTime}\n• 8-12টি প্রাসঙ্গিক হ্যাশট্যাগ ব্যবহার করুন\n• 2 ঘন্টার মধ্যে মন্তব্যের সাথে যুক্ত হন`
  };
  
  return content + (enhancements[language as keyof typeof enhancements] || enhancements['en']);
}

function generateFallbackResponse(language: string, message: string): AIResponse {
  const fallbacks = {
    'en': {
      content: cleanMarkdown("I'm experiencing technical difficulties. I can still help with digital marketing, pricing strategies, or social media tips for your craft business. Try asking about Instagram marketing or pricing advice."),
      suggestions: [
        "Ask about Instagram marketing strategies",
        "Need help with pricing your products?",
        "Want tips for better product photography?",
        "How to create engaging social media content?"
      ]
    },
    'hi': {
      content: cleanMarkdown("मुझे तकनीकी समस्या हो रही है। मैं अभी भी डिजिटल मार्केटिंग, मूल्य निर्धारण रणनीतियों या आपके शिल्प व्यवसाय के लिए सोशल मीडिया टिप्स के साथ मदद कर सकता हूं।"),
      suggestions: [
        "Instagram मार्केटिंग रणनीतियों के बारे में पूछें",
        "अपने उत्पादों की कीमत निर्धारण में मदद चाहिए?",
        "बेहतर उत्पाद फोटोग्राफी के लिए टिप्स चाहिए?",
        "आकर्षक सोशल मीडिया सामग्री कैसे बनाएं?"
      ]
    }
  };
  
  const fallback = fallbacks[language as keyof typeof fallbacks] || fallbacks['en'];
  
  return {
    content: fallback.content,
    suggestions: fallback.suggestions,
    actions: [
      {
        type: 'marketing_tips',
        title: 'Marketing Help',
        description: 'Get marketing advice despite technical issues',
        icon: '📱',
        priority: 'high'
      }
    ],
    language
  };
}

// Health check with enhanced diagnostics
export const handleAIHealth: RequestHandler = async (req, res) => {
  try {
    const healthCheck = {
      vertexAI: false,
      vision: false,
      imagen: false,
      timestamp: new Date().toISOString()
    };

    // Test Vertex AI
    try {
      const { model: aiModel } = await initializeVertexAI();
      const testResult = await aiModel.generateContent('Test connection');
      const response = await testResult.response;
      healthCheck.vertexAI = !!extractTextFromResponse(response);
    } catch (error) {
      console.error('Vertex AI health check failed:', error);
    }

    // Test Vision AI
    try {
      await initializeVisionAI();
      healthCheck.vision = true;
    } catch (error) {
      console.error('Vision AI health check failed:', error);
    }

    // Test Imagen
    try {
      await initializeImagenAI();
      healthCheck.imagen = true;
    } catch (error) {
      console.error('Imagen AI health check failed:', error);
    }

    const overallHealth = healthCheck.vertexAI; // Core service must work
    
    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? 'healthy' : 'degraded',
      services: healthCheck,
      model: 'gemini-2.0-flash-exp',
      features: {
        chat: healthCheck.vertexAI,
        imageAnalysis: healthCheck.vision,
        imageGeneration: healthCheck.imagen
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};