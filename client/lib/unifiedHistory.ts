import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface BaseHistoryItem {
  id?: string;
  userId: string;
  timestamp: Date;
  feature: string; // 'chat', 'storytelling', 'image-studio', 'marketing', 'voice'
  metadata?: {
    language?: string;
    sessionId?: string;
    [key: string]: any;
  };
}

export interface ChatHistoryItem extends BaseHistoryItem {
  type: 'chat';
  userMessage: string;
  aiResponse: string;
  generatedImages?: Array<{
    prompt: string;
    imageUrl: string;
    isGenerated: boolean;
  }>;
}

export interface StoryHistoryItem extends BaseHistoryItem {
  type: 'story';
  originalPrompt: string;
  enhancedPrompt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  status: 'draft' | 'enhanced' | 'generating' | 'completed' | 'failed';
  title?: string;
}

export interface ImageHistoryItem extends BaseHistoryItem {
  type: 'image';
  prompt: string;
  imageUrl: string;
  operation: 'generate' | 'enhance' | 'background-swap';
  originalImageUrl?: string; // For enhance/background-swap operations
  settings?: {
    brightness?: number;
    saturation?: number;
    hue?: number;
    blur?: number;
    sharpen?: number;
  };
  backgroundType?: 'standard' | 'premium' | 'festive' | 'custom';
}

export interface MarketingHistoryItem extends BaseHistoryItem {
  type: 'marketing';
  content: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'general';
  contentType: 'post' | 'caption' | 'hashtags' | 'strategy';
  generatedContent?: string;
  hashtags?: string[];
  postingTime?: string;
}

export interface VoiceHistoryItem extends BaseHistoryItem {
  type: 'voice';
  audioUrl: string;
  transcript: string;
  language: string;
  translatedText?: string;
  action: 'upload' | 'transcribe' | 'translate';
}

export type HistoryItem = ChatHistoryItem | StoryHistoryItem | ImageHistoryItem | MarketingHistoryItem | VoiceHistoryItem;

export interface HistorySession {
  id: string;
  userId: string;
  feature: string;
  title: string;
  createdAt: Date;
  lastActivityAt: Date;
  itemCount: number;
  items: HistoryItem[];
}

class UnifiedHistoryService {
  private readonly COLLECTION_NAME = 'userHistory';
  private readonly SESSIONS_COLLECTION = 'historySessions';

  /**
   * Save any type of history item
   */
  async saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<string> {
    try {
      const itemData = {
        ...item,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), itemData);
      
      // Update session
      await this.updateSession(item.userId, item.feature, item);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving history item:', error);
      throw new Error('Failed to save history item');
    }
  }

  /**
   * Get history for a specific feature
   */
  async getFeatureHistory(userId: string, feature: string, limitCount: number = 50): Promise<HistoryItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('feature', '==', feature),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const items: HistoryItem[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as HistoryItem);
      });

      return items.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching feature history:', error);
      throw new Error('Failed to fetch feature history');
    }
  }

  /**
   * Get all history for a user across all features
   */
  async getAllHistory(userId: string, limitCount: number = 100): Promise<HistoryItem[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const items: HistoryItem[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as HistoryItem);
      });

      return items;
    } catch (error) {
      console.error('Error fetching all history:', error);
      throw new Error('Failed to fetch all history');
    }
  }

  /**
   * Get history sessions for a user
   */
  async getHistorySessions(userId: string): Promise<HistorySession[]> {
    try {
      const q = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('lastActivityAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions: HistorySession[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.userId,
          feature: data.feature,
          title: data.title,
          createdAt: data.createdAt.toDate(),
          lastActivityAt: data.lastActivityAt.toDate(),
          itemCount: data.itemCount,
          items: data.items || []
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching history sessions:', error);
      throw new Error('Failed to fetch history sessions');
    }
  }

  /**
   * Get recent history items for quick loading
   */
  async getRecentHistory(userId: string, feature?: string, count: number = 10): Promise<HistoryItem[]> {
    if (feature) {
      return this.getFeatureHistory(userId, feature, count);
    }
    return this.getAllHistory(userId, count);
  }

  /**
   * Update or create a history session
   */
  private async updateSession(userId: string, feature: string, item: HistoryItem): Promise<void> {
    try {
      const title = this.generateSessionTitle(item);
      
      // Check if there's an active session today for this feature
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('feature', '==', feature),
        where('createdAt', '>=', Timestamp.fromDate(today))
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new session
        await addDoc(collection(db, this.SESSIONS_COLLECTION), {
          userId,
          feature,
          title,
          createdAt: Timestamp.now(),
          lastActivityAt: Timestamp.now(),
          itemCount: 1,
          items: [item]
        });
      } else {
        // Update existing session
        const sessionDoc = querySnapshot.docs[0];
        const sessionData = sessionDoc.data();
        await addDoc(collection(db, this.SESSIONS_COLLECTION), {
          ...sessionData,
          lastActivityAt: Timestamp.now(),
          itemCount: (sessionData.itemCount || 0) + 1,
          items: [...(sessionData.items || []), item]
        });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      // Don't throw error for session update failures
    }
  }

  /**
   * Generate a session title based on the item type
   */
  private generateSessionTitle(item: HistoryItem): string {
    switch (item.type) {
      case 'chat':
        return item.userMessage.substring(0, 50).trim() + (item.userMessage.length > 50 ? '...' : '');
      case 'story':
        return item.originalPrompt.substring(0, 50).trim() + (item.originalPrompt.length > 50 ? '...' : '');
      case 'image':
        return item.prompt.substring(0, 50).trim() + (item.prompt.length > 50 ? '...' : '');
      case 'marketing':
        return item.content.substring(0, 50).trim() + (item.content.length > 50 ? '...' : '');
      case 'voice':
        return item.transcript.substring(0, 50).trim() + (item.transcript.length > 50 ? '...' : '');
      default:
        return `${item.feature} session`;
    }
  }

  /**
   * Clear history for a specific feature
   */
  async clearFeatureHistory(userId: string, feature: string): Promise<void> {
    try {
      console.log(`Clear ${feature} history requested for user: ${userId}`);
      // Implementation would require batch delete operations
      // For now, we'll just log that this feature is requested
    } catch (error) {
      console.error('Error clearing feature history:', error);
      throw new Error('Failed to clear feature history');
    }
  }

  /**
   * Clear all history for a user
   */
  async clearAllHistory(userId: string): Promise<void> {
    try {
      console.log(`Clear all history requested for user: ${userId}`);
      // Implementation would require batch delete operations
      // For now, we'll just log that this feature is requested
    } catch (error) {
      console.error('Error clearing all history:', error);
      throw new Error('Failed to clear all history');
    }
  }

  /**
   * Get history statistics for a user
   */
  async getHistoryStats(userId: string): Promise<{
    totalItems: number;
    featureCounts: Record<string, number>;
    lastActivity: Date | null;
  }> {
    try {
      const allHistory = await this.getAllHistory(userId, 1000); // Get more items for stats
      
      const featureCounts: Record<string, number> = {};
      let lastActivity: Date | null = null;
      
      allHistory.forEach(item => {
        featureCounts[item.feature] = (featureCounts[item.feature] || 0) + 1;
        if (!lastActivity || item.timestamp > lastActivity) {
          lastActivity = item.timestamp;
        }
      });
      
      return {
        totalItems: allHistory.length,
        featureCounts,
        lastActivity
      };
    } catch (error) {
      console.error('Error getting history stats:', error);
      throw new Error('Failed to get history stats');
    }
  }
}

// Export a singleton instance
export const unifiedHistoryService = new UnifiedHistoryService();
