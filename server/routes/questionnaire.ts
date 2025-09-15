import { RequestHandler } from "express";

interface QuestionnaireAnswers {
  [key: string]: any;
}

interface Question {
  question: string;
  options?: string[];
  type: 'open' | 'multiple-choice' | 'location' | 'craft-type';
  field: string;
  required: boolean;
}

interface FlowNode {
  id: string;
  title: string;
  description: string;
  type: string;
  quickActions: string[];
  children: string[];
  position?: { x: number; y: number };
}

interface FlowData {
  nodes: FlowNode[];
  edges: { from: string; to: string; label?: string }[];
}

// Static questionnaire - no API calls needed
// Context: QUESTIONNAIRE MODE - Handled client-side with static questions
export const generateNextQuestion: RequestHandler = async (req, res) => {
  // This endpoint is no longer used - questionnaire is now completely static
  res.status(410).json({ 
    error: 'This endpoint is deprecated. Questionnaire is now static.' 
  });
};

// Generate complete business flow using Gemini AI
// Context: FLOW GENERATION MODE - Builds flowchart from collected answers
export const generateFlow: RequestHandler = async (req, res) => {
  try {
    const { answers }: { answers: QuestionnaireAnswers } = req.body;

    // Import Vertex AI
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Create comprehensive prompt for flow generation with clear context switching
    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. You are now in FLOW GENERATION MODE.

Context: Flow Generation Mode
- Read the user's answers below
- Build a business flowchart that shows the artisan's journey
- Output in JSON with "nodes" and "edges"
- Each node must have the exact structure specified
- Do not add explanations, only return JSON

User Profile:
${JSON.stringify(answers, null, 2)}

Required JSON Structure:
{
  "nodes": [
    {
      "id": "string",
      "title": "string", 
      "description": "string",
      "detailedExplanation": "string - comprehensive explanation with specific steps, tips, and actionable advice for this artisan",
      "type": "milestone|action|resource",
      "quickActions": ["list of dynamic quick action suggestions"],
      "children": ["list of child node ids"]
    }
  ],
  "edges": [
    {"from": "string", "to": "string"}
  ]
}

Node Requirements:
- Create 6-10 nodes specific to this artisan's craft, location, and challenges
- Use only these node types: milestone, action, resource
- Each node must have actionable quickActions
- Connect nodes logically with edges
- Focus on Indian artisan business journey
- Each detailedExplanation should be formatted as bullet points with:
  - Specific steps and actionable advice (use - for each point)
  - Location-specific tips for ${answers.location || 'India'}
  - Local market insights and cultural context for ${answers.location || 'India'}
  - Regional suppliers, markets, and business opportunities
  - Local festivals, seasons, and events relevant to ${answers.craft || 'handicrafts'}
  - Regional pricing strategies and customer preferences
  - Local government schemes, grants, or support programs
  - Location-specific marketing channels and platforms
  - Practical implementation guidance for ${answers.location || 'India'}
  - Common challenges and how to overcome them locally
  - ArtisAI service suggestions where relevant (AI Image Generator, Marketing Assistant, Video Generator, etc.)
  - Format: Use bullet points (-) for each actionable item
  - Structure: 8-12 bullet points covering all aspects

CRITICAL FORMATTING RULES FOR detailedExplanation:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- NO special characters except dashes for bullets
- Each line should start with a dash and space: "- Your content here"
- Do not use any other formatting symbols
- Example: "- This is a proper bullet point" NOT "* This is wrong"

Craft Context:
- Craft type: ${answers.craft || 'handicrafts'}
- Location: ${answers.location || 'India'} 
- Main challenge: ${answers.challenge || 'business growth'}
- Experience level: ${answers.experience_level || 'beginner'}
- Target market: ${answers.target_market || 'local customers'}

Location-Specific Requirements:
- Provide location-specific market insights for ${answers.location || 'India'}
- Include local cultural context and traditions relevant to ${answers.craft || 'handicrafts'}
- Suggest local suppliers, markets, and business opportunities in ${answers.location || 'India'}
- Reference local festivals, seasons, and events that could boost sales
- Include regional pricing strategies and customer preferences
- Mention local government schemes, grants, or support programs
- Suggest location-specific marketing channels and platforms

Return only the JSON structure, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Debug: Log response structure (commented out for production)
    // console.log('Gemini response structure:', JSON.stringify(response, null, 2));
    
    // Handle different response structures
    let text: string;
    if (typeof response.text === 'function') {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else if (response.text) {
      text = response.text.trim();
    } else {
      console.error('Unexpected response structure:', response);
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
    
    let flowData: FlowData;
    try {
      flowData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing Gemini flow response:', parseError);
      console.error('Raw response:', cleanedText);
      
      // Fallback flow
      flowData = generateFallbackFlow(answers);
    }

    // Validate and enhance the flow data
    flowData = enhanceFlowData(flowData, answers);

    res.json(flowData);
  } catch (error) {
    console.error('Error generating flow:', error);
    
    // Return error instead of fallback
    res.status(500).json({ 
      error: 'Failed to generate business flow',
      message: 'Unable to create your personalized business roadmap. Please try again later.',
      details: error.message
    });
  }
};

// Generate adaptive fallback question based on user answers
function generateAdaptiveFallbackQuestion(answers: QuestionnaireAnswers): Question {
  const craft = answers.craft?.toLowerCase() || '';
  const location = answers.location?.toLowerCase() || '';
  const challenge = answers.challenge?.toLowerCase() || '';
  const sellingStatus = answers.selling_status?.toLowerCase() || '';
  const targetMarket = answers.target_market?.toLowerCase() || '';
  const goal = answers.goal?.toLowerCase() || '';

  // Priority order for questions
  if (!challenge) {
    return {
      question: "What's your biggest business challenge right now?",
      type: 'multiple-choice',
      field: 'challenge',
      required: true,
      options: ['Pricing Strategy', 'Finding Customers', 'Marketing', 'Suppliers', 'Online Presence', 'Other']
    };
  }

  if (!sellingStatus) {
    return {
      question: "Do you currently sell online or offline?",
      type: 'multiple-choice',
      field: 'selling_status',
      required: true,
      options: ['Online only', 'Offline only', 'Both', 'Not selling yet', 'Other']
    };
  }

  if (!targetMarket) {
    return {
      question: "What's your target market?",
      type: 'multiple-choice',
      field: 'target_market',
      required: true,
      options: ['Local customers', 'National market', 'International', 'Tourists', 'Wholesale buyers', 'Other']
    };
  }

  if (!goal) {
    return {
      question: "What's your main goal for the next 6 months?",
      type: 'multiple-choice',
      field: 'goal',
      required: true,
      options: ['Increase sales', 'Improve product quality', 'Expand product line', 'Find new suppliers', 'Build online presence', 'Other']
    };
  }

  // Craft-specific questions
  if (craft && !answers.experience_level) {
    if (craft.includes('textile') || craft.includes('weaving')) {
      return {
        question: "How long have you been practicing textile work?",
        type: 'multiple-choice',
        field: 'experience_level',
        required: true,
        options: ['Less than 1 year', '1-3 years', '3-5 years', '5+ years', 'Other']
      };
    } else if (craft.includes('pottery') || craft.includes('ceramic')) {
      return {
        question: "What's your pottery experience level?",
        type: 'multiple-choice',
        field: 'experience_level',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced', 'Master craftsman', 'Other']
      };
    } else if (craft.includes('jewelry')) {
      return {
        question: "What type of jewelry do you specialize in?",
        type: 'multiple-choice',
        field: 'jewelry_type',
        required: true,
        options: ['Traditional Indian', 'Modern Contemporary', 'Fusion Style', 'Custom Orders', 'Other']
      };
    }
  }

  // Challenge-specific follow-up
  if (challenge && !answers.challenge_details) {
    if (challenge.includes('pricing')) {
      return {
        question: "What's your current pricing strategy?",
        type: 'multiple-choice',
        field: 'pricing_strategy',
        required: true,
        options: ['Cost-based pricing', 'Market-based pricing', 'Value-based pricing', 'I need help with pricing', 'Other']
      };
    } else if (challenge.includes('marketing')) {
      return {
        question: "Which marketing channels do you currently use?",
        type: 'multiple-choice',
        field: 'marketing_channels',
        required: true,
        options: ['Social media only', 'Word of mouth', 'Local advertising', 'Online platforms', 'None', 'Other']
      };
    } else if (challenge.includes('suppliers')) {
      return {
        question: "What type of suppliers do you need?",
        type: 'multiple-choice',
        field: 'supplier_type',
        required: true,
        options: ['Raw materials', 'Tools and equipment', 'Packaging materials', 'All of the above', 'Other']
      };
    }
  }

  // Location-specific questions
  if (location && !answers.local_markets) {
    return {
      question: "Do you participate in local markets or fairs?",
      type: 'multiple-choice',
      field: 'local_markets',
      required: true,
      options: ['Yes, regularly', 'Sometimes', 'Never', 'Want to start', 'Other']
    };
  }

  // Business story question
  if (!answers.story) {
    return {
      question: "Tell us about your craft story and what makes it unique:",
      type: 'open',
      field: 'story',
      required: false
    };
  }

  // Default fallback
  return {
    question: "What additional support do you need for your craft business?",
    type: 'multiple-choice',
    field: 'additional_support',
    required: true,
    options: ['Business planning', 'Marketing help', 'Technical skills', 'Financial guidance', 'All of the above', 'Other']
  };
}

// Fallback flow generation if AI fails
function generateFallbackFlow(answers: QuestionnaireAnswers): FlowData {
  const craft = answers.craft || 'handicrafts';
  const location = answers.location || 'India';
  const challenge = answers.challenge || 'marketing';

  return {
    nodes: [
      {
        id: '1',
        title: 'Complete Profile',
        description: `Set up your ${craft} artisan profile with business information`,
        type: 'milestone',
        quickActions: ['Add Business Info', 'Upload Photos', 'Write Story'],
        children: ['2', '3'],
        position: { x: 0, y: 0 }
      },
      {
        id: '2',
        title: 'Create Catalog',
        description: 'Develop product listings with photos and descriptions',
        type: 'action',
        quickActions: ['Take Photos', 'Write Descriptions', 'Set Categories'],
        children: ['4'],
        position: { x: 300, y: -100 }
      },
      {
        id: '3',
        title: 'Find Suppliers',
        description: `Locate suppliers for ${craft} in ${location}`,
        type: 'supplier',
        quickActions: ['Search Suppliers', 'Compare Prices', 'Contact Wholesalers'],
        children: ['4'],
        position: { x: 300, y: 100 }
      },
      {
        id: '4',
        title: 'Set Pricing',
        description: 'Calculate costs and set competitive prices',
        type: 'pricing',
        quickActions: ['Calculate Costs', 'Research Competitors', 'Set Prices'],
        children: ['5'],
        position: { x: 600, y: 0 }
      },
      {
        id: '5',
        title: 'Launch Marketing',
        description: `Focus on ${challenge} - promote through social media and local channels`,
        type: 'marketing',
        quickActions: ['Create Social Media', 'Generate Content', 'Find Markets'],
        children: ['6'],
        position: { x: 900, y: 0 }
      },
      {
        id: '6',
        title: 'Start Selling',
        description: 'Begin selling and building customer relationships',
        type: 'milestone',
        quickActions: ['Process Orders', 'Handle Service', 'Track Sales'],
        children: [],
        position: { x: 1200, y: 0 }
      }
    ],
    edges: [
      { from: '1', to: '2' },
      { from: '1', to: '3' },
      { from: '2', to: '4' },
      { from: '3', to: '4' },
      { from: '4', to: '5' },
      { from: '5', to: '6' }
    ]
  };
}

// Enhance flow data with additional properties
function enhanceFlowData(flowData: FlowData, answers: QuestionnaireAnswers): FlowData {
  // Add position data if missing
  flowData.nodes = flowData.nodes.map((node, index) => ({
    ...node,
    position: node.position || { 
      x: (index % 3) * 400, 
      y: Math.floor(index / 3) * 200 
    }
  }));

  // Add meta information
  flowData.nodes = flowData.nodes.map(node => ({
    ...node,
    meta: {
      status: 'not-started',
      ai_generated: true,
      tags: [node.type],
      priority: node.type === 'milestone' ? 'high' : 'medium'
    }
  }));

  return flowData;
}

// Get all questionnaires for a user
export const getQuestionnaires: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock data - in production, fetch from Firestore
    const questionnaires = [
      {
        id: 'q1',
        title: 'My First Business Plan',
        craft: 'Pottery',
        location: 'Jaipur',
        status: 'completed',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        answers: {
          craft: 'Pottery',
          location: 'Jaipur',
          challenge: 'Marketing',
          experience_level: 'Intermediate',
          selling_status: 'Not selling yet',
          target_market: 'Local customers',
          goal: 'Start selling online'
        }
      },
      {
        id: 'q2',
        title: 'Jewelry Business Roadmap',
        craft: 'Jewelry',
        location: 'Mumbai',
        status: 'in_progress',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22'),
        answers: {
          craft: 'Jewelry',
          location: 'Mumbai',
          challenge: 'Pricing',
          experience_level: 'Beginner'
        }
      }
    ];
    
    res.json({ questionnaires });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaires' });
  }
};

// Get specific questionnaire
export const getQuestionnaire: RequestHandler = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    
    // Mock data - in production, fetch from Firestore
    const questionnaire = {
      id: questionnaireId,
      title: 'My Business Plan',
      craft: 'Pottery',
      location: 'Jaipur',
      status: 'completed',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      answers: {
        craft: 'Pottery',
        location: 'Jaipur',
        challenge: 'Marketing',
        experience_level: 'Intermediate',
        selling_status: 'Not selling yet',
        target_market: 'Local customers',
        goal: 'Start selling online'
      }
    };
    
    res.json({ questionnaire });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire' });
  }
};

// Create new questionnaire
export const createQuestionnaire: RequestHandler = async (req, res) => {
  try {
    const { title, craft, location } = req.body;
    
    // Mock data - in production, save to Firestore
    const newQuestionnaire = {
      id: `q_${Date.now()}`,
      title: title || 'New Business Plan',
      craft: craft || '',
      location: location || '',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      answers: {}
    };
    
    console.log('Creating new questionnaire:', newQuestionnaire);
    res.json({ questionnaire: newQuestionnaire });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({ error: 'Failed to create questionnaire' });
  }
};

// Update questionnaire
export const updateQuestionnaire: RequestHandler = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const { title, answers, status } = req.body;
    
    // Mock data - in production, update in Firestore
    const updatedQuestionnaire = {
      id: questionnaireId,
      title: title || 'Updated Business Plan',
      status: status || 'in_progress',
      updatedAt: new Date(),
      answers: answers || {}
    };
    
    console.log('Updating questionnaire:', updatedQuestionnaire);
    res.json({ questionnaire: updatedQuestionnaire });
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    res.status(500).json({ error: 'Failed to update questionnaire' });
  }
};

// Delete questionnaire
export const deleteQuestionnaire: RequestHandler = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    
    console.log('Deleting questionnaire:', questionnaireId);
    res.json({ success: true, message: 'Questionnaire deleted successfully' });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).json({ error: 'Failed to delete questionnaire' });
  }
};

// Save questionnaire answers to Firestore
export const saveAnswers: RequestHandler = async (req, res) => {
  try {
    const { userId, answers }: { userId: string; answers: QuestionnaireAnswers } = req.body;
    
    // In production, save to Firestore
    // For now, just return success
    res.json({ success: true, message: 'Answers saved successfully' });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Failed to save answers' });
  }
};

// Save generated flow to Firestore
export const saveFlow: RequestHandler = async (req, res) => {
  try {
    const { userId, flowData }: { userId: string; flowData: FlowData } = req.body;
    
    // In production, save to Firestore
    // For now, just return success
    res.json({ success: true, message: 'Flow saved successfully' });
  } catch (error) {
    console.error('Error saving flow:', error);
    res.status(500).json({ error: 'Failed to save flow' });
  }
};

// Test endpoint to verify questionnaire is working
export const testQuestionnaire: RequestHandler = async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Questionnaire system is running',
      note: 'No fallback flows - Gemini required for flow generation'
    });
  } catch (error) {
    console.error('Error testing questionnaire:', error);
    res.status(500).json({ error: 'Failed to test questionnaire' });
  }
};