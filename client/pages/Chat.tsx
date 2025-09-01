import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Sparkles, 
  Mic, 
  Camera, 
  TrendingUp, 
  BookOpen, 
  DollarSign,
  MessageCircle,
  User,
  Bot,
  Upload,
  Image as ImageIcon,
  Facebook,
  Instagram,
  Calendar
} from "lucide-react";
import { voiceService, type VoiceRecognitionResult } from "@/lib/voice-service";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'suggestion';
  needsMoreInfo?: boolean;
  followUpQuestions?: string[];
  image?: string; // Base64 image data for display
  generatedImages?: GeneratedImage[];
}

interface GeneratedImage {
  id: string;
  description: string;
  prompt: string;
  style: string;
  platform: 'instagram' | 'facebook' | 'general';
  tags: string[];
  suggestedCaption: string;
  imageUrl?: string; // Base64 image data for display
  isGenerated?: boolean; // Whether this is a real AI-generated image
  isGenerating?: boolean; // Whether this image is currently being generated
}

const quickActions = [
  { icon: Instagram, label: "Instagram Marketing", query: "Create an Instagram post for my handwoven scarf with hashtags and best posting time for Indian audience" },
  { icon: Facebook, label: "Facebook Content", query: "Help me create a Facebook post to promote my traditional pottery business with engagement strategies" },
  { icon: TrendingUp, label: "Marketing Strategy", query: "Give me a complete digital marketing strategy for my handmade jewelry business including social media platforms" },
  { icon: BookOpen, label: "Content Calendar", query: "Create a weekly social media content calendar for my craft business with post ideas and hashtags" },
  { icon: Calendar, label: "Festival Marketing", query: "What festivals and seasonal trends should I focus on for marketing my traditional crafts this month?" },
  { icon: Camera, label: "Generate Images", query: "Generate Instagram image ideas and prompts for my traditional pottery with different styles and captions" },
];

export default function Chat() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', native: 'English', script: 'Latin' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी', script: 'Devanagari' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
    { code: 'ur', name: 'Urdu', native: 'اردو', script: 'Arabic' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', script: 'Bengali' },
  ];

  const handleSend = async (message?: string) => {
    const messageToSend = message || input.trim();
    if (!messageToSend) return;

    // Add user message with image if available
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      image: imagePreview || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Get real AI response
    try {
      let aiResponse;
      
      if (selectedImage) {
        // If image is selected, include it in the context
        const imageContext = `User has uploaded an image of their craft. Please analyze the image and provide specific advice about: ${messageToSend}`;
        aiResponse = await getAIResponse(imageContext);
        
        // Clear the image after sending
        clearImage();
      } else {
        aiResponse = await getAIResponse(messageToSend);
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        needsMoreInfo: aiResponse.needsMoreInfo,
        followUpQuestions: aiResponse.followUpQuestions,
        generatedImages: aiResponse.generatedImages,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);

    const welcomeMessages: { [key: string]: string } = {
      'en': "Hello! I'm your AI assistant for artisan businesses. I can help you with marketing, storytelling, pricing, and much more. What would you like to work on today?",
      'hi': "नमस्ते! मैं आपका AI सहायक हूँ जो कारीगर व्यवसायों के लिए है। मैं मार्केटिंग, कहानी सुनाने, मूल्य निर्धारण और बहुत कुछ में आपकी सहायता कर सकता हूँ। आज आप किस पर काम करना चाहेंगे?",
      'bn': "নমস্কার! আমি আপনার AI সহায়ক যা কারিগর ব্যবসার জন্য। আমি বিপণন, গল্প বলা, মূল্য নির্ধারণ এবং আরও অনেক কিছুতে সাহায্য করতে পারি। আজ আপনি কী নিয়ে কাজ করতে চান?",
      'te': "నమస్కారం! నేను కళాకారుల వ్యాపారాల క��సం మీ AI సహాయకుడిని। మార్కెటింగ్, కథ చెప్పడం, ధర నిర্ణయం మరియు మరిన్నింటిలో సహాయం చేయగలను. నేడు మీరు దేనిపై పని చేయాలనుకుంటున్నారు?",
      'mr': "नमस्कार! मी तुमचा AI सहाय्यक आहे जो कारागीर व्यवसायांसाठी आहे. मी मार्केटिंग, कथाकथन, किंमत निर्धारण आणि बरेच काही मध्ये मदत करू शकतो. आज तुम्ही कशावर काम करू इच्छिता?",
      'ta': "வணக்கம்! நான் கைவினைஞர் வணிகங்களுக்கான உங்கள் AI உதவியாளர். மார்க்கெட்டிங், கதை சொல்லல், விலை நிர்ணயம் மற்றும் பலவற்றில் உதவ முடியும். இன்று நீங்கள் எதில் வேலை செய்ய விரும்புகிறீர்கள்?",
      'ur': "السلام ع��یکم! میں آپ کا AI اسسٹنٹ ہوں جو دستکاروں کے کاروبار کے لیے ہے۔ میں مارکیٹنگ، کہانی سنانے، قیمت طے کرنے اور بہت کچھ میں مدد کر سکتا ہوں۔ آج آپ کس پر کام کرنا چاہیں گے؟",
      'gu': "નમસ્તે! હું તમારો AI સહાયક છું જે કારીગર વ્યવસાયો માટે છે. હું માર્કેટિંગ, વાર્તા કહેવા, કિંમત નક્કી કરવા અને ઘણું બધું માં મદદ કરી શકું છું. આજે તમે શું પર કામ કરવા માંગો છો?",
      'kn': "ನಮಸ್ಕಾರ! ನಾನು ಕಲಾಕಾರ ವ್ಯವಸಾಯಗಳಿಗಾಗಿ ನಿಮ್ಮ AI ಸಹಾಯಕ. ಮಾರ್ಕೆಟಿಂಗ್, ಕಥೆ ಹೇಳುವಿಕೆ, ಬೆಲೆ ನಿರ್ಧಾರ ಮತ್ತು ಇನ್ನೂ ಅನೇಕದಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಯಾವುದರ ಮೇಲೆ ಕೆಲಸ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
      'ml': "നമസ്കാരം! ഞാൻ കരകൗശല ബിസിനസുകൾക്കു���്ള നിങ്ങളുടെ AI സഹായകനാണ്. മാർക്കറ്റിംഗ്, കഥപറച്ചിൽ, വില നിർണ്ണയം എന്നിവയിലും മറ്റു പലതിലും സഹായിക്കാൻ കഴിയും. ഇന്ന് നിങ്ങൾ എന്തിൽ പ്രവർത്തിക്കാൻ ആഗ്രഹിക്കുന്നു?",
      'pa': "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਸਹਾਇਕ ਹਾਂ ਜੋ ਕਾਰੀਗਰ ਕਾਰੋਬਾਰਾਂ ਲਈ ਹੈ। ਮੈਂ ਮਾਰਕੀਟਿੰਗ, ਕਹਾਣੀ ਸੁਣਾਉਣ, ਕੀਮਤ ਨਿਰਧਾਰਨ ਅਤੇ ਹੋਰ ਬਹੁਤ ਕੁਝ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਸ ਗੱਲ 'ਤੇ ਕੰਮ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
      'or': "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର AI ସହାୟକ ଯିଏ କାରିଗର ବ୍ୟବସାୟ ପାଇଁ। ମୁଁ ମାର୍କେଟିଂ, କାହାଣୀ କହିବା, ମୂଲ୍ୟ ନିର୍ଧାରଣ ଏବଂ ଅନେକ କାମରେ ସାହାଯ୍ୟ କରିପାରେ। ଆଜି ଆପଣ କ'ଣ ଉପରେ କାମ କରିବାକୁ ଚାହାଁନ୍ତି?",
      'as': "নমস্কাৰ! মই আপোনাৰ AI সহায়ক যি শিল্পী ব্যৱসায়ৰ বাবে। মই বিপণন, কাহিনী কোৱা, মূল্য নিৰ্ধাৰণ আৰু বহুতো কামত সহায় কৰিব পাৰো। আজি আপুনি কিহৰ ওপৰত কাম কৰিব বিচাৰে?",
    };

    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: welcomeMessages[languageCode] || "Hello! I'm your AI assistant for artisan businesses. I can help you with marketing, storytelling, pricing, and more. What would you like to work on today?",
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
  };

  const handleMicClick = async () => {
    if (isListening) {
      // Stop listening
      voiceService.stopRecording();
      setIsListening(false);
    } else {
      try {
        // Start listening
        setIsListening(true);
        await voiceService.startRecording(selectedLanguage || 'en');
      } catch (error) {
        console.error('Voice recording error:', error);
        setIsListening(false);
        
        // Show error toast
        const errorMessage = error instanceof Error ? error.message : 'Failed to start voice recording';
        toast.error("Voice Recording Failed", {
          description: errorMessage,
          duration: 4000,
        });
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please select an image file (JPEG, PNG, etc.)",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please select an image smaller than 5MB",
        });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success("Image selected", {
        description: "You can now ask me about this image or send it with a message",
      });
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Set up voice service callbacks
  useEffect(() => {
    // Set transcription callback
    voiceService.setTranscriptionCallback((result: VoiceRecognitionResult) => {
      if (result.text) {
        // Show interim results in textbox as you speak
        setInput(result.text);
        
        // If it's final, auto-send and stop listening
        if (result.isFinal) {
          setIsListening(false);
          // Auto-send the voice message
          handleSend(result.text);
        }
      }
    });

    // Set error callback
    voiceService.setErrorCallback((error: string) => {
      setIsListening(false);
      
      // Show different toast types based on error
      if (error.includes("Processing audio")) {
        toast.info("Processing Voice", {
          description: error,
          duration: 3000,
        });
      } else if (error.includes("No speech detected")) {
        toast.warning("No Speech Detected", {
          description: error,
          duration: 4000,
        });
      } else {
        toast.error("Voice Recognition Error", {
          description: error,
          duration: 4000,
        });
      }
    });

    return () => {
      voiceService.setTranscriptionCallback(() => {});
      voiceService.setErrorCallback(() => {});
    };
  }, [selectedLanguage]);

  const getAIResponse = async (userMessage: string): Promise<{content: string, needsMoreInfo?: boolean, followUpQuestions?: string[], generatedImages?: any[]}> => {
    try {
      // Create artisan context (you can make this more dynamic based on user profile)
      const context = {
        craft: 'Traditional crafts',
        language: selectedLanguage || 'en',
        businessSize: 'Small',
        location: 'India',
        products: ['Handwoven textiles', 'Traditional crafts', 'Artisan products']
      };

      // Call the AI backend
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          language: selectedLanguage || 'en',
          context: context
        })
      });

      if (!response.ok) {
        // Try to get fallback response from error
        const errorData = await response.json().catch(() => ({}));
        if (errorData.fallback) {
          return errorData.fallback.content;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const aiResponse = await response.json();
      console.log('🎨 Frontend received AI response:', aiResponse);
      return {
        content: aiResponse.content || "I'm sorry, I couldn't generate a response right now. Please try again.",
        needsMoreInfo: aiResponse.needsMoreInfo,
        followUpQuestions: aiResponse.followUpQuestions,
        generatedImages: aiResponse.generatedImages
      };

    } catch (error) {
      console.error('AI Response error:', error);
      
      // Fallback responses based on language
      const fallbackMessages: { [key: string]: string } = {
        'en': "I'm experiencing technical difficulties right now. Please try again in a moment, or feel free to ask me about digital marketing, pricing strategies, or social media tips for your craft business.",
        'hi': "मुझे अभी तकनीकी कठिनाइयों का सामना कर रहा हूं। कृपया एक क्षण में फिर से कोशिश करें, या अपने शिल्प व्यवसाय के लिए डिजिटल मार्केटिंग, मूल्य निर्धारण रणनीतियों, या सोशल मीडिया टिप्स के बारे में मुझसे पूछने के लिए स्वतंत्र महसूस करें।",
        'bn': "আমি এখন প্রযুক্তিগত সমস্যার সম্মুখীন হচ্ছি। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন, অথবা আপনার কারুশিল্প ব্যবসার জন্য ডিজিটাল বিপণন, মূল্য নির্ধারণ কৌশল, বা সোশ্যাল মিডিয়া টিপস সম্পর্কে আমাকে জিজ্ঞাসা করতে দ্বিধা করবেন না।"
      };

      return {
        content: fallbackMessages[selectedLanguage || 'en'] || fallbackMessages['en'],
        needsMoreInfo: false,
        followUpQuestions: []
      };
    }
  };

  const getAIResponseOld = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Hindi responses
    if (selectedLanguage === 'hi') {
      if (lowerMessage.includes('instagram') || lowerMessage.includes('social media')) {
        return "मैं आपके लिए एक आकर्षक Instagram पोस्ट बनाने में मदद करूंगा! यहाँ एक सुझाव है:\n\n✨ \"पीढ़ियों के कौशल और प्रेम से बुना गया हर धागा। यह हस्तनिर्मित दुपट्टा परंपरा की गर्माहट और कालातीत कलात्मकता की सुंदरता लिए हुए है। त्योहारी सीज़न के लिए एकदम सही! 🧣✨\n\n#हस्तशिल्प #कारीगरी #पारंपरिकशिल्प #त्योहारीवस्त्र\"\n\n📅 सबसे अच्छा पोस्टिंग समय: शाम 6-8 बजे जब आपके दर्शक सबसे सक्रिय होते ���ैं\n📱 बुनाई की प्रक्रिया के बारे में एक कहानी जोड़ने पर विचार करें\n💡 बनावट दिखाने के लिए प्राकृतिक रोशनी का उपयोग करें";
      }
      return "मैं आपके कारीगर व्यवसाय में मदद के लिए यहाँ हूँ! मैं इनमें सहायता कर सकता हूँ:\n\n🎯 **मार्केटिंग:** सोशल मीडिया कंटेंट, कैप्शन, हैशटैग\n📖 **कहानी सुनाना:** उत्पाद की कहानियाँ, ब्रांड कथा\n💰 **मूल्य निर्धारण:** बाज़ार विश्लेषण, मौसमी मूल्य निर्धारण\n📸 **फोटोग्राफी:** उत्पाद फोटो टिप्स\n🎤 **आवाज़ सहायता:** अपनी भाषा में विवरण अपलोड करें\n📊 **विश्लेषण:** बिक्री अंतर्दृष्टि और रुझान\n\nआप किस विशिष्ट क्���ेत्र का पता लगाना चाहेंगे?";
    }

    // Bengali responses
    if (selectedLanguage === 'bn') {
      if (lowerMessage.includes('instagram') || lowerMessage.includes('social media')) {
        return "আমি আপনার জন্য একটি আকর্ষণীয় Instagram পোস্ট তৈরি করতে সাহায্য করব! এখানে একটি সুझাব:\n\n✨ \"প্রজন্মের দক্ষতা এবং ভালোবাসা দিয়ে বোনা প্রতিটি সুতা। এই হস্তনির্মিত স্কার্ফ ঐতিহ্যের উষ্ণতা এবং নিরবধি শিল্পকলার কমনীয়তা বহন করে। উৎসবের মৌসুমের জন্য নিখুঁত! 🧣✨\n\n#হস্তশিল্প #কারিগরি #ঐতিহ্যবাহীশিল্প #উৎসবীপোশাক\"\n\n📅 সেরা পোস্টিং সময়: সন্ধ্যা ৬-৮টা যখন আপনার দর্শকরা সবচেয়ে সক্রিয়\n📱 বুননের প্রক্রিয়া সম্পর্কে একটি ��ল্প যোগ করার কথা ভাবুন\n💡 টেক্সচার দেখানোর জন্য প্রাকৃতিক আলো ব্যবহার করুন";
      }
      return "আমি আপনার কারিগর ব্যবসায় সাহায্যের জন্য এখানে আছি! আমি এইসব বিষয়ে সহায়তা করতে পারি:\n\n🎯 **বিপণন:** সোশ্যাল মিডিয়া কন্টেন্ট, ক্যাপশন, হ্যাশট্যাগ\n📖 **গল্প বলা:** পণ্যের গল্প, ব্র্যান্ড বর্ণনা\n💰 **মূল্য নির্ধারণ:** বাজার বিশ্লেষণ, মৌসুমী মূল্য নির্ধারণ\n📸 **ফটোগ্রাফি:** পণ্য ফটো টিপস\n🎤 **ভয়েস সাপোর্ট:** আপনার ভাষায় বিবরণ আপলোড করুন\n📊 **বিশ্লেষণ:** বিক্রয় অন্তর্দৃষ্টি এবং প্রবণতা\n\nআপনি কোন নির্দিষ্ট ক্ষেত্র অন্বেষণ করতে চান?";
    }

    // English (default for other languages)
    if (lowerMessage.includes('instagram') || lowerMessage.includes('social media')) {
      return "I'll help you create an engaging Instagram post! Here's a suggestion:\n\n✨ \"Each thread woven with generations of skill and love. This handcrafted scarf carries the warmth of tradition and the elegance of timeless artistry. Perfect for the festive season! 🧣✨\n\n#HandwovenCrafts #ArtisanMade #SustainableFashion #TraditionalCrafts #FestiveWear\"\n\n📅 Best posting time: 6-8 PM when your audience is most active\n📱 Consider adding a story about the weaving process\n💡 Use natural lighting for photos to showcase the texture";
    }

    return "I'm here to help with your artisan business! I can assist you with:\n\n🎯 **Marketing:** Social media content, captions, hashtags\n📖 **Storytelling:** Product stories, brand narrative\n💰 **Pricing:** Market analysis, seasonal pricing\n📸 **Photography:** Product photo tips\n🎤 **Voice Support:** Upload details in your language\n📊 **Analytics:** Sales insights and trends\n\nWhat specific area would you like to explore? You can also use the quick action buttons below to get started!";
  };

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Choose Your <span className="gemini-text-gradient">Language</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              Select your preferred language to start chatting
            </p>
            <p className="text-sm text-muted-foreground">
              Choose your language • अपनी भाषा चुनें • আপনার ভাষা নির্বাচন করুন • మీ భాషను ఎంచుకోండి
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {languages.map((language) => (
                  <Button
                    key={language.code}
                    variant="outline"
                    onClick={() => handleLanguageSelect(language.code)}
                    className="p-6 h-auto flex flex-col items-center space-y-3 hover:border-primary/50 hover:bg-primary hover:text-white group transition-all duration-300"
                  >
                    <div className="text-2xl font-bold text-center leading-tight group-hover:text-white">
                      {language.native}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-white/80 text-center">
                      {language.name}
                    </div>
                  </Button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    12 Languages
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Advanced AI that understands context and culture in your language
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                AI Assistant for <span className="gemini-text-gradient">Artisans</span>
              </h1>
              <p className="text-muted-foreground">
                Get personalized help with marketing, storytelling, pricing, and growing your craft business
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLanguage(null)}
              className="text-xs"
            >
              Change Language
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-4 mb-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="p-2 h-auto flex items-center justify-center hover:border-primary/50 hover:bg-primary aspect-square group md:aspect-auto md:flex-col md:space-y-2 md:p-4"
                onClick={() => handleSend(action.query)}
                title={action.label}
              >
                <Icon className="h-4 w-4 text-primary group-hover:text-white transition-colors md:h-6 md:w-6" />
                <span className="hidden md:block text-sm font-medium group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages Container - Fixed height with scroll */}
            <div className="flex-1 overflow-hidden max-h-[500px]">
              <ScrollArea className="h-full w-full">
                <div className="p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender === 'ai' && (
                        <div className="h-8 w-8 rounded-full gemini-gradient flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* Display image if message has one */}
                        {message.image && (
                          <div className="mt-3">
                            <img
                              src={message.image}
                              alt="Craft image"
                              className="max-w-full h-auto rounded-lg border border-gray-200 max-h-48 object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Follow-up Questions */}
                        {message.needsMoreInfo && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm font-medium text-blue-800 mb-2">
                              💡 Please answer these questions to help me provide better advice:
                            </div>
                            <div className="space-y-2">
                              {message.followUpQuestions.map((question, index) => (
                                <div key={index} className="text-sm text-blue-700 bg-white p-2 rounded border-l-2 border-blue-300">
                                  {index + 1}. {question}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <div className="text-xs text-blue-600 mb-2">💬 Quick examples to get you started:</div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                                  onClick={() => setInput("I make handwoven textiles in Jaipur, Rajasthan. I have 5 years of experience.")}
                                >
                                  Textiles Example
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                                  onClick={() => setInput("I create handmade jewelry using silver and stones. Each piece takes 2-3 hours.")}
                                >
                                  Jewelry Example
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Generated Images */}
                        {message.generatedImages && message.generatedImages.length > 0 && (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            {(() => {
                              console.log('🎨 Frontend Debug - generatedImages:', message.generatedImages);
                              message.generatedImages.forEach((img, index) => {
                                console.log(`🎨 Image ${index + 1}:`, {
                                  id: img.id,
                                  style: img.style,
                                  imageUrl: img.imageUrl ? `${img.imageUrl.substring(0, 50)}...` : 'NO URL',
                                  isGenerated: img.isGenerated,
                                  hasImageUrl: !!img.imageUrl
                                });
                              });
                              return null;
                            })()}
                            <div className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                              🎨 {message.generatedImages.some(img => img.isGenerated) ? 'AI-Generated Images' : 'AI Image Ideas for Your Craft'}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {message.generatedImages.map((img) => (
                                <div key={img.id} className="bg-white p-3 rounded-lg border border-purple-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                      {img.style}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-purple-600">
                                        {img.platform}
                                      </span>
                                      {img.isGenerated && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                          ✨ AI Generated
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Show actual generated image if available */}
                                  {(() => {
                                    console.log(`🎨 Image Display Debug for ${img.style}:`, {
                                      hasImageUrl: !!img.imageUrl,
                                      isGenerated: img.isGenerated,
                                      condition: !!(img.imageUrl && img.isGenerated),
                                      imageUrlLength: img.imageUrl ? img.imageUrl.length : 0
                                    });
                                    return null;
                                  })()}
                                  {img.imageUrl && img.isGenerated ? (
                                    <div className="mb-3">
                                      <img 
                                        src={img.imageUrl} 
                                        alt={img.description}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                      />
                                    </div>
                                  ) : img.isGenerating ? (
                                    <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                                      <div className="flex items-center gap-3 text-blue-700">
                                        <div className="relative">
                                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                          <div className="absolute inset-0 rounded-full h-5 w-5 border-2 border-blue-300 border-t-transparent animate-ping"></div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium">🎨 Generating {img.style}</div>
                                          <div className="text-xs text-blue-600">Using Google Imagen 4.0 AI...</div>
                                        </div>
                                      </div>
                                      <div className="mt-3 bg-blue-100 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                      </div>
                                      <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                        <span className="animate-pulse">⏳</span>
                                        Creating high-quality image... (10-30 seconds)
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-700 mb-2">
                                      {img.description}
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-600 mb-2">
                                    <strong>Prompt:</strong> {img.prompt}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">
                                    <strong>Caption:</strong> {img.suggestedCaption}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {img.tags.map((tag, index) => (
                                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Show different tips based on whether images were generated */}
                            {message.generatedImages.some(img => img.isGenerating) ? (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                                  <div className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                                    AI Image Generation in Progress
                                  </div>
                                  <div className="text-xs text-blue-700 space-y-1">
                                    <div>• Using Google's latest Imagen 4.0 model</div>
                                    <div>• Creating professional-quality images</div>
                                    <div>• Each image takes 10-30 seconds</div>
                                    <div>• Images will appear as they're completed</div>
                                  </div>
                                </div>
                              </div>
                            ) : message.generatedImages.some(img => img.isGenerated) ? (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <div className="text-xs text-green-600 mb-2">
                                  ✨ These images were generated by Google's Imagen AI! You can download and use them for your marketing.
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <div className="text-xs text-purple-600 mb-2">
                                  💡 Use these prompts with AI image generation tools:
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <strong>Free Tools:</strong><br/>
                                    • Canva AI (Free)<br/>
                                    • Leonardo.ai (Free tier)<br/>
                                    • Bing Image Creator
                                  </div>
                                  <div className="bg-green-50 p-2 rounded border border-green-200">
                                    <strong>Paid Tools:</strong><br/>
                                    • DALL-E 3<br/>
                                    • Midjourney<br/>
                                    • Stable Diffusion
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {message.sender === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-full gemini-gradient flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor for auto-scroll */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="border-t p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">📷 Selected Image</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearImage}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src={imagePreview}
                    alt="Selected craft"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">
                      {selectedImage?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Size: {(selectedImage?.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">
                  💡 You can now ask me about this image or send it with a message. Try asking: "What can you tell me about this craft?" or "How can I improve this photo?"
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening... Speak now..." : "Ask me anything about growing your artisan business..."}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className={`flex-1 transition-all duration-300 ${
                      isListening ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                    disabled={isListening}
                  />
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleImageClick}
                    className="hover:border-primary/50 transition-all duration-300"
                    title="Upload image"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "outline"}
                    onClick={handleMicClick}
                    className={`relative transition-all duration-300 ${
                      isListening
                        ? "gemini-gradient text-white listening-pulse shadow-lg scale-105 border-0"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <Mic className={`h-4 w-4 transition-all duration-300 ${
                      isListening ? "animate-pulse" : ""
                    }`} />
                    {isListening && (
                      <>
                        <div className="absolute inset-0 rounded-md bg-primary/30 animate-ping"></div>
                        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary/0 animate-pulse"></div>
                      </>
                    )}
                  </Button>
                </div>
                <Button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="gemini-gradient text-white border-0 hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  {isListening ? (
                    <Badge variant="default" className="text-xs gemini-gradient text-white border-0 animate-pulse">
                      <Mic className="h-3 w-3 mr-1" />
                      Listening...
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Powered
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        12 Languages
                      </Badge>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isListening ? "Speak now..." : <span className="hidden md:inline">Press Enter to send</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
