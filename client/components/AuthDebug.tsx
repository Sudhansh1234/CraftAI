import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AuthDebug() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading authentication status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <strong>Status:</strong> 
          <Badge variant={currentUser ? "default" : "destructive"} className="ml-2">
            {currentUser ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        {currentUser && (
          <>
            <div>
              <strong>User ID:</strong> 
              <code className="ml-2 text-xs bg-gray-100 p-1 rounded">
                {currentUser.uid}
              </code>
            </div>
            <div>
              <strong>Email:</strong> 
              <span className="ml-2">{currentUser.email}</span>
            </div>
            <div>
              <strong>Display Name:</strong> 
              <span className="ml-2">{currentUser.displayName || "Not set"}</span>
            </div>
            <div>
              <strong>Provider:</strong> 
              <span className="ml-2">
                {currentUser.providerData[0]?.providerId || "Unknown"}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
