import { createServer } from '../server/index';
import serverless from 'serverless-http';

// Create the Express app
const app = createServer();

// Export the serverless handler
export default serverless(app);
