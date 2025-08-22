import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { SpeechClient } from '@google-cloud/speech';
import { Translate } from '@google-cloud/translate';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { LanguageServiceClient } from '@google-cloud/language';

// Google Cloud configuration
const PROJECT_ID = 'expanded-flame-469612-c2';
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

