import { RequestHandler } from "express";

// Lazy initialization of Vertex AI to avoid Vite build issues
let vertexAI: any = null;
let model: any = null;

async function initializeVertexAI() {
  if (!vertexAI) {
    const { VertexAI } = await import('@google-cloud/vertexai');
    vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    });
    
    model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
      },
    });
  }
  return { vertexAI, model };
}

export interface AIResponse {
  content: string;
  suggestions: string[];
  actions: AIAction[];
  language: string;
  needsMoreInfo?: boolean;
  followUpQuestions?: string[];
  conversationContext?: any;
}

export interface AIAction {
  type: 'create_post' | 'write_story' | 'suggest_price' | 'enhance_photo' | 'marketing_tips' | 'business_advice';
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

// Language-specific system prompts
const systemPrompts: { [key: string]: string } = {
  'en': `You are CraftAI, an AI assistant specifically designed to help Indian artisans grow their traditional craft businesses in the digital age. You provide practical, culturally-sensitive advice that respects traditional methods while embracing modern marketing and business practices.

Your expertise includes:
- Digital marketing for traditional crafts
- Social media strategies for artisan businesses
- Storytelling that highlights cultural heritage
- Pricing strategies for handmade products
- Photography tips for craft products
- Online marketplace optimization
- Customer relationship management
- Festival and seasonal marketing
- Export opportunities and regulations

IMPORTANT: Be conversational and natural. Don't start every response with "Namaste" or repetitive greetings. Vary your responses and be direct when asking follow-up questions. Always be encouraging, practical, and respectful of traditional craft methods. Provide actionable advice that artisans can implement immediately.`,

  'hi': `आप CraftAI हैं, एक AI सहायक जो भारतीय कारीगरों की पारंपरिक शिल्प व्यवसायों को डिजिटल युग में बढ़ाने में मदद करने के लिए विशेष रूप से डिज़ाइन किया गया है। आप व्यावहारिक, सांस्कृतिक रूप से संवेदनशील सलाह प्रदान करते हैं जो पारंपरिक तरीकों का सम्मान करते हुए आधुनिक मार्केटिंग और व्यावसायिक प्रथाओं को अपनाती है।

आपकी विशेषज्ञता में शामिल है:
- पारंपरिक शिल्प के लिए डिजिटल मार्केटिंग
- कारीगर व्यवसायों के लिए सोशल मीडिया रणनीतियां
- सांस्कृतिक विरासत को उजागर करने वाली कहानियां
- हस्तनिर्मित उत्पादों के लिए मूल्य निर्धारण रणनीतियां
- शिल्प उत्पादों के लिए फोटोग्राफी टिप्स

महत्वपूर्ण: बातचीत और स्वाभाविक रहें। हर प्रतिक्रिया में "नमस्ते" या दोहराव वाले अभिवादन से शुरू न करें। अपनी प्रतिक्रियाओं में विविधता लाएं और अनुवर्ती प्रश्न पूछते समय सीधे रहें। हमेशा प्रोत्साहनजनक, व्यावहारिक और पारंपरिक शिल्प विधियों के प्रति सम्मानजनक रहें।`,

  'bn': `আপনি CraftAI, একটি AI সহায়ক যা ভারতীয় কারিগরদের ঐতিহ্যবাহী কারুশিল্প ব্যবসাকে ডিজিটাল যুগে বৃদ্ধি করতে সাহায্য করার জন্য বিশেষভাবে ডিজাইন করা হয়েছে। আপনি ব্যবহারিক, সাংস্কৃতিকভাবে সংবেদনশীল পরামর্শ প্রদান করেন যা ঐতিহ্যগত পদ্ধতিকে সম্মান করে আধুনিক বিপণন এবং ব্যবসায়িক অনুশীলনকে গ্রহণ করে।

আপনার দক্ষতার মধ্যে রয়েছে:
- ঐতিহ্যবাহী কারুশিল্পের জন্য ডিজিটাল বিপণন
- কারিগর ব্যবসার জন্য সোশ্যাল মিডিয়া কৌশল
- সাংস্কৃতিক ঐতিহ্য তুলে ধরে গল্প বলা
- হস্তনির্মিত পণ্যের জন্য মূল্য নির্ধারণ কৌশল

গুরুত্বপূর্ণ: কথোপকথন এবং স্বাভাবিক থাকুন। প্রতিটি প্রতিক্রিয়ায় "নমস্কার" বা পুনরাবৃত্তিমূলক অভিবাদন দিয়ে শুরু করবেন না। আপনার প্রতিক্রিয়ায় বৈচিত্র্য আনুন এবং অনুসরণকারী প্রশ্ন জিজ্ঞাসা করার সময় সরাসরি থাকুন। সর্বদা উৎসাহজনক, ব্যবহারিক এবং ঐতিহ্যবাহী কারুশিল্প পদ্ধতির প্রতি সম্মানজনক হন।`
};

export const handleAIChat: RequestHandler = async (req, res) => {
  try {
    const { message, language = 'en', context, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Get system prompt for the language
    const systemPrompt = systemPrompts[language] || systemPrompts['en'];
    
    // Build enhanced prompt with context
    let enhancedPrompt = systemPrompt;
    
    if (context) {
      enhancedPrompt += `\n\nArtisan Context:
- Craft: ${context.craft || 'General crafts'}
- Location: ${context.location || 'India'}
- Business Size: ${context.businessSize || 'Small'}
- Products: ${context.products?.join(', ') || 'Various handmade items'}`;
    }

    enhancedPrompt += `\n\nUser Question: ${message}

IMPORTANT: If the user's request is vague and needs more information (like "I want to start a business", "Help me with pricing", "I need marketing help"), provide a BRIEF response and then ask 2-3 specific follow-up questions.

DO NOT provide detailed advice if you don't have enough information. Instead, give a short acknowledgment and ask targeted questions.

DO NOT start with repetitive greetings like "Namaste" or "Hello". Be direct and conversational.

For example:
- "I want to start a business" → Brief response + ask about craft type, location, experience
- "Help me with pricing" → Brief response + ask about product, materials, time investment
- "I need marketing help" → Brief response + ask about products, audience, current platforms

Keep your response concise and focus on gathering the information you need.`;

    // Generate response using Gemini
    const { model: aiModel } = await initializeVertexAI();
    const result = await aiModel.generateContent(enhancedPrompt);
    const response = await result.response;
    
    // Handle different response formats from Vertex AI
    let content: string;
    if (typeof response.text === 'function') {
      content = response.text();
    } else if (typeof response.text === 'string') {
      content = response.text;
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      content = response.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected response format from Vertex AI');
    }

    // Extract suggestions from the response
    const suggestions = extractSuggestions(content);
    
    // Generate contextual actions
    const actions = generateActions(message, context);

    // Analyze if the response needs more information
    const needsMoreInfo = analyzeIfNeedsMoreInfo(content, message);
    const followUpQuestions = needsMoreInfo ? generateFollowUpQuestions(message, language) : [];

    const aiResponse: AIResponse = {
      content: content.trim(),
      suggestions,
      actions,
      language,
      needsMoreInfo,
      followUpQuestions
    };

    res.json(aiResponse);

  } catch (error) {
    console.error('AI Chat error:', error);
    
    // Provide fallback response
    const fallbackMessage = {
      'en': "I'm experiencing technical difficulties right now. Please try again in a moment, or feel free to ask me about digital marketing, pricing strategies, or social media tips for your craft business.",
      'hi': "मुझे अभी तकनीकी कठिनाइयों का सामना कर रहा हूं। कृपया एक क्षण में फिर से कोशिश करें, या अपने शिल्प व्यवसाय के लिए डिजिटल मार्केटिंग, मूल्य निर्धारण रणनीतियों, या सोशल मीडिया टिप्स के बारे में मुझसे पूछने के लिए स्वतंत्र महसूस करें।",
      'bn': "আমি এখন প্রযুক্তিগত সমস্যার সম্মুখীন হচ্ছি। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন, অথবা আপনার কারুশিল্প ব্যবসার জন্য ডিজিটাল বিপণন, মূল্য নির্ধারণ কৌশল, বা সোশ্যাল মিডিয়া টিপস সম্পর্কে আমাকে জিজ্ঞাসা করতে দ্বিধা করবেন না।"
    };

    const language = req.body.language || 'en';
    
    res.status(500).json({ 
      error: 'AI service temporarily unavailable',
      fallback: {
        content: fallbackMessage[language as keyof typeof fallbackMessage] || fallbackMessage['en'],
        suggestions: [
          language === 'hi' ? "डिजिटल मार्केटिंग के बारे में पूछें" : 
          language === 'bn' ? "ডিজিটাল বিপণন সম্পর্কে জিজ্ঞাসা করুন" : 
          "Ask about digital marketing",
          
          language === 'hi' ? "मूल्य निर्धারण सलाह चाहिए" : 
          language === 'bn' ? "মূল্য নির্ধারণের পরামর্শ চান" : 
          "Need pricing advice",
          
          language === 'hi' ? "सोशल मीडिया टिप्स" : 
          language === 'bn' ? "সোশ্যাল মিডিয়া টিপস" : 
          "Social media tips"
        ],
        actions: [],
        language
      }
    });
  }
};

// Extract actionable suggestions from AI response
function extractSuggestions(content: string): string[] {
  const lines = content.split('\n').map(line => line.trim());
  const suggestions: string[] = [];
  
  for (const line of lines) {
    // Look for numbered lists, bullet points, or action items
    if (line.match(/^\d+\.|^[-•*]|^→|^✓/) && line.length > 15 && line.length < 100) {
      const cleaned = line.replace(/^\d+\.|^[-•*→✓]\s*/, '').trim();
      if (cleaned && !cleaned.toLowerCase().includes('conclusion') && !cleaned.toLowerCase().includes('summary')) {
        suggestions.push(cleaned);
      }
    }
  }
  
  // If no structured suggestions found, extract sentences that sound actionable
  if (suggestions.length === 0) {
    const sentences = content.split(/[.!?]+/).map(s => s.trim());
    for (const sentence of sentences) {
      if ((sentence.includes('should') || sentence.includes('can') || sentence.includes('try') || 
           sentence.includes('consider') || sentence.includes('use')) && 
          sentence.length > 20 && sentence.length < 100) {
        suggestions.push(sentence);
      }
    }
  }
  
  return suggestions.slice(0, 3);
}

// Generate contextual actions based on the message
function generateActions(message: string, context?: ArtisanContext): AIAction[] {
  const actions: AIAction[] = [];
  const lowerMessage = message.toLowerCase();

  // Social media related
  if (lowerMessage.includes('social media') || lowerMessage.includes('instagram') || 
      lowerMessage.includes('facebook') || lowerMessage.includes('post')) {
    actions.push({
      type: 'create_post',
      title: 'Create Social Media Post',
      description: 'Generate engaging content for your social media platforms',
      icon: '📱'
    });
  }

  // Storytelling related
  if (lowerMessage.includes('story') || lowerMessage.includes('narrative') || 
      lowerMessage.includes('heritage') || lowerMessage.includes('tradition')) {
    actions.push({
      type: 'write_story',
      title: 'Craft Your Story',
      description: 'Create compelling stories about your craft and heritage',
      icon: '📖'
    });
  }

  // Pricing related
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || 
      lowerMessage.includes('value') || lowerMessage.includes('sell')) {
    actions.push({
      type: 'suggest_price',
      title: 'Smart Pricing',
      description: 'Get intelligent pricing recommendations for your products',
      icon: '💰'
    });
  }

  // Photography related
  if (lowerMessage.includes('photo') || lowerMessage.includes('image') || 
      lowerMessage.includes('picture') || lowerMessage.includes('camera')) {
    actions.push({
      type: 'enhance_photo',
      title: 'Photo Tips',
      description: 'Learn professional photography techniques for your products',
      icon: '📸'
    });
  }

  // Marketing related
  if (lowerMessage.includes('market') || lowerMessage.includes('customer') || 
      lowerMessage.includes('sell') || lowerMessage.includes('business')) {
    actions.push({
      type: 'marketing_tips',
      title: 'Marketing Strategy',
      description: 'Get targeted marketing advice for your craft business',
      icon: '📈'
    });
  }

  // General business advice
  if (lowerMessage.includes('grow') || lowerMessage.includes('expand') || 
      lowerMessage.includes('improve') || lowerMessage.includes('help')) {
    actions.push({
      type: 'business_advice',
      title: 'Business Growth',
      description: 'Comprehensive advice for growing your artisan business',
      icon: '🚀'
    });
  }

  return actions.slice(0, 3);
}

// Analyze if the AI response indicates more information is needed
function analyzeIfNeedsMoreInfo(content: string, userMessage: string): boolean {
  const lowerContent = content.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();
  
  // Check if the AI is asking follow-up questions
  if (lowerContent.includes('what kind of') || 
      lowerContent.includes('can you tell me more') ||
      lowerContent.includes('i need to know') ||
      lowerContent.includes('please provide more details') ||
      lowerContent.includes('to help you better') ||
      lowerContent.includes('to give you specific advice')) {
    return true;
  }
  
  // Check if user message is vague and needs clarification
  if (lowerMessage.includes('start a business') ||
      lowerMessage.includes('help me with') ||
      lowerMessage.includes('i need help') ||
      lowerMessage.includes('advice') ||
      lowerMessage.includes('tips')) {
    return true;
  }
  
  return false;
}

// Generate specific follow-up questions based on user message
function generateFollowUpQuestions(userMessage: string, language: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const questions: string[] = [];
  
  if (lowerMessage.includes('start a business') || lowerMessage.includes('business')) {
    if (language === 'hi') {
      questions.push('आप किस तरह का शिल्प करते हैं?');
      questions.push('आप कहाँ रहते हैं?');
      questions.push('क्या आपको इस काम में अनुभव है?');
    } else if (language === 'bn') {
      questions.push('আপনি কোন ধরনের কারুশিল্প করেন?');
      questions.push('আপনি কোথায় থাকেন?');
      questions.push('আপনার এই কাজে অভিজ্ঞতা আছে?');
    } else {
      questions.push('What type of craft or art form do you specialize in?');
      questions.push('Where are you located? (City/State)');
      questions.push('Do you have experience in this craft, or are you just starting?');
    }
  } else if (lowerMessage.includes('price') || lowerMessage.includes('pricing')) {
    if (language === 'hi') {
      questions.push('आप क्या बनाते हैं?');
      questions.push('आप किन सामग्रियों का उपयोग करते हैं?');
      questions.push('एक वस्तु बनाने में कितना समय लगता है?');
    } else if (language === 'bn') {
      questions.push('আপনি কী তৈরি করেন?');
      questions.push('আপনি কোন উপকরণ ব্যবহার করেন?');
      questions.push('একটি জিনিস তৈরি করতে কত সময় লাগে?');
    } else {
      questions.push('What specific products do you make?');
      questions.push('What materials do you use? (e.g., clay, wood, fabric, metal)');
      questions.push('How long does it typically take to make one item?');
    }
  } else if (lowerMessage.includes('marketing') || lowerMessage.includes('social media')) {
    if (language === 'hi') {
      questions.push('आपके पास कौन से उत्पाद हैं?');
      questions.push('आप किस ग्राहक समूह को लक्षित कर रहे हैं?');
      questions.push('क्या आप पहले से ही सोशल मीडिया का उपयोग कर रहे हैं?');
    } else if (language === 'bn') {
      questions.push('আপনার কী কী পণ্য আছে?');
      questions.push('আপনি কোন গ্রাহক গোষ্ঠীকে লক্ষ্য করছেন?');
      questions.push('আপনি কি ইতিমধ্যে সোশ্যাল মিডিয়া ব্যবহার করছেন?');
    } else {
      questions.push('What products do you want to market?');
      questions.push('Who is your target audience? (e.g., local customers, tourists, online buyers)');
      questions.push('Are you already using any social media platforms?');
    }
  } else {
    // Generic follow-up questions
    if (language === 'hi') {
      questions.push('क्या आप इस बारे में और विस्तार से बता सकते हैं?');
      questions.push('आपका मुख्य लक्ष्य क्या है?');
    } else if (language === 'bn') {
      questions.push('আপনি কি এই সম্পর্কে আরও বিস্তারিত দিতে পারেন?');
      questions.push('আপনার মূল লক্ষ্য কী?');
    } else {
      questions.push('Can you provide more specific details about what you need help with?');
      questions.push('What is your main goal or challenge?');
    }
  }
  
  return questions.slice(0, 2); // Reduced to 2 questions to avoid overwhelming
}

// Health check for AI service
export const handleAIHealth: RequestHandler = async (req, res) => {
  try {
    // Test Vertex AI connectivity
    const { model: aiModel } = await initializeVertexAI();
    const testResult = await aiModel.generateContent('Hello, this is a test.');
    const response = await testResult.response;
    
    // Check if we got a valid response
    let hasContent = false;
    if (typeof response.text === 'function') {
      hasContent = !!response.text();
    } else if (typeof response.text === 'string') {
      hasContent = !!response.text;
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      hasContent = !!response.candidates[0].content.parts[0].text;
    }
    
    if (hasContent) {
             res.json({ 
         status: 'healthy', 
         service: 'Vertex AI Gemini',
         message: 'AI service is operational',
         model: 'gemini-2.5-flash-lite'
       });
    } else {
      throw new Error('No response from AI model');
    }
  } catch (error) {
         res.status(503).json({ 
       status: 'unhealthy', 
       service: 'Vertex AI Gemini',
       error: error instanceof Error ? error.message : 'Unknown error',
       model: 'gemini-2.5-flash-lite'
     });
  }
};
