import { VercelRequest, VercelResponse } from '@vercel/node';

// Import the dashboard route handlers directly
import { 
  getDashboardData, 
  extractUserId,
  createUserDataEndpoint,
  getUserProducts,
  getAllBusinessMetrics,
  getInsights,
  getBusinessMetrics,
  getRecommendations,
  addBusinessMetric,
  generateInsights
} from '../server/routes/dashboard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the path and method
    const url = new URL(req.url || '', `https://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const method = req.method?.toLowerCase() || 'get';
    
    // Extract userId from the path
    const userId = pathParts[pathParts.length - 1];
    
    // Create a mock Express request object
    const mockReq = {
      ...req,
      params: { userId },
      query: req.query,
      body: req.body,
      method: method.toUpperCase(),
      url: req.url,
      headers: req.headers,
    };

    // Create a mock Express response object
    const mockRes = {
      status: (code: number) => {
        res.status(code);
        return mockRes;
      },
      json: (data: any) => {
        res.json(data);
      },
      send: (data: any) => {
        res.send(data);
      },
      setHeader: (name: string, value: string) => {
        res.setHeader(name, value);
      },
    };

    // Route to the appropriate handler based on the path
    if (pathParts.includes('create-user')) {
      await createUserDataEndpoint(mockReq, mockRes);
    } else if (pathParts.includes('products')) {
      await extractUserId(mockReq, mockRes, () => getUserProducts(mockReq, mockRes));
    } else if (pathParts.includes('all-metrics')) {
      await extractUserId(mockReq, mockRes, () => getAllBusinessMetrics(mockReq, mockRes));
    } else if (pathParts.includes('insights') && pathParts.includes('generate')) {
      await extractUserId(mockReq, mockRes, () => generateInsights(mockReq, mockRes));
    } else if (pathParts.includes('insights')) {
      await extractUserId(mockReq, mockRes, () => getInsights(mockReq, mockRes));
    } else if (pathParts.includes('metrics')) {
      await extractUserId(mockReq, mockRes, () => getBusinessMetrics(mockReq, mockRes));
    } else if (pathParts.includes('add-metric')) {
      await extractUserId(mockReq, mockRes, () => addBusinessMetric(mockReq, mockRes));
    } else if (pathParts.includes('recommendations')) {
      await extractUserId(mockReq, mockRes, () => getRecommendations(mockReq, mockRes));
    } else {
      // Default to getDashboardData for the main dashboard endpoint
      await extractUserId(mockReq, mockRes, () => getDashboardData(mockReq, mockRes));
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
