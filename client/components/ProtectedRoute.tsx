import { ReactNode } from 'react';
import { useAuth } from '@/contexts/MockAuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, ArrowRight, Users, BarChart3, Image, Video } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  feature?: string;
}

export default function ProtectedRoute({ children, feature }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      // User is not authenticated, redirect to auth page
      navigate('/auth');
    }
  }, [currentUser, loading, navigate]);

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

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 gemini-gradient opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/80 to-background"></div>
        </div>

        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-lg gemini-gradient flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access {feature ? `the ${feature}` : 'this feature'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="secondary" className="px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  Secure Access
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Sign in to unlock all features and save your progress
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">AI Chatbot</p>
                  <p className="text-xs text-muted-foreground">Multi-language business advice</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Image className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Image Studio</p>
                  <p className="text-xs text-muted-foreground">AI image generation & enhancement</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Video className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Storytelling</p>
                  <p className="text-xs text-muted-foreground">AI video creation with Veo 3</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Dashboard</p>
                  <p className="text-xs text-muted-foreground">Business analytics & insights</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/auth')}
              className="w-full h-12 gemini-gradient text-white border-0 hover:opacity-90"
            >
              <div className="flex items-center space-x-2">
                <span>Sign In to Continue</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Free to start • No credit card required • Secure authentication
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
