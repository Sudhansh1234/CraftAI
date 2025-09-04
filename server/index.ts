import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSpeechToText, handleSpeechHealth } from "./routes/speech";
import { handleAIChat, handleAIHealth } from "./routes/ai";
import { handleImageGenerate, handleImageEnhance, handleImageBgSwap } from "./routes/images";
import { handleGenerateVideo, handleVideoStatus, handleVideoDownload, handleDebugVeo3 } from "./routes/videos";
import { handleLocationSearch } from "./routes/location";

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

  return app;
}
