import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage, languages } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  Instagram, 
  Facebook, 
  Twitter, 
  Image as ImageIcon,
  Video,
  Upload,
  Download,
  RefreshCw,
  Home,
  BarChart3,
  Target,
  Workflow,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  content: {
    image?: string;
    video?: string;
    caption: string;
    hashtags: string[];
  };
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
}

interface ProductImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export default function SocialPlayground() {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-blue-400' }
  ];

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode);
    toast({
      title: "Language Selected",
      description: `Content will be generated in ${languages.find(l => l.code === langCode)?.name}`,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        const newImage: ProductImage = {
          id: Date.now().toString() + Math.random(),
          file,
          preview,
          name: file.name
        };
        setProductImages(prev => [...prev, newImage]);
      }
    });
  };

  const removeImage = (imageId: string) => {
    setProductImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
    
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  };

  const generatePost = async () => {
    if (!currentPrompt.trim() || selectedPlatforms.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a prompt and select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    if (productImages.length > 0 && !selectedImage) {
      toast({
        title: "No Image Selected",
        description: "You have uploaded images but haven't selected one. Click on an image to select it for AI generation.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const newPost: SocialPost = {
        id: Date.now().toString(),
        platform: selectedPlatforms[0] as 'instagram' | 'facebook' | 'twitter',
        content: {
          caption: '',
          hashtags: []
        },
        status: 'generating',
        createdAt: new Date()
      };
      
      setPosts(prev => [newPost, ...prev]);

      // Generate content for each selected platform
      for (const platform of selectedPlatforms) {
        const requestBody = {
          prompt: currentPrompt,
          platform,
          language: selectedLanguage || 'en',
          productImage: selectedImage ? {
            name: selectedImage.name,
            data: await fileToBase64(selectedImage.file)
          } : null
        };

        console.log('🚀 Sending request to API:', {
          ...requestBody,
          productImage: requestBody.productImage ? {
            name: requestBody.productImage.name,
            dataLength: requestBody.productImage.data.length
          } : null
        });

        const response = await fetch('/api/social/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
          
          const platformPost: SocialPost = {
            id: `${Date.now()}-${platform}`,
            platform: platform as 'instagram' | 'facebook' | 'twitter',
          content: {
            image: data.image,
              video: data.video,
            caption: data.caption,
              hashtags: data.hashtags || []
            },
            status: 'completed',
            createdAt: new Date()
          };
          
          setPosts(prev => [platformPost, ...prev]);
        } else {
          throw new Error(`Failed to generate content for ${platform}`);
        }
      }

      setCurrentPrompt('');
      toast({
        title: "Posts Generated",
        description: "Your social media posts have been created successfully!",
      });
      
    } catch (error) {
      console.error('Error generating posts:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const downloadPost = (post: SocialPost) => {
    // Create a simple download for the post content
    const content = `${post.content.caption}\n\n${post.content.hashtags.map(tag => `#${tag}`).join(' ')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.platform}-post-${post.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        {/* Navigation Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-600" />
                <h1 className="text-lg font-semibold">Social Post Generator</h1>
                <ThemeToggle variant="minimal" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-xs"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">
                Choose Your <span className="gemini-text-gradient">Language</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                Select your preferred language for social media content creation
              </p>
              <p className="text-sm text-muted-foreground">
                AI will generate content in your chosen language
              </p>
            </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md transition-all duration-200 text-left"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{lang.native}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{lang.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{lang.script}</div>
              </motion.button>
            ))}
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-600" />
              <h1 className="text-lg font-semibold">Social Post Generator</h1>
              <LanguageSelector variant="minimal" />
              <ThemeToggle variant="minimal" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs"
              >
                <Home className="h-4 w-4 mr-1" />
                Home
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-xs"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Social <span className="gemini-text-gradient">Post Generator</span>
          </h1>
          <p className="text-muted-foreground">
            AI-powered content creation for Instagram, Facebook, and X using your product images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Create New Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Image Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Images (Optional)</label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your product images to enhance AI generation
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Images
                      </Button>
                    </div>
                    
                    {/* Image Preview */}
                    {productImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Click on an image to select it for AI generation. The AI will preserve your product's design while enhancing the photography.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {productImages.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.preview}
                                alt={image.name}
                                className={`w-full h-20 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                                  selectedImage?.id === image.id 
                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedImage(image)}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => removeImage(image.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              {selectedImage?.id === image.id && (
                                <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {selectedImage && (
                          <div className="space-y-1">
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Selected: {selectedImage.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              AI will enhance photography while keeping your product's original design intact
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">What would you like to create?</label>
                  <Textarea
                    placeholder="E.g., 'Create a post about my new pottery collection for Diwali' or 'Generate content about sustainable crafts'"
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Platform Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Platforms</label>
                  <div className="grid grid-cols-3 gap-2">
                    {platforms.map((platform) => {
                      const IconComponent = platform.icon;
                        return (
                        <label
                          key={platform.id}
                          className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedPlatforms.includes(platform.id)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                            <input
                              type="checkbox"
                            checked={selectedPlatforms.includes(platform.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                setSelectedPlatforms(prev => [...prev, platform.id]);
                                } else {
                                setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                              }
                            }}
                            className="sr-only"
                          />
                          <IconComponent className={`h-4 w-4 ${platform.color}`} />
                          <span className="text-sm font-medium">{platform.name}</span>
                            </label>
                        );
                      })}
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={generatePost}
                  disabled={isGenerating || !currentPrompt.trim() || selectedPlatforms.length === 0}
                  className="w-full gemini-gradient text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Posts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Posts
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
                    </div>

          {/* Generated Posts */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Generated Posts
                  <Badge variant="secondary">{posts.length}</Badge>
                  {posts.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      Scroll to see more
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No posts generated yet. Create some content first!
                  </div>
                ) : (
                  <div className="relative">
                    <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {posts.map((post) => {
                      const platform = platforms.find(p => p.id === post.platform);
                      const IconComponent = platform?.icon || Instagram;
                      
                      return (
                        <div key={post.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                              <IconComponent className={`h-5 w-5 ${platform?.color}`} />
                              <span className="font-medium capitalize">{post.platform}</span>
                              <Badge variant={post.status === 'completed' ? 'default' : post.status === 'generating' ? 'secondary' : 'destructive'}>
                                {post.status}
                          </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPost(post)}
                              disabled={post.status !== 'completed'}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                        </div>
                          
                          {post.status === 'completed' && (
                            <div className="space-y-3">
                              {post.content.image && (
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                  <img
                                    src={post.content.image}
                                    alt="Generated content"
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                  />
                  </div>
                )}
                              
                    <div>
                                <p className="text-sm font-medium mb-1">Caption:</p>
                                <p className="text-sm text-muted-foreground">{post.content.caption}</p>
                    </div>
                              
                              {post.content.hashtags.length > 0 && (
                    <div>
                                  <p className="text-sm font-medium mb-1">Hashtags:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {post.content.hashtags.map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        #{tag}
                                      </Badge>
                                    ))}
                    </div>
                  </div>
                              )}
                            </div>
                          )}
                          
                          {post.status === 'generating' && (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">Generating content...</span>
                        </div>
                          )}
                      </div>
                    );
                  })}
                    </div>
                    {/* Gradient fade effect at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}