import { createServer } from "../server/index.js";

// Create the Express app
const app = createServer();

// Export the app as a Vercel serverless function
export default app;
