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

export interface ChatMessage {
  id?: string;
  userId: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  generatedImages?: Array<{
    prompt: string;
    imageUrl: string;
    isGenerated: boolean;
  }>;
  metadata?: {
    language?: string;
    feature?: string;
    sessionId?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

class ChatHistoryService {
  private readonly COLLECTION_NAME = 'chatMessages';
  private readonly SESSIONS_COLLECTION = 'chatSessions';

  /**
   * Save a chat message to Firestore
   */
  async saveMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      // Clean up undefined values before saving to Firestore
      const messageData = {
        userId: message.userId,
        userMessage: message.userMessage,
        aiResponse: message.aiResponse,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        // Only include generatedImages if it exists and is not empty
        ...(message.generatedImages && message.generatedImages.length > 0 && {
          generatedImages: message.generatedImages
        }),
        // Only include metadata if it exists
        ...(message.metadata && {
          metadata: message.metadata
        })
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), messageData);
      
      // Also update the session
      await this.updateSession(message.userId, message.userMessage);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw new Error('Failed to save chat message');
    }
  }

  /**
   * Get chat history for a specific user
   */
  async getChatHistory(userId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      // Try the indexed query first
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          userId: data.userId,
          userMessage: data.userMessage,
          aiResponse: data.aiResponse,
          timestamp: data.timestamp.toDate(),
          generatedImages: data.generatedImages || [],
          metadata: data.metadata || {}
        });
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching chat history with index:', error);
      
      // Fallback: Try a simpler query without orderBy if index is still building
      try {
        console.log('Trying fallback query without orderBy...');
        const fallbackQuery = query(
          collection(db, this.COLLECTION_NAME),
          where('userId', '==', userId),
          limit(limitCount)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);
        const messages: ChatMessage[] = [];

        fallbackSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            userId: data.userId,
            userMessage: data.userMessage,
            aiResponse: data.aiResponse,
            timestamp: data.timestamp.toDate(),
            generatedImages: data.generatedImages || [],
            metadata: data.metadata || {}
          });
        });

        // Sort manually since we can't use orderBy
        messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return messages.slice(0, limitCount);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new Error('Failed to fetch chat history');
      }
    }
  }

  /**
   * Get chat sessions for a user
   */
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      // Use a simpler query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];

      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          createdAt: data.createdAt.toDate(),
          lastMessageAt: data.lastMessageAt.toDate(),
          messageCount: data.messageCount
        });
      });

      // Sort by lastMessageAt in JavaScript instead of Firestore
      sessions.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      return sessions;
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      throw new Error('Failed to fetch chat sessions');
    }
  }

  /**
   * Update or create a chat session
   */
  private async updateSession(userId: string, userMessage: string): Promise<void> {
    try {
      // Generate a session title from the first message
      const title = this.generateSessionTitle(userMessage);
      
      // Check if there's an active session today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, this.SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(today))
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new session
        await addDoc(collection(db, this.SESSIONS_COLLECTION), {
          userId,
          title,
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          messageCount: 1
        });
      } else {
        // Update existing session
        const sessionDoc = querySnapshot.docs[0];
        await addDoc(collection(db, this.SESSIONS_COLLECTION), {
          ...sessionDoc.data(),
          lastMessageAt: Timestamp.now(),
          messageCount: (sessionDoc.data().messageCount || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      // Don't throw error for session update failures
    }
  }

  /**
   * Generate a session title from the user message
   */
  private generateSessionTitle(message: string): string {
    // Take first 50 characters and clean up
    const title = message.substring(0, 50).trim();
    return title.length < message.length ? `${title}...` : title;
  }

  /**
   * Get recent messages for a user (for quick loading)
   */
  async getRecentMessages(userId: string, count: number = 10): Promise<ChatMessage[]> {
    return this.getChatHistory(userId, count);
  }

  /**
   * Clear chat history for a user (optional feature)
   */
  async clearChatHistory(userId: string): Promise<void> {
    try {
      // Note: This would require batch delete operations
      // For now, we'll just log that this feature is requested
      console.log(`Clear chat history requested for user: ${userId}`);
      // Implementation would require additional Firestore rules and batch operations
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error('Failed to clear chat history');
    }
  }
}

// Export a singleton instance
export const chatHistoryService = new ChatHistoryService();

