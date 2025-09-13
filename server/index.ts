import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.local (dev) or .env.production (prod)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: path.resolve(process.cwd(), envFile) });

import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSpeechToText, handleSpeechHealth } from "./routes/speech";
import { handleAIChat, handleAIHealth } from "./routes/ai";
import { handleImageGenerate, handleImageEnhance, handleImageBgSwap } from "./routes/images";
import { handleGenerateVideo, handleVideoStatus, handleVideoDownload, handleDebugVeo3 } from "./routes/videos";
import { handleLocationSearch, generateLocationInsights, reverseGeocode } from "./routes/location";
import * as businessFlowRoutes from "./routes/business-flow";
import { 
  generateFlow, 
  saveAnswers, 
  saveFlow, 
  getQuestionnaires, 
  getQuestionnaire, 
  createQuestionnaire, 
  updateQuestionnaire, 
  deleteQuestionnaire,
  testQuestionnaire
} from "./routes/questionnaire";
import * as socialRoutes from "./routes/social";
import * as dashboardRoutes from "./routes/dashboard";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Debug endpoint to check environment variables
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not set',
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not set',
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not set',
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? 'Set' : 'Not set'
    });
  });

  // Debug endpoint to check Firebase configuration at runtime
  app.get("/api/debug/firebase", async (_req, res) => {
    try {
      // Import Firebase module and check configuration
      const firebase = await import("./database/firebase");
      
      // Manually create config to see what's being used
      const config = {
        apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
        appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
      };
      
      res.json({
        environmentVars: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
        },
        firebaseConfig: config,
        isConfigured: firebase.isFirebaseConfigured()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/demo", handleDemo);

  // Speech recognition endpoints
  app.post("/api/speech/recognize", handleSpeechToText);
  app.get("/api/speech/health", handleSpeechHealth);

  // AI chat endpoints
  app.post("/api/ai/chat", handleAIChat);
  app.get("/api/ai/health", handleAIHealth);

  // Image endpoints
  app.post("/api/images/generate", handleImageGenerate);
  app.post("/api/images/enhance", handleImageEnhance);
  app.post("/api/images/bg-swap", handleImageBgSwap);

  // Video generation endpoints
  app.post("/api/videos/generate", handleGenerateVideo);
  app.get("/api/videos/:videoId/status", handleVideoStatus);
  app.get("/api/videos/:videoId/download", handleVideoDownload);
  app.get("/api/videos/debug/veo3", handleDebugVeo3);

  // Location-based search endpoints
  app.post("/api/location/search", handleLocationSearch);
  app.post("/api/location/insights", generateLocationInsights);
  app.get("/api/location/reverse-geocode", reverseGeocode);

  // Business Flow endpoints
  app.get("/api/business-flow/charts/:userId", businessFlowRoutes.getCharts);
  app.get("/api/business-flow/charts/:chartId", businessFlowRoutes.getChart);
  app.post("/api/business-flow/charts", businessFlowRoutes.createChart);
  app.patch("/api/business-flow/charts/:chartId", businessFlowRoutes.updateChart);
  app.post("/api/business-flow/charts/:chartId/nodes", businessFlowRoutes.addNode);
  app.patch("/api/business-flow/nodes/:nodeId", businessFlowRoutes.updateNode);
  app.delete("/api/business-flow/nodes/:nodeId", businessFlowRoutes.deleteNode);
  app.post("/api/business-flow/charts/:chartId/edges", businessFlowRoutes.addEdge);
  app.post("/api/business-flow/ai-expand", businessFlowRoutes.aiExpand);
  app.post("/api/business-flow/generate-node", businessFlowRoutes.generateNode);
  app.get("/api/business-flow/charts/:chartId/history", businessFlowRoutes.getChartHistory);
  app.get("/api/business-flow/charts/:chartId/export", businessFlowRoutes.exportChart);
  
  // Business Flow data persistence endpoints
  app.post("/api/business-flow/:userId/save", businessFlowRoutes.saveBusinessFlow);
  app.get("/api/business-flow/:userId/latest", businessFlowRoutes.getLatestBusinessFlow);
  app.get("/api/business-flow/:userId/all", businessFlowRoutes.getAllBusinessFlows);
  app.put("/api/business-flow/:userId/:flowId", businessFlowRoutes.updateBusinessFlow);
  app.delete("/api/business-flow/:userId/:flowId", businessFlowRoutes.deleteBusinessFlow);

  // Questionnaire endpoints (static questionnaire, Gemini only for flow generation)
  app.get("/api/questionnaires/:userId", getQuestionnaires);
  app.get("/api/questionnaires/:userId/:questionnaireId", getQuestionnaire);
  app.post("/api/questionnaires", createQuestionnaire);
  app.put("/api/questionnaires/:questionnaireId", updateQuestionnaire);
  app.delete("/api/questionnaires/:questionnaireId", deleteQuestionnaire);
  app.post("/api/questionnaire/generate-flow", generateFlow);
  app.post("/api/questionnaire/save-answers", saveAnswers);
  app.post("/api/questionnaire/save-flow", saveFlow);
  app.get("/api/questionnaire/test", testQuestionnaire);

  // Social Media endpoints
  app.post("/api/social/generate-post", socialRoutes.handleGeneratePost);
  app.get("/api/social/platforms", socialRoutes.handleGetPlatforms);

  // Dashboard endpoints (specific routes first to avoid conflicts)
  app.get("/api/dashboard/test", dashboardRoutes.testEndpoint);
  app.get("/api/dashboard/test-firebase", dashboardRoutes.testFirebaseConnection);
  app.get("/api/dashboard/health", dashboardRoutes.healthCheckEndpoint);
  app.post("/api/dashboard/seed", dashboardRoutes.seedDatabase);
  app.post("/api/dashboard/create-user", dashboardRoutes.createUserDataEndpoint);
  app.post("/api/dashboard/:userId/add-metric", dashboardRoutes.extractUserId, dashboardRoutes.addBusinessMetric);
  app.get("/api/dashboard/:userId/products", dashboardRoutes.extractUserId, dashboardRoutes.getUserProducts);
  app.get("/api/dashboard/:userId/all-metrics", dashboardRoutes.extractUserId, dashboardRoutes.getAllBusinessMetrics);
  app.get("/api/dashboard/market-trends", dashboardRoutes.getMarketTrends);
  app.patch("/api/dashboard/insights/:insightId/status", dashboardRoutes.updateInsightStatus);
  app.patch("/api/dashboard/recommendations/:recommendationId/status", dashboardRoutes.updateRecommendationStatus);
  app.get("/api/dashboard/:userId", dashboardRoutes.extractUserId, dashboardRoutes.getDashboardData);
  app.get("/api/dashboard/:userId/insights", dashboardRoutes.extractUserId, dashboardRoutes.getInsights);
  app.post("/api/dashboard/:userId/insights", dashboardRoutes.extractUserId, dashboardRoutes.createInsight);
  app.post("/api/dashboard/:userId/insights/generate", dashboardRoutes.extractUserId, dashboardRoutes.generateInsights);
  app.get("/api/dashboard/:userId/metrics", dashboardRoutes.extractUserId, dashboardRoutes.getBusinessMetrics);
  app.post("/api/dashboard/:userId/metrics", dashboardRoutes.extractUserId, dashboardRoutes.createBusinessMetric);
  app.get("/api/dashboard/:userId/recommendations", dashboardRoutes.extractUserId, dashboardRoutes.getRecommendations);

  return app;
}
