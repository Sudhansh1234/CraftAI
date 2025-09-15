export default async function handler(req, res) {
  try {
    console.log('Dashboard API called:', {
      url: req.url,
      method: req.method,
      headers: req.headers
    });

    // For now, just return a simple response to test if the endpoint is working
    res.status(200).json({ 
      message: 'Dashboard API is working (JS version)',
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
