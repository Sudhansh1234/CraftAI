import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Create user data in Firebase after successful login
      if (result.user) {
        await createUserDataIfNeeded(result.user);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      // Create user data in Firebase after successful signup
      if (userCredential.user) {
        await createUserDataIfNeeded(userCredential.user);
      }
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Create user data in Firebase after successful login
      if (result.user) {
        await createUserDataIfNeeded(result.user);
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Helper function to create user data if it doesn't exist
  const createUserDataIfNeeded = async (user: User) => {
    try {
      const userInfo = {
        email: user.email || '',
        displayName: user.displayName || undefined,
        businessName: user.displayName ? `${user.displayName}'s Business` : undefined,
        businessType: 'artisan',
        location: 'Unknown'
      };

      const response = await fetch('/api/dashboard/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userInfo
        })
      });

      if (response.ok) {
        console.log('✅ User data created successfully');
      } else {
        console.log('ℹ️ User data may already exist or creation failed');
      }
    } catch (error) {
      console.error('Error creating user data:', error);
      // Don't throw error here as it's not critical for login
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

