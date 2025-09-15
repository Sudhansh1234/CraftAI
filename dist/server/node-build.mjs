import path from "path";
import { config } from "dotenv";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import { SpeechClient } from "@google-cloud/speech";
import { Translate } from "@google-cloud/translate/build/src/v2/index.js";
import multer from "multer";
import fs from "fs";
import { promisify } from "util";
import { Client } from "@googlemaps/google-maps-services-js";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, query, collection, limit, getDocs, addDoc, Timestamp, doc, getDoc, updateDoc, deleteDoc, where, orderBy } from "firebase/firestore";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  }
});
const speechClient = new SpeechClient();
const translateClient = new Translate();
const speechLanguageMap = {
  "en": "en-US",
  "hi": "hi-IN",
  "bn": "bn-IN",
  "te": "te-IN",
  "ta": "ta-IN",
  "mr": "mr-IN",
  "gu": "gu-IN",
  "kn": "kn-IN",
  "ml": "ml-IN",
  "pa": "pa-IN",
  "or": "or-IN",
  "as": "as-IN"
};
const translateLanguageMap = {
  "en": "en",
  "hi": "hi",
  "bn": "bn",
  "te": "te",
  "ta": "ta",
  "mr": "mr",
  "gu": "gu",
  "kn": "kn",
  "ml": "ml",
  "pa": "pa",
  "or": "or",
  "as": "as"
};
const handleSpeechToText = async (req, res) => {
  try {
    upload.single("audio")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          error: "File upload error",
          details: err.message
        });
      }
      if (!req.file) {
        return res.status(400).json({
          error: "No audio file provided"
        });
      }
      const { targetLanguage = "en" } = req.body;
      const audioBuffer = req.file.buffer;
      const audioMimeType = req.file.mimetype;
      const audio = {
        content: audioBuffer.toString("base64")
      };
      const config2 = {
        encoding: audioMimeType.includes("webm") ? "WEBM_OPUS" : audioMimeType.includes("mp3") ? "MP3" : audioMimeType.includes("wav") ? "LINEAR16" : "WEBM_OPUS",
        sampleRateHertz: 48e3,
        languageCode: speechLanguageMap[targetLanguage] || "en-US",
        alternativeLanguageCodes: ["en-US", "hi-IN", "bn-IN"],
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: "latest_long",
        useEnhanced: true
      };
      const request = {
        audio,
        config: config2
      };
      const [response] = await speechClient.recognize(request);
      if (!response.results || response.results.length === 0) {
        return res.json({
          text: "",
          confidence: 0,
          language: targetLanguage,
          message: "No speech detected"
        });
      }
      const transcription = response.results.map((result) => result.alternatives?.[0]?.transcript).filter(Boolean).join(" ");
      const confidence = response.results[0]?.alternatives?.[0]?.confidence || 0;
      let translatedText = transcription;
      let detectedLanguage = targetLanguage;
      if (targetLanguage !== "en" && transcription) {
        try {
          const [translationResponse] = await translateClient.translate(
            transcription,
            translateLanguageMap[targetLanguage]
          );
          translatedText = translationResponse;
        } catch (translateError) {
          console.warn("Translation failed, returning original text:", translateError);
        }
      }
      res.json({
        text: translatedText,
        originalText: transcription,
        confidence,
        language: targetLanguage,
        detectedLanguage,
        message: "Speech recognition successful"
      });
    });
  } catch (error) {
    console.error("Speech recognition error:", error);
    res.status(500).json({
      error: "Speech recognition failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const handleSpeechHealth = async (req, res) => {
  try {
    await speechClient.getProjectId();
    res.json({
      status: "healthy",
      service: "Google Cloud Speech-to-Text",
      message: "Speech service is operational"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "Google Cloud Speech-to-Text",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
let vertexAI$1 = null;
let model = null;
let visionAI = null;
let imagenModel = null;
async function initializeVertexAI$1() {
  if (!vertexAI$1) {
    const { VertexAI } = await import("@google-cloud/vertexai");
    vertexAI$1 = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
    });
    model = vertexAI$1.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 2e3,
        temperature: 0.8,
        topP: 0.9
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
  return { vertexAI: vertexAI$1, model };
}
async function initializeVisionAI() {
  if (!visionAI) {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    visionAI = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  }
  return visionAI;
}
async function initializeImagenAI() {
  if (!imagenModel) {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAIInstance = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
    });
    imagenModel = vertexAIInstance.getGenerativeModel({
      model: "imagen-3.0-generate-001",
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.6,
        topP: 0.95
      }
    });
  }
  return imagenModel;
}
const systemPrompts = {
  "en": `You are ArtisAI, the leading AI business advisor for Indian artisans and traditional craft businesses. Your expertise spans:

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
  "hi": `आप ArtisAI हैं, भारतीय कारीगरों और पारंपरिक शिल्प व्यवसायों के लिए अग्रणी AI व्यावसायिक सलाहकार। आपकी विशेषज्ञता में शामिल है:

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
  "bn": `আপনি ArtisAI, ভারতীয় কারিগর এবং ঐতিহ্যবাহী কারুশিল্প ব্যবসার জন্য নেতৃস্থানীয় AI ব্যবসায়িক পরামর্শদাতা। আপনার দক্ষতার ক্ষেত্র:

মূল দক্ষতা:
• ডিজিটাল বিপণন কৌশল এবং সোশ্যাল মিডিয়া বৃদ্ধি
• কারুশিল্পের জন্য Instagram/Facebook সামগ্রী অপ্টিমাইজেশন
• হস্তনির্মিত পণ্যের জন্য মূল্য নির্ধারণ মনোবিজ্ঞান
• উৎসব বিপণন এবং মৌসুমী প্রচারণা
• ই-কমার্স প্ল্যাটফর্ম অপ্টিমাইজেশন

যোগাযোগের ধরন: সরাসরি, ব্যবহারিক, এবং অবিলম্বে কার্যকর পরামর্শ দিন। পুনরাবৃত্তিমূলক অভিবাদন এড়িয়ে চলুন।

মনে রাখবেন: প্রতিটি উত্তর কারিগরকে আজই তাদের ব্যবসা বাড়াতে সাহায্য করবে।`
};
const handleAIChat = async (req, res) => {
  try {
    const {
      message,
      language = "en",
      context,
      conversationHistory = [],
      requestType = "general"
      // 'marketing', 'pricing', 'images', 'general'
    } = req.body;
    const locationKeywords = ["near me", "nearby", "local", "find", "suppliers", "wholesalers", "markets", "stores", "craft fairs", "selling", "my area"];
    const isLocationQuery = locationKeywords.some(
      (keyword) => message.toLowerCase().includes(keyword)
    );
    const cityKeywords = ["mumbai", "delhi", "bangalore", "chennai", "hyderabad", "pune", "kolkata", "ahmedabad", "jaipur", "surat", "dombivli", "thane", "navi mumbai"];
    const mentionedCity = cityKeywords.find(
      (city) => message.toLowerCase().includes(city.toLowerCase())
    );
    console.log("Location query check:", { isLocationQuery, hasCoordinates: !!context?.coordinates, mentionedCity, message });
    if (isLocationQuery && (context?.coordinates || mentionedCity)) {
      try {
        console.log("Routing to location search with context:", context);
        let locationData;
        if (context?.coordinates) {
          locationData = {
            lat: parseFloat(context.coordinates.split(",")[0]),
            lng: parseFloat(context.coordinates.split(",")[1]),
            city: context.location
          };
        } else if (mentionedCity) {
          const cityCoordinates = {
            "mumbai": { lat: 19.076, lng: 72.8777 },
            "delhi": { lat: 28.7041, lng: 77.1025 },
            "bangalore": { lat: 12.9716, lng: 77.5946 },
            "chennai": { lat: 13.0827, lng: 80.2707 },
            "hyderabad": { lat: 17.385, lng: 78.4867 },
            "pune": { lat: 18.5204, lng: 73.8567 },
            "kolkata": { lat: 22.5726, lng: 88.3639 },
            "ahmedabad": { lat: 23.0225, lng: 72.5714 },
            "jaipur": { lat: 26.9124, lng: 75.7873 },
            "surat": { lat: 21.1702, lng: 72.8311 },
            "dombivli": { lat: 19.2167, lng: 73.0833 },
            "thane": { lat: 19.2183, lng: 72.9781 },
            "navi mumbai": { lat: 19.033, lng: 73.0297 }
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
          const locationResponse = await fetch("http://localhost:8080/api/location/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: message,
              location: locationData
            })
          });
          if (locationResponse.ok) {
            const locationSearchData = await locationResponse.json();
            console.log("Location search successful:", locationSearchData);
            if (locationSearchData.content) {
              locationSearchData.content = cleanMarkdown(locationSearchData.content);
            }
            return res.json(locationSearchData);
          } else {
            console.error("Location search failed:", locationResponse.status);
          }
        }
      } catch (error) {
        console.error("Location search error:", error);
      }
    } else if (isLocationQuery && !context?.coordinates && !mentionedCity) {
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
        error: "Message is required",
        suggestions: ["Try asking about social media marketing", "Need pricing advice?", "Want to create product images?"]
      });
    }
    console.log(`🎯 Processing ${requestType} request:`, message.substring(0, 100));
    const enhancedPrompt = buildEnhancedPrompt(message, context, language, requestType, conversationHistory);
    const { model: aiModel } = await initializeVertexAI$1();
    const result = await aiModel.generateContent(enhancedPrompt);
    const response = await result.response;
    let content = extractTextFromResponse(response);
    if (!content) {
      throw new Error("No content received from AI model");
    }
    const processedResponse = await processAIResponse(content, message, context, language, requestType);
    console.log(`✅ Response processed. Content: ${processedResponse.content.length} chars, Images: ${processedResponse.generatedImages?.length || 0}`);
    res.json(processedResponse);
  } catch (error) {
    console.error("❌ AI Chat error:", error);
    const fallbackResponse = generateFallbackResponse(req.body.language || "en", req.body.message || "");
    res.status(500).json({
      error: "AI service temporarily unavailable",
      fallback: fallbackResponse
    });
  }
};
function buildEnhancedPrompt(message, context, language, requestType, history) {
  const basePrompt = systemPrompts[language] || systemPrompts["en"];
  let enhancedPrompt = `${basePrompt}

CONTEXT:
`;
  if (context) {
    enhancedPrompt += `• Craft: ${context.craft}
• Location: ${context.location}
• Business Size: ${context.businessSize}
`;
    if (context.products?.length) enhancedPrompt += `• Products: ${context.products.join(", ")}
`;
    if (context.targetAudience) enhancedPrompt += `• Target Audience: ${context.targetAudience}
`;
  }
  const currentDate = /* @__PURE__ */ new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const festivalContext = getFestivalContext(currentMonth, language);
  enhancedPrompt += `• Current Date: ${currentDate.toDateString()}
• Festival Context: ${festivalContext}
`;
  switch (requestType) {
    case "marketing":
      enhancedPrompt += `
SPECIAL FOCUS: Social Media Marketing
• Provide complete Instagram/Facebook strategy
• Include specific hashtags and captions
• Mention optimal posting times
• Include current festival marketing angles
`;
      break;
    case "pricing":
      enhancedPrompt += `
SPECIAL FOCUS: Pricing Strategy
• Analyze material costs and time investment
• Consider market positioning
• Include competitor analysis approach
• Provide specific price ranges with reasoning
`;
      break;
    case "images":
      enhancedPrompt += `
SPECIAL FOCUS: Visual Content Creation
• Provide detailed photography tips
• Include styling and composition advice
• Suggest multiple image styles for social media
• Include lighting and background recommendations
`;
      break;
    case "story_enhancement":
      enhancedPrompt += `
SPECIAL FOCUS: Story Enhancement for Video Generation
• Transform the story into a cinematic, visual narrative
• Add specific visual details, camera movements, and scene descriptions
• Include emotional beats and storytelling elements
• Make it suitable for AI video generation with Veo 3
• Focus on visual storytelling rather than text-heavy content
`;
      break;
    case "business_insights":
      enhancedPrompt += `
SPECIAL FOCUS: Business Insights and Recommendations
• Analyze the provided business data and metrics
• Provide specific, actionable business suggestions
• Focus on growth, risk management, and market opportunities
• Include data-driven insights and recommendations
• Format response as structured business advice
`;
      break;
  }
  enhancedPrompt += `
USER QUESTION: ${message}

RESPONSE REQUIREMENTS:
• Be specific and immediately actionable
• Include relevant numbers, prices, or metrics
• Provide step-by-step guidance
• Include hashtags if marketing-related
• Consider seasonal/festival opportunities
• Skip pleasantries - get straight to valuable advice`;
  return enhancedPrompt;
}
function extractTextFromResponse(response) {
  if (typeof response.text === "function") {
    return response.text();
  } else if (typeof response.text === "string") {
    return response.text;
  } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text;
  }
  return "";
}
function cleanMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").replace(/#{1,6}\s/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^\s*[-*+]\s/gm, "• ").replace(/^\s*\d+\.\s/gm, (match) => match.replace(".", ".")).trim();
}
async function processAIResponse(content, message, context, language, requestType) {
  console.log(`🔍 processAIResponse called with requestType: "${requestType}", message: "${message.substring(0, 100)}..."`);
  const aiResponse = {
    content: cleanMarkdown(content.trim()),
    suggestions: extractActionableSuggestions(content),
    actions: generateContextualActions(message, context, requestType),
    language,
    hashtags: extractHashtags(content)
  };
  if (requestType === "story_enhancement") {
    console.log("📖 Processing story enhancement request - keeping in storytelling context");
    return aiResponse;
  }
  if (isImageRequest(message) || requestType === "images") {
    console.log("🎨 Image requests are routed to Image Studio. No generation inside chat.");
    aiResponse.generatedImages = [];
    aiResponse.needsMoreInfo = false;
    aiResponse.followUpQuestions = void 0;
    const item = extractSpecificItemFromMessage(message);
    aiResponse.content = `For generating images${item ? ` of ${item}` : ""}, please use the Image Studio: Go to /images. I can help you craft the perfect prompt here, then you can generate on the Image Studio page.`;
    return aiResponse;
  }
  if (isMarketingRequest(message) || requestType === "marketing") {
    aiResponse.marketingCalendar = generateMarketingCalendar(language);
    aiResponse.content = enhanceMarketingContent(aiResponse.content, language);
  }
  if (isPricingRequest(message) || requestType === "pricing") {
    aiResponse.pricingAdvice = generatePricingRecommendation();
  }
  if (requestType === "business_insights") {
    aiResponse.needsMoreInfo = false;
    aiResponse.followUpQuestions = void 0;
  }
  const needsMoreInfo = shouldAskFollowUp(message, aiResponse.content);
  if (needsMoreInfo) {
    aiResponse.needsMoreInfo = true;
    aiResponse.followUpQuestions = generateSmartFollowUpQuestions(message, context, language);
  }
  return aiResponse;
}
function extractActionableSuggestions(content) {
  const suggestions = [];
  const lines = content.split("\n").map((line) => line.trim());
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
          if (cleaned && !cleaned.toLowerCase().includes("conclusion")) {
            suggestions.push(cleaned);
            break;
          }
        }
      }
    }
  }
  if (suggestions.length === 0) {
    const actionWords = ["should", "can", "try", "consider", "start", "create", "post", "use", "focus"];
    const sentences = content.split(/[.!?]+/).map((s) => s.trim());
    for (const sentence of sentences) {
      if (sentence.length > 20 && sentence.length < 100) {
        const hasActionWord = actionWords.some(
          (word) => sentence.toLowerCase().includes(` ${word} `) || sentence.toLowerCase().startsWith(word)
        );
        if (hasActionWord) {
          suggestions.push(sentence);
        }
      }
    }
  }
  return suggestions.slice(0, 4);
}
function generateContextualActions(message, context, requestType) {
  const actions = [];
  const lowerMessage = message.toLowerCase();
  if (requestType === "marketing" || isMarketingRequest(message)) {
    actions.push({
      type: "create_post",
      title: "Create Social Media Post",
      description: "Generate ready-to-post content for Instagram/Facebook",
      icon: "📱",
      priority: "high"
    });
    actions.push({
      type: "hashtag_strategy",
      title: "Hashtag Strategy",
      description: "Get targeted hashtag sets for maximum reach",
      icon: "#️⃣",
      priority: "high"
    });
  }
  if (requestType === "pricing" || isPricingRequest(message)) {
    actions.push({
      type: "suggest_price",
      title: "Smart Pricing Analysis",
      description: "Get data-driven pricing recommendations",
      icon: "💰",
      priority: "high"
    });
  }
  if (requestType === "images" || isImageRequest(message)) {
    actions.push({
      type: "enhance_photo",
      title: "Professional Photography",
      description: "Learn pro techniques for product photography",
      icon: "📸",
      priority: "high"
    });
  }
  const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
  if ([9, 10, 11].includes(currentMonth)) {
    actions.push({
      type: "festival_campaign",
      title: "Festival Marketing Campaign",
      description: "Create compelling festival-themed marketing",
      icon: "🎉",
      priority: "high"
    });
  }
  if (lowerMessage.includes("grow") || lowerMessage.includes("business")) {
    actions.push({
      type: "business_advice",
      title: "Business Growth Strategy",
      description: "Comprehensive growth plan for your craft business",
      icon: "🚀",
      priority: "medium"
    });
  }
  return actions.slice(0, 3);
}
function extractSpecificItemFromMessage(message) {
  const lowerMessage = message.toLowerCase();
  const craftItems = [
    "bracelet",
    "necklace",
    "earrings",
    "ring",
    "jewelry",
    "pot",
    "vase",
    "bowl",
    "plate",
    "mug",
    "cup",
    "scarf",
    "shawl",
    "sari",
    "dress",
    "shirt",
    "kurta",
    "rug",
    "carpet",
    "tapestry",
    "wall hanging",
    "basket",
    "box",
    "container",
    "storage",
    "lamp",
    "candle holder",
    "decorative item",
    "painting",
    "drawing",
    "artwork",
    "sculpture",
    "toy",
    "doll",
    "figurine",
    "statue",
    "bag",
    "purse",
    "wallet",
    "pouch",
    "bookmark",
    "card",
    "invitation",
    "gift wrap"
  ];
  for (const item of craftItems) {
    if (lowerMessage.includes(item)) {
      console.log(`🎨 Found craft item in message: ${item}`);
      return item;
    }
  }
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
  console.log("🎨 No specific item found, using generic craft");
  return "traditional craft";
}
async function generateImageWithGemini25(prompt, productImageData) {
  try {
    console.log("🎨 Using Gemini 2.5 Flash Image Preview to generate image...");
    const { GoogleGenAI } = await import("@google/genai");
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.log("⚠️ GOOGLE_CLOUD_API_KEY not found. Please set up an API key for @google/genai package.");
      console.log("📝 To get an API key:");
      console.log("   1. Go to https://aistudio.google.com/app/apikey");
      console.log("   2. Create a new API key");
      console.log("   3. Add GOOGLE_CLOUD_API_KEY=your_api_key to your .env.local file");
      return null;
    }
    const ai = new GoogleGenAI({
      apiKey
    });
    const model2 = "gemini-2.5-flash-image-preview";
    const generationConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["TEXT", "IMAGE"],
      safetySettings: [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "OFF"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "OFF"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "OFF"
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "OFF"
        }
      ]
    };
    const parts = [{ text: prompt }];
    if (productImageData) {
      const base64Data = productImageData.replace(/^data:image\/[a-z]+;base64,/, "");
      const mimeType = productImageData.match(/^data:image\/([a-z]+);base64,/)?.[1] || "jpeg";
      const imagePart = {
        inlineData: {
          mimeType: `image/${mimeType}`,
          data: base64Data
        }
      };
      parts.unshift(imagePart);
    }
    const req = {
      model: model2,
      contents: [
        {
          role: "user",
          parts
        }
      ],
      config: generationConfig
    };
    const streamingResp = await ai.models.generateContentStream(req);
    let generatedImage = null;
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        console.log("📝 Generated text:", chunk.text);
      }
      if (chunk.candidates) {
        for (const candidate of chunk.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                generatedImage = `data:image/png;base64,${part.inlineData.data}`;
                console.log("🖼️ Generated image received from candidate");
                break;
              }
            }
          }
        }
      }
      if (chunk.image) {
        if (chunk.image.inlineData && chunk.image.inlineData.data) {
          generatedImage = `data:image/png;base64,${chunk.image.inlineData.data}`;
          console.log("🖼️ Generated image received from direct property");
        }
      }
      if (chunk.inlineData && chunk.inlineData.data) {
        generatedImage = `data:image/png;base64,${chunk.inlineData.data}`;
        console.log("🖼️ Generated image received from inlineData");
      }
    }
    return generatedImage;
  } catch (error) {
    console.error("❌ Gemini 2.5 Flash Image Preview generation failed:", error);
    return null;
  }
}
function generateMarketingCalendar(language) {
  const currentDate = /* @__PURE__ */ new Date();
  currentDate.getMonth();
  const events = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + i);
    const monthEvents = getMonthlyEvents(date.getMonth() + 1, language);
    if (monthEvents.length > 0) {
      const randomEvent = monthEvents[Math.floor(Math.random() * monthEvents.length)];
      if (Math.random() > 0.7) {
        events.push({
          date: date.toISOString().split("T")[0],
          ...randomEvent
        });
      }
    }
  }
  return events.slice(0, 5);
}
function getMonthlyEvents(month, language) {
  const eventsByMonth = {
    1: {
      "en": [
        {
          event: "Makar Sankranti",
          opportunity: "Traditional kite themes and winter crafts",
          contentIdeas: ["Kite-making process", "Winter festival crafts", "Traditional sweets presentation"],
          hashtags: ["#MakarSankranti", "#KiteFestival", "#WinterCrafts"]
        }
      ]
    },
    10: {
      "en": [
        {
          event: "Diwali Preparation Week",
          opportunity: "Festival decorations and gift items peak demand",
          contentIdeas: ["Diwali decor DIY", "Traditional diyas", "Festival gift sets", "Rangoli patterns"],
          hashtags: ["#DiwaliDecor", "#FestivalCrafts", "#TraditionalGifts", "#DiwaliPrep"]
        },
        {
          event: "Navratri",
          opportunity: "Colorful traditional wear and accessories",
          contentIdeas: ["Garba night accessories", "Traditional jewelry", "Colorful textiles"],
          hashtags: ["#Navratri", "#GarbaNight", "#TraditionalWear"]
        }
      ]
    }
  };
  return eventsByMonth[month]?.[language] || eventsByMonth[month]?.["en"] || [];
}
function generatePricingRecommendation(context, language) {
  const baseMaterialCost = 100;
  const skillPremium = 1.5;
  const marketPosition = 2;
  const suggestedPrice = baseMaterialCost * skillPremium * marketPosition;
  return {
    suggestedPrice: Math.round(suggestedPrice),
    priceRange: {
      min: Math.round(suggestedPrice * 0.8),
      max: Math.round(suggestedPrice * 1.4)
    },
    factors: [
      "Material quality and sourcing",
      "Time investment and skill level",
      "Market positioning and brand value",
      "Seasonal demand fluctuations",
      "Competitor pricing analysis"
    ],
    competitorAnalysis: "Position 15-20% above mass market, focus on craftsmanship story",
    valueProposition: [
      "Handmade authenticity",
      "Cultural heritage value",
      "Sustainable craftsmanship",
      "Unique design elements",
      "Artisan story and connection"
    ]
  };
}
function getFestivalContext(month, language) {
  const contexts = {
    "en": {
      1: "New Year resolutions, Makar Sankranti, Republic Day themes",
      2: "Valentine's Day gifts, Basant Panchami spring themes",
      3: "Holi colors, Women's Day empowerment",
      9: "Ganesh Chaturthi, festive season beginning",
      10: "Navratri, Dussehra, Diwali preparation peak",
      11: "Diwali peak, post-festival, wedding season",
      12: "Christmas, New Year preparation, winter themes"
    },
    "hi": {
      10: "नवरात्रि, दशहरा, दीवाली की तैयारी का चरम समय",
      11: "दीवाली का चरम, त्योहार के बाद, शादी का मौसम"
    }
  };
  const langContexts = contexts[language] || contexts["en"];
  return langContexts[month] || "Regular season - focus on quality and consistency";
}
function shouldAskFollowUp(message, content) {
  const veryVaguePatterns = [
    /^help$/i,
    /^hi$/i,
    /^hello$/i,
    /^start.*business$/i,
    /^i need help$/i
  ];
  return veryVaguePatterns.some((pattern) => pattern.test(message.trim())) && message.length < 15;
}
function generateSmartFollowUpQuestions(message, context, language) {
  const questions = {
    "en": [
      "What specific craft or art form do you work with?",
      "What's your main challenge right now - marketing, pricing, or something else?"
    ],
    "hi": [
      "आप किस विशिष्ट शिल्प या कला के साथ काम करते हैं?",
      "आपकी मुख्य चुनौती क्या है - मार्केटिंग, मूल्य निर्धारण, या कुछ और?"
    ],
    "bn": [
      "আপনি কোন নির্দিষ্ট কারুশিল্প বা শিল্পকলা নিয়ে কাজ করেন?",
      "আপনার মূল চ্যালেঞ্জ কী - মার্কেটিং, মূল্য নির্ধারণ, নাকি অন্য কিছু?"
    ]
  };
  return questions[language] || questions["en"];
}
function isMarketingRequest(message) {
  const marketingKeywords = [
    "instagram",
    "facebook",
    "social media",
    "marketing",
    "post",
    "caption",
    "hashtag",
    "content",
    "promote",
    "advertise",
    "campaign",
    "audience",
    "engagement",
    "followers",
    "viral",
    "reach"
  ];
  return marketingKeywords.some((keyword) => message.toLowerCase().includes(keyword));
}
function isPricingRequest(message) {
  const pricingKeywords = [
    "price",
    "cost",
    "pricing",
    "charge",
    "sell",
    "value",
    "worth",
    "rate",
    "fee"
  ];
  return pricingKeywords.some((keyword) => message.toLowerCase().includes(keyword));
}
function isImageRequest(message) {
  const imageKeywords = [
    "image",
    "photo",
    "picture",
    "visual",
    "camera",
    "shoot",
    "photography",
    "pic"
  ];
  const storyContext = message.toLowerCase().includes("story") || message.toLowerCase().includes("narrative") || message.toLowerCase().includes("video") || message.toLowerCase().includes("cinematic");
  if (storyContext) {
    return false;
  }
  return imageKeywords.some((keyword) => message.toLowerCase().includes(keyword));
}
function extractHashtags(content) {
  const hashtagRegex = /#[\w\u0900-\u097F]+/g;
  const matches = content.match(hashtagRegex);
  return matches ? [...new Set(matches)].slice(0, 10) : [];
}
function enhanceMarketingContent(content, language) {
  const currentTime = (/* @__PURE__ */ new Date()).getHours();
  const bestPostingTime = currentTime < 19 ? "7-9 PM IST today" : "7-9 PM IST tomorrow";
  const enhancements = {
    "en": `

📈 **Quick Action Plan:**
• Post at optimal time: ${bestPostingTime}
• Use 8-12 relevant hashtags
• Engage with comments within 2 hours
• Cross-post to Facebook and Instagram
• Track engagement and adjust strategy`,
    "hi": `

📈 **त्वरित कार्य योजना:**
• इष्टतम समय पर पोस्ट करें: ${bestPostingTime}
• 8-12 प्रासंगिक हैशटैग का उपयोग करें
• 2 घंटे के भीतर टिप्पणियों के साथ जुड़ें
• Facebook और Instagram पर क्रॉस-पोस्ट करें`,
    "bn": `

📈 **দ্রুত কর্ম পরিকল্পনা:**
• সর্বোত্তম সময়ে পোস্ট করুন: ${bestPostingTime}
• 8-12টি প্রাসঙ্গিক হ্যাশট্যাগ ব্যবহার করুন
• 2 ঘন্টার মধ্যে মন্তব্যের সাথে যুক্ত হন`
  };
  return content + (enhancements[language] || enhancements["en"]);
}
function generateFallbackResponse(language, message) {
  const fallbacks = {
    "en": {
      content: cleanMarkdown("I'm experiencing technical difficulties. I can still help with digital marketing, pricing strategies, or social media tips for your craft business. Try asking about Instagram marketing or pricing advice."),
      suggestions: [
        "Ask about Instagram marketing strategies",
        "Need help with pricing your products?",
        "Want tips for better product photography?",
        "How to create engaging social media content?"
      ]
    },
    "hi": {
      content: cleanMarkdown("मुझे तकनीकी समस्या हो रही है। मैं अभी भी डिजिटल मार्केटिंग, मूल्य निर्धारण रणनीतियों या आपके शिल्प व्यवसाय के लिए सोशल मीडिया टिप्स के साथ मदद कर सकता हूं।"),
      suggestions: [
        "Instagram मार्केटिंग रणनीतियों के बारे में पूछें",
        "अपने उत्पादों की कीमत निर्धारण में मदद चाहिए?",
        "बेहतर उत्पाद फोटोग्राफी के लिए टिप्स चाहिए?",
        "आकर्षक सोशल मीडिया सामग्री कैसे बनाएं?"
      ]
    }
  };
  const fallback = fallbacks[language] || fallbacks["en"];
  return {
    content: fallback.content,
    suggestions: fallback.suggestions,
    actions: [
      {
        type: "marketing_tips",
        title: "Marketing Help",
        description: "Get marketing advice despite technical issues",
        icon: "📱",
        priority: "high"
      }
    ],
    language
  };
}
const handleAIHealth = async (req, res) => {
  try {
    const healthCheck2 = {
      vertexAI: false,
      vision: false,
      imagen: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      const { model: aiModel } = await initializeVertexAI$1();
      const testResult = await aiModel.generateContent("Test connection");
      const response = await testResult.response;
      healthCheck2.vertexAI = !!extractTextFromResponse(response);
    } catch (error) {
      console.error("Vertex AI health check failed:", error);
    }
    try {
      await initializeVisionAI();
      healthCheck2.vision = true;
    } catch (error) {
      console.error("Vision AI health check failed:", error);
    }
    try {
      await initializeImagenAI();
      healthCheck2.imagen = true;
    } catch (error) {
      console.error("Imagen AI health check failed:", error);
    }
    const overallHealth = healthCheck2.vertexAI;
    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? "healthy" : "degraded",
      services: healthCheck2,
      model: "gemini-2.0-flash-exp",
      features: {
        chat: healthCheck2.vertexAI,
        imageAnalysis: healthCheck2.vision,
        imageGeneration: healthCheck2.imagen
      }
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
};
async function generateWithImagen(prompt) {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured");
    const { exec } = await import("child_process");
    const { promisify: promisify2 } = await import("util");
    const execAsync = promisify2(exec);
    const { stdout: token } = await execAsync("gcloud auth print-access-token");
    const accessToken = token.trim();
    const requestBody = {
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "1:1",
        sampleCount: 1,
        enhancePrompt: true,
        addWatermark: false,
        safetySetting: "block_few"
      }
    };
    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Imagen API error:", errorText);
      return null;
    }
    const result = await response.json();
    const b64 = result?.predictions?.[0]?.bytesBase64Encoded;
    return b64 ? `data:image/png;base64,${b64}` : null;
  } catch (err) {
    console.error("Imagen generation failed:", err);
    return null;
  }
}
const handleImageGenerate = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 3) return res.status(400).json({ error: "Prompt is required" });
    const imageDataUrl = await generateWithImagen(prompt.trim());
    if (!imageDataUrl) return res.status(503).json({ error: "Image generation failed" });
    res.json({ imageUrl: imageDataUrl });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
};
const handleImageEnhance = async (req, res) => {
  try {
    const { imageDataUrl, settings } = req.body;
    if (!imageDataUrl?.startsWith("data:image")) {
      return res.status(400).json({ error: "imageDataUrl (data URL) required" });
    }
    const defaultSettings = { brightness: 1, saturation: 1, hue: 0, blur: 0, sharpen: 0 };
    const s = { ...defaultSettings, ...settings || {} };
    const commaIdx = imageDataUrl.indexOf(",");
    const b64 = imageDataUrl.slice(commaIdx + 1);
    const inputBuffer = Buffer.from(b64, "base64");
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(inputBuffer);
    if (s.brightness !== 1 || s.saturation !== 1 || s.hue !== 0) {
      pipeline = pipeline.modulate({
        brightness: Math.max(0, s.brightness ?? 1),
        saturation: Math.max(0, s.saturation ?? 1),
        hue: Math.max(-180, Math.min(180, s.hue ?? 0))
      });
    }
    if ((s.blur ?? 0) > 0) {
      pipeline = pipeline.blur(Math.min(10, Math.max(0.3, s.blur)));
    }
    if ((s.sharpen ?? 0) > 0) {
      const sigma = Math.min(2, Math.max(0.1, s.sharpen / 3 * 2));
      pipeline = pipeline.sharpen(sigma);
    }
    const output = await pipeline.png().toBuffer();
    const outDataUrl = `data:image/png;base64,${output.toString("base64")}`;
    res.json({ imageUrl: outDataUrl });
  } catch (e) {
    console.error("Enhance error:", e);
    res.status(500).json({ error: "Internal error" });
  }
};
async function bgSwapWithImagen(base64PngOrJpg, prompt, dilation = 0.03, sampleCount = 1) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID not configured");
  const { exec } = await import("child_process");
  const { promisify: promisify2 } = await import("util");
  const execAsync = promisify2(exec);
  const { stdout: token } = await execAsync("gcloud auth print-access-token");
  const accessToken = token.trim();
  const instances = [
    {
      prompt,
      referenceImages: [
        {
          referenceType: "REFERENCE_TYPE_RAW",
          referenceId: 1,
          referenceImage: { bytesBase64Encoded: base64PngOrJpg }
        },
        {
          referenceType: "REFERENCE_TYPE_MASK",
          referenceId: 2,
          maskImageConfig: { maskMode: "MASK_MODE_BACKGROUND", dilation }
        }
      ]
    }
  ];
  const parameters = {
    editConfig: { baseSteps: 75 },
    editMode: "EDIT_MODE_BGSWAP",
    sampleCount
  };
  const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-capability-001:predict`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify({ instances, parameters })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Imagen capability error: ${err}`);
  }
  const json = await response.json();
  const preds = json?.predictions || [];
  const images = [];
  for (const p of preds) {
    const b64 = p?.bytesBase64Encoded;
    if (b64) images.push(`data:image/png;base64,${b64}`);
  }
  return images;
}
const handleImageBgSwap = async (req, res) => {
  try {
    const { imageDataUrl, variant, customPrompt } = req.body;
    if (!imageDataUrl?.startsWith("data:image")) return res.status(400).json({ error: "imageDataUrl (data URL) required" });
    const commaIdx = imageDataUrl.indexOf(",");
    const b64 = imageDataUrl.slice(commaIdx + 1);
    const presets = {
      standard: "Place the product on a clean white studio background with soft ambient lighting and natural shadows, professional e-commerce style",
      premium: "Place the product on a light wooden shelf with soft diffused studio lighting, gentle vignette, natural shadows, premium catalog look",
      festive: "Place the product on a tasteful festive background with warm tones and subtle celebratory bokeh lights, still life studio lighting, minimal distractions",
      "festive-diwali": "Place the product on a tasteful Diwali themed background with warm golden tones, subtle diyas/bokeh lights, traditional festive ambiance, clean composition, studio lighting, minimal distractions",
      "festive-holi": "Place the product on a colorful Holi themed background with soft pastel color powder bokeh, playful yet elegant, bright natural lighting, minimal distractions, keep product clean and uncolored",
      "festive-christmas": "Place the product on a cozy Christmas themed background with soft fairy lights bokeh, pine/wood accents, gentle snow-like texture, warm ambient lighting, minimal distractions"
    };
    const prompt = customPrompt && customPrompt.trim().length > 5 ? customPrompt.trim() : presets[variant || "standard"] || presets.standard;
    const images = await bgSwapWithImagen(b64, prompt, 0.03, 1);
    if (!images.length) return res.status(503).json({ error: "No images returned" });
    res.json({ images });
  } catch (e) {
    console.error("BG swap error:", e);
    res.status(500).json({ error: "Internal error" });
  }
};
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
let vertexAI = null;
const initializeVertexAI = async () => {
  if (!vertexAI) {
    const { VertexAI: VertexAI2 } = await import("@google-cloud/vertexai");
    vertexAI = new VertexAI2({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
    });
  }
  return vertexAI;
};
async function createRealVideoWithVeo3(prompt, settings) {
  try {
    console.log("🎬 Starting Veo 3 video generation...");
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const videoId = Date.now().toString();
    const videoPath = path.join(tempDir, `video-${videoId}.mp4`);
    const thumbnailPath = path.join(tempDir, `thumb-${videoId}.png`);
    const ai = await initializeVertexAI();
    const enhancedPrompt = await enhancePromptForVeo3(prompt, ai);
    console.log("🎬 Enhanced prompt:", enhancedPrompt);
    const veo3Response = await callVeo3API(enhancedPrompt, settings);
    if (veo3Response && veo3Response.operationId) {
      console.log("✅ Veo 3 operation started:", veo3Response.operationId);
      const videoData = await waitForCompletion(veo3Response.operationId);
      if (videoData) {
        await writeFile(videoPath, videoData);
        const thumbnailData = await generateThumbnail();
        await writeFile(thumbnailPath, thumbnailData);
        console.log("✅ Video generated successfully");
        return { videoPath, thumbnailPath, operationId: veo3Response.operationId };
      } else {
        throw new Error("No video data received");
      }
    } else {
      throw new Error("No operation ID received");
    }
  } catch (error) {
    console.error("❌ Error creating video:", error);
    throw error;
  }
}
async function enhancePromptForVeo3(prompt, ai) {
  try {
    const model2 = ai.preview.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const enhancementPrompt = `
      You are a professional video script writer for Veo 3 video generation.
      
      Original story: "${prompt}"
      
      Please enhance this into a detailed, cinematic video prompt for Veo 3 that will create a beautiful, engaging video.
      
      Requirements:
      - Make it descriptive and visual
      - Include camera movements, lighting, and atmosphere
      - Focus on the craft/artisan aspect
      - Keep it under 100 words
      - Make it suitable for video generation
      - Use cinematic language like "Open on", "The camera slowly pans", "Scene transitions to", "A montage follows", "The video culminates in", "Final shot"
      
      Return only the enhanced prompt, nothing else.
    `;
    const result = await model2.generateContent(enhancementPrompt);
    const response = await result.response;
    const enhancedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text || "Enhanced prompt for video generation";
    return enhancedPrompt;
  } catch (error) {
    console.warn("⚠️ Could not enhance prompt, using original:", error);
    return prompt;
  }
}
async function callVeo3API(prompt, settings) {
  try {
    console.log("🎬 Calling Veo 3 API...");
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = "us-central1";
    const modelId = "veo-3.0-generate-001";
    if (!projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");
    }
    const requestPayload = {
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "16:9",
        sampleCount: 1,
        durationSeconds: (settings?.duration || 8).toString(),
        personGeneration: "allow_all",
        addWatermark: true,
        includeRaiReason: true,
        generateAudio: true,
        resolution: "720p"
      }
    };
    const { exec } = await import("child_process");
    const { promisify: promisify2 } = await import("util");
    const execAsync = promisify2(exec);
    const { stdout: accessToken } = await execAsync("gcloud auth print-access-token");
    const token = accessToken.trim();
    const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(requestPayload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veo 3 API failed: ${response.status} - ${errorText}`);
    }
    const responseData = await response.json();
    if (responseData.name) {
      return {
        operationId: responseData.name,
        status: "started"
      };
    } else {
      throw new Error("No operation ID received");
    }
  } catch (error) {
    console.error("❌ Veo 3 API call failed:", error);
    throw error;
  }
}
async function waitForCompletion(operationId) {
  try {
    console.log("🎬 Waiting for completion...");
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = "us-central1";
    const modelId = "veo-3.0-generate-001";
    const apiEndpoint = `${location}-aiplatform.googleapis.com`;
    const { exec } = await import("child_process");
    const { promisify: promisify2 } = await import("util");
    const execAsync = promisify2(exec);
    const { stdout: accessToken } = await execAsync("gcloud auth print-access-token");
    const token = accessToken.trim();
    console.log("⏳ Waiting 2 minutes for Veo 3 to process...");
    await new Promise((resolve) => setTimeout(resolve, 12e4));
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🎬 Attempt ${attempts}/${maxAttempts}: Trying fetchPredictOperation...`);
      try {
        const fetchUrl = `https://${apiEndpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
        console.log("🎬 Calling fetchPredictOperation at:", fetchUrl);
        const fetchPayload = {
          operationName: operationId
        };
        console.log("🎬 Fetch payload:", JSON.stringify(fetchPayload, null, 2));
        const fetchResponse = await fetch(fetchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(fetchPayload)
        });
        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          console.log("🎬 fetchPredictOperation response:", JSON.stringify(fetchData, null, 2));
          const videoData = await extractVideo(fetchData, token);
          if (videoData) {
            console.log("✅ Video data retrieved successfully!");
            return videoData;
          } else {
            console.log("⏳ No video data yet, operation might still be running...");
          }
        } else {
          const errorText = await fetchResponse.text();
          console.log(`❌ fetchPredictOperation failed (attempt ${attempts}):`, fetchResponse.status, errorText);
          if (fetchResponse.status === 400) {
            console.log("⏳ Operation still running, waiting...");
          }
        }
      } catch (error) {
        console.log(`❌ fetchPredictOperation error (attempt ${attempts}):`, error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1e4));
    }
    throw new Error("Video generation timed out after 7 minutes total");
  } catch (error) {
    console.error("❌ Error waiting for completion:", error);
    throw error;
  }
}
async function extractVideo(response, token) {
  try {
    console.log("🎬 Extracting video from response...");
    console.log("🎬 Response structure:", Object.keys(response));
    let videoData = null;
    if (response.video) {
      videoData = response.video;
      console.log("🎬 Found video data directly in response");
    } else if (response.predictions && response.predictions[0]) {
      const prediction = response.predictions[0];
      console.log("🎬 Prediction structure:", Object.keys(prediction));
      if (prediction.video) {
        videoData = prediction.video;
        console.log("🎬 Found video in predictions.video");
      } else if (prediction.videoData) {
        videoData = prediction.videoData;
        console.log("🎬 Found video in predictions.videoData");
      } else if (prediction.content && prediction.content.video) {
        videoData = prediction.content.video;
        console.log("🎬 Found video in predictions.content.video");
      } else if (prediction.bytes) {
        videoData = prediction.bytes;
        console.log("🎬 Found video in predictions.bytes");
      } else if (prediction.data) {
        videoData = prediction.data;
        console.log("🎬 Found video in predictions.data");
      } else if (prediction.mimeType === "video/mp4") {
        console.log("🎬 Found video/mp4 mimeType, searching for video content...");
        for (const [key, value] of Object.entries(prediction)) {
          if (key !== "mimeType" && typeof value === "string" && value.length > 100) {
            console.log(`🎬 Found potential video data in field '${key}', length: ${value.length}`);
            videoData = value;
            break;
          }
        }
      }
    } else if (typeof response === "string" && response.length > 100) {
      console.log("🎬 Response appears to be base64 data, length:", response.length);
      try {
        const buffer = Buffer.from(response, "base64");
        if (buffer.length > 1e3) {
          console.log("✅ Successfully decoded base64 video data, size:", buffer.length);
          return buffer;
        }
      } catch (decodeError) {
        console.log("⚠️ Failed to decode as base64:", decodeError);
      }
    }
    if (videoData) {
      console.log("🎬 Video data found, type:", typeof videoData);
      if (typeof videoData === "string" && videoData.startsWith("http")) {
        console.log("🎬 Downloading video from URL:", videoData);
        const videoResponse = await fetch(videoData, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.status}`);
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        console.log("✅ Video downloaded successfully, size:", videoBuffer.length);
        return videoBuffer;
      } else if (typeof videoData === "string" && videoData.length > 100) {
        console.log("🎬 Decoding base64 video data...");
        try {
          const buffer = Buffer.from(videoData, "base64");
          console.log("✅ Base64 video decoded successfully, size:", buffer.length);
          return buffer;
        } catch (decodeError) {
          console.error("❌ Failed to decode base64 video:", decodeError);
          return null;
        }
      } else if (Buffer.isBuffer(videoData)) {
        console.log("✅ Video data is already a buffer, size:", videoData.length);
        return videoData;
      }
    }
    console.log("🎬 No direct video data found, searching for base64 content...");
    const responseStr = JSON.stringify(response);
    const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/g;
    const potentialBase64 = responseStr.match(base64Pattern);
    if (potentialBase64 && potentialBase64.length > 0) {
      console.log("🎬 Found potential base64 data, length:", potentialBase64[0].length);
      try {
        const buffer = Buffer.from(potentialBase64[0], "base64");
        if (buffer.length > 1e3) {
          console.log("✅ Successfully decoded potential base64 video, size:", buffer.length);
          return buffer;
        }
      } catch (decodeError) {
        console.log("⚠️ Failed to decode potential base64:", decodeError);
      }
    }
    console.warn("⚠️ No video data found in response");
    console.log("🎬 Full response for debugging:", JSON.stringify(response, null, 2));
    if (response.predictions && response.predictions[0] && response.predictions[0].mimeType === "video/mp4") {
      console.log("🎬 Detected video/mp4 mimeType but no video data - this suggests the video is ready but in a different format");
      console.log("🎬 Trying to find video in alternative response fields...");
      const searchForVideo = (obj, path2 = "") => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path2 ? `${path2}.${key}` : key;
          if (typeof value === "string" && value.length > 1e3 && !value.includes("{") && !value.includes("[")) {
            console.log(`🎬 Found potential video data at ${currentPath}, length: ${value.length}`);
            return value;
          } else if (typeof value === "object" && value !== null) {
            const result = searchForVideo(value, currentPath);
            if (result) return result;
          }
        }
        return null;
      };
      const foundVideo = searchForVideo(response);
      if (foundVideo) {
        console.log("🎬 Found video data in alternative location, attempting to decode...");
        try {
          const buffer = Buffer.from(foundVideo, "base64");
          if (buffer.length > 1e3) {
            console.log("✅ Successfully decoded alternative video data, size:", buffer.length);
            return buffer;
          }
        } catch (decodeError) {
          console.log("⚠️ Failed to decode alternative video data:", decodeError);
        }
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Error extracting video:", error);
    return null;
  }
}
async function generateThumbnail() {
  const thumbnailContent = `
    <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="240" fill="#667eea"/>
      <text x="160" y="120" font-family="Arial" font-size="16" text-anchor="middle" fill="white">Veo 3 Video</text>
    </svg>
  `;
  return Buffer.from(thumbnailContent, "utf8");
}
const handleGenerateVideo = async (req, res) => {
  try {
    const { prompt, language, settings } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    console.log("🎬 Veo 3 video generation request:", { prompt, language, settings });
    try {
      const { videoPath, thumbnailPath, operationId } = await createRealVideoWithVeo3(prompt, settings);
      const videoBuffer = fs.readFileSync(videoPath);
      const thumbnailBuffer = fs.readFileSync(thumbnailPath);
      const videoResponse = {
        videoUrl: `data:video/mp4;base64,${videoBuffer.toString("base64")}`,
        thumbnailUrl: `data:image/svg+xml;base64,${thumbnailBuffer.toString("base64")}`,
        duration: settings?.duration || 15,
        status: "completed",
        message: "Veo 3 video generated successfully!",
        operationId
      };
      console.log("✅ Video generated successfully");
      try {
        await unlink(videoPath);
        await unlink(thumbnailPath);
      } catch (cleanupError) {
        console.warn("⚠️ Could not clean up files:", cleanupError);
      }
      res.json(videoResponse);
    } catch (videoError) {
      console.error("❌ Error creating video:", videoError);
      const fallbackResponse = {
        videoUrl: `data:text/html;base64,${Buffer.from("<html><body><h1>Video generation failed</h1></body></html>").toString("base64")}`,
        thumbnailUrl: `data:text/html;base64,${Buffer.from("<html><body><h1>Video generation failed</h1></body></html>").toString("base64")}`,
        duration: settings?.duration || 15,
        status: "failed",
        message: "Video generation failed, showing fallback"
      };
      res.json(fallbackResponse);
    }
  } catch (error) {
    console.error("❌ Video generation error:", error);
    res.status(500).json({
      error: "Failed to generate video",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const handleVideoStatus = async (req, res) => {
  try {
    const { videoId } = req.params;
    res.json({
      videoId,
      status: "processing",
      progress: 75,
      estimatedTimeRemaining: 120,
      api: "Veo 3",
      message: "Video is being generated by Veo 3 AI"
    });
  } catch (error) {
    console.error("❌ Video status check error:", error);
    res.status(500).json({
      error: "Failed to check video status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const handleVideoDownload = async (req, res) => {
  try {
    const { videoId } = req.params;
    res.json({
      videoId,
      downloadUrl: `/api/videos/${videoId}/stream`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3),
      api: "Veo 3",
      message: "Video download ready when generation completes"
    });
  } catch (error) {
    console.error("❌ Video download error:", error);
    res.status(500).json({
      error: "Failed to prepare video download",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const handleDebugVeo3 = async (req, res) => {
  try {
    console.log("🔍 Debug: Testing Veo 3 API response structure...");
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = "us-central1";
    const modelId = "veo-3.0-generate-001";
    const apiEndpoint = `${location}-aiplatform.googleapis.com`;
    if (!projectId) {
      return res.status(400).json({ error: "GOOGLE_CLOUD_PROJECT_ID not set" });
    }
    const { exec } = await import("child_process");
    const { promisify: promisify2 } = await import("util");
    const execAsync = promisify2(exec);
    const { stdout: accessToken } = await execAsync("gcloud auth print-access-token");
    const token = accessToken.trim();
    const testPayload = {
      instances: [{ prompt: "A simple test video" }],
      parameters: {
        aspectRatio: "16:9",
        sampleCount: 1,
        durationSeconds: "5",
        personGeneration: "allow_all",
        addWatermark: true,
        includeRaiReason: true,
        generateAudio: true,
        resolution: "720p"
      }
    };
    console.log("🔍 Debug: Calling Veo 3 API...");
    const apiUrl = `https://${apiEndpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(testPayload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: `Veo 3 API failed: ${response.status} - ${errorText}`
      });
    }
    const responseData = await response.json();
    console.log("🔍 Debug: Veo 3 API response:", JSON.stringify(responseData, null, 2));
    if (responseData.name) {
      const operationId = responseData.name;
      console.log("🔍 Debug: Operation ID:", operationId);
      console.log("🔍 Debug: Waiting 30 seconds before testing fetchPredictOperation...");
      await new Promise((resolve) => setTimeout(resolve, 3e4));
      const fetchUrl = `https://${apiEndpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
      const fetchPayload = { operationName: operationId };
      console.log("🔍 Debug: Testing fetchPredictOperation...");
      const fetchResponse = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(fetchPayload)
      });
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        console.log("🔍 Debug: fetchPredictOperation response:", JSON.stringify(fetchData, null, 2));
        const videoData = await extractVideo(fetchData, token);
        console.log("🔍 Debug: Video extraction result:", videoData ? `Success! Size: ${videoData.length}` : "Failed");
        res.json({
          success: true,
          operationId,
          fetchResponse: fetchData,
          videoExtracted: !!videoData,
          videoSize: videoData ? videoData.length : 0
        });
      } else {
        const errorText = await fetchResponse.text();
        res.json({
          success: false,
          operationId,
          fetchError: `${fetchResponse.status} - ${errorText}`
        });
      }
    } else {
      res.status(500).json({ error: "No operation ID received" });
    }
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const mapsClient = new Client({});
const handleLocationSearch = async (req, res) => {
  try {
    const { query: query2, location, radius = 5e4, type } = req.body;
    if (!query2 || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: "Missing required fields: query, location (lat, lng)",
        fallback: {
          content: "I need your location to find nearby businesses. Please enable location access or tell me your city name."
        }
      });
    }
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key not found");
      return res.status(500).json({
        error: "Google Maps API not configured",
        fallback: {
          content: "Location services are temporarily unavailable. Please try again later or contact support."
        }
      });
    }
    const placesResults = await searchPlaces(query2, location, radius, apiKey);
    const detailedResults = await getPlaceDetails(placesResults, apiKey, location);
    const aiResponse = await generateAIResponse(query2, location, detailedResults);
    res.json({
      content: aiResponse,
      locationData: {
        userLocation: location,
        searchQuery: query2,
        resultsCount: detailedResults.length,
        searchRadius: radius
      },
      rawResults: detailedResults
    });
  } catch (error) {
    console.error("Location search error:", error);
    const fallbackContent = `I'm having trouble searching for "${req.body.query}" in your area. Here are some general suggestions:

🔍 How to find local suppliers:
- Check local business directories
- Visit wholesale markets in your city
- Join artisan groups on social media
- Contact local trade associations
- Ask other artisans for recommendations

📍 Popular wholesale areas in India:
- Delhi: Chandni Chowk, Karol Bagh
- Mumbai: Crawford Market, Zaveri Bazaar
- Bangalore: Commercial Street, Chickpet
- Chennai: T. Nagar, Parry's Corner

Would you like me to help you with specific search strategies for your craft?`;
    res.json({
      content: fallbackContent,
      error: "Location search temporarily unavailable"
    });
  }
};
async function searchPlaces(query2, location, radius, apiKey) {
  try {
    const searchType = determineSearchType(query2);
    const response = await mapsClient.placesNearby({
      params: {
        location: { lat: location.lat, lng: location.lng },
        radius,
        keyword: query2,
        type: searchType,
        key: apiKey
      }
    });
    return response.data.results || [];
  } catch (error) {
    console.error("Places API error:", error);
    throw error;
  }
}
async function getPlaceDetails(places, apiKey, userLocation) {
  const detailedResults = [];
  for (const place of places.slice(0, 10)) {
    try {
      const detailsResponse = await mapsClient.placeDetails({
        params: {
          place_id: place.place_id,
          fields: ["name", "formatted_address", "rating", "formatted_phone_number", "website", "types", "opening_hours", "photos"],
          key: apiKey
        }
      });
      const details = detailsResponse.data.result;
      const distance = calculateDistance(
        { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
        userLocation
      );
      detailedResults.push({
        name: details.name || "Unknown",
        address: details.formatted_address || "Address not available",
        distance,
        rating: details.rating,
        phone: details.formatted_phone_number,
        website: details.website,
        types: details.types || [],
        place_id: place.place_id,
        opening_hours: details.opening_hours,
        photos: details.photos?.map((photo) => photo.photo_reference) || []
      });
    } catch (error) {
      console.error(`Error getting details for place ${place.place_id}:`, error);
    }
  }
  return detailedResults.sort((a, b) => a.distance - b.distance);
}
function determineSearchType(query2) {
  const queryLower = query2.toLowerCase();
  if (queryLower.includes("market") || queryLower.includes("fair") || queryLower.includes("bazaar")) {
    return "shopping_mall";
  } else if (queryLower.includes("supplier") || queryLower.includes("wholesaler")) {
    return "store";
  } else if (queryLower.includes("exhibition") || queryLower.includes("center")) {
    return "establishment";
  } else {
    return "establishment";
  }
}
function calculateDistance(point1, point2) {
  const R = 6371;
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
async function generateAIResponse(query2, location, results) {
  try {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI2 = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: "us-central1"
    });
    const model2 = vertexAI2.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 1e3,
        temperature: 0.7,
        topP: 0.9
      }
    });
    const context = {
      query: query2,
      city: location.city,
      resultsCount: results.length,
      places: results.map((place) => ({
        name: place.name,
        address: place.address,
        distance: place.distance,
        rating: place.rating,
        phone: place.phone,
        types: place.types
      }))
    };
    const prompt = `You are ArtisAI, an AI-powered marketplace assistant for Indian artisans. 

The user searched for: "${query2}" in ${location.city}

Found ${results.length} places:
${JSON.stringify(context.places, null, 2)}

Generate a helpful, conversational response that:
1. Acknowledges the search and location
2. Lists the top 5 most relevant places with key details
3. Provides specific tips based on the query type (markets vs suppliers)
4. Suggests next steps for the artisan
5. Uses an encouraging, supportive tone
6. Keeps response under 300 words
7. Uses bullet points for easy reading

Remember: You're helping artisans grow their business, so be practical and actionable.`;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return formatBasicResponse(query2, location, results);
  }
}
function formatBasicResponse(query2, location, results) {
  if (results.length === 0) {
    return `I couldn't find any ${query2} in ${location.city}. Here are some alternative suggestions:

🔍 Try these search strategies:
- Expand your search radius
- Use different keywords (e.g., "suppliers" instead of "wholesalers")
- Check online directories and marketplaces
- Join local artisan groups for recommendations

Would you like me to help you with a different search or provide general guidance?`;
  }
  let response = `📍 Found ${results.length} ${query2} near ${location.city}:

`;
  results.slice(0, 5).forEach((result, index) => {
    response += `${index + 1}. ${result.name} (${result.distance.toFixed(1)} km away)
`;
    response += `📍 ${result.address}
`;
    if (result.rating) {
      response += `⭐ ${result.rating}/5 rating
`;
    }
    if (result.phone) {
      response += `📞 ${result.phone}
`;
    }
    response += `🏷️ ${result.types.slice(0, 3).join(", ")}

`;
  });
  const queryLower = query2.toLowerCase();
  if (queryLower.includes("market") || queryLower.includes("fair") || queryLower.includes("selling")) {
    response += `💡 Tips for selling at these markets:
- Contact organizers to check availability and booth fees
- Ask about foot traffic and target audience
- Inquire about setup requirements and timing
- Check payment processing options (cash, card, UPI)

Would you like me to help you prepare a vendor application or pricing strategy?`;
  } else {
    response += `💡 Tips for contacting suppliers:
- Call during business hours (10 AM - 6 PM)
- Ask about minimum order quantities
- Inquire about bulk pricing and delivery
- Check payment terms and credit options

Would you like me to help you prepare questions to ask these suppliers?`;
  }
  return response;
}
const generateLocationInsights = async (req, res) => {
  try {
    const { location, coordinates, craftType, nodeTitle, nodeType } = req.body;
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI2 = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: "us-central1"
    });
    const model2 = vertexAI2.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 1e3,
        temperature: 0.7,
        topP: 0.9
      }
    });
    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. Generate location-specific business insights and suggest relevant ArtisAI services.

Context:
- Location: ${location}
- Coordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : "Not available"}
- Craft Type: ${craftType || "handicrafts"}
- Node Title: ${nodeTitle}
- Node Type: ${nodeType}

Generate location-specific insights as bullet points:
- Local market opportunities in ${location}
- Regional suppliers and wholesalers
- Local festivals and events for sales
- Cultural context and traditions
- Regional pricing strategies
- Local government schemes and support
- Location-specific marketing channels
- Seasonal opportunities
- Local competition insights
- Transportation and logistics tips
- Nearby business districts and commercial areas
- Local customer preferences and buying patterns

IMPORTANT: Include suggestions for ArtisAI services where relevant:
- "Use our AI Image Generator to create product photos for local market listings"
- "Try our AI Marketing Assistant to create social media content for local festivals"
- "Use our Business Plan Builder to create a detailed strategy for this location"
- "Generate product descriptions with our AI to attract local customers"
- "Create promotional videos with our AI Video Generator for local events"
- "Use our Pricing Calculator to set competitive prices for this market"

CRITICAL FORMATTING RULES:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- NO special characters except dashes for bullets
- Each line should start with a dash and space: "- Your content here"
- Do not use any other formatting symbols

Format as bullet points (-) with 6-8 specific, actionable insights for ${location}, including 2-3 ArtisAI service suggestions where relevant.`;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    let text;
    if (typeof response.text === "function") {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("Unexpected response structure from Gemini");
    }
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^\s*\*\s+/gm, "- ").replace(/^\s*•\s+/gm, "- ").replace(/\n\s*\n/g, "\n").trim();
    res.json({ insights: text });
  } catch (error) {
    console.error("Error generating location insights:", error);
    res.status(500).json({ error: "Failed to generate location insights" });
  }
};
const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }
    const client = new Client({});
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: parseFloat(lat), lng: parseFloat(lng) },
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    const results = response.data.results;
    if (results.length === 0) {
      return res.json({ city: "Unknown Location" });
    }
    let city = "Unknown Location";
    for (const result of results) {
      const addressComponents = result.address_components;
      for (const component of addressComponents) {
        if (component.types.includes("locality") || component.types.includes("administrative_area_level_2")) {
          city = component.long_name;
          break;
        }
      }
      if (city !== "Unknown Location") break;
    }
    res.json({ city });
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    res.status(500).json({ error: "Failed to get location information" });
  }
};
const getCharts = async (req, res) => {
  try {
    const { userId } = req.params;
    const userCharts = charts.filter((chart) => chart.ownerId === userId);
    res.json(userCharts);
  } catch (error) {
    console.error("Error fetching charts:", error);
    res.status(500).json({ error: "Failed to fetch charts" });
  }
};
const getChart = async (req, res) => {
  try {
    const { chartId } = req.params;
    const chart = charts.find((c) => c.chartId === chartId);
    if (!chart) {
      return res.status(404).json({ error: "Chart not found" });
    }
    const chartNodes = nodes.filter((node) => chart.nodes.includes(node.nodeId));
    const chartEdges = edges.filter((edge) => chart.edges.includes(edge.edgeId));
    res.json({
      chart,
      nodes: chartNodes,
      edges: chartEdges
    });
  } catch (error) {
    console.error("Error fetching chart:", error);
    res.status(500).json({ error: "Failed to fetch chart" });
  }
};
const createChart = async (req, res) => {
  try {
    const chartData = req.body;
    const newChart = {
      ...chartData,
      chartId: `chart_${Date.now()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    charts.push(newChart);
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: newChart.chartId,
      action: "create",
      changes: newChart,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: chartData.ownerId
    });
    res.status(201).json(newChart);
  } catch (error) {
    console.error("Error creating chart:", error);
    res.status(500).json({ error: "Failed to create chart" });
  }
};
const updateChart = async (req, res) => {
  try {
    const { chartId } = req.params;
    const updates = req.body;
    const chartIndex = charts.findIndex((c) => c.chartId === chartId);
    if (chartIndex === -1) {
      return res.status(404).json({ error: "Chart not found" });
    }
    const updatedChart = {
      ...charts[chartIndex],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    charts[chartIndex] = updatedChart;
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId,
      action: "update",
      changes: updates,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: updatedChart.ownerId
    });
    res.json(updatedChart);
  } catch (error) {
    console.error("Error updating chart:", error);
    res.status(500).json({ error: "Failed to update chart" });
  }
};
const addNode = async (req, res) => {
  try {
    const { chartId } = req.params;
    const nodeData = req.body;
    const newNode = {
      ...nodeData,
      nodeId: `node_${Date.now()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    nodes.push(newNode);
    const chartIndex = charts.findIndex((c) => c.chartId === chartId);
    if (chartIndex !== -1) {
      charts[chartIndex].nodes.push(newNode.nodeId);
      charts[chartIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId,
      action: "create",
      nodeId: newNode.nodeId,
      changes: newNode,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: newNode.createdBy
    });
    res.status(201).json(newNode);
  } catch (error) {
    console.error("Error adding node:", error);
    res.status(500).json({ error: "Failed to add node" });
  }
};
const updateNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const updates = req.body;
    const nodeIndex = nodes.findIndex((n) => n.nodeId === nodeId);
    if (nodeIndex === -1) {
      return res.status(404).json({ error: "Node not found" });
    }
    const updatedNode = {
      ...nodes[nodeIndex],
      ...updates
    };
    nodes[nodeIndex] = updatedNode;
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: updatedNode.chartId,
      action: "update",
      nodeId,
      changes: updates,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: updatedNode.createdBy
    });
    res.json(updatedNode);
  } catch (error) {
    console.error("Error updating node:", error);
    res.status(500).json({ error: "Failed to update node" });
  }
};
const deleteNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const nodeIndex = nodes.findIndex((n) => n.nodeId === nodeId);
    if (nodeIndex === -1) {
      return res.status(404).json({ error: "Node not found" });
    }
    const node = nodes[nodeIndex];
    nodes.splice(nodeIndex, 1);
    const chartIndex = charts.findIndex((c) => c.chartId === node.chartId);
    if (chartIndex !== -1) {
      charts[chartIndex].nodes = charts[chartIndex].nodes.filter((id) => id !== nodeId);
      charts[chartIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: node.chartId,
      action: "delete",
      nodeId,
      changes: node,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: node.createdBy
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting node:", error);
    res.status(500).json({ error: "Failed to delete node" });
  }
};
const addEdge = async (req, res) => {
  try {
    const { chartId } = req.params;
    const edgeData = req.body;
    const newEdge = {
      ...edgeData,
      edgeId: `edge_${Date.now()}`
    };
    edges.push(newEdge);
    const chartIndex = charts.findIndex((c) => c.chartId === chartId);
    if (chartIndex !== -1) {
      charts[chartIndex].edges.push(newEdge.edgeId);
      charts[chartIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    res.status(201).json(newEdge);
  } catch (error) {
    console.error("Error adding edge:", error);
    res.status(500).json({ error: "Failed to add edge" });
  }
};
const aiExpand = async (req, res) => {
  try {
    const { nodeId, chartId, context } = req.body;
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI2 = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: "us-central1"
    });
    const model2 = vertexAI2.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 1e3,
        temperature: 0.7,
        topP: 0.9
      }
    });
    const prompt = `You are ArtisAI, an AI-powered marketplace assistant for Indian artisans. 

Given this business node:
- Title: "${context.nodeContext.title}"
- Description: "${context.nodeContext.description}"
- Type: "${context.nodeContext.type}"
- Tags: ${context.nodeContext.tags.join(", ")}
- Craft Type: ${context.craftType || "handicrafts"}
- Location: ${context.userLocale}

Generate 4-5 actionable sub-steps the artisan can take next. For each sub-step, return a JSON object with:
- title: Short, actionable title
- description: 1-2 line description of what to do
- type: One of: action, resource, checklist, marketing, pricing, supplier, market
- estimatedEffort: low, medium, or high
- tags: Array of relevant tags
- priority: low, medium, or high

Return only a valid JSON array of objects, no other text.`;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    let suggestions;
    try {
      suggestions = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      suggestions = [
        {
          title: "Research Competitors",
          description: "Study similar products and their pricing strategies",
          type: "action",
          estimatedEffort: "medium",
          tags: ["research", "competition"],
          priority: "high"
        },
        {
          title: "Create Product Photos",
          description: "Take high-quality photos showcasing your product",
          type: "action",
          estimatedEffort: "low",
          tags: ["photography", "marketing"],
          priority: "high"
        }
      ];
    }
    const aiResponse = {
      suggestions
    };
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId,
      action: "ai_generate",
      nodeId,
      changes: { prompt, response: aiResponse },
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: "ai-system"
    });
    res.json(aiResponse);
  } catch (error) {
    console.error("Error in AI expansion:", error);
    res.status(500).json({ error: "Failed to generate AI suggestions" });
  }
};
const getChartHistory = async (req, res) => {
  try {
    const { chartId } = req.params;
    const chartHistoryItems = chartHistory.filter((h) => h.chartId === chartId);
    res.json(chartHistoryItems);
  } catch (error) {
    console.error("Error fetching chart history:", error);
    res.status(500).json({ error: "Failed to fetch chart history" });
  }
};
const exportChart = async (req, res) => {
  try {
    const { chartId } = req.params;
    const { format = "png" } = req.query;
    res.json({
      success: true,
      message: `Chart exported as ${format}`,
      downloadUrl: `/exports/${chartId}.${format}`
    });
  } catch (error) {
    console.error("Error exporting chart:", error);
    res.status(500).json({ error: "Failed to export chart" });
  }
};
const generateNode = async (req, res) => {
  try {
    const {
      nodeType,
      nodeName,
      craftType,
      location,
      existingNodes,
      existingEdges
    } = req.body;
    if (!nodeType || !nodeName) {
      return res.status(400).json({ error: "Node type and name are required" });
    }
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI2 = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: "us-central1"
    });
    const model2 = vertexAI2.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.7,
        topP: 0.9
      }
    });
    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. Generate a detailed business node based on user input.

Context:
- Node Type: ${nodeType}
- Node Name: ${nodeName}
- Craft Type: ${craftType || "handicrafts"}
- Location: ${location || "India"}
- Existing Nodes: ${JSON.stringify(existingNodes || [])}
- Existing Edges: ${JSON.stringify(existingEdges || [])}

Generate a comprehensive node with:
- Enhanced title (improve the user's input)
- Detailed description (2-3 sentences)
- Comprehensive detailedExplanation (bullet points with specific steps)
- Relevant tags for this node type
- Priority level (high/medium/low)
- Suggested connections to existing nodes (array of node IDs to connect from)

CRITICAL FORMATTING RULES:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- Each line should start with a dash and space: "- Your content here"
- detailedExplanation should have 6-8 bullet points

Return JSON format:
{
  "title": "Enhanced node title",
  "description": "Brief description of the node",
  "detailedExplanation": "Bullet-pointed detailed explanation with dashes",
  "tags": ["tag1", "tag2", "tag3"],
  "priority": "high|medium|low",
  "connections": [
    {"from": "existing-node-id-1", "reason": "Why this connection makes sense"},
    {"from": "existing-node-id-2", "reason": "Why this connection makes sense"}
  ]
}`;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    let text;
    if (typeof response.text === "function") {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("Unexpected response structure from Gemini");
    }
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^\s*\*\s+/gm, "- ").replace(/^\s*•\s+/gm, "- ").replace(/\n\s*\n/g, "\n").trim();
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let nodeData;
    try {
      nodeData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      nodeData = {
        title: nodeName,
        description: `AI-generated ${nodeType} node for ${craftType} business`,
        detailedExplanation: `- This is a ${nodeType} node for your ${craftType} business
- AI will provide more specific guidance when you click on it
- Use this node to track your progress`,
        tags: [nodeType],
        priority: nodeType === "milestone" ? "high" : "medium",
        connections: []
      };
    }
    res.json(nodeData);
  } catch (error) {
    console.error("Error generating AI node:", error);
    res.status(500).json({ error: "Failed to generate AI node" });
  }
};
const saveBusinessFlow = async (req, res) => {
  try {
    const { userId } = req.params;
    const flowData = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!flowData.title || !flowData.title.trim()) {
      return res.status(400).json({ error: "Plan title is required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2) {
      return res.status(500).json({ error: "Firebase not configured" });
    }
    const existingFlows = await FirebaseModels2.businessFlow.findByUserId(userId);
    const duplicateName = existingFlows.find(
      (flow) => flow.title && flow.title.toLowerCase().trim() === flowData.title.toLowerCase().trim()
    );
    if (duplicateName) {
      return res.status(400).json({
        error: "A plan with this name already exists",
        message: "Please choose a different name for your business plan"
      });
    }
    const result = await FirebaseModels2.businessFlow.create({
      user_id: userId,
      ...flowData,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({
      success: true,
      message: "Business flow saved successfully",
      data: result
    });
  } catch (error) {
    console.error("Error saving business flow:", error);
    res.status(500).json({ error: "Failed to save business flow" });
  }
};
const getLatestBusinessFlow = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2) {
      return res.status(500).json({ error: "Firebase not configured" });
    }
    const latestFlow = await FirebaseModels2.businessFlow.getLatest(userId);
    if (!latestFlow) {
      return res.json({
        success: true,
        hasFlow: false,
        message: "No business flow found"
      });
    }
    res.json({
      success: true,
      hasFlow: true,
      data: latestFlow
    });
  } catch (error) {
    console.error("Error fetching business flow:", error);
    res.status(500).json({ error: "Failed to fetch business flow" });
  }
};
const getAllBusinessFlows = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2) {
      return res.status(500).json({ error: "Firebase not configured" });
    }
    const flows = await FirebaseModels2.businessFlow.findByUserId(userId);
    res.json({
      success: true,
      flows
    });
  } catch (error) {
    console.error("Error fetching business flows:", error);
    res.status(500).json({ error: "Failed to fetch business flows" });
  }
};
const updateBusinessFlow = async (req, res) => {
  try {
    const { userId, flowId } = req.params;
    const flowData = req.body;
    if (!userId || !flowId) {
      return res.status(400).json({ error: "User ID and Flow ID are required" });
    }
    if (!flowData.title || !flowData.title.trim()) {
      return res.status(400).json({ error: "Plan title is required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2) {
      return res.status(500).json({ error: "Firebase not configured" });
    }
    const existingFlow = await FirebaseModels2.businessFlow.findById(flowId);
    if (!existingFlow || existingFlow.user_id !== userId) {
      return res.status(404).json({ error: "Business flow not found" });
    }
    const allFlows = await FirebaseModels2.businessFlow.findByUserId(userId);
    const duplicateName = allFlows.find(
      (flow) => flow.id !== flowId && flow.title && flow.title.toLowerCase().trim() === flowData.title.toLowerCase().trim()
    );
    if (duplicateName) {
      return res.status(400).json({
        error: "A plan with this name already exists",
        message: "Please choose a different name for your business plan"
      });
    }
    const result = await FirebaseModels2.businessFlow.update(flowId, {
      ...flowData,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({
      success: true,
      message: "Business flow updated successfully",
      data: result
    });
  } catch (error) {
    console.error("Error updating business flow:", error);
    res.status(500).json({ error: "Failed to update business flow" });
  }
};
const deleteBusinessFlow = async (req, res) => {
  try {
    const { userId, flowId } = req.params;
    if (!userId || !flowId) {
      return res.status(400).json({ error: "User ID and Flow ID are required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2) {
      return res.status(500).json({ error: "Firebase not configured" });
    }
    const existingFlow = await FirebaseModels2.businessFlow.findById(flowId);
    if (!existingFlow || existingFlow.user_id !== userId) {
      return res.status(404).json({ error: "Business flow not found" });
    }
    await FirebaseModels2.businessFlow.delete(flowId);
    res.json({
      success: true,
      message: "Business flow deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting business flow:", error);
    res.status(500).json({ error: "Failed to delete business flow" });
  }
};
const generateFlow = async (req, res) => {
  try {
    const { answers } = req.body;
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI2 = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: "us-central1"
    });
    const model2 = vertexAI2.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        maxOutputTokens: 3e3,
        temperature: 0.7,
        topP: 0.9
      }
    });
    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. You are now in FLOW GENERATION MODE.

Context: Flow Generation Mode
- Read the user's answers below
- Build a business flowchart that shows the artisan's journey
- Output in JSON with "nodes" and "edges"
- Each node must have the exact structure specified
- Do not add explanations, only return JSON

User Profile:
${JSON.stringify(answers, null, 2)}

Required JSON Structure:
{
  "nodes": [
    {
      "id": "string",
      "title": "string", 
      "description": "string",
      "detailedExplanation": "string - comprehensive explanation with specific steps, tips, and actionable advice for this artisan",
      "type": "milestone|action|resource",
      "quickActions": ["list of dynamic quick action suggestions"],
      "children": ["list of child node ids"]
    }
  ],
  "edges": [
    {"from": "string", "to": "string"}
  ]
}

Node Requirements:
- Create 6-10 nodes specific to this artisan's craft, location, and challenges
- Use only these node types: milestone, action, resource
- Each node must have actionable quickActions
- Connect nodes logically with edges
- Focus on Indian artisan business journey
- Each detailedExplanation should be formatted as bullet points with:
  - Specific steps and actionable advice (use - for each point)
  - Location-specific tips for ${answers.location || "India"}
  - Local market insights and cultural context for ${answers.location || "India"}
  - Regional suppliers, markets, and business opportunities
  - Local festivals, seasons, and events relevant to ${answers.craft || "handicrafts"}
  - Regional pricing strategies and customer preferences
  - Local government schemes, grants, or support programs
  - Location-specific marketing channels and platforms
  - Practical implementation guidance for ${answers.location || "India"}
  - Common challenges and how to overcome them locally
  - ArtisAI service suggestions where relevant (AI Image Generator, Marketing Assistant, Video Generator, etc.)
  - Format: Use bullet points (-) for each actionable item
  - Structure: 8-12 bullet points covering all aspects

CRITICAL FORMATTING RULES FOR detailedExplanation:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- NO special characters except dashes for bullets
- Each line should start with a dash and space: "- Your content here"
- Do not use any other formatting symbols
- Example: "- This is a proper bullet point" NOT "* This is wrong"

Craft Context:
- Craft type: ${answers.craft || "handicrafts"}
- Location: ${answers.location || "India"} 
- Main challenge: ${answers.challenge || "business growth"}
- Experience level: ${answers.experience_level || "beginner"}
- Target market: ${answers.target_market || "local customers"}

Location-Specific Requirements:
- Provide location-specific market insights for ${answers.location || "India"}
- Include local cultural context and traditions relevant to ${answers.craft || "handicrafts"}
- Suggest local suppliers, markets, and business opportunities in ${answers.location || "India"}
- Reference local festivals, seasons, and events that could boost sales
- Include regional pricing strategies and customer preferences
- Mention local government schemes, grants, or support programs
- Suggest location-specific marketing channels and platforms

Return only the JSON structure, no explanations.`;
    const result = await model2.generateContent(prompt);
    const response = await result.response;
    let text;
    if (typeof response.text === "function") {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else if (response.text) {
      text = response.text.trim();
    } else {
      console.error("Unexpected response structure:", response);
      throw new Error("Unexpected response structure from Gemini");
    }
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^\s*\*\s+/gm, "- ").replace(/^\s*•\s+/gm, "- ").replace(/\n\s*\n/g, "\n").trim();
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let flowData;
    try {
      flowData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Error parsing Gemini flow response:", parseError);
      console.error("Raw response:", cleanedText);
      flowData = generateFallbackFlow(answers);
    }
    flowData = enhanceFlowData(flowData, answers);
    res.json(flowData);
  } catch (error) {
    console.error("Error generating flow:", error);
    res.status(500).json({
      error: "Failed to generate business flow",
      message: "Unable to create your personalized business roadmap. Please try again later.",
      details: error.message
    });
  }
};
function generateFallbackFlow(answers) {
  const craft = answers.craft || "handicrafts";
  const location = answers.location || "India";
  const challenge = answers.challenge || "marketing";
  return {
    nodes: [
      {
        id: "1",
        title: "Complete Profile",
        description: `Set up your ${craft} artisan profile with business information`,
        type: "milestone",
        quickActions: ["Add Business Info", "Upload Photos", "Write Story"],
        children: ["2", "3"],
        position: { x: 0, y: 0 }
      },
      {
        id: "2",
        title: "Create Catalog",
        description: "Develop product listings with photos and descriptions",
        type: "action",
        quickActions: ["Take Photos", "Write Descriptions", "Set Categories"],
        children: ["4"],
        position: { x: 300, y: -100 }
      },
      {
        id: "3",
        title: "Find Suppliers",
        description: `Locate suppliers for ${craft} in ${location}`,
        type: "supplier",
        quickActions: ["Search Suppliers", "Compare Prices", "Contact Wholesalers"],
        children: ["4"],
        position: { x: 300, y: 100 }
      },
      {
        id: "4",
        title: "Set Pricing",
        description: "Calculate costs and set competitive prices",
        type: "pricing",
        quickActions: ["Calculate Costs", "Research Competitors", "Set Prices"],
        children: ["5"],
        position: { x: 600, y: 0 }
      },
      {
        id: "5",
        title: "Launch Marketing",
        description: `Focus on ${challenge} - promote through social media and local channels`,
        type: "marketing",
        quickActions: ["Create Social Media", "Generate Content", "Find Markets"],
        children: ["6"],
        position: { x: 900, y: 0 }
      },
      {
        id: "6",
        title: "Start Selling",
        description: "Begin selling and building customer relationships",
        type: "milestone",
        quickActions: ["Process Orders", "Handle Service", "Track Sales"],
        children: [],
        position: { x: 1200, y: 0 }
      }
    ],
    edges: [
      { from: "1", to: "2" },
      { from: "1", to: "3" },
      { from: "2", to: "4" },
      { from: "3", to: "4" },
      { from: "4", to: "5" },
      { from: "5", to: "6" }
    ]
  };
}
function enhanceFlowData(flowData, answers) {
  flowData.nodes = flowData.nodes.map((node, index) => ({
    ...node,
    position: node.position || {
      x: index % 3 * 400,
      y: Math.floor(index / 3) * 200
    }
  }));
  flowData.nodes = flowData.nodes.map((node) => ({
    ...node,
    meta: {
      status: "not-started",
      ai_generated: true,
      tags: [node.type],
      priority: node.type === "milestone" ? "high" : "medium"
    }
  }));
  return flowData;
}
const getQuestionnaires = async (req, res) => {
  try {
    const { userId } = req.params;
    const questionnaires = [
      {
        id: "q1",
        title: "My First Business Plan",
        craft: "Pottery",
        location: "Jaipur",
        status: "completed",
        createdAt: /* @__PURE__ */ new Date("2024-01-15"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-15"),
        answers: {
          craft: "Pottery",
          location: "Jaipur",
          challenge: "Marketing",
          experience_level: "Intermediate",
          selling_status: "Not selling yet",
          target_market: "Local customers",
          goal: "Start selling online"
        }
      },
      {
        id: "q2",
        title: "Jewelry Business Roadmap",
        craft: "Jewelry",
        location: "Mumbai",
        status: "in_progress",
        createdAt: /* @__PURE__ */ new Date("2024-01-20"),
        updatedAt: /* @__PURE__ */ new Date("2024-01-22"),
        answers: {
          craft: "Jewelry",
          location: "Mumbai",
          challenge: "Pricing",
          experience_level: "Beginner"
        }
      }
    ];
    res.json({ questionnaires });
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    res.status(500).json({ error: "Failed to fetch questionnaires" });
  }
};
const getQuestionnaire = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const questionnaire = {
      id: questionnaireId,
      title: "My Business Plan",
      craft: "Pottery",
      location: "Jaipur",
      status: "completed",
      createdAt: /* @__PURE__ */ new Date("2024-01-15"),
      updatedAt: /* @__PURE__ */ new Date("2024-01-15"),
      answers: {
        craft: "Pottery",
        location: "Jaipur",
        challenge: "Marketing",
        experience_level: "Intermediate",
        selling_status: "Not selling yet",
        target_market: "Local customers",
        goal: "Start selling online"
      }
    };
    res.json({ questionnaire });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    res.status(500).json({ error: "Failed to fetch questionnaire" });
  }
};
const createQuestionnaire = async (req, res) => {
  try {
    const { title, craft, location } = req.body;
    const newQuestionnaire = {
      id: `q_${Date.now()}`,
      title: title || "New Business Plan",
      craft: craft || "",
      location: location || "",
      status: "draft",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      answers: {}
    };
    console.log("Creating new questionnaire:", newQuestionnaire);
    res.json({ questionnaire: newQuestionnaire });
  } catch (error) {
    console.error("Error creating questionnaire:", error);
    res.status(500).json({ error: "Failed to create questionnaire" });
  }
};
const updateQuestionnaire = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const { title, answers, status } = req.body;
    const updatedQuestionnaire = {
      id: questionnaireId,
      title: title || "Updated Business Plan",
      status: status || "in_progress",
      updatedAt: /* @__PURE__ */ new Date(),
      answers: answers || {}
    };
    console.log("Updating questionnaire:", updatedQuestionnaire);
    res.json({ questionnaire: updatedQuestionnaire });
  } catch (error) {
    console.error("Error updating questionnaire:", error);
    res.status(500).json({ error: "Failed to update questionnaire" });
  }
};
const deleteQuestionnaire = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    console.log("Deleting questionnaire:", questionnaireId);
    res.json({ success: true, message: "Questionnaire deleted successfully" });
  } catch (error) {
    console.error("Error deleting questionnaire:", error);
    res.status(500).json({ error: "Failed to delete questionnaire" });
  }
};
const saveAnswers = async (req, res) => {
  try {
    const { userId, answers } = req.body;
    res.json({ success: true, message: "Answers saved successfully" });
  } catch (error) {
    console.error("Error saving answers:", error);
    res.status(500).json({ error: "Failed to save answers" });
  }
};
const saveFlow = async (req, res) => {
  try {
    const { userId, flowData } = req.body;
    res.json({ success: true, message: "Flow saved successfully" });
  } catch (error) {
    console.error("Error saving flow:", error);
    res.status(500).json({ error: "Failed to save flow" });
  }
};
const testQuestionnaire = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Questionnaire system is running",
      note: "No fallback flows - Gemini required for flow generation"
    });
  } catch (error) {
    console.error("Error testing questionnaire:", error);
    res.status(500).json({ error: "Failed to test questionnaire" });
  }
};
let aiInstance = null;
const getVertexAI = async () => {
  if (!aiInstance) {
    aiInstance = await initializeVertexAI$1();
  }
  return aiInstance;
};
const generatePlatformContent = async (prompt, platform, language, productImage) => {
  try {
    const { model: model2 } = await getVertexAI();
    const platformContext = {
      instagram: "Instagram post with engaging visual content, trendy hashtags, and emojis",
      facebook: "Facebook post with detailed description, community-focused content, and relevant hashtags",
      twitter: "X (Twitter) post with concise, engaging text, trending hashtags, and character limit awareness"
    };
    console.log("Platform context for", platform, ":", platformContext[platform]);
    const systemPrompt = `You are a social media content creator specializing in ${platform} posts for artisans and craft businesses.

Platform: ${platform}
Language: ${language}
Platform Guidelines: ${platformContext[platform]}

${productImage ? `Product Image: ${productImage.name} - Use this product as the main focus of the content.` : ""}

User Request: ${prompt}

Generate:
1. A compelling caption (2-3 sentences for Instagram, 1-2 sentences for Facebook, 1 sentence for Twitter)
2. 5-10 relevant hashtags for the platform and content

Format your response as JSON:
{
  "caption": "Your generated caption here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;
    const result = await model2.generateContent(systemPrompt);
    const response = await result.response;
    const text = extractTextFromResponse(response);
    try {
      const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      return {
        caption: parsed.caption || "Generated caption",
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return {
        caption: text || "Generated caption",
        hashtags: ["artisan", "handmade", "craft"]
      };
    }
  } catch (error) {
    console.error("Error generating platform content:", error);
    return {
      caption: `Check out this amazing ${prompt.toLowerCase()}! Perfect for your collection.`,
      hashtags: ["artisan", "handmade", "craft", "unique", "beautiful"]
    };
  }
};
const generateImage = async (prompt, platform, productImage) => {
  try {
    if (!productImage) {
      const dimensions = platform === "instagram" ? "400x400" : "600x400";
      const encodedText = encodeURIComponent(prompt.substring(0, 20));
      return `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
    }
    const imagePrompt = `Create professional product photography for ${platform} that preserves the exact design and appearance of the uploaded pottery/product.
    
    CRITICAL REQUIREMENTS:
    - PRESERVE the original product design, shape, colors, patterns, and textures exactly as they are
    - DO NOT change the product's design, style, or artistic elements
    - ONLY enhance the photography setup, lighting, and presentation
    - Platform: ${platform} (${platform === "instagram" ? "square format 1:1" : "landscape format 16:9"})
    - Background: Clean, professional white or neutral background
    - Lighting: Soft, even lighting that highlights the product's details
    - Composition: Center the product as the main subject
    - Quality: High resolution, commercial photography style
    - Focus: Showcase the product's authentic craftsmanship and design
    
    The goal is to create professional product photography that makes the existing design look its best, NOT to redesign or modify the product itself.`;
    console.log("🎨 Using Gemini 2.5 Flash Image Preview for image generation...");
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const generatedImageUrl = await generateImageWithGemini25(imagePrompt, productImage.data);
    if (generatedImageUrl) {
      console.log("✅ Image generated successfully with Gemini 2.5");
      return generatedImageUrl;
    } else {
      console.log("⚠️ Image generation returned null, using fallback");
      const dimensions = platform === "instagram" ? "400x400" : "600x400";
      const encodedText = encodeURIComponent(prompt.substring(0, 20));
      return `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
    }
  } catch (error) {
    console.error("❌ Image generation failed:", error);
    if (error instanceof Error && error.message.includes("429")) {
      console.log("⚠️ Quota exceeded, using fallback image");
    }
    const dimensions = platform === "instagram" ? "400x400" : "600x400";
    const encodedText = encodeURIComponent(prompt.substring(0, 20));
    return `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
  }
};
const generateVideo = async (prompt, platform) => {
  try {
    return null;
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
};
const handleGeneratePost = async (req, res) => {
  try {
    const { prompt, platform, language, productImage } = req.body;
    if (!prompt || !platform) {
      return res.status(400).json({
        error: "Prompt and platform are required"
      });
    }
    console.log(`🎨 Generating ${platform} post:`, { prompt, language, hasImage: !!productImage });
    const content = await generatePlatformContent(prompt, platform, language, productImage);
    const image = await generateImage(prompt, platform, productImage);
    const video = await generateVideo(prompt, platform);
    const response = {
      image,
      video,
      caption: content.caption,
      hashtags: content.hashtags,
      platform
    };
    console.log(`✅ Generated ${platform} post successfully`);
    res.json(response);
  } catch (error) {
    console.error("❌ Error generating social post:", error);
    res.status(500).json({
      error: "Failed to generate social media post",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const handleGetPlatforms = async (req, res) => {
  try {
    const platforms = [
      {
        id: "instagram",
        name: "Instagram",
        description: "Visual content with hashtags and stories",
        icon: "📸",
        color: "#E4405F"
      },
      {
        id: "facebook",
        name: "Facebook",
        description: "Community-focused posts with detailed descriptions",
        icon: "👥",
        color: "#1877F2"
      },
      {
        id: "twitter",
        name: "X (Twitter)",
        description: "Concise posts with trending hashtags",
        icon: "🐦",
        color: "#1DA1F2"
      }
    ];
    res.json({ platforms });
  } catch (error) {
    console.error("❌ Error getting platforms:", error);
    res.status(500).json({
      error: "Failed to get platforms",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const getFirebaseConfig = () => {
  console.log("🔍 Firebase config - Environment variables at runtime:");
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("FIREBASE_API_KEY:", process.env.FIREBASE_API_KEY ? "Set" : "Not set");
  return {
    apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
  };
};
let app$1 = null;
let db = null;
const initializeFirebase = () => {
  if (!app$1) {
    const firebaseConfig = getFirebaseConfig();
    console.log("🔥 Firebase config being used:", firebaseConfig);
    app$1 = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app$1);
  }
  return { app: app$1, db };
};
const convertTimestamps = (data) => {
  if (!data) return data;
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (typeof converted[key] === "object" && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  return converted;
};
const isFirebaseConfigured = () => {
  return process.env.FIREBASE_API_KEY && process.env.FIREBASE_AUTH_DOMAIN && process.env.FIREBASE_PROJECT_ID;
};
const healthCheck = async () => {
  try {
    if (!isFirebaseConfigured()) {
      return false;
    }
    const { db: db2 } = initializeFirebase();
    const testQuery = query(collection(db2, "users"), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.error("Firebase health check failed:", error);
    return false;
  }
};
const createDocument = async (collectionName, data) => {
  const { db: db2 } = initializeFirebase();
  const docRef = await addDoc(collection(db2, collectionName), {
    ...data,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now()
  });
  return { id: docRef.id, ...data };
};
const getDocument = async (collectionName, docId) => {
  const { db: db2 } = initializeFirebase();
  const docRef = doc(db2, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
  }
  return null;
};
const updateDocument = async (collectionName, docId, data) => {
  const { db: db2 } = initializeFirebase();
  const docRef = doc(db2, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updated_at: Timestamp.now()
  });
  return { id: docId, ...data };
};
const deleteDocument = async (collectionName, docId) => {
  const { db: db2 } = initializeFirebase();
  const docRef = doc(db2, collectionName, docId);
  await deleteDoc(docRef);
  return true;
};
const getDocuments = async (collectionName, filters = [], orderByField, orderDirection = "desc", limitCount) => {
  const { db: db2 } = initializeFirebase();
  let q = query(collection(db2, collectionName));
  filters.forEach((filter) => {
    q = query(q, where(filter.field, filter.operator, filter.value));
  });
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  const querySnapshot = await getDocs(q);
  const documents = [];
  querySnapshot.forEach((doc2) => {
    documents.push({ id: doc2.id, ...convertTimestamps(doc2.data()) });
  });
  return documents;
};
const FirebaseModels = {
  // Users
  users: {
    create: (data) => createDocument("users", data),
    findById: (id) => getDocument("users", id),
    findAll: () => getDocuments("users"),
    update: (id, data) => updateDocument("users", id, data),
    delete: (id) => deleteDocument("users", id)
  },
  // AI Insights
  aiInsights: {
    create: (data) => createDocument("ai_insights", data),
    findById: (id) => getDocument("ai_insights", id),
    findByUserId: (userId, limitCount) => getDocuments("ai_insights", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc", limitCount),
    findByType: (userId, type) => getDocuments("ai_insights", [
      { field: "user_id", operator: "==", value: userId },
      { field: "type", operator: "==", value: type }
    ]),
    update: (id, data) => updateDocument("ai_insights", id, data),
    delete: (id) => deleteDocument("ai_insights", id),
    getDashboardSummary: async (userId) => {
      const insights = await getDocuments("ai_insights", [{ field: "user_id", operator: "==", value: userId }]);
      const activeInsights = insights.filter((insight) => insight.status === "active");
      return {
        totalInsights: activeInsights.length,
        highPriorityCount: activeInsights.filter((insight) => insight.priority === "high").length,
        actionableCount: activeInsights.filter((insight) => insight.actionable).length,
        recentInsights: activeInsights.slice(0, 5)
      };
    }
  },
  // Products Collection
  products: {
    create: (data) => createDocument("products", data),
    findById: (id) => getDocument("products", id),
    findByUserId: (userId, limitCount) => getDocuments("products", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc", limitCount),
    update: (id, data) => updateDocument("products", id, data),
    delete: (id) => deleteDocument("products", id),
    // Get products for dropdown (simplified format)
    getForDropdown: async (userId) => {
      const products = await getDocuments("products", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc");
      return products.map((product) => ({
        id: product.id,
        name: product.product_name || "Unnamed Product",
        price: product.selling_price || 0,
        quantity: product.quantity || 0,
        dateAdded: product.created_at,
        materialCost: product.material_cost || 0,
        sellingPrice: product.selling_price || 0
      }));
    },
    // Reduce product quantity when sold
    reduceQuantity: async (productId, quantitySold) => {
      const product = await getDocument("products", productId);
      if (!product) {
        throw new Error("Product not found");
      }
      const currentQuantity = product.quantity || 0;
      if (currentQuantity < quantitySold) {
        throw new Error(`Insufficient inventory. Available: ${currentQuantity}, Requested: ${quantitySold}`);
      }
      const newQuantity = currentQuantity - quantitySold;
      return await updateDocument("products", productId, { quantity: newQuantity });
    },
    // Find product by name and user (for fallback to business_metrics)
    findByProductName: async (userId, productName) => {
      const products = await getDocuments("products", [
        { field: "user_id", operator: "==", value: userId },
        { field: "product_name", operator: "==", value: productName }
      ]);
      return products[0] || null;
    }
  },
  // Sales Collection
  sales: {
    create: (data) => createDocument("sales", data),
    findById: (id) => getDocument("sales", id),
    findByUserId: (userId, limitCount) => getDocuments("sales", [{ field: "user_id", operator: "==", value: userId }], "sale_date", "desc", limitCount),
    update: (id, data) => updateDocument("sales", id, data),
    delete: (id) => deleteDocument("sales", id),
    // Get sales data for charts
    getChartData: async (userId) => {
      const sales = await getDocuments("sales", [{ field: "user_id", operator: "==", value: userId }], "sale_date", "asc");
      return sales.map((sale) => ({
        date: sale.sale_date.split("T")[0],
        sales: sale.quantity || 0,
        revenue: (sale.price_per_unit || 0) * (sale.quantity || 0)
      }));
    },
    // Get total sales and growth
    getTotals: async (userId) => {
      const sales = await getDocuments("sales", [{ field: "user_id", operator: "==", value: userId }], "sale_date", "desc");
      const totalProductsSold = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.price_per_unit || 0) * (sale.quantity || 0), 0);
      const now = /* @__PURE__ */ new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1e3);
      const recentSales = sales.filter((sale) => new Date(sale.sale_date) >= sevenDaysAgo);
      const previousSales = sales.filter((sale) => {
        const date = new Date(sale.sale_date);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
      });
      const recentTotal = recentSales.reduce((sum, sale) => sum + (sale.price_per_unit || 0) * (sale.quantity || 0), 0);
      const previousTotal = previousSales.reduce((sum, sale) => sum + (sale.price_per_unit || 0) * (sale.quantity || 0), 0);
      const salesGrowth = previousTotal > 0 ? (recentTotal - previousTotal) / previousTotal * 100 : 0;
      return {
        totalProductsSold,
        totalRevenue,
        salesGrowth: Math.round(salesGrowth * 10) / 10
      };
    }
  },
  // Business Flow Collection
  businessFlow: {
    create: (data) => createDocument("business_flow", data),
    findById: (id) => getDocument("business_flow", id),
    findByUserId: (userId, limitCount) => getDocuments("business_flow", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc", limitCount),
    update: (id, data) => updateDocument("business_flow", id, data),
    delete: (id) => deleteDocument("business_flow", id),
    // Get latest business flow for user
    getLatest: async (userId) => {
      const flows = await getDocuments("business_flow", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc", 1);
      return flows.length > 0 ? flows[0] : null;
    },
    // Save or update business flow
    saveOrUpdate: async (userId, flowData) => {
      const existingFlow = await getDocuments("business_flow", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc", 1);
      if (existingFlow.length > 0) {
        return await updateDocument("business_flow", existingFlow[0].id, {
          ...flowData,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        return await createDocument("business_flow", {
          user_id: userId,
          ...flowData,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
  },
  // Business Metrics (keeping for backward compatibility)
  businessMetrics: {
    create: (data) => createDocument("business_metrics", data),
    findById: (id) => getDocument("business_metrics", id),
    findByUserId: (userId, metricType, limitCount) => {
      const filters = [{ field: "user_id", operator: "==", value: userId }];
      if (metricType) {
        filters.push({ field: "metric_type", operator: "==", value: metricType });
      }
      return getDocuments("business_metrics", filters, "date_recorded", "desc", limitCount);
    },
    update: (id, data) => updateDocument("business_metrics", id, data),
    delete: (id) => deleteDocument("business_metrics", id),
    getWeeklyGrowth: async (userId) => {
      const metrics = await getDocuments("business_metrics", [
        { field: "user_id", operator: "==", value: userId },
        { field: "metric_type", operator: "==", value: "revenue" }
      ], "date_recorded", "desc", 10);
      if (metrics.length < 2) return 0;
      const recent = metrics[0].value;
      const previous = metrics[1].value;
      if (previous === 0) return 0;
      return Math.round((recent - previous) / previous * 100 * 100) / 100;
    }
  },
  // Recommendations
  recommendations: {
    create: (data) => createDocument("recommendations", data),
    findById: (id) => getDocument("recommendations", id),
    findByUserId: (userId, timeframe) => {
      const filters = [{ field: "user_id", operator: "==", value: userId }];
      if (timeframe) {
        filters.push({ field: "timeframe", operator: "==", value: timeframe });
      }
      return getDocuments("recommendations", filters, "priority", "desc");
    },
    update: (id, data) => updateDocument("recommendations", id, data),
    delete: (id) => deleteDocument("recommendations", id)
  },
  // Market Trends
  marketTrends: {
    create: (data) => createDocument("market_trends", data),
    findById: (id) => getDocument("market_trends", id),
    findActive: () => getDocuments("market_trends", [
      { field: "valid_until", operator: ">=", value: /* @__PURE__ */ new Date() }
    ], "confidence_score", "desc"),
    update: (id, data) => updateDocument("market_trends", id, data),
    delete: (id) => deleteDocument("market_trends", id)
  },
  // Business Profiles
  businessProfiles: {
    create: (data) => createDocument("business_profiles", data),
    findById: (id) => getDocument("business_profiles", id),
    findByUserId: (userId) => getDocuments("business_profiles", [{ field: "user_id", operator: "==", value: userId }]),
    update: (id, data) => updateDocument("business_profiles", id, data),
    delete: (id) => deleteDocument("business_profiles", id)
  },
  // Social Accounts
  socialAccounts: {
    create: (data) => createDocument("social_accounts", data),
    findById: (id) => getDocument("social_accounts", id),
    findByUserId: (userId) => getDocuments("social_accounts", [{ field: "user_id", operator: "==", value: userId }]),
    update: (id, data) => updateDocument("social_accounts", id, data),
    delete: (id) => deleteDocument("social_accounts", id)
  },
  // Content Posts
  contentPosts: {
    create: (data) => createDocument("content_posts", data),
    findById: (id) => getDocument("content_posts", id),
    findByUserId: (userId) => getDocuments("content_posts", [{ field: "user_id", operator: "==", value: userId }], "created_at", "desc"),
    update: (id, data) => updateDocument("content_posts", id, data),
    delete: (id) => deleteDocument("content_posts", id)
  }
};
const firebase = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FirebaseModels,
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  healthCheck,
  initializeFirebase,
  isFirebaseConfigured,
  updateDocument
}, Symbol.toStringTag, { value: "Module" }));
async function createUserData(userId, userInfo) {
  try {
    console.log(`🌱 Creating user data for: ${userId}`);
    const userProfile = {
      id: userId,
      email: userInfo.email,
      display_name: userInfo.displayName || userInfo.email.split("@")[0],
      business_name: userInfo.businessName || `${userInfo.displayName || "User"}'s Business`,
      business_type: userInfo.businessType || "artisan",
      location: userInfo.location || "Unknown",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await FirebaseModels.users.create(userProfile);
    console.log(`✅ Created user profile for ${userId}`);
    const businessProfile = {
      id: `business_${userId}`,
      user_id: userId,
      business_name: userProfile.business_name,
      business_type: userProfile.business_type,
      location: userProfile.location,
      description: `Welcome to ${userProfile.business_name}! We create beautiful ${userProfile.business_type} products.`,
      website: "",
      social_media: {},
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await FirebaseModels.businessProfiles.create(businessProfile);
    console.log(`✅ Created business profile for ${userId}`);
    const userInsights = sampleInsights.map((insight) => ({
      ...insight,
      id: `insight_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    for (const insight of userInsights) {
      await FirebaseModels.aiInsights.create(insight);
    }
    console.log(`✅ Created ${userInsights.length} insights for ${userId}`);
    const userMetrics = sampleBusinessMetrics.map((metric) => ({
      ...metric,
      id: `metric_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    for (const metric of userMetrics) {
      await FirebaseModels.businessMetrics.create(metric);
    }
    console.log(`✅ Created ${userMetrics.length} business metrics for ${userId}`);
    const userRecommendations = sampleRecommendations.map((rec) => ({
      ...rec,
      id: `rec_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    for (const recommendation of userRecommendations) {
      await FirebaseModels.recommendations.create(recommendation);
    }
    console.log(`✅ Created ${userRecommendations.length} recommendations for ${userId}`);
    console.log(`🎉 Successfully created user data for ${userId}`);
    return { success: true, userId };
  } catch (error) {
    console.error(`❌ Error creating user data for ${userId}:`, error);
    throw error;
  }
}
const sampleUsers = [
  {
    email: "sarah@artisan.com",
    name: "Sarah Johnson",
    business_name: "Sarah's Ceramic Studio",
    business_type: "ceramics",
    location: "Portland, OR"
  },
  {
    email: "mike@handmade.com",
    name: "Mike Chen",
    business_name: "Handwoven Treasures",
    business_type: "textiles",
    location: "Seattle, WA"
  }
];
const sampleInsights = [
  {
    type: "trend",
    title: "Handmade Ceramics Trending",
    description: "Ceramic home decor items are seeing 40% increased demand in your region. Consider expanding your pottery collection.",
    detailed_description: "Market analysis shows ceramic vases, bowls, and decorative pieces are trending strongly in urban areas. Social media mentions increased 65% in the past month. Target demographic: 25-45 year olds with disposable income.",
    priority: "high",
    actionable: true,
    category: "marketing",
    confidence: 87,
    source: "market_data",
    tags: ["ceramics", "home-decor", "trending", "pottery"],
    suggested_actions: [
      "Create a new ceramic collection",
      "Update product photography",
      "Target Instagram marketing",
      "Partner with home decor influencers"
    ],
    estimated_impact: "high",
    timeframe: "short_term",
    status: "active"
  },
  {
    type: "opportunity",
    title: "Local Craft Fair Application",
    description: "Spring Artisan Market opens applications next week. High foot traffic and perfect for your target audience.",
    detailed_description: "The Spring Artisan Market at Central Park attracts 5,000+ visitors over 3 days. Previous vendors report 200-500 sales per event. Application fee: $150. Deadline: March 15th.",
    priority: "high",
    actionable: true,
    category: "sales",
    confidence: 92,
    source: "external_trends",
    tags: ["craft-fair", "local-market", "sales-opportunity", "spring"],
    suggested_actions: [
      "Prepare application materials",
      "Plan booth layout and display",
      "Create special event pricing",
      "Order business cards and signage"
    ],
    estimated_impact: "high",
    timeframe: "immediate",
    status: "active"
  },
  {
    type: "pricing",
    title: "Pricing Optimization Opportunity",
    description: "Your handwoven scarves are priced 20% below market average. Consider increasing prices by 15-25%.",
    detailed_description: "Competitor analysis shows similar handwoven scarves sell for $45-65. Your current price of $38 leaves room for 20-30% increase while maintaining competitiveness.",
    priority: "medium",
    actionable: true,
    category: "finance",
    confidence: 78,
    source: "ai_analysis",
    tags: ["pricing", "scarf", "revenue-optimization", "market-analysis"],
    suggested_actions: [
      "Research competitor pricing",
      "Test price increase on 2-3 items",
      "Update pricing strategy",
      "Communicate value proposition"
    ],
    estimated_impact: "medium",
    timeframe: "short_term",
    status: "active"
  },
  {
    type: "inventory",
    title: "Inventory Replenishment Alert",
    description: "Running low on popular items: ceramic bowls (3 left), handwoven scarves (1 left).",
    detailed_description: "Your best-selling ceramic bowls and handwoven scarves are nearly out of stock. These items account for 35% of your monthly revenue.",
    priority: "medium",
    actionable: true,
    category: "operations",
    confidence: 95,
    source: "user_behavior",
    tags: ["inventory", "restock", "popular-items", "revenue-critical"],
    suggested_actions: [
      "Order ceramic bowl materials",
      "Weave additional scarves",
      "Update inventory tracking",
      "Consider bulk ordering"
    ],
    estimated_impact: "high",
    timeframe: "immediate",
    status: "active"
  },
  {
    type: "recommendation",
    title: "Social Media Strategy Enhancement",
    description: "Your Instagram engagement increased 30% this month. Double down on video content and behind-the-scenes posts.",
    detailed_description: "Video posts receive 3x more engagement than static images. Behind-the-scenes content showing your creative process gets 40% more saves and shares.",
    priority: "medium",
    actionable: true,
    category: "marketing",
    confidence: 82,
    source: "user_behavior",
    tags: ["social-media", "instagram", "video-content", "engagement"],
    suggested_actions: [
      "Create weekly process videos",
      "Post behind-the-scenes content",
      "Use trending hashtags",
      "Engage with artisan community"
    ],
    estimated_impact: "medium",
    timeframe: "short_term",
    status: "active"
  },
  {
    type: "market",
    title: "Seasonal Opportunity: Wedding Season",
    description: "Wedding season starts in 2 months. Custom ceramic gifts and decorations are in high demand.",
    detailed_description: "March-June is peak wedding season. Custom ceramic centerpieces, guest favors, and decorative items see 200% demand increase. Average order value: $300-800.",
    priority: "high",
    actionable: true,
    category: "sales",
    confidence: 89,
    source: "market_data",
    tags: ["wedding", "seasonal", "custom-orders", "high-value"],
    suggested_actions: [
      "Create wedding collection",
      "Update website with custom options",
      "Reach out to wedding planners",
      "Prepare sample packages"
    ],
    estimated_impact: "high",
    timeframe: "short_term",
    status: "active"
  }
];
const sampleMetrics = [
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 2500, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-01-15") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 2800, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-01-22") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 3200, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-01-29") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 3500, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-02-05") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 3800, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-02-12") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 4200, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-02-19") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 4500, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-02-26") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 4800, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-03-05") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 5200, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-03-12") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 5500, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-03-19") },
  { metric_type: "revenue", metric_name: "Monthly Revenue", value: 5800, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-03-26") },
  { metric_type: "orders", metric_name: "Daily Orders", value: 12, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-01-29") },
  { metric_type: "orders", metric_name: "Daily Orders", value: 15, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-02-15") },
  { metric_type: "orders", metric_name: "Daily Orders", value: 18, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-03-10") },
  { metric_type: "customers", metric_name: "New Customers", value: 8, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-01-29") },
  { metric_type: "customers", metric_name: "New Customers", value: 12, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-02-15") },
  { metric_type: "customers", metric_name: "New Customers", value: 15, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-03-10") },
  { metric_type: "social", metric_name: "Instagram Followers", value: 2847, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-03-26") },
  { metric_type: "social", metric_name: "Instagram Engagement Rate", value: 4.2, unit: "percent", date_recorded: /* @__PURE__ */ new Date("2024-03-26") },
  { metric_type: "website", metric_name: "Monthly Visitors", value: 2340, unit: "count", date_recorded: /* @__PURE__ */ new Date("2024-03-26") },
  { metric_type: "website", metric_name: "Conversion Rate", value: 2.8, unit: "percent", date_recorded: /* @__PURE__ */ new Date("2024-03-26") },
  { metric_type: "website", metric_name: "Average Order Value", value: 85.5, unit: "USD", date_recorded: /* @__PURE__ */ new Date("2024-03-26") }
];
const sampleRecommendations = [
  {
    title: "Apply for Spring Artisan Market",
    description: "Submit application for the upcoming Spring Artisan Market to increase local visibility and sales.",
    category: "sales",
    priority: "high",
    timeframe: "immediate",
    status: "pending",
    estimated_effort: "medium",
    estimated_impact: "high",
    suggested_actions: ["Prepare application materials", "Plan booth layout", "Create event pricing"]
  },
  {
    title: "Restock Popular Inventory Items",
    description: "Order materials and create additional ceramic bowls and handwoven scarves to meet demand.",
    category: "operations",
    priority: "high",
    timeframe: "immediate",
    status: "pending",
    estimated_effort: "high",
    estimated_impact: "high",
    suggested_actions: ["Order ceramic materials", "Schedule weaving time", "Update inventory system"]
  },
  {
    title: "Update Pricing Strategy",
    description: "Research competitor pricing and implement price increases for handwoven scarves.",
    category: "finance",
    priority: "medium",
    timeframe: "short_term",
    status: "pending",
    estimated_effort: "low",
    estimated_impact: "medium",
    suggested_actions: ["Research competitor prices", "Test price increases", "Update website pricing"]
  },
  {
    title: "Create Wedding Season Collection",
    description: "Develop a specialized collection of ceramic items for wedding season demand.",
    category: "sales",
    priority: "high",
    timeframe: "short_term",
    status: "pending",
    estimated_effort: "high",
    estimated_impact: "high",
    suggested_actions: ["Design wedding items", "Create samples", "Update website", "Contact wedding planners"]
  },
  {
    title: "Enhance Social Media Video Content",
    description: "Increase video content production to boost engagement and reach.",
    category: "marketing",
    priority: "medium",
    timeframe: "short_term",
    status: "pending",
    estimated_effort: "medium",
    estimated_impact: "medium",
    suggested_actions: ["Plan video content", "Create behind-the-scenes videos", "Use trending hashtags"]
  },
  {
    title: "Develop Wholesale Partnerships",
    description: "Establish relationships with local retailers and online marketplaces for wholesale distribution.",
    category: "growth",
    priority: "low",
    timeframe: "long_term",
    status: "pending",
    estimated_effort: "high",
    estimated_impact: "high",
    suggested_actions: ["Research potential partners", "Create wholesale catalog", "Develop pricing structure"]
  }
];
const sampleMarketTrends = [
  {
    trend_type: "product",
    title: "Ceramic Home Decor Trending",
    description: "Handmade ceramic home decor items are experiencing significant growth in urban markets.",
    impact_level: "high",
    confidence_score: 85,
    source: "Social Media Analytics",
    region: "North America",
    category: "products",
    tags: ["ceramics", "home-decor", "handmade", "trending"],
    valid_from: /* @__PURE__ */ new Date("2024-01-01"),
    valid_until: /* @__PURE__ */ new Date("2024-06-30")
  },
  {
    trend_type: "seasonal",
    title: "Wedding Season Demand",
    description: "Custom ceramic and textile items for weddings show 200% increase in demand during spring months.",
    impact_level: "high",
    confidence_score: 90,
    source: "Market Research",
    region: "North America",
    category: "seasonal",
    tags: ["wedding", "seasonal", "custom", "ceramics"],
    valid_from: /* @__PURE__ */ new Date("2024-03-01"),
    valid_until: /* @__PURE__ */ new Date("2024-06-30")
  },
  {
    trend_type: "competitor",
    title: "Local Artisan Pricing Increase",
    description: "Local artisans in the region have increased pricing by 15% on average due to material cost increases.",
    impact_level: "medium",
    confidence_score: 75,
    source: "Competitor Analysis",
    region: "Pacific Northwest",
    category: "competitor",
    tags: ["pricing", "competitor", "market-analysis"],
    valid_from: /* @__PURE__ */ new Date("2024-01-15"),
    valid_until: /* @__PURE__ */ new Date("2024-12-31")
  },
  {
    trend_type: "product",
    title: "Sustainable Textiles Rising",
    description: "Eco-friendly and sustainable textile products are gaining popularity among conscious consumers.",
    impact_level: "medium",
    confidence_score: 80,
    source: "Consumer Research",
    region: "Global",
    category: "products",
    tags: ["sustainable", "textiles", "eco-friendly", "conscious-consumer"],
    valid_from: /* @__PURE__ */ new Date("2024-02-01"),
    valid_until: /* @__PURE__ */ new Date("2024-12-31")
  },
  {
    trend_type: "seasonal",
    title: "Holiday Gift Season Preparation",
    description: "Artisan gifts see 300% demand increase during November-December holiday season.",
    impact_level: "high",
    confidence_score: 88,
    source: "Historical Sales Data",
    region: "North America",
    category: "seasonal",
    tags: ["holiday", "gifts", "seasonal", "high-demand"],
    valid_from: /* @__PURE__ */ new Date("2024-11-01"),
    valid_until: /* @__PURE__ */ new Date("2024-12-31")
  }
];
async function seedFirebaseDatabase() {
  try {
    console.log("🌱 Starting Firebase database seeding...");
    const users = [];
    for (const userData of sampleUsers) {
      const user = await FirebaseModels.users.create(userData);
      users.push(user);
      console.log(`✅ Created user: ${user.name}`);
    }
    const userId = users[0].id;
    for (const insightData of sampleInsights) {
      await FirebaseModels.aiInsights.create({ ...insightData, user_id: userId });
    }
    console.log(`✅ Created ${sampleInsights.length} AI insights`);
    for (const metricData of sampleMetrics) {
      await FirebaseModels.businessMetrics.create({ ...metricData, user_id: userId });
    }
    console.log(`✅ Created ${sampleMetrics.length} business metrics`);
    for (const recData of sampleRecommendations) {
      await FirebaseModels.recommendations.create({ ...recData, user_id: userId });
    }
    console.log(`✅ Created ${sampleRecommendations.length} recommendations`);
    for (const trendData of sampleMarketTrends) {
      await FirebaseModels.marketTrends.create(trendData);
    }
    console.log(`✅ Created ${sampleMarketTrends.length} market trends`);
    console.log("🎉 Firebase database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Firebase database seeding failed:", error);
    throw error;
  }
}
const firebaseSeed = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createUserData,
  seedFirebaseDatabase
}, Symbol.toStringTag, { value: "Module" }));
const extractUserId = (req, res, next) => {
  let userId = req.params.userId || req.query.userId || req.headers["x-user-id"];
  if (!userId || userId === "default-user") {
    userId = "00000000-0000-0000-0000-000000000001";
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const firebaseUidRegex = /^[a-zA-Z0-9]{28}$/;
  if (!userId.match(uuidRegex) && !userId.match(firebaseUidRegex)) {
    userId = "00000000-0000-0000-0000-000000000001";
  }
  req.userId = userId;
  next();
};
const getDashboardData = async (req, res) => {
  try {
    console.log("Dashboard API called for user:", req.params.userId);
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.userId || "00000000-0000-0000-0000-000000000001";
    const isQuotaExceeded = userId === "quota-exceeded-user" || Math.random() < 0.1;
    if (isQuotaExceeded) {
      return res.status(429).json({
        error: "QUOTA_EXCEEDED",
        message: "AI recommendations quota exceeded. Please try again tomorrow."
      });
    }
    console.log("Firebase configured:", isFirebaseConfigured2());
    if (!isFirebaseConfigured2()) {
      console.log("Firebase not configured, returning empty data");
      const emptyData = {
        insights: [],
        summary: {
          totalInsights: 0,
          highPriorityCount: 0,
          actionableCount: 0,
          weeklyGrowth: 0,
          topCategories: []
        },
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        },
        marketTrends: {
          trendingProducts: [],
          seasonalOpportunities: [],
          competitorInsights: []
        }
      };
      return res.json(emptyData);
    }
    const isHealthy = await healthCheck2();
    console.log("Firebase health check:", isHealthy);
    if (!isHealthy) {
      console.log("Firebase not healthy, returning empty data");
      const emptyData = {
        insights: [],
        summary: {
          totalInsights: 0,
          highPriorityCount: 0,
          actionableCount: 0,
          weeklyGrowth: 0,
          topCategories: []
        },
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        },
        marketTrends: {
          trendingProducts: [],
          seasonalOpportunities: [],
          competitorInsights: []
        }
      };
      return res.json(emptyData);
    }
    let products = [];
    let sales = [];
    let businessMetrics = [];
    try {
      products = await FirebaseModels2.products.findByUserId(userId);
      sales = await FirebaseModels2.sales.findByUserId(userId);
      businessMetrics = [
        ...products.map((p) => ({ ...p, metric_type: "products" })),
        ...sales.map((s) => ({ ...s, metric_type: "sales" }))
      ];
    } catch (error) {
      businessMetrics = await FirebaseModels2.businessMetrics.findByUserId(userId);
    }
    const insights = await getInsightsFromMetrics(userId);
    const totalInsights = insights.length;
    const highPriorityCount = insights.filter((i) => i.priority === "high").length;
    const actionableCount = insights.filter((i) => i.actionable).length;
    const categoryCount = insights.reduce((acc, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categoryCount).sort(([, a], [, b]) => b - a).slice(0, 3).map(([category]) => category);
    const weeklyGrowth = await FirebaseModels2.businessMetrics.getWeeklyGrowth(userId);
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };
    const marketTrends = generateMarketTrendsFromMetrics(businessMetrics);
    await storeInsightsAsMetrics(userId, insights);
    const dashboardData = {
      insights,
      summary: {
        totalInsights,
        highPriorityCount,
        actionableCount,
        weeklyGrowth: weeklyGrowth || 0,
        topCategories
      },
      recommendations,
      marketTrends,
      businessMetrics
      // All data is now stored as business metrics
    };
    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      details: error.message,
      stack: void 0,
      debug: {
        userId: req.params.userId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: "production",
        firebaseConfig: {
          FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "Set" : "Not set",
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "Set" : "Not set"
        }
      }
    });
  }
};
const getInsights = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.params.userId || "00000000-0000-0000-0000-000000000001";
    const { type, limit: limit2 = 50, offset = 0 } = req.query;
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.json([]);
    }
    let insights;
    if (type) {
      insights = await FirebaseModels2.aiInsights.findByType(userId, type);
    } else {
      const limitCount = limit2 ? parseInt(limit2) : 50;
      insights = await FirebaseModels2.aiInsights.findByUserId(userId, limitCount);
    }
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
};
const createInsight = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.params.userId || "00000000-0000-0000-0000-000000000001";
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    const insightData = {
      ...req.body,
      user_id: userId,
      status: "active"
    };
    const insight = await FirebaseModels2.aiInsights.create(insightData);
    res.status(201).json(insight);
  } catch (error) {
    res.status(500).json({ error: "Failed to create insight" });
  }
};
const updateInsightStatus = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const { insightId } = req.params;
    const { status } = req.body;
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    const insight = await FirebaseModels2.aiInsights.update(insightId, { status });
    if (!insight) {
      return res.status(404).json({ error: "Insight not found" });
    }
    res.json(insight);
  } catch (error) {
    res.status(500).json({ error: "Failed to update insight status" });
  }
};
const generateInsights = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.params.userId || "00000000-0000-0000-0000-000000000001";
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    let products = [];
    let sales = [];
    let businessMetrics = [];
    try {
      products = await FirebaseModels2.products.findByUserId(userId);
      sales = await FirebaseModels2.sales.findByUserId(userId);
      businessMetrics = [
        ...products.map((p) => ({ ...p, metric_type: "products" })),
        ...sales.map((s) => ({ ...s, metric_type: "sales" }))
      ];
    } catch (error) {
      businessMetrics = await FirebaseModels2.businessMetrics.findByUserId(userId);
    }
    const newInsights = await generateInsightsFromMetrics(userId, businessMetrics);
    const storedInsights = [];
    for (const insight of newInsights) {
      try {
        const storedInsight = await FirebaseModels2.aiInsights.create({
          ...insight,
          user_id: userId,
          status: "active",
          generated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        storedInsights.push(storedInsight);
      } catch (error) {
      }
    }
    res.json({
      message: "AI insights generated successfully",
      insights: storedInsights,
      count: storedInsights.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate insights" });
  }
};
const getBusinessMetrics = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.params.userId || "00000000-0000-0000-0000-000000000001";
    const { metricType, limit: limit2 = 100 } = req.query;
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.json([]);
    }
    const limitCount = limit2 ? parseInt(limit2) : 100;
    const metrics = await FirebaseModels2.businessMetrics.findByUserId(
      userId,
      metricType,
      limitCount
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch business metrics" });
  }
};
const createBusinessMetric = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.params.userId || "00000000-0000-0000-0000-000000000001";
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    const metricData = {
      ...req.body,
      user_id: userId
    };
    const metric = await FirebaseModels2.businessMetrics.create(metricData);
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ error: "Failed to create business metric" });
  }
};
const getRecommendations = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const userId = req.params.userId || "00000000-0000-0000-0000-000000000001";
    const { timeframe } = req.query;
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.json([]);
    }
    const recommendations = await FirebaseModels2.recommendations.findByUserId(
      userId,
      timeframe
    );
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};
const updateRecommendationStatus = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const { recommendationId } = req.params;
    const { status } = req.body;
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    const recommendation = await FirebaseModels2.recommendations.update(recommendationId, { status });
    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: "Failed to update recommendation status" });
  }
};
const getMarketTrends = async (req, res) => {
  try {
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.json([]);
    }
    const trends = await FirebaseModels2.marketTrends.findActive();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch market trends" });
  }
};
const testEndpoint = async (req, res) => {
  try {
    const { isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    const debugInfo = {
      message: "Dashboard API is working",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: req.params.userId,
      environment: "production",
      firebaseConfig: {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "Set" : "Not set",
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? "Set" : "Not set",
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "Set" : "Not set",
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? "Set" : "Not set",
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? "Set" : "Not set",
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? "Set" : "Not set"
      },
      firebaseStatus: {
        isConfigured: isFirebaseConfigured2(),
        isHealthy: isFirebaseConfigured2() ? await healthCheck2() : false
      }
    };
    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: "Test endpoint failed",
      details: error.message,
      stack: void 0
    });
  }
};
const healthCheckEndpoint = async (req, res) => {
  try {
    const { isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2()) {
      return res.status(503).json({
        status: "unhealthy",
        reason: "Firebase not configured",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const isHealthy = await healthCheck2();
    if (isHealthy) {
      res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } else {
      res.status(503).json({ status: "unhealthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
};
const seedDatabase = async (req, res) => {
  try {
    const { isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    const { seedFirebaseDatabase: seedFirebaseDatabase2 } = await Promise.resolve().then(() => firebaseSeed);
    await seedFirebaseDatabase2();
    res.json({ message: "Firebase database seeded successfully with sample data" });
  } catch (error) {
    res.status(500).json({ error: "Failed to seed Firebase database" });
  }
};
const createUserDataEndpoint = async (req, res) => {
  try {
    const { userId, userInfo } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!userInfo || !userInfo.email) {
      return res.status(400).json({ error: "User info with email is required" });
    }
    const result = await createUserData(userId, userInfo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user data" });
  }
};
const addBusinessMetric = async (req, res) => {
  try {
    const { userId } = req.params;
    const { metricType, value, date, productName, price, quantity, materialCost, sellingPrice } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!metricType || value === void 0) {
      return res.status(400).json({ error: "Metric type and value are required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    let result;
    if (metricType === "products") {
      const productData = {
        user_id: userId,
        product_name: productName || "",
        quantity: quantity ? parseInt(quantity) : 0,
        material_cost: materialCost ? parseFloat(materialCost) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0,
        added_date: date || (/* @__PURE__ */ new Date()).toISOString()
      };
      result = await FirebaseModels2.products.create(productData);
    } else if (metricType === "sales") {
      if (!productName || !quantity || quantity <= 0) {
        return res.status(400).json({
          error: "Product name and valid quantity are required for sales"
        });
      }
      let productToUpdate = null;
      try {
        productToUpdate = await FirebaseModels2.products.findByProductName(userId, productName);
        if (!productToUpdate) {
          const fallbackProducts = await FirebaseModels2.businessMetrics.findByUserId(userId, "products");
          productToUpdate = fallbackProducts.find((p) => p.product_name === productName);
        }
        if (!productToUpdate) {
          return res.status(400).json({
            error: `Product "${productName}" not found in inventory`
          });
        }
        const currentQuantity = productToUpdate.quantity || 0;
        const quantityToSell = parseInt(quantity);
        if (currentQuantity < quantityToSell) {
          return res.status(400).json({
            error: `Insufficient inventory. Available: ${currentQuantity}, Requested: ${quantityToSell}`
          });
        }
        if (productToUpdate.id && !productToUpdate.id.startsWith("metric_")) {
          await FirebaseModels2.products.reduceQuantity(productToUpdate.id, quantityToSell);
        } else {
          const newQuantity = currentQuantity - quantityToSell;
          await FirebaseModels2.businessMetrics.update(productToUpdate.id, {
            quantity: newQuantity
          });
        }
      } catch (inventoryError) {
        return res.status(500).json({
          error: "Failed to update inventory",
          details: inventoryError.message
        });
      }
      const saleData = {
        user_id: userId,
        product_name: productName || "",
        quantity: quantity ? parseInt(quantity) : 0,
        price_per_unit: price ? parseFloat(price) : 0,
        sale_date: date || (/* @__PURE__ */ new Date()).toISOString()
      };
      result = await FirebaseModels2.sales.create(saleData);
    } else {
      const metricData = {
        user_id: userId,
        metric_type: metricType,
        value: parseFloat(value),
        date_recorded: date || (/* @__PURE__ */ new Date()).toISOString(),
        product_name: productName || "",
        price: price ? parseFloat(price) : 0,
        quantity: quantity ? parseInt(quantity) : 0,
        material_cost: materialCost ? parseFloat(materialCost) : 0,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : 0
      };
      result = await FirebaseModels2.businessMetrics.create(metricData);
    }
    res.json({
      success: true,
      message: `${metricType === "products" ? "Product" : metricType === "sales" ? "Sale" : "Metric"} added successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to add business metric" });
  }
};
const getUserProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    try {
      const products = await FirebaseModels2.products.getForDropdown(userId);
      res.json({
        success: true,
        products
      });
    } catch (error) {
      const fallbackProducts = await FirebaseModels2.businessMetrics.findByUserId(userId, "products");
      const formattedProducts = fallbackProducts.map((product) => ({
        id: product.id,
        name: product.product_name || "Unnamed Product",
        price: product.selling_price || 0,
        quantity: product.quantity || 0,
        dateAdded: product.created_at,
        materialCost: product.material_cost || 0,
        sellingPrice: product.selling_price || 0
      }));
      res.json({
        success: true,
        products: formattedProducts
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};
const getAllBusinessMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const { FirebaseModels: FirebaseModels2, isFirebaseConfigured: isFirebaseConfigured2, healthCheck: healthCheck2 } = await Promise.resolve().then(() => firebase);
    if (!isFirebaseConfigured2() || !await healthCheck2()) {
      return res.status(503).json({ error: "Firebase not available" });
    }
    const businessMetrics = await FirebaseModels2.businessMetrics.findByUserId(userId);
    const regularMetrics = businessMetrics.filter((metric) => metric.metric_type !== "ai_insight");
    const aiInsights = businessMetrics.filter((metric) => metric.metric_type === "ai_insight");
    res.json({
      success: true,
      data: {
        businessMetrics: regularMetrics,
        aiInsights,
        total: businessMetrics.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get business metrics" });
  }
};
async function generateInsightsFromMetrics(userId, metrics) {
  const insights = [];
  const currentDate = (/* @__PURE__ */ new Date()).toISOString();
  const businessMetrics = metrics.filter((metric) => metric.metric_type !== "ai_insight");
  const metricsByType = businessMetrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = [];
    }
    acc[metric.metric_type].push(metric);
    return acc;
  }, {});
  if (metricsByType.revenue && metricsByType.revenue.length > 0) {
    const revenueMetrics = metricsByType.revenue.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
    const latestRevenue = Number(revenueMetrics[0].value);
    const previousRevenue = Number(revenueMetrics[1]?.value || latestRevenue);
    const growthRate = previousRevenue > 0 ? (latestRevenue - previousRevenue) / previousRevenue * 100 : 0;
    if (growthRate > 20) {
      insights.push({
        id: `insight_${userId}_revenue_growth_${Date.now()}`,
        type: "trend",
        title: "Strong Revenue Growth Detected",
        description: `Your revenue has grown by ${growthRate.toFixed(1)}% compared to the previous period. This is excellent growth!`,
        priority: "high",
        date: currentDate,
        actionable: true,
        category: "finance",
        confidence: 90,
        source: "ai_analysis",
        tags: ["revenue", "growth", "positive"],
        suggestedActions: [
          "Analyze what drove this growth",
          "Consider scaling successful strategies",
          "Plan for continued growth"
        ],
        estimatedImpact: "high",
        timeframe: "short_term"
      });
    } else if (growthRate < -10) {
      insights.push({
        id: `insight_${userId}_revenue_decline_${Date.now()}`,
        type: "alert",
        title: "Revenue Decline Alert",
        description: `Your revenue has decreased by ${Math.abs(growthRate).toFixed(1)}% compared to the previous period. Immediate attention needed.`,
        priority: "high",
        date: currentDate,
        actionable: true,
        category: "finance",
        confidence: 85,
        source: "ai_analysis",
        tags: ["revenue", "decline", "urgent"],
        suggestedActions: [
          "Review recent changes in strategy",
          "Analyze customer feedback",
          "Consider promotional campaigns"
        ],
        estimatedImpact: "high",
        timeframe: "immediate"
      });
    }
  }
  if (metricsByType.customers && metricsByType.customers.length > 0) {
    const customerMetrics = metricsByType.customers.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
    const latestCustomers = Number(customerMetrics[0].value);
    if (latestCustomers > 100) {
      insights.push({
        id: `insight_${userId}_customer_milestone_${Date.now()}`,
        type: "opportunity",
        title: "Customer Milestone Reached",
        description: `Congratulations! You've reached ${latestCustomers} customers. This is a significant milestone for your business.`,
        priority: "medium",
        date: currentDate,
        actionable: true,
        category: "growth",
        confidence: 95,
        source: "ai_analysis",
        tags: ["customers", "milestone", "growth"],
        suggestedActions: [
          "Celebrate this achievement with your team",
          "Consider customer appreciation campaigns",
          "Plan for the next milestone"
        ],
        estimatedImpact: "medium",
        timeframe: "short_term"
      });
    }
  }
  if (metricsByType.sales && metricsByType.sales.length > 0) {
    const salesMetrics = metricsByType.sales.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime());
    const latestSales = Number(salesMetrics[0].value);
    const avgSales = salesMetrics.reduce((sum, m) => sum + Number(m.value), 0) / salesMetrics.length;
    if (latestSales > avgSales * 1.5) {
      insights.push({
        id: `insight_${userId}_sales_spike_${Date.now()}`,
        type: "trend",
        title: "Sales Spike Detected",
        description: `Your recent sales of ${latestSales} are significantly above your average of ${avgSales.toFixed(0)}. Great performance!`,
        priority: "medium",
        date: currentDate,
        actionable: true,
        category: "sales",
        confidence: 80,
        source: "ai_analysis",
        tags: ["sales", "spike", "performance"],
        suggestedActions: [
          "Identify what caused this spike",
          "Replicate successful strategies",
          "Maintain momentum"
        ],
        estimatedImpact: "medium",
        timeframe: "short_term"
      });
    }
  }
  return insights;
}
function generateMarketTrendsFromMetrics(metrics) {
  const trends = {
    trendingProducts: [],
    seasonalOpportunities: [],
    competitorInsights: []
  };
  const revenueMetrics = metrics.filter((m) => m.metric_type === "revenue");
  if (revenueMetrics.length > 0) {
    const avgRevenue = revenueMetrics.reduce((sum, m) => sum + Number(m.value), 0) / revenueMetrics.length;
    if (avgRevenue > 1e3) {
      trends.trendingProducts.push("Premium products showing strong demand");
    }
  }
  const customerMetrics = metrics.filter((m) => m.metric_type === "customers");
  if (customerMetrics.length > 0) {
    const latestCustomers = Number(customerMetrics.sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime())[0].value);
    if (latestCustomers > 50) {
      trends.seasonalOpportunities.push("Customer base growing - consider seasonal promotions");
    }
  }
  return trends;
}
async function storeInsightsAsMetrics(userId, insights) {
  try {
    const { FirebaseModels: FirebaseModels2 } = await Promise.resolve().then(() => firebase);
    for (const insight of insights) {
      const insightMetric = {
        id: `insight_metric_${insight.id}`,
        user_id: userId,
        metric_type: "ai_insight",
        value: insight.confidence || 0,
        // Use confidence as the numeric value
        description: insight.description,
        date_recorded: insight.date,
        metadata: {
          insight_id: insight.id,
          type: insight.type,
          title: insight.title,
          priority: insight.priority,
          actionable: insight.actionable,
          category: insight.category,
          source: insight.source,
          tags: insight.tags || [],
          suggestedActions: insight.suggestedActions || [],
          estimatedImpact: insight.estimatedImpact,
          timeframe: insight.timeframe
        },
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      try {
        const existingMetric = await FirebaseModels2.businessMetrics.findById(insightMetric.id);
        if (!existingMetric) {
          await FirebaseModels2.businessMetrics.create(insightMetric);
        }
      } catch (error) {
        await FirebaseModels2.businessMetrics.create(insightMetric);
      }
    }
  } catch (error) {
  }
}
async function getInsightsFromMetrics(userId) {
  try {
    const { FirebaseModels: FirebaseModels2 } = await Promise.resolve().then(() => firebase);
    const insightMetrics = await FirebaseModels2.businessMetrics.findByUserId(userId, "ai_insight");
    const insights = insightMetrics.map((metric) => ({
      id: metric.metadata?.insight_id || metric.id,
      type: metric.metadata?.type || "insight",
      title: metric.metadata?.title || "AI Insight",
      description: metric.description,
      priority: metric.metadata?.priority || "medium",
      date: metric.date_recorded,
      actionable: metric.metadata?.actionable || false,
      category: metric.metadata?.category || "general",
      confidence: metric.value,
      source: metric.metadata?.source || "ai_analysis",
      tags: Array.isArray(metric.metadata?.tags) ? metric.metadata.tags : [],
      suggestedActions: Array.isArray(metric.metadata?.suggestedActions) ? metric.metadata.suggestedActions : [],
      estimatedImpact: metric.metadata?.estimatedImpact || "medium",
      timeframe: metric.metadata?.timeframe || "short_term"
    }));
    return insights;
  } catch (error) {
    return [];
  }
}
const envFile = ".env.production";
config({ path: path.resolve(process.cwd(), envFile) });
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json({ limit: "25mb" }));
  app2.use(express__default.urlencoded({ extended: true, limit: "25mb" }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/debug/env", (_req, res) => {
    res.json({
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "Set" : "Not set",
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? "Set" : "Not set",
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? "Set" : "Not set",
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? "Set" : "Not set",
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? "Set" : "Not set"
    });
  });
  app2.get("/api/debug/firebase", async (_req, res) => {
    try {
      const firebase$1 = await Promise.resolve().then(() => firebase);
      const config2 = {
        apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
        appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
      };
      res.json({
        environmentVars: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "Set" : "Not set"
        },
        firebaseConfig: config2,
        isConfigured: firebase$1.isFirebaseConfigured()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/speech/recognize", handleSpeechToText);
  app2.get("/api/speech/health", handleSpeechHealth);
  app2.post("/api/ai/chat", handleAIChat);
  app2.get("/api/ai/health", handleAIHealth);
  app2.post("/api/images/generate", handleImageGenerate);
  app2.post("/api/images/enhance", handleImageEnhance);
  app2.post("/api/images/bg-swap", handleImageBgSwap);
  app2.post("/api/videos/generate", handleGenerateVideo);
  app2.get("/api/videos/:videoId/status", handleVideoStatus);
  app2.get("/api/videos/:videoId/download", handleVideoDownload);
  app2.get("/api/videos/debug/veo3", handleDebugVeo3);
  app2.post("/api/location/search", handleLocationSearch);
  app2.post("/api/location/insights", generateLocationInsights);
  app2.get("/api/location/reverse-geocode", reverseGeocode);
  app2.get("/api/business-flow/charts/:userId", getCharts);
  app2.get("/api/business-flow/charts/:chartId", getChart);
  app2.post("/api/business-flow/charts", createChart);
  app2.patch("/api/business-flow/charts/:chartId", updateChart);
  app2.post("/api/business-flow/charts/:chartId/nodes", addNode);
  app2.patch("/api/business-flow/nodes/:nodeId", updateNode);
  app2.delete("/api/business-flow/nodes/:nodeId", deleteNode);
  app2.post("/api/business-flow/charts/:chartId/edges", addEdge);
  app2.post("/api/business-flow/ai-expand", aiExpand);
  app2.post("/api/business-flow/generate-node", generateNode);
  app2.get("/api/business-flow/charts/:chartId/history", getChartHistory);
  app2.get("/api/business-flow/charts/:chartId/export", exportChart);
  app2.post("/api/business-flow/:userId/save", saveBusinessFlow);
  app2.get("/api/business-flow/:userId/latest", getLatestBusinessFlow);
  app2.get("/api/business-flow/:userId/all", getAllBusinessFlows);
  app2.put("/api/business-flow/:userId/:flowId", updateBusinessFlow);
  app2.delete("/api/business-flow/:userId/:flowId", deleteBusinessFlow);
  app2.get("/api/questionnaires/:userId", getQuestionnaires);
  app2.get("/api/questionnaires/:userId/:questionnaireId", getQuestionnaire);
  app2.post("/api/questionnaires", createQuestionnaire);
  app2.put("/api/questionnaires/:questionnaireId", updateQuestionnaire);
  app2.delete("/api/questionnaires/:questionnaireId", deleteQuestionnaire);
  app2.post("/api/questionnaire/generate-flow", generateFlow);
  app2.post("/api/questionnaire/save-answers", saveAnswers);
  app2.post("/api/questionnaire/save-flow", saveFlow);
  app2.get("/api/questionnaire/test", testQuestionnaire);
  app2.post("/api/social/generate-post", handleGeneratePost);
  app2.get("/api/social/platforms", handleGetPlatforms);
  app2.get("/api/dashboard/test", testEndpoint);
  app2.get("/api/dashboard/health", healthCheckEndpoint);
  app2.post("/api/dashboard/seed", seedDatabase);
  app2.post("/api/dashboard/create-user", createUserDataEndpoint);
  app2.post("/api/dashboard/:userId/add-metric", extractUserId, addBusinessMetric);
  app2.get("/api/dashboard/:userId/products", extractUserId, getUserProducts);
  app2.get("/api/dashboard/:userId/all-metrics", extractUserId, getAllBusinessMetrics);
  app2.get("/api/dashboard/market-trends", getMarketTrends);
  app2.patch("/api/dashboard/insights/:insightId/status", updateInsightStatus);
  app2.patch("/api/dashboard/recommendations/:recommendationId/status", updateRecommendationStatus);
  app2.get("/api/dashboard/:userId", extractUserId, getDashboardData);
  app2.get("/api/dashboard/:userId/insights", extractUserId, getInsights);
  app2.post("/api/dashboard/:userId/insights", extractUserId, createInsight);
  app2.post("/api/dashboard/:userId/insights/generate", extractUserId, generateInsights);
  app2.get("/api/dashboard/:userId/metrics", extractUserId, getBusinessMetrics);
  app2.post("/api/dashboard/:userId/metrics", extractUserId, createBusinessMetric);
  app2.get("/api/dashboard/:userId/recommendations", extractUserId, getRecommendations);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
