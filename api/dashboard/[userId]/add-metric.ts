import { VercelRequest, VercelResponse } from '@vercel/node';
import { addBusinessMetric } from '../../../server/routes/dashboard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create a mock Express request object
  const mockReq = {
    params: { userId: req.query.userId as string },
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
    await addBusinessMetric(mockReq, mockRes, () => {});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
