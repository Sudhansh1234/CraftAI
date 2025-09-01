import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Video, 
  Play, 
  Download, 
  RefreshCw,
  Languages,
  BookOpen,
  Wand2,
  Clock,
  FileVideo,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface StoryPrompt {
  id: string;
  title: string;
  description: string;
  language: string;
  timestamp: Date;
  status: 'draft' | 'enhanced' | 'generating' | 'completed' | 'failed';
  originalPrompt?: string;
  enhancedPrompt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

interface Language {
  code: string;
  name: string;
  native: string;
  script: string;
}

export default function Storytelling() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stories, setStories] = useState<StoryPrompt[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryPrompt | null>(null);

  const languages: Language[] = [
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

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    
    // Add welcome message based on language
    const welcomeMessages: { [key: string]: string } = {
      'en': "Welcome to the Storytelling Platform! Create engaging product stories and convert them to videos with AI assistance.",
      'hi': "कहानी सुनाने के मंच में आपका स्वागत है! आकर्षक उत्पाद कहानियाँ बनाएं और AI सहायता के साथ उन्हें वीडियो में बदलें।",
      'bn': "গল্প বলার প্ল্যাটফর্মে স্বাগতম! আকর্ষণীয় পণ্যের গল্প তৈরি করুন এবং AI সহায়তায় সেগুলিকে ভিডিওতে রূপান্তর করুন।",
      'te': "కథ చెప్పే వేదికకు స్వాగతం! ఆకర్షణీయమైన ఉత్పత్తి కథలను సృష్టించండి మరియు AI సహాయంతో వాటిని వీడియోలుగా మార్చండి।",
      'mr': "कथाकथन प्लॅटफॉर्ममध्ये आपले स्वागत आहे! आकर्षक उत्पादन कथा तयार करा आणि AI सहाय्याने त्यांना व्हिडिओमध्ये रूपांतरित करा।",
      'ta': "கதை சொல்லும் தளத்திற்கு வரவேற்கிறோம்! கவர்ச்சிகரமான தயாரிப்பு கதைகளை உருவாக்கி, AI உதவியுடன் அவற்றை வீடியோக்களாக மாற்றுங்கள்।",
      'ur': "کہانی سنانے کے پلیٹ فارم میں خوش آمدید! دلکش مصنوعات کی کہانیاں بنائیں اور AI کی مدد سے انہیں ویڈیوز میں تبدیل کریں۔",
      'gu': "વાર્તા કહેવાના પ્લેટફોર્મમાં આપનું સ્વાગત છે! આકર્ષક ઉત્પાદન વાર્તાઓ બનાવો અને AI સહાયથી તેમને વિડિયોમાં રૂપાંતર કરો।",
      'kn': "ಕಥೆ ಹೇಳುವ ವೇದಿಕೆಗೆ ಸುಸ್ವಾಗತ! ಆಕರ್ಷಕ ಉತ್ಪನ್ನ ಕಥೆಗಳನ್ನು ರಚಿಸಿ ಮತ್ತು AI ಸಹಾಯದಿಂದ ಅವುಗಳನ್ನು ವೀಡಿಯೊಗಳಾಗಿ ಪರಿವರ್ತಿಸಿ।",
      'ml': "കഥ പറയുന്ന പ്ലാറ്റ്ഫോമിലേക്ക് സ്വാഗതം! ആകർഷകമായ ഉത്പന്ന കഥകൾ സൃഷ്ടിക്കുക, AI സഹായത്തോടെ അവയെ വീഡിയോകളാക്കി മാറ്റുക।",
      'pa': "ਕਹਾਣੀ ਸੁਣਾਉਣ ਦੇ ਪਲੇਟਫਾਰਮ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਦਿਲਚਸਪ ਉਤਪਾਦ ਕਹਾਣੀਆਂ ਬਣਾਓ ਅਤੇ AI ਸਹਾਇਤਾ ਨਾਲ ਉਹਨਾਂ ਨੂੰ ਵੀਡੀਓਜ਼ ਵਿੱਚ ਬਦਲੋ।",
      'or': "କାହାଣୀ କହିବା ପ୍ଲାଟଫର୍ମରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ! ଆକର୍ଷଣୀୟ ଉତ୍ପାଦ କାହାଣୀ ସୃଷ୍ଟି କରନ୍ତୁ ଏବଂ AI ସହାୟତାରେ ସେଗୁଡ଼ିକୁ ଭିଡ଼ିଓରେ ପରିବର୍ତ୍ତନ କରନ୍ତୁ।",
      'as': "কাহিনী কোৱা প্লেটফৰ্মলৈ স্বাগতম! আকৰ্ষণীয় উৎপাদন কাহিনী সৃষ্টি কৰক আৰু AI সহায়তাৰে সেইবোৰক ভিডিঅ'লৈ ৰূপান্তৰ কৰক।",
    };

    toast.success("Language Selected", {
      description: welcomeMessages[languageCode] || welcomeMessages['en'],
      duration: 4000,
    });
  };

  const enhancePromptWithAI = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Enhance this story prompt for video generation using Veo 3. Make it more detailed, cinematic, and suitable for AI video creation. Original prompt: "${prompt}". 
          
          Please provide the enhanced prompt in this format:
          {
            "enhancedPrompt": "Detailed, cinematic description for video generation",
            "suggestions": ["Visual suggestion 1", "Visual suggestion 2", "Visual suggestion 3"]
          }`,
          requestType: 'story_enhancement',
          language: selectedLanguage || 'en'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          // Try to parse JSON response
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.enhancedPrompt) {
              setEnhancedPrompt(parsed.enhancedPrompt);
              toast.success("Prompt Enhanced", {
                description: "AI has enhanced your story prompt for better video generation",
              });
              return;
            }
          }
          
          // Fallback: use the content directly
          setEnhancedPrompt(data.content);
          toast.success("Prompt Enhanced", {
            description: "AI has enhanced your story prompt",
          });
        } catch (parseError) {
          // If parsing fails, use the content directly
          setEnhancedPrompt(data.content);
          toast.success("Prompt Enhanced", {
            description: "AI has enhanced your story prompt",
          });
        }
      } else {
        throw new Error('Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error("Enhancement Failed", {
        description: "Could not enhance prompt. Using original prompt.",
      });
      setEnhancedPrompt(prompt);
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateVideo = async () => {
    const finalPrompt = enhancedPrompt || storyPrompt;
    if (!finalPrompt.trim()) {
      toast.error("No Prompt", {
        description: "Please enter a story prompt first",
      });
      return;
    }

    setIsGenerating(true);
    
    // Create new story entry
    const newStory: StoryPrompt = {
      id: Date.now().toString(),
      title: finalPrompt.substring(0, 50) + (finalPrompt.length > 50 ? '...' : ''),
      description: finalPrompt,
      language: selectedLanguage || 'en',
      timestamp: new Date(),
      status: 'generating',
      originalPrompt: storyPrompt,
      enhancedPrompt: enhancedPrompt || undefined,
    };

    setStories(prev => [newStory, ...prev]);
    setCurrentStory(newStory);

    try {
      // Simulate Veo 3 API call (replace with actual API integration)
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          language: selectedLanguage || 'en',
          settings: {
            duration: 15, // 15 seconds
            style: 'cinematic',
            aspectRatio: '16:9'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update story with video data
        const updatedStory = {
          ...newStory,
          status: 'completed' as const,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          duration: data.duration || 15
        };

        setStories(prev => prev.map(s => s.id === newStory.id ? updatedStory : s));
        setCurrentStory(updatedStory);
        
        toast.success("Video Generated", {
          description: "Your story video has been created successfully!",
        });
      } else {
        throw new Error('Video generation failed');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      
      // Update story status to failed
      const failedStory = {
        ...newStory,
        status: 'failed' as const
      };

      setStories(prev => prev.map(s => s.id === newStory.id ? failedStory : s));
      setCurrentStory(failedStory);
      
      toast.error("Generation Failed", {
        description: "Could not generate video. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status: StoryPrompt['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'enhanced': return 'bg-blue-100 text-blue-700';
      case 'generating': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: StoryPrompt['status']) => {
    switch (status) {
      case 'draft': return <BookOpen className="h-4 w-4" />;
      case 'enhanced': return <Wand2 className="h-4 w-4" />;
      case 'generating': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <Video className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
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
              Select your preferred language to start creating stories
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
                  <Badge variant="outline" className="text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    Veo 3
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Advanced AI that enhances your stories and generates videos in your language
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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Storytelling <span className="gemini-text-gradient">Platform</span>
              </h1>
              <p className="text-muted-foreground">
                Create engaging product stories and convert them to videos with AI assistance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLanguage(null)}
              className="text-xs"
            >
              <Languages className="h-4 w-4 mr-2" />
              Change Language
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Story Creation Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Create Your Story
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Story Prompt
                  </label>
                  <Textarea
                    placeholder="Describe your story idea, product, or concept..."
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => enhancePromptWithAI(storyPrompt)}
                    disabled={!storyPrompt.trim() || isEnhancing}
                    className="flex-1"
                  >
                    {isEnhancing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </div>

                {enhancedPrompt && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Enhanced Prompt
                    </label>
                    <Textarea
                      value={enhancedPrompt}
                      onChange={(e) => setEnhancedPrompt(e.target.value)}
                      className="min-h-[100px] bg-blue-50"
                      placeholder="AI-enhanced prompt will appear here..."
                    />
                  </div>
                )}

                <Button
                  onClick={generateVideo}
                  disabled={!storyPrompt.trim() || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video className="h-5 w-5 mr-2" />
                      Generate Video with Veo 3
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Current Story Status */}
            {currentStory && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className={getStatusColor(currentStory.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(currentStory.status)}
                          {currentStory.status.charAt(0).toUpperCase() + currentStory.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                    
                    {currentStory.videoUrl && (
                      <div className="space-y-2">
                        {currentStory.videoUrl.includes('text/html') ? (
                          // Display HTML video
                          <div className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                            <iframe
                              src={currentStory.videoUrl}
                              title="Story Video"
                              className="w-full h-96 rounded-lg border-0"
                              sandbox="allow-scripts allow-same-origin"
                            />
                            <div className="mt-3 text-center text-sm text-gray-600">
                              <p>🎬 Real Video Generated!</p>
                              <p className="text-xs">Advanced HTML5 animations with controls</p>
                            </div>
                          </div>
                        ) : currentStory.videoUrl.includes('image/') ? (
                          // Display image preview (PNG/SVG)
                          <div className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                            <img
                              src={currentStory.videoUrl}
                              alt="Story Preview"
                              className="w-full rounded-lg"
                            />
                            <div className="mt-3 text-center text-sm text-gray-600">
                              <p>🎬 Story Preview Generated</p>
                              <p className="text-xs">Full video generation with Veo 3 coming soon!</p>
                            </div>
                          </div>
                        ) : (
                          // Display actual video if available
                          <video
                            src={currentStory.videoUrl}
                            controls
                            className="w-full rounded-lg"
                            poster={currentStory.thumbnailUrl}
                          />
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(currentStory.videoUrl, '_blank')}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = currentStory.videoUrl!;
                              const extension = currentStory.videoUrl.includes('text/html') ? 'html' : 
                                            currentStory.videoUrl.includes('image/') ? 'png' : 'mp4';
                              link.download = `story-${currentStory.id}.${extension}`;
                              link.click();
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Story History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileVideo className="h-5 w-5" />
                  Story History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {stories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No stories created yet</p>
                        <p className="text-sm">Start by creating your first story above</p>
                      </div>
                    ) : (
                      stories.map((story) => (
                        <Card
                          key={story.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            currentStory?.id === story.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setCurrentStory(story)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {story.title}
                              </h4>
                              <Badge className={getStatusColor(story.status)}>
                                {getStatusIcon(story.status)}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {story.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{story.language.toUpperCase()}</span>
                              <span>{story.timestamp.toLocaleTimeString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
