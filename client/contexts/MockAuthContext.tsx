import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Mock user type
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface MockAuthContextType {
  currentUser: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('mockUser');
      }
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Simulate Google sign-in with a mock user
      const mockUser: MockUser = {
        uid: 'mock-user-123',
        email: 'demo@craftai.com',
        displayName: 'Demo User',
        photoURL: null
      };
      
      // Save to localStorage
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Remove from localStorage
      localStorage.removeItem('mockUser');
      setCurrentUser(null);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: MockAuthContextType = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {!loading && children}
    </MockAuthContext.Provider>
  );
}
