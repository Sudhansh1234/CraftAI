import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  getDashboardData, 
  getUserProducts, 
  addBusinessMetric, 
  generateInsights,
  createUserDataEndpoint 
} from '../../server/routes/dashboard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { params } = req.query;
  const pathSegments = Array.isArray(params) ? params : [params];
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Create a mock Express request object
  const mockReq = {
    params: { userId: pathSegments[0] },
    query: req.query,
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.url
  } as any;

  // Create a mock Express response object
  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => res.status(code).json(data)
    }),
    json: (data: any) => res.json(data)
  } as any;

  try {
    // Route based on the path segments
    if (pathSegments.length === 1) {
      // /api/dashboard/{userId} - Get dashboard data
      if (req.method === 'GET') {
        await getDashboardData(mockReq, mockRes, () => {});
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } else if (pathSegments.length === 2) {
      const [userId, action] = pathSegments;
      
      if (action === 'products' && req.method === 'GET') {
        // /api/dashboard/{userId}/products
        await getUserProducts(mockReq, mockRes, () => {});
      } else if (action === 'add-metric' && req.method === 'POST') {
        // /api/dashboard/{userId}/add-metric
        await addBusinessMetric(mockReq, mockRes, () => {});
      } else {
        res.status(404).json({ error: 'Endpoint not found' });
      }
    } else if (pathSegments.length === 3) {
      const [userId, category, action] = pathSegments;
      
      if (category === 'insights' && action === 'generate' && req.method === 'POST') {
        // /api/dashboard/{userId}/insights/generate
        await generateInsights(mockReq, mockRes, () => {});
      } else {
        res.status(404).json({ error: 'Endpoint not found' });
      }
    } else if (pathSegments.length === 1 && pathSegments[0] === 'create-user' && req.method === 'POST') {
      // /api/dashboard/create-user
      await createUserDataEndpoint(mockReq, mockRes, () => {});
    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
