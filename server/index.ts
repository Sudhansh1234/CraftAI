import { config } from "dotenv";
import path from "path";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSpeechToText, handleSpeechHealth } from "./routes/speech";
import { handleAIChat, handleAIHealth } from "./routes/ai";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  return app;
}
