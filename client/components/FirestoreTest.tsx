import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function FirestoreTest() {
  const { currentUser } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testFirestore = async () => {
    if (!currentUser) {
      setTestResult('❌ No user authenticated');
      return;
    }

    setIsLoading(true);
    setTestResult('🔄 Testing Firestore...');

    try {
      // Test 1: Try to write to Firestore
      const testData = {
        userId: currentUser.uid,
        message: 'Test message',
        timestamp: Timestamp.now(),
        test: true
      };

      const docRef = await addDoc(collection(db, 'testCollection'), testData);
      setTestResult(`✅ Write successful! Document ID: ${docRef.id}`);

      // Test 2: Try to read from Firestore
      const querySnapshot = await getDocs(collection(db, 'testCollection'));
      const docs = querySnapshot.docs.map(doc => doc.data());
      
      setTestResult(prev => prev + `\n✅ Read successful! Found ${docs.length} documents`);
      
      toast.success('Firestore test passed!');
    } catch (error: any) {
      console.error('Firestore test error:', error);
      setTestResult(`❌ Error: ${error.message}\nCode: ${error.code}`);
      toast.error('Firestore test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Firestore Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <strong>User Status:</strong>
          <Badge variant={currentUser ? "default" : "destructive"}>
            {currentUser ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        {currentUser && (
          <div>
            <strong>User ID:</strong>
            <code className="ml-2 text-xs bg-gray-100 p-1 rounded">
              {currentUser.uid}
            </code>
          </div>
        )}

        <Button 
          onClick={testFirestore} 
          disabled={!currentUser || isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Firestore Connection'}
        </Button>

        {testResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <strong>Test Result:</strong>
            <pre className="mt-2 text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
