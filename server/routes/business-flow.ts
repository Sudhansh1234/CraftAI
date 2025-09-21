import { RequestHandler } from "express";
import { 
  Chart, 
  Node, 
  Edge, 
  AIExpansionRequest, 
  AIExpansionResponse,
  ChartHistory 
} from "@shared/business-flow";

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  params: {
    userId: string;
    [key: string]: string;
  };
}

// Get all charts for a user
export const getCharts: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const userCharts = charts.filter(chart => chart.ownerId === userId);
    res.json(userCharts);
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
};

// Get a specific chart with nodes and edges
export const getChart: RequestHandler = async (req, res) => {
  try {
    const { chartId } = req.params;
    const chart = charts.find(c => c.chartId === chartId);
    
    if (!chart) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    const chartNodes = nodes.filter(node => chart.nodes.includes(node.nodeId));
    const chartEdges = edges.filter(edge => chart.edges.includes(edge.edgeId));

    res.json({
      chart,
      nodes: chartNodes,
      edges: chartEdges
    });
  } catch (error) {
    console.error('Error fetching chart:', error);
    res.status(500).json({ error: 'Failed to fetch chart' });
  }
};

// Create a new chart
export const createChart: RequestHandler = async (req, res) => {
  try {
    const chartData: Omit<Chart, 'chartId' | 'createdAt' | 'updatedAt'> = req.body;
    
    const newChart: Chart = {
      ...chartData,
      chartId: `chart_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    charts.push(newChart);
    
    // Add to history
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: newChart.chartId,
      action: 'create',
      changes: newChart,
      timestamp: new Date().toISOString(),
      userId: chartData.ownerId,
    });

    res.status(201).json(newChart);
  } catch (error) {
    console.error('Error creating chart:', error);
    res.status(500).json({ error: 'Failed to create chart' });
  }
};

// Update a chart
export const updateChart: RequestHandler = async (req, res) => {
  try {
    const { chartId } = req.params;
    const updates = req.body;
    
    const chartIndex = charts.findIndex(c => c.chartId === chartId);
    if (chartIndex === -1) {
      return res.status(404).json({ error: 'Chart not found' });
    }

    const updatedChart = {
      ...charts[chartIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    charts[chartIndex] = updatedChart;
    
    // Add to history
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: chartId,
      action: 'update',
      changes: updates,
      timestamp: new Date().toISOString(),
      userId: updatedChart.ownerId,
    });

    res.json(updatedChart);
  } catch (error) {
    console.error('Error updating chart:', error);
    res.status(500).json({ error: 'Failed to update chart' });
  }
};

// Add a node to a chart
export const addNode: RequestHandler = async (req, res) => {
  try {
    const { chartId } = req.params;
    const nodeData: Omit<Node, 'nodeId' | 'createdAt'> = req.body;
    
    const newNode: Node = {
      ...nodeData,
      nodeId: `node_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    nodes.push(newNode);
    
    // Update chart to include new node
    const chartIndex = charts.findIndex(c => c.chartId === chartId);
    if (chartIndex !== -1) {
      charts[chartIndex].nodes.push(newNode.nodeId);
      charts[chartIndex].updatedAt = new Date().toISOString();
    }
    
    // Add to history
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: chartId,
      action: 'create',
      nodeId: newNode.nodeId,
      changes: newNode,
      timestamp: new Date().toISOString(),
      userId: newNode.createdBy,
    });

    res.status(201).json(newNode);
  } catch (error) {
    console.error('Error adding node:', error);
    res.status(500).json({ error: 'Failed to add node' });
  }
};

// Update a node
export const updateNode: RequestHandler = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const updates = req.body;
    
    const nodeIndex = nodes.findIndex(n => n.nodeId === nodeId);
    if (nodeIndex === -1) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const updatedNode = {
      ...nodes[nodeIndex],
      ...updates,
    };

    nodes[nodeIndex] = updatedNode;
    
    // Add to history
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: updatedNode.chartId,
      action: 'update',
      nodeId: nodeId,
      changes: updates,
      timestamp: new Date().toISOString(),
      userId: updatedNode.createdBy,
    });

    res.json(updatedNode);
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: 'Failed to update node' });
  }
};

// Delete a node
export const deleteNode: RequestHandler = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    const nodeIndex = nodes.findIndex(n => n.nodeId === nodeId);
    if (nodeIndex === -1) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const node = nodes[nodeIndex];
    nodes.splice(nodeIndex, 1);
    
    // Remove from chart
    const chartIndex = charts.findIndex(c => c.chartId === node.chartId);
    if (chartIndex !== -1) {
      charts[chartIndex].nodes = charts[chartIndex].nodes.filter(id => id !== nodeId);
      charts[chartIndex].updatedAt = new Date().toISOString();
    }
    
    // Add to history
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: node.chartId,
      action: 'delete',
      nodeId: nodeId,
      changes: node,
      timestamp: new Date().toISOString(),
      userId: node.createdBy,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Failed to delete node' });
  }
};

// Add an edge
export const addEdge: RequestHandler = async (req, res) => {
  try {
    const { chartId } = req.params;
    const edgeData: Omit<Edge, 'edgeId'> = req.body;
    
    const newEdge: Edge = {
      ...edgeData,
      edgeId: `edge_${Date.now()}`,
    };

    edges.push(newEdge);
    
    // Update chart to include new edge
    const chartIndex = charts.findIndex(c => c.chartId === chartId);
    if (chartIndex !== -1) {
      charts[chartIndex].edges.push(newEdge.edgeId);
      charts[chartIndex].updatedAt = new Date().toISOString();
    }

    res.status(201).json(newEdge);
  } catch (error) {
    console.error('Error adding edge:', error);
    res.status(500).json({ error: 'Failed to add edge' });
  }
};

// AI-powered node expansion
export const aiExpand: RequestHandler = async (req, res) => {
  try {
    const { nodeId, chartId, context }: AIExpansionRequest = req.body;
    
    // Import Vertex AI
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    // Create credentials object from environment variables
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN || 'googleapis.com'
    };
    
    // Create temporary credentials file
    const fs = await import('fs');
    const tempCredentialsPath = './temp-credentials-business-flow.json';
    fs.writeFileSync(tempCredentialsPath, JSON.stringify(credentials, null, 2));
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredentialsPath;
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1'
    });
    
    // Clean up temporary file
    setTimeout(() => {
      try {
        fs.unlinkSync(tempCredentialsPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 1000);

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Create AI prompt for node expansion
    const prompt = `You are ArtisAI, an AI-powered marketplace assistant for Indian artisans. 

Given this business node:
- Title: "${context.nodeContext.title}"
- Description: "${context.nodeContext.description}"
- Type: "${context.nodeContext.type}"
- Tags: ${context.nodeContext.tags.join(', ')}
- Craft Type: ${context.craftType || 'handicrafts'}
- Location: ${context.userLocale}

Generate 4-5 actionable sub-steps the artisan can take next. For each sub-step, return a JSON object with:
- title: Short, actionable title
- description: 1-2 line description of what to do
- type: One of: action, resource, checklist, marketing, pricing, supplier, market
- estimatedEffort: low, medium, or high
- tags: Array of relevant tags
- priority: low, medium, or high

Return only a valid JSON array of objects, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let suggestions;
    try {
      suggestions = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback suggestions
      suggestions = [
        {
          title: "Research Competitors",
          description: "Study similar products and their pricing strategies",
          type: "action",
          estimatedEffort: "medium",
          tags: ["research", "competition"],
          priority: "high"
        },
        {
          title: "Create Product Photos",
          description: "Take high-quality photos showcasing your product",
          type: "action",
          estimatedEffort: "low",
          tags: ["photography", "marketing"],
          priority: "high"
        }
      ];
    }

    const aiResponse: AIExpansionResponse = {
      suggestions: suggestions
    };

    // Add to history
    chartHistory.push({
      historyId: `history_${Date.now()}`,
      chartId: chartId,
      action: 'ai_generate',
      nodeId: nodeId,
      changes: { prompt: prompt, response: aiResponse },
      timestamp: new Date().toISOString(),
      userId: 'ai-system',
    });

    res.json(aiResponse);
  } catch (error) {
    console.error('Error in AI expansion:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestions' });
  }
};

// Get chart history
export const getChartHistory: RequestHandler = async (req, res) => {
  try {
    const { chartId } = req.params;
    const chartHistoryItems = chartHistory.filter(h => h.chartId === chartId);
    res.json(chartHistoryItems);
  } catch (error) {
    console.error('Error fetching chart history:', error);
    res.status(500).json({ error: 'Failed to fetch chart history' });
  }
};

// Export chart as PNG/SVG
export const exportChart: RequestHandler = async (req, res) => {
  try {
    const { chartId } = req.params;
    const { format = 'png' } = req.query;
    
    // In production, this would generate actual PNG/SVG
    // For now, return a placeholder response
    res.json({
      success: true,
      message: `Chart exported as ${format}`,
      downloadUrl: `/exports/${chartId}.${format}`
    });
  } catch (error) {
    console.error('Error exporting chart:', error);
    res.status(500).json({ error: 'Failed to export chart' });
  }
};

// Generate AI node with custom name and auto-connections
export const generateNode: RequestHandler = async (req, res) => {
  try {
    const { 
      nodeType, 
      nodeName, 
      craftType, 
      location, 
      existingNodes, 
      existingEdges 
    } = req.body;

    if (!nodeType || !nodeName) {
      return res.status(400).json({ error: 'Node type and name are required' });
    }

    // Import Vertex AI for node generation
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    // Create credentials object from environment variables
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
      auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN || 'googleapis.com'
    };
    
    // Create temporary credentials file
    const fs = await import('fs');
    const tempCredentialsPath = './temp-credentials-business-flow.json';
    fs.writeFileSync(tempCredentialsPath, JSON.stringify(credentials, null, 2));
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredentialsPath;
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1'
    });
    
    // Clean up temporary file
    setTimeout(() => {
      try {
        fs.unlinkSync(tempCredentialsPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 1000);

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. Generate a detailed business node based on user input.

Context:
- Node Type: ${nodeType}
- Node Name: ${nodeName}
- Craft Type: ${craftType || 'handicrafts'}
- Location: ${location || 'India'}
- Existing Nodes: ${JSON.stringify(existingNodes || [])}
- Existing Edges: ${JSON.stringify(existingEdges || [])}

Generate a comprehensive node with:
- Enhanced title (improve the user's input)
- Detailed description (2-3 sentences)
- Comprehensive detailedExplanation (bullet points with specific steps)
- Relevant tags for this node type
- Priority level (high/medium/low)
- Suggested connections to existing nodes (array of node IDs to connect from)

CRITICAL FORMATTING RULES:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- Each line should start with a dash and space: "- Your content here"
- detailedExplanation should have 6-8 bullet points

Return JSON format:
{
  "title": "Enhanced node title",
  "description": "Brief description of the node",
  "detailedExplanation": "Bullet-pointed detailed explanation with dashes",
  "tags": ["tag1", "tag2", "tag3"],
  "priority": "high|medium|low",
  "connections": [
    {"from": "existing-node-id-1", "reason": "Why this connection makes sense"},
    {"from": "existing-node-id-2", "reason": "Why this connection makes sense"}
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let text: string;
    if (typeof response.text === 'function') {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response structure from Gemini');
    }

    // Clean up any remaining markdown formatting
    text = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
      .replace(/^\s*\*\s+/gm, '- ') // Replace * with - at start of lines
      .replace(/^\s*•\s+/gm, '- ') // Replace • with - at start of lines
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    // Clean up the response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let nodeData;
    try {
      nodeData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      nodeData = {
        title: nodeName,
        description: `AI-generated ${nodeType} node for ${craftType} business`,
        detailedExplanation: `- This is a ${nodeType} node for your ${craftType} business\n- AI will provide more specific guidance when you click on it\n- Use this node to track your progress`,
        tags: [nodeType],
        priority: nodeType === 'milestone' ? 'high' : 'medium',
        connections: []
      };
    }

    res.json(nodeData);
  } catch (error) {
    console.error('Error generating AI node:', error);
    res.status(500).json({ error: 'Failed to generate AI node' });
  }
};

// Save business flow data
export const saveBusinessFlow: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const flowData = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate required fields
    if (!flowData.title || !flowData.title.trim()) {
      return res.status(400).json({ error: 'Plan title is required' });
    }

    // Import Firebase models
    const { FirebaseModels, isFirebaseConfigured } = await import('../database/firebase');
    
    if (!isFirebaseConfigured) {
      return res.status(500).json({ error: 'Firebase not configured' });
    }

    // Check for duplicate plan names
    const existingFlows = await FirebaseModels.businessFlow.findByUserId(userId);
    const duplicateName = existingFlows.find(flow => 
      flow.title && flow.title.toLowerCase().trim() === flowData.title.toLowerCase().trim()
    );

    if (duplicateName) {
      return res.status(400).json({ 
        error: 'A plan with this name already exists',
        message: 'Please choose a different name for your business plan'
      });
    }

    // Create new business flow (always create new, don't update existing)
    const result = await FirebaseModels.businessFlow.create({
      user_id: userId,
      ...flowData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Business flow saved successfully',
      data: result 
    });
  } catch (error) {
    console.error('Error saving business flow:', error);
    res.status(500).json({ error: 'Failed to save business flow' });
  }
};

// Get latest business flow for user
export const getLatestBusinessFlow: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Import Firebase models
    const { FirebaseModels, isFirebaseConfigured } = await import('../database/firebase');
    
    if (!isFirebaseConfigured) {
      return res.status(500).json({ error: 'Firebase not configured' });
    }

    // Get latest business flow
    const latestFlow = await FirebaseModels.businessFlow.getLatest(userId);
    
    if (!latestFlow) {
      return res.json({ 
        success: true, 
        hasFlow: false, 
        message: 'No business flow found' 
      });
    }

    res.json({ 
      success: true, 
      hasFlow: true, 
      data: latestFlow 
    });
  } catch (error) {
    console.error('Error fetching business flow:', error);
    res.status(500).json({ error: 'Failed to fetch business flow' });
  }
};

// Get all business flows for user
export const getAllBusinessFlows: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Import Firebase models
    const { FirebaseModels, isFirebaseConfigured } = await import('../database/firebase');
    
    if (!isFirebaseConfigured) {
      return res.status(500).json({ error: 'Firebase not configured' });
    }

    // Get all business flows
    const flows = await FirebaseModels.businessFlow.findByUserId(userId);
    
    res.json({ 
      success: true, 
      flows: flows 
    });
  } catch (error) {
    console.error('Error fetching business flows:', error);
    res.status(500).json({ error: 'Failed to fetch business flows' });
  }
};

// Update existing business flow
export const updateBusinessFlow: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, flowId } = req.params;
    const flowData = req.body;

    if (!userId || !flowId) {
      return res.status(400).json({ error: 'User ID and Flow ID are required' });
    }

    // Validate required fields
    if (!flowData.title || !flowData.title.trim()) {
      return res.status(400).json({ error: 'Plan title is required' });
    }

    // Import Firebase models
    const { FirebaseModels, isFirebaseConfigured } = await import('../database/firebase');
    
    if (!isFirebaseConfigured) {
      return res.status(500).json({ error: 'Firebase not configured' });
    }

    // Check if flow exists and belongs to user
    const existingFlow = await FirebaseModels.businessFlow.findById(flowId);
    if (!existingFlow || existingFlow.user_id !== userId) {
      return res.status(404).json({ error: 'Business flow not found' });
    }

    // Check for duplicate plan names (excluding current flow)
    const allFlows = await FirebaseModels.businessFlow.findByUserId(userId);
    const duplicateName = allFlows.find(flow => 
      flow.id !== flowId && 
      flow.title && 
      flow.title.toLowerCase().trim() === flowData.title.toLowerCase().trim()
    );

    if (duplicateName) {
      return res.status(400).json({ 
        error: 'A plan with this name already exists',
        message: 'Please choose a different name for your business plan'
      });
    }

    // Update the business flow
    const result = await FirebaseModels.businessFlow.update(flowId, {
      ...flowData,
      updated_at: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Business flow updated successfully',
      data: result 
    });
  } catch (error) {
    console.error('Error updating business flow:', error);
    res.status(500).json({ error: 'Failed to update business flow' });
  }
};

// Delete business flow
export const deleteBusinessFlow: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, flowId } = req.params;

    if (!userId || !flowId) {
      return res.status(400).json({ error: 'User ID and Flow ID are required' });
    }

    // Import Firebase models
    const { FirebaseModels, isFirebaseConfigured } = await import('../database/firebase');
    
    if (!isFirebaseConfigured) {
      return res.status(500).json({ error: 'Firebase not configured' });
    }

    // Check if flow exists and belongs to user
    const existingFlow = await FirebaseModels.businessFlow.findById(flowId);
    if (!existingFlow || existingFlow.user_id !== userId) {
      return res.status(404).json({ error: 'Business flow not found' });
    }

    // Delete the business flow
    await FirebaseModels.businessFlow.delete(flowId);
    
    res.json({ 
      success: true, 
      message: 'Business flow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business flow:', error);
    res.status(500).json({ error: 'Failed to delete business flow' });
  }
};

