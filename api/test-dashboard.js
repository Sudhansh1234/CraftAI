// Test endpoint for debugging dashboard timeout
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Simple test endpoint without Firebase
app.get("/api/dashboard/:userId", (req, res) => {
  console.log('🧪 TEST: Dashboard endpoint called');
  console.log('👤 User ID:', req.params.userId);
  console.log('📅 Timestamp:', new Date().toISOString());
  
  const response = {
    userId: req.params.userId,
    message: "Test endpoint working - no Firebase",
    timestamp: new Date().toISOString(),
    dataSource: "test"
  };
  
  console.log('✅ TEST: Sending response:', response);
  res.json(response);
});

// Health check
app.get("/api/health", (req, res) => {
  console.log('🏥 TEST: Health check called');
  res.json({ status: "ok", message: "Test API working" });
});

export default serverless(app);



