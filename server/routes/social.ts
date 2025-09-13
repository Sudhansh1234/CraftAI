import { RequestHandler } from 'express';
import { initializeVertexAI, extractTextFromResponse, generateImageWithGemini25 } from './ai';

interface GeneratePostRequest {
  prompt: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  language: string;
  productImage?: {
    name: string;
    data: string;
  };
}

interface GeneratePostResponse {
    image?: string;
  video?: string;
    caption: string;
    hashtags: string[];
  platform: string;
}

// Initialize Vertex AI
let aiInstance: any = null;

const getVertexAI = async () => {
  if (!aiInstance) {
    aiInstance = await initializeVertexAI();
  }
  return aiInstance;
};

// Generate platform-specific content
const generatePlatformContent = async (
  prompt: string, 
  platform: string, 
  language: string,
  productImage?: { name: string; data: string }
): Promise<{ caption: string; hashtags: string[] }> => {
  try {
    const { model } = await getVertexAI();
    
    const platformContext = {
      instagram: "Instagram post with engaging visual content, trendy hashtags, and emojis",
      facebook: "Facebook post with detailed description, community-focused content, and relevant hashtags",
      twitter: "X (Twitter) post with concise, engaging text, trending hashtags, and character limit awareness"
    };

    console.log('Platform context for', platform, ':', platformContext[platform as keyof typeof platformContext]);

    const systemPrompt = `You are a social media content creator specializing in ${platform} posts for artisans and craft businesses.

Platform: ${platform}
Language: ${language}
Platform Guidelines: ${platformContext[platform as keyof typeof platformContext]}

${productImage ? `Product Image: ${productImage.name} - Use this product as the main focus of the content.` : ''}

User Request: ${prompt}

Generate:
1. A compelling caption (2-3 sentences for Instagram, 1-2 sentences for Facebook, 1 sentence for Twitter)
2. 5-10 relevant hashtags for the platform and content

Format your response as JSON:
{
  "caption": "Your generated caption here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    const result = await model.generateContent(systemPrompt);

    const response = await result.response;
    const text = extractTextFromResponse(response);
    
    try {
      // Clean markdown code blocks from the response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return {
        caption: parsed.caption || 'Generated caption',
        hashtags: parsed.hashtags || []
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        caption: text || 'Generated caption',
        hashtags: ['artisan', 'handmade', 'craft']
      };
    }
  } catch (error) {
    console.error('Error generating platform content:', error);
    return {
      caption: `Check out this amazing ${prompt.toLowerCase()}! Perfect for your collection.`,
      hashtags: ['artisan', 'handmade', 'craft', 'unique', 'beautiful']
    };
  }
};

// Generate image using Vertex AI Imagen
const generateImage = async (prompt: string, platform: string, productImage?: { name: string; data: string }): Promise<string | null> => {
  try {
    if (!productImage) {
      // If no product image provided, return a placeholder
      const dimensions = platform === 'instagram' ? '400x400' : '600x400';
      const encodedText = encodeURIComponent(prompt.substring(0, 20));
      return `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
    }

    // Use Gemini 2.5 Flash Image Preview for true image-to-image generation
    const imagePrompt = `Create professional product photography for ${platform} that preserves the exact design and appearance of the uploaded pottery/product.
    
    CRITICAL REQUIREMENTS:
    - PRESERVE the original product design, shape, colors, patterns, and textures exactly as they are
    - DO NOT change the product's design, style, or artistic elements
    - ONLY enhance the photography setup, lighting, and presentation
    - Platform: ${platform} (${platform === 'instagram' ? 'square format 1:1' : 'landscape format 16:9'})
    - Background: Clean, professional white or neutral background
    - Lighting: Soft, even lighting that highlights the product's details
    - Composition: Center the product as the main subject
    - Quality: High resolution, commercial photography style
    - Focus: Showcase the product's authentic craftsmanship and design
    
    The goal is to create professional product photography that makes the existing design look its best, NOT to redesign or modify the product itself.`;

    console.log('🎨 Using Gemini 2.5 Flash Image Preview for image generation...');
    
    // Add a small delay to avoid quota issues
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use Gemini 2.5 Flash Image Preview for both analysis and generation
    const generatedImageUrl = await generateImageWithGemini25(imagePrompt, productImage.data);
    
    if (generatedImageUrl) {
      console.log('✅ Image generated successfully with Gemini 2.5');
      return generatedImageUrl;
    } else {
      console.log('⚠️ Image generation returned null, using fallback');
      // Fallback to placeholder if AI generation fails
      const dimensions = platform === 'instagram' ? '400x400' : '600x400';
      const encodedText = encodeURIComponent(prompt.substring(0, 20));
      return `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
    }
  } catch (error) {
    console.error('❌ Image generation failed:', error);
    
    // Check if it's a quota error
    if (error instanceof Error && error.message.includes('429')) {
      console.log('⚠️ Quota exceeded, using fallback image');
    }
    
    // Fallback to placeholder if AI generation fails
    const dimensions = platform === 'instagram' ? '400x400' : '600x400';
    const encodedText = encodeURIComponent(prompt.substring(0, 20));
    return `https://dummyimage.com/${dimensions}/6366f1/ffffff&text=${encodedText}`;
  }
};

// Generate video using Vertex AI Veo
const generateVideo = async (prompt: string, platform: string): Promise<string | null> => {
  try {
    // For now, return null as video generation is more complex
    // In a real implementation, you would use the Veo API
    return null;
  } catch (error) {
    console.error('Error generating video:', error);
    return null;
  }
};

// Main post generation handler
export const handleGeneratePost: RequestHandler = async (req, res) => {
  try {
    const { prompt, platform, language, productImage }: GeneratePostRequest = req.body;

    if (!prompt || !platform) {
      return res.status(400).json({ 
        error: "Prompt and platform are required" 
      });
    }

    console.log(`🎨 Generating ${platform} post:`, { prompt, language, hasImage: !!productImage });

    // Generate content for the platform
    const content = await generatePlatformContent(prompt, platform, language, productImage);
    
    // Generate image
    const image = await generateImage(prompt, platform, productImage);
    
    // Generate video (optional)
    const video = await generateVideo(prompt, platform);

    const response: GeneratePostResponse = {
      image,
      video,
      caption: content.caption,
      hashtags: content.hashtags,
      platform
    };

    console.log(`✅ Generated ${platform} post successfully`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating social post:', error);
    res.status(500).json({ 
      error: "Failed to generate social media post",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get available platforms
export const handleGetPlatforms: RequestHandler = async (req, res) => {
  try {
    const platforms = [
      {
        id: 'instagram',
        name: 'Instagram',
        description: 'Visual content with hashtags and stories',
        icon: '📸',
        color: '#E4405F'
      },
      {
        id: 'facebook',
        name: 'Facebook',
        description: 'Community-focused posts with detailed descriptions',
        icon: '👥',
        color: '#1877F2'
      },
      {
        id: 'twitter',
        name: 'X (Twitter)',
        description: 'Concise posts with trending hashtags',
        icon: '🐦',
        color: '#1DA1F2'
      }
    ];

    res.json({ platforms });
  } catch (error) {
    console.error('❌ Error getting platforms:', error);
    res.status(500).json({ 
      error: "Failed to get platforms",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};