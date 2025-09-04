import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  feature?: string;
}

export default function ProtectedRoute({ children, feature }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      // Redirect to auth page if not authenticated
      navigate('/auth', { 
        state: { 
          from: window.location.pathname,
          feature: feature 
        } 
      });
    }
  }, [currentUser, loading, navigate, feature]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-lg gemini-gradient flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Will redirect to auth page if not authenticated
  if (!currentUser) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}