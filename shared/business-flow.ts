// Business Flow Data Models and Types

export interface Chart {
  chartId: string;
  ownerId: string;
  title: string;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
    };
    layout: 'radial' | 'linear' | 'free';
  };
  createdAt: string;
  updatedAt: string;
  nodes: string[]; // Array of node IDs
  edges: string[]; // Array of edge IDs
}

export interface Node {
  nodeId: string;
  chartId: string;
  type: NodeType;
  title: string;
  description: string;
  position: { x: number; y: number };
  children: string[]; // Array of child node IDs
  meta: {
    status: 'not-started' | 'in-progress' | 'complete';
    ai_generated: boolean;
    tags: string[];
    priority?: 'low' | 'medium' | 'high';
    estimatedEffort?: 'low' | 'medium' | 'high';
  };
  ui: {
    collapsed: boolean;
    expandedHeight?: number;
    selected: boolean;
  };
  createdBy: string;
  createdAt: string;
  ai_context?: {
    promptSnapshot: string;
    generationId: string;
  };
}

export interface Edge {
  edgeId: string;
  chartId: string;
  from: string; // Source node ID
  to: string; // Target node ID
  label?: string;
  type: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
}

export type NodeType = 
  | 'milestone'    // Big business step
  | 'action'       // Specific task
  | 'resource'     // Supplier, tool, material
  | 'decision'     // Decision point
  | 'external'     // Map location, market
  | 'ai_suggestion' // AI-generated suggestion
  | 'checklist'    // Checklist items
  | 'marketing'    // Marketing activities
  | 'pricing'      // Pricing strategies
  | 'supplier'     // Supplier information
  | 'market';      // Market information

export interface NodeTypeConfig {
  color: string;
  icon: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon';
  size: 'small' | 'medium' | 'large';
}

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  milestone: {
    color: '#3B82F6',
    icon: '🎯',
    shape: 'hexagon',
    size: 'large'
  },
  action: {
    color: '#10B981',
    icon: '⚡',
    shape: 'rectangle',
    size: 'medium'
  },
  resource: {
    color: '#F59E0B',
    icon: '📦',
    shape: 'circle',
    size: 'medium'
  },
  decision: {
    color: '#EF4444',
    icon: '❓',
    shape: 'diamond',
    size: 'medium'
  },
  external: {
    color: '#8B5CF6',
    icon: '📍',
    shape: 'circle',
    size: 'medium'
  },
  ai_suggestion: {
    color: '#06B6D4',
    icon: '🤖',
    shape: 'rectangle',
    size: 'small'
  },
  checklist: {
    color: '#84CC16',
    icon: '✅',
    shape: 'rectangle',
    size: 'small'
  },
  marketing: {
    color: '#EC4899',
    icon: '📢',
    shape: 'rectangle',
    size: 'medium'
  },
  pricing: {
    color: '#F97316',
    icon: '💰',
    shape: 'rectangle',
    size: 'medium'
  },
  supplier: {
    color: '#6366F1',
    icon: '🏪',
    shape: 'circle',
    size: 'medium'
  },
  market: {
    color: '#14B8A6',
    icon: '🏪',
    shape: 'rectangle',
    size: 'medium'
  }
};

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: 'find_suppliers' | 'generate_post' | 'add_checklist' | 'calculate_pricing' | 'find_markets' | 'ai_suggest';
  nodeType?: NodeType;
}

export const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  marketing: [
    { id: 'gen_post', label: 'Generate Post', icon: '📝', action: 'generate_post' },
    { id: 'find_markets', label: 'Find Markets', icon: '📍', action: 'find_markets' },
    { id: 'ai_suggest', label: 'AI Suggest', icon: '🤖', action: 'ai_suggest' }
  ],
  pricing: [
    { id: 'calc_pricing', label: 'Calculate Pricing', icon: '💰', action: 'calculate_pricing' },
    { id: 'ai_suggest', label: 'AI Suggest', icon: '🤖', action: 'ai_suggest' }
  ],
  supplier: [
    { id: 'find_suppliers', label: 'Find Suppliers', icon: '🔍', action: 'find_suppliers' },
    { id: 'ai_suggest', label: 'AI Suggest', icon: '🤖', action: 'ai_suggest' }
  ],
  market: [
    { id: 'find_markets', label: 'Find Markets', icon: '📍', action: 'find_markets' },
    { id: 'ai_suggest', label: 'AI Suggest', icon: '🤖', action: 'ai_suggest' }
  ],
  default: [
    { id: 'ai_suggest', label: 'AI Suggest', icon: '🤖', action: 'ai_suggest' },
    { id: 'add_checklist', label: 'Add Checklist', icon: '✅', action: 'add_checklist' }
  ]
};

export interface AIExpansionRequest {
  nodeId: string;
  chartId: string;
  context: {
    userLocale: string;
    craftType?: string;
    existingAnswers?: Record<string, any>;
    nodeContext: {
      title: string;
      description: string;
      type: NodeType;
      tags: string[];
    };
  };
}

export interface AIExpansionResponse {
  suggestions: {
    title: string;
    description: string;
    type: NodeType;
    estimatedEffort: 'low' | 'medium' | 'high';
    tags: string[];
    priority: 'low' | 'medium' | 'high';
  }[];
}

export interface ChartHistory {
  historyId: string;
  chartId: string;
  action: 'create' | 'update' | 'delete' | 'ai_generate';
  nodeId?: string;
  edgeId?: string;
  changes: Record<string, any>;
  timestamp: string;
  userId: string;
}

// Default chart template for new users
export const DEFAULT_CHART: Partial<Chart> = {
  title: "My Business Roadmap",
  theme: {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#F8FAFC'
    },
    layout: 'radial'
  }
};

// Starter nodes for new charts
export const STARTER_NODES: Partial<Node>[] = [
  {
    nodeId: 'setup-account',
    type: 'milestone',
    title: 'Account Setup',
    description: 'Complete your artisan profile and business information',
    position: { x: 0, y: 0 },
    children: [],
    meta: {
      status: 'not-started',
      ai_generated: false,
      tags: ['onboarding', 'profile'],
      priority: 'high'
    },
    ui: {
      collapsed: true,
      selected: false
    }
  },
  {
    nodeId: 'add-product',
    type: 'milestone',
    title: 'Add Product',
    description: 'Create your first product listing with photos and story',
    position: { x: 200, y: 0 },
    children: [],
    meta: {
      status: 'not-started',
      ai_generated: false,
      tags: ['listing', 'product'],
      priority: 'high'
    },
    ui: {
      collapsed: true,
      selected: false
    }
  },
  {
    nodeId: 'find-suppliers',
    type: 'milestone',
    title: 'Find Suppliers',
    description: 'Locate raw materials and suppliers for your craft',
    position: { x: 400, y: 0 },
    children: [],
    meta: {
      status: 'not-started',
      ai_generated: false,
      tags: ['suppliers', 'materials'],
      priority: 'medium'
    },
    ui: {
      collapsed: true,
      selected: false
    }
  },
  {
    nodeId: 'pricing-strategy',
    type: 'milestone',
    title: 'Pricing Strategy',
    description: 'Develop competitive pricing for your products',
    position: { x: 600, y: 0 },
    children: [],
    meta: {
      status: 'not-started',
      ai_generated: false,
      tags: ['pricing', 'strategy'],
      priority: 'high'
    },
    ui: {
      collapsed: true,
      selected: false
    }
  },
  {
    nodeId: 'marketing',
    type: 'milestone',
    title: 'Marketing',
    description: 'Promote your products and build your brand',
    position: { x: 800, y: 0 },
    children: [],
    meta: {
      status: 'not-started',
      ai_generated: false,
      tags: ['marketing', 'promotion'],
      priority: 'high'
    },
    ui: {
      collapsed: true,
      selected: false
    }
  }
];


