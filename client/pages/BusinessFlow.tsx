import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
// React Flow styles will be imported in global.css
import { motion, AnimatePresence } from 'framer-motion';

// Using default React Flow edges with enhanced styling
import { 
  Chart, 
  Node as FlowNode, 
  NodeType, 
  NODE_TYPE_CONFIGS, 
  QUICK_ACTIONS,
  AIExpansionRequest,
  AIExpansionResponse,
  DEFAULT_CHART,
  STARTER_NODES
} from '@shared/business-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Settings, 
  Upload, 
  Save, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MapPin,
  DollarSign,
  Megaphone,
  Package,
  Lightbulb,
  Target,
  ArrowRight,
  X,
  FileText,
  Sparkles,
  Languages,
  Home,
  BarChart3,
  Share2
} from 'lucide-react';

// Custom Node Components
const MilestoneNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const config = NODE_TYPE_CONFIGS[data.type as NodeType];
  const isDone = data.meta?.done || false;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative ${selected ? 'ring-2 ring-blue-500' : ''} ${isDone ? 'opacity-75' : ''}`}
    >
      {/* Handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{ background: '#3b82f6', width: 10, height: 10 }}
      />
      
      {/* Handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        style={{ background: '#3b82f6', width: 10, height: 10 }}
      />
      
      <Card 
        className={`w-64 cursor-pointer transition-all duration-200 hover:shadow-md ${isDone ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : ''}`}
        style={{ borderColor: isDone ? '#10b981' : config.color }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <CardTitle className={`text-sm font-semibold ${isDone ? 'line-through text-gray-500' : ''}`}>
              {data.title}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className="ml-auto"
              style={{ 
                backgroundColor: isDone ? '#10b98120' : config.color + '20', 
                color: isDone ? '#10b981' : config.color 
              }}
            >
              {isDone ? 'Done' : (data.meta?.status || 'not-started')}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

const ActionNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const config = NODE_TYPE_CONFIGS[data.type as NodeType];
  const isDone = data.meta?.done || false;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative ${selected ? 'ring-2 ring-green-500' : ''} ${isDone ? 'opacity-75' : ''}`}
    >
      {/* Handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{ background: '#3b82f6', width: 10, height: 10 }}
      />
      
      {/* Handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        style={{ background: '#3b82f6', width: 10, height: 10 }}
      />
      
      <Card 
        className={`w-48 cursor-pointer transition-all duration-200 hover:shadow-md ${isDone ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : ''}`}
        style={{ borderColor: isDone ? '#10b981' : config.color }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <CardTitle className={`text-sm font-medium ${isDone ? 'line-through text-gray-500' : ''}`}>
              {data.title}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

const ResourceNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const config = NODE_TYPE_CONFIGS[data.type as NodeType];
  const isDone = data.meta?.done || false;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative ${selected ? 'ring-2 ring-orange-500' : ''} ${isDone ? 'opacity-75' : ''}`}
    >
      {/* Handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        style={{ background: '#3b82f6', width: 10, height: 10 }}
      />
      
      {/* Handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        style={{ background: '#3b82f6', width: 10, height: 10 }}
      />
      
      <Card 
        className={`w-44 cursor-pointer transition-all duration-200 hover:shadow-md ${isDone ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : ''}`}
        style={{ borderColor: isDone ? '#10b981' : config.color }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <CardTitle className={`text-sm font-medium ${isDone ? 'line-through text-gray-500' : ''}`}>
              {data.title}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

// Node type mapping
const nodeTypes: NodeTypes = {
  milestone: MilestoneNode,
  action: ActionNode,
  resource: ResourceNode,
  decision: ActionNode, // Reuse ActionNode for now
  external: ResourceNode, // Reuse ResourceNode for now
  ai_suggestion: ActionNode, // Reuse ActionNode for now
  checklist: ActionNode, // Reuse ActionNode for now
  marketing: ActionNode, // Reuse ActionNode for now
  pricing: ActionNode, // Reuse ActionNode for now
  supplier: ResourceNode, // Reuse ResourceNode for now
  market: ActionNode, // Reuse ActionNode for now
};

// Using default edge types with enhanced styling

// Main BusinessFlow Component
const BusinessFlow: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedLanguage, getCurrentLanguage } = useLanguage();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [chartTitle, setChartTitle] = useState("My Business Roadmap");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, city: string} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('prompt');
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);
  const [customNodeName, setCustomNodeName] = useState('');
  const [isGeneratingNode, setIsGeneratingNode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoadPlanModal, setShowLoadPlanModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Function to toggle done state for a node
  const toggleNodeDone = useCallback((nodeId: string) => {
    console.log('Toggling node done state for:', nodeId);
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? {
              ...node,
              data: {
                ...node.data,
                meta: {
                  ...node.data.meta,
                  done: !node.data.meta?.done
                }
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Get current node data for the modal (always fresh from nodes array)
  const currentSelectedNode = selectedNode ? nodes.find(node => node.id === selectedNode.id) : null;

  // Calculate progress statistics
  const progressStats = React.useMemo(() => {
    const totalNodes = nodes.length;
    const completedNodes = nodes.filter(node => node.data.meta?.done).length;
    const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
    
    return {
      total: totalNodes,
      completed: completedNodes,
      remaining: totalNodes - completedNodes,
      percentage: progressPercentage
    };
  }, [nodes]);

  // Initialize with starter nodes or generated flow
  useEffect(() => {
    const initializeBusinessFlow = async () => {
      try {
        // PRIORITY 1: Check if we have generated flow data from questionnaire (NEW PLAN)
        if (location.state?.generatedFlow && location.state?.fromQuestionnaire) {
      const { generatedFlow } = location.state;
      console.log('Generated flow data:', generatedFlow);
      console.log('Generated flow nodes:', generatedFlow.nodes);
      console.log('Generated flow edges:', generatedFlow.edges);
      
      // Convert generated flow to React Flow nodes
      const flowNodes: Node[] = generatedFlow.nodes.map((node: any, index: number) => {
        // Use the node's id field directly, or create a fallback
        const nodeId = node.id || `node-${index}`;
        console.log('Processing node:', node, 'ID:', nodeId);
        return {
          id: nodeId,
          type: node.type,
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          data: {
            title: node.title,
            description: node.description,
            detailedExplanation: node.detailedExplanation || node.description,
            type: node.type,
            meta: {
              status: 'not-started',
              ai_generated: true,
              tags: [node.type],
              priority: node.type === 'milestone' ? 'high' : 'medium',
              location: location.state?.answers?.location || 'India',
              done: false
            },
            onQuickAction: handleQuickAction,
          },
        };
      });
      
      console.log('All node IDs:', flowNodes.map(n => n.id));

      // If nodes don't have proper IDs, create a mapping based on titles
      const nodeIdMap: { [key: string]: string } = {};
      flowNodes.forEach(node => {
        if (node.data.title) {
          // Create a simple ID from the title
          const simpleId = node.data.title.toLowerCase().replace(/\s+/g, '_');
          nodeIdMap[simpleId] = node.id;
          nodeIdMap[node.data.title] = node.id;
        }
      });
      console.log('Node ID mapping:', nodeIdMap);

      // Convert edges with enhanced arrow styling
      const flowEdges: Edge[] = generatedFlow.edges
        .filter((edge: any) => edge.from && edge.to) // Filter out invalid edges
        .map((edge: any, index: number) => {
          console.log('Processing edge:', edge);
          
          // Find the actual node IDs that match the edge references
          console.log(`Looking for source node matching: "${edge.from}"`);
          console.log(`Looking for target node matching: "${edge.to}"`);
          
          // Try to find nodes using the mapping first
          const sourceNodeId = nodeIdMap[edge.from] || edge.from;
          const targetNodeId = nodeIdMap[edge.to] || edge.to;
          
          const sourceNode = flowNodes.find(node => node.id === sourceNodeId);
          const targetNode = flowNodes.find(node => node.id === targetNodeId);
          
          console.log(`Source: ${edge.from} -> ${sourceNodeId} -> ${sourceNode ? 'FOUND' : 'NOT FOUND'}`);
          console.log(`Target: ${edge.to} -> ${targetNodeId} -> ${targetNode ? 'FOUND' : 'NOT FOUND'}`);
          
          if (!sourceNode || !targetNode) {
            console.warn('Could not find matching nodes for edge:', edge);
            return null;
          }
          
          return {
            id: `edge-${index}`,
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle: 'source',
            targetHandle: 'target',
            label: edge.label || '',
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#3b82f6',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#3b82f6',
              width: 20,
              height: 20,
            },
          };
        })
        .filter(Boolean); // Remove null entries

      console.log('Generated edges:', flowEdges);
      console.log('Generated nodes:', flowNodes);

      // If no valid edges were created, create some basic sequential edges
      let finalEdges = flowEdges;
      if (flowEdges.length === 0 && flowNodes.length > 1) {
        console.log('No valid edges found, creating sequential edges');
        finalEdges = flowNodes.slice(0, -1).map((node, index) => ({
          id: `sequential-edge-${index}`,
          source: node.id,
          target: flowNodes[index + 1].id,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#3b82f6',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 20,
            height: 20,
          },
        }));
        console.log('Created sequential edges:', finalEdges);
      }

      setNodes(flowNodes);
      setEdges(finalEdges);
      
      // Debug: Log edges after setting
      setTimeout(() => {
        console.log('Edges after setting:', edges);
      }, 100);
          setChartTitle("Your Personalized Business Roadmap");
          return;
        }
        
        // PRIORITY 2: If no generated flow, try to load saved business flow data
        console.log('No generated flow found, checking for saved flow...');
        
        const userId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
        const response = await fetch(`/api/business-flow/${userId}/latest`);
        const data = await response.json();
        
        if (data.success && data.hasFlow) {
          // Load saved business flow
          console.log('Loading saved business flow:', data.data);
          const savedFlow = data.data;
          
          // Convert saved flow to React Flow format
          // Handle both array and object formats for nodes
          console.log('Saved flow nodes type:', typeof savedFlow.nodes, 'isArray:', Array.isArray(savedFlow.nodes));
          console.log('Saved flow nodes:', savedFlow.nodes);
          
          let nodesArray = [];
          if (Array.isArray(savedFlow.nodes)) {
            nodesArray = savedFlow.nodes;
          } else if (savedFlow.nodes && typeof savedFlow.nodes === 'object') {
            nodesArray = Object.values(savedFlow.nodes);
          }
          
          console.log('Converted nodes array:', nodesArray);
          
          const flowNodes: Node[] = nodesArray.map((node: any, index: number) => ({
            id: node.id || `node-${index}`,
            type: node.type || 'default',
            position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
            data: {
              title: node.title,
              description: node.description,
              detailedExplanation: node.detailedExplanation || node.description,
              type: node.type || 'default',
              meta: {
                status: node.meta?.status || 'not-started',
                ai_generated: node.meta?.ai_generated || false,
                tags: node.meta?.tags || [node.type || 'default'],
                priority: node.meta?.priority || 'medium',
                location: node.meta?.location || 'India',
                done: node.meta?.done || false
              },
              onQuickAction: handleQuickAction,
            },
          }));
          
          // Handle both array and object formats for edges
          console.log('Saved flow edges type:', typeof savedFlow.edges, 'isArray:', Array.isArray(savedFlow.edges));
          console.log('Saved flow edges:', savedFlow.edges);
          
          let edgesArray = [];
          if (Array.isArray(savedFlow.edges)) {
            edgesArray = savedFlow.edges;
          } else if (savedFlow.edges && typeof savedFlow.edges === 'object') {
            edgesArray = Object.values(savedFlow.edges);
          }
          
          console.log('Converted edges array:', edgesArray);
          
          const flowEdges: Edge[] = edgesArray.map((edge: any, index: number) => ({
            id: edge.id || `edge-${index}`,
            source: edge.source,
            target: edge.target,
            sourceHandle: 'source',
            targetHandle: 'target',
            label: edge.label || '',
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#3b82f6',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#3b82f6',
              width: 20,
              height: 20,
            },
          }));
          
          setNodes(flowNodes);
          setEdges(flowEdges);
          setChartTitle(savedFlow.title || "Your Business Roadmap");
          return;
        }
        
        // PRIORITY 3: If no saved flow, redirect to questionnaire
        console.log('No flow data found, redirecting to questionnaire');
        navigate('/questionnaire');
      } catch (error) {
        console.error('Error loading business flow:', error);
        // On error, redirect to questionnaire
        navigate('/questionnaire');
      }
    };
    
    initializeBusinessFlow();
  }, [location.state, navigate]);

  // Debug: Monitor edges changes
  useEffect(() => {
    console.log('Edges updated:', edges);
  }, [edges]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      // Only auto-save if we have nodes and we're not already saving
      if (nodes.length > 0 && !isSaving) {
        const userId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
        
        const flowData = {
          title: chartTitle,
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            title: node.data.title,
            description: node.data.description,
            detailedExplanation: node.data.detailedExplanation,
            meta: node.data.meta
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: edge.type
          })),
          userLocation: userLocation,
          craftType: 'handicrafts',
          language: selectedLanguage
        };

        try {
          await fetch(`/api/business-flow/${userId}/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(flowData),
          });
          console.log('Auto-saved business flow');
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };

    // Debounce auto-save to avoid too many requests
    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, chartTitle, userLocation, selectedLanguage, isSaving]);

  const handleQuickAction = useCallback((action: any) => {
    console.log('Quick action triggered:', action);
    
    switch (action.action) {
      case 'ai_suggest':
        handleAISuggest();
        break;
      case 'find_suppliers':
        handleFindSuppliers();
        break;
      case 'find_markets':
        handleFindMarkets();
        break;
      case 'generate_post':
        handleGeneratePost();
        break;
      case 'calculate_pricing':
        handleCalculatePricing();
        break;
      case 'add_checklist':
        handleAddChecklist();
        break;
      default:
        console.log('Unknown action:', action.action);
    }
  }, []);

  const handleAISuggest = async () => {
    if (!selectedNode) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/business-flow/ai-expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: currentSelectedNode.id,
          chartId: 'default-chart',
          context: {
            userLocale: 'en',
            craftType: 'handicrafts',
            nodeContext: {
              title: currentSelectedNode.data.title,
              description: currentSelectedNode.data.description,
              type: selectedNode.type,
              tags: currentSelectedNode.data.meta?.tags || [],
            },
          },
        }),
      });

      const data: AIExpansionResponse = await response.json();
      
      // Add AI suggestions as new nodes
      const newNodes: Node[] = data.suggestions.map((suggestion, index) => ({
        id: `ai-suggestion-${Date.now()}-${index}`,
        type: suggestion.type,
        position: { 
          x: selectedNode.position.x + (index + 1) * 200, 
          y: selectedNode.position.y + 150 
        },
        data: {
          title: suggestion.title,
          description: suggestion.description,
          type: suggestion.type,
          meta: {
            status: 'not-started',
            ai_generated: true,
            tags: suggestion.tags,
            priority: suggestion.priority,
            estimatedEffort: suggestion.estimatedEffort,
            done: false,
          },
          onQuickAction: handleQuickAction,
        },
      }));

      setNodes(prev => [...prev, ...newNodes]);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAISuggest = async () => {
    setIsLoading(true);
    try {
      // Generate AI suggestions based on the current flow context
      const response = await fetch('/api/business-flow/ai-expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId: 'auto-suggest',
          chartId: 'default-chart',
          context: {
            userLocale: 'en',
            craftType: location.state?.answers?.craft || 'handicrafts',
            location: userLocation?.city || location.state?.answers?.location || 'India',
            nodeContext: {
              title: 'AI Business Suggestions',
              description: 'Automated AI suggestions for your artisan business',
              type: 'ai_suggestion',
              tags: ['ai', 'suggestion', 'automated'],
            },
            // Send complete node details to Gemini
            existingNodes: nodes.map(n => ({ 
              id: n.id, 
              title: n.data.title, 
              type: n.data.type,
              description: n.data.description,
              detailedExplanation: n.data.detailedExplanation,
              position: n.position,
              meta: {
                status: n.data.meta?.status,
                ai_generated: n.data.meta?.ai_generated,
                tags: n.data.meta?.tags,
                priority: n.data.meta?.priority,
                estimatedEffort: n.data.meta?.estimatedEffort,
                location: n.data.meta?.location,
                locationInsights: n.data.meta?.locationInsights,
                actualLocation: n.data.meta?.actualLocation
              }
            })),
            // Send complete edge details
            existingEdges: edges.map(e => ({ 
              id: e.id,
              from: e.source, 
              to: e.target,
              type: e.type,
              animated: e.animated,
              style: e.style,
              label: e.label
            })),
            // Additional context for better AI suggestions
            flowContext: {
              totalNodes: nodes.length,
              totalEdges: edges.length,
              nodeTypes: [...new Set(nodes.map(n => n.data.type))],
              hasLocationInsights: nodes.some(n => n.data.meta?.locationInsights),
              hasAIGeneratedNodes: nodes.some(n => n.data.meta?.ai_generated),
              averagePriority: nodes.reduce((acc, n) => {
                const priority = n.data.meta?.priority;
                if (priority === 'high') return acc + 3;
                if (priority === 'medium') return acc + 2;
                if (priority === 'low') return acc + 1;
                return acc;
              }, 0) / nodes.length || 0
            }
          },
        }),
      });

      const data: AIExpansionResponse = await response.json();
      
      // Create only ONE AI suggestion node
      const centerX = 400;
      const centerY = 300;
      const suggestion = data.suggestions[0] || {
        title: 'AI Business Suggestion',
        description: 'AI-generated business recommendation',
        type: 'action' as NodeType,
        tags: ['ai', 'suggestion'],
        priority: 'medium' as const,
        estimatedEffort: 'medium' as const
      };

      const newNode: Node = {
        id: `auto-ai-suggestion-${Date.now()}`,
        type: suggestion.type,
        position: { 
          x: centerX, 
          y: centerY
        },
        data: {
          title: suggestion.title,
          description: suggestion.description,
          detailedExplanation: suggestion.description,
          type: suggestion.type,
          meta: {
            status: 'not-started',
            ai_generated: true,
            tags: suggestion.tags || [suggestion.type],
            priority: suggestion.priority || 'medium',
            estimatedEffort: suggestion.estimatedEffort,
            location: userLocation?.city || location.state?.answers?.location || 'India',
            done: false
          },
          onQuickAction: handleQuickAction,
        },
      };

      // Add the single new node
      setNodes(prev => [...prev, newNode]);

      // Auto-connect to existing nodes
      if (nodes.length > 0) {
        const newEdges: Edge[] = [];
        
        // Connect to the most recent node (last in the array)
        const lastNode = nodes[nodes.length - 1];
        newEdges.push({
          id: `auto-edge-${Date.now()}`,
          source: lastNode.id,
          target: newNode.id,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#3b82f6',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 20,
            height: 20,
          },
        });

        // If there are multiple nodes, also connect to a random earlier node for variety
        if (nodes.length > 1) {
          const randomNode = nodes[Math.floor(Math.random() * (nodes.length - 1))];
          newEdges.push({
            id: `auto-edge-${Date.now()}-2`,
            source: randomNode.id,
            target: newNode.id,
            sourceHandle: 'source',
            targetHandle: 'target',
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#10b981',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#10b981',
              width: 20,
              height: 20,
            },
          });
        }

        setEdges(prev => [...prev, ...newEdges]);
      }
      
      // Show a success message
      console.log(`Generated 1 AI suggestion and connected it to existing nodes`);
      
    } catch (error) {
      console.error('Error generating auto AI suggestions:', error);
      // Fallback: Create one contextual suggestion if API fails
      const nodeTypes = [...new Set(nodes.map(n => n.data.type))];
      const hasMarketing = nodeTypes.includes('marketing');
      const hasPricing = nodeTypes.includes('pricing');
      const hasSupplier = nodeTypes.includes('supplier');
      const hasMarket = nodeTypes.includes('market');
      
      // Generate contextual fallback based on existing nodes
      let fallbackTitle = 'AI Business Suggestion';
      let fallbackDescription = 'AI-generated business recommendation based on your current flow';
      let fallbackExplanation = 'This is an AI-generated suggestion that can help improve your business strategy. It has been automatically connected to your existing workflow.';
      
      if (!hasMarketing) {
        fallbackTitle = 'Marketing Strategy';
        fallbackDescription = 'Develop a comprehensive marketing plan for your artisan business';
        fallbackExplanation = 'Create a marketing strategy that includes social media presence, content marketing, and customer engagement tactics tailored to your artisan products and target audience.';
      } else if (!hasPricing) {
        fallbackTitle = 'Pricing Strategy';
        fallbackDescription = 'Optimize your pricing for maximum profitability';
        fallbackExplanation = 'Develop a pricing strategy that considers your costs, market positioning, and customer value perception to maximize both sales and profitability.';
      } else if (!hasSupplier) {
        fallbackTitle = 'Supplier Network';
        fallbackDescription = 'Build relationships with reliable suppliers';
        fallbackExplanation = 'Identify and establish relationships with suppliers who can provide quality materials at competitive prices to support your artisan business growth.';
      } else if (!hasMarket) {
        fallbackTitle = 'Market Expansion';
        fallbackDescription = 'Explore new markets and sales channels';
        fallbackExplanation = 'Research and identify new markets, both local and online, where your artisan products can find new customers and increase sales opportunities.';
      }

      const fallbackSuggestion = {
        id: `fallback-suggestion-${Date.now()}`,
        type: 'action' as NodeType,
        position: { x: 400, y: 300 },
        data: {
          title: fallbackTitle,
          description: fallbackDescription,
          detailedExplanation: fallbackExplanation,
          type: 'action' as NodeType,
          meta: {
            status: 'not-started',
            ai_generated: true,
            tags: ['ai', 'suggestion', ...nodeTypes],
            priority: 'medium',
            location: userLocation?.city || location.state?.answers?.location || 'India',
            done: false
          },
          onQuickAction: handleQuickAction,
        },
      };
      
      setNodes(prev => [...prev, fallbackSuggestion]);

      // Auto-connect fallback suggestion to existing nodes
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        const fallbackEdge: Edge = {
          id: `fallback-edge-${Date.now()}`,
          source: lastNode.id,
          target: fallbackSuggestion.id,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#f59e0b',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#f59e0b',
            width: 20,
            height: 20,
          },
        };
        setEdges(prev => [...prev, fallbackEdge]);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleFindSuppliers = async () => {
    // This will integrate with the location service
    console.log('Finding suppliers...');
  };

  const getUserLocation = async (): Promise<{lat: number, lng: number, city: string} | null> => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      return null;
    }

    return new Promise((resolve) => {
      setLocationPermission('loading');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding to get city name
            const response = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            const data = await response.json();
            
            const locationData = {
              lat: latitude,
              lng: longitude,
              city: data.city || 'Unknown Location'
            };
            
            setUserLocation(locationData);
            setLocationPermission('granted');
            resolve(locationData);
          } catch (error) {
            console.error('Error getting city name:', error);
            const locationData = {
              lat: latitude,
              lng: longitude,
              city: 'Unknown Location'
            };
            setUserLocation(locationData);
            setLocationPermission('granted');
            resolve(locationData);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission('denied');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  const generateLocationInsights = async (node: Node) => {
    if (isGeneratingInsights) return;
    
    setIsGeneratingInsights(true);
    
    try {
      // Get user's actual location if not already available
      let currentLocation = userLocation;
      if (!currentLocation) {
        currentLocation = await getUserLocation();
      }

      // Use actual location or fallback to questionnaire location
      const locationToUse = currentLocation?.city || node.data.meta?.location || 'India';
      const coordinates = currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null;

      console.log('🔍 Location insights request data:', {
        locationToUse,
        coordinates,
        craftType: location.state?.answers?.craft || 'handicrafts',
        nodeTitle: node.data.title,
        nodeType: node.data.type,
        currentLocation,
        nodeMeta: node.data.meta
      });

      const requestBody = {
        location: locationToUse,
        coordinates: coordinates,
        craftType: location.state?.answers?.craft || 'handicrafts',
        nodeTitle: node.data.title,
        nodeType: node.data.type
      };

      console.log('📤 Sending request body:', requestBody);

      const response = await fetch('/api/location/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Location insights API error:', errorData);
        throw new Error(`Failed to get location insights: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Location insights response:', data);
      
      // Update the node with location insights
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id 
            ? {
                ...n,
                data: {
                  ...n.data,
                  meta: {
                    ...n.data.meta,
                    locationInsights: data.insights || data.message || data,
                    actualLocation: locationToUse
                  }
                }
              }
            : n
        )
      );
      
      // Update the selected node as well
      setSelectedNode(prev => prev ? {
        ...prev,
        data: {
          ...prev.data,
          meta: {
            ...prev.data.meta,
            locationInsights: data.insights || data.message || data,
            actualLocation: locationToUse
          }
        }
      } : null);
      
    } catch (error) {
      console.error('Error generating location insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleFindMarkets = async () => {
    // This will integrate with the location service
    console.log('Finding markets...');
  };

  const handleGeneratePost = async () => {
    // This will integrate with AI for content generation
    console.log('Generating post...');
  };

  const handleCalculatePricing = async () => {
    // This will open a pricing calculator
    console.log('Calculating pricing...');
  };

  const handleAddChecklist = () => {
    // Add a checklist node
    const checklistNode: Node = {
      id: `checklist-${Date.now()}`,
      type: 'checklist',
      position: { 
        x: selectedNode ? selectedNode.position.x + 200 : 0, 
        y: selectedNode ? selectedNode.position.y + 100 : 0 
      },
      data: {
        title: 'Checklist',
        description: 'Add your checklist items here',
        type: 'checklist',
        meta: {
          status: 'not-started',
          ai_generated: false,
          tags: ['checklist'],
          done: false,
        },
        onQuickAction: handleQuickAction,
      },
    };

    setNodes(prev => [...prev, checklistNode]);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle || 'source',
          targetHandle: params.targetHandle || 'target',
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#3b82f6',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 20,
            height: 20,
          },
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowNodeModal(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowNodeModal(false);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    // Allow deleting edges by clicking on them
    if (event.detail === 2) { // Double click
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  }, [setEdges]);

  const handleAddNode = (type: NodeType) => {
    // If it's an AI suggestion node, automatically generate suggestions without modal
    if (type === 'ai_suggestion') {
      handleAutoAISuggest();
      return;
    }
    
    setSelectedNodeType(type);
    setCustomNodeName('');
    setShowAddNodeModal(true);
  };

  const generateAINode = async () => {
    if (!selectedNodeType || !customNodeName.trim()) return;
    
    setIsGeneratingNode(true);
    
    try {
      const response = await fetch('/api/business-flow/generate-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeType: selectedNodeType,
          nodeName: customNodeName.trim(),
          craftType: location.state?.answers?.craft || 'handicrafts',
          location: userLocation?.city || location.state?.answers?.location || 'India',
          existingNodes: nodes.map(n => ({ id: n.id, title: n.data.title, type: n.data.type })),
          existingEdges: edges.map(e => ({ from: e.source, to: e.target }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI node');
      }

      const data = await response.json();
      
      // Create the new node with AI-generated content
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: selectedNodeType,
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 300 + 100 
        },
        data: {
          title: data.title || customNodeName.trim(),
          description: data.description || `AI-generated ${selectedNodeType} node`,
          detailedExplanation: data.detailedExplanation || data.description,
          type: selectedNodeType,
          meta: {
            status: 'not-started',
            ai_generated: true,
            tags: data.tags || [selectedNodeType],
            priority: data.priority || (selectedNodeType === 'milestone' ? 'high' : 'medium'),
            location: userLocation?.city || location.state?.answers?.location || 'India',
            done: false
          },
          onQuickAction: handleQuickAction,
        },
      };

      // Add the new node
      setNodes((nds) => [...nds, newNode]);

      // Auto-connect if AI suggested connections
      if (data.connections && data.connections.length > 0) {
        const newEdges = data.connections.map((connection: any) => ({
          id: `edge-${Date.now()}-${Math.random()}`,
          source: connection.from,
          target: newNode.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 20,
            height: 20,
          },
        }));
        setEdges((eds) => [...eds, ...newEdges]);
      }

      // Close modal
      setShowAddNodeModal(false);
      setSelectedNodeType(null);
      setCustomNodeName('');
      
    } catch (error) {
      console.error('Error generating AI node:', error);
    } finally {
      setIsGeneratingNode(false);
    }
  };

  const handleNewPlan = () => {
    // Redirect to questionnaire to create a new plan with cleared state
    navigate('/questionnaire', { 
      state: { 
        isNewPlan: true,
        clearState: true 
      } 
    });
  };

  const handleLoadPlan = async () => {
    setIsLoadingPlans(true);
    try {
      const userId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
      const response = await fetch(`/api/business-flow/${userId}/all`);
      const data = await response.json();
      
      if (data.success) {
        setAvailablePlans(data.flows || []);
        setShowLoadPlanModal(true);
      } else {
        console.error('Error loading plans:', data.error);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
      const response = await fetch(`/api/business-flow/${userId}/latest`);
      const data = await response.json();
      
      if (data.success && data.hasFlow) {
        const savedFlow = data.data;
        
        // Convert saved flow to React Flow format
        console.log('Loading selected plan:', savedFlow);
        
        // Handle both array and object formats for nodes
        let nodesArray = [];
        if (Array.isArray(savedFlow.nodes)) {
          nodesArray = savedFlow.nodes;
        } else if (savedFlow.nodes && typeof savedFlow.nodes === 'object') {
          nodesArray = Object.values(savedFlow.nodes);
        }
        
        const flowNodes: Node[] = nodesArray.map((node: any, index: number) => ({
          id: node.id || `node-${index}`,
          type: node.type || 'default',
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          data: {
            title: node.title,
            description: node.description,
            detailedExplanation: node.detailedExplanation || node.description,
            type: node.type || 'default',
            meta: {
              status: node.meta?.status || 'not-started',
              ai_generated: node.meta?.ai_generated || false,
              tags: node.meta?.tags || [node.type || 'default'],
              priority: node.meta?.priority || 'medium',
              location: node.meta?.location || 'India',
              done: node.meta?.done || false
            },
            onQuickAction: handleQuickAction,
          },
        }));
        
        // Handle both array and object formats for edges
        let edgesArray = [];
        if (Array.isArray(savedFlow.edges)) {
          edgesArray = savedFlow.edges;
        } else if (savedFlow.edges && typeof savedFlow.edges === 'object') {
          edgesArray = Object.values(savedFlow.edges);
        }
        
        const flowEdges: Edge[] = edgesArray.map((edge: any, index: number) => ({
          id: edge.id || `edge-${index}`,
          source: edge.source,
          target: edge.target,
          sourceHandle: 'source',
          targetHandle: 'target',
          label: edge.label || '',
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#3b82f6',
            strokeWidth: 3,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
            width: 20,
            height: 20,
          },
        }));
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        setChartTitle(savedFlow.title || "Your Business Roadmap");
        setShowLoadPlanModal(false);
      }
    } catch (error) {
      console.error('Error loading selected plan:', error);
    }
  };

  const handleSaveChart = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const userId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from auth context
      
      const flowData = {
        title: chartTitle,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          title: node.data.title,
          description: node.data.description,
          detailedExplanation: node.data.detailedExplanation,
          meta: node.data.meta
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: edge.type
        })),
        userLocation: userLocation,
        craftType: 'handicrafts', // TODO: Get from user profile
        language: selectedLanguage
      };

      const response = await fetch(`/api/business-flow/${userId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Business flow saved successfully');
        setSaveError(null);
        // You could show a toast notification here
      } else {
        console.error('Error saving business flow:', result.error);
        setSaveError(result.message || result.error || 'Failed to save business flow');
      }
    } catch (error) {
      console.error('Error saving business flow:', error);
      setSaveError('Failed to save business flow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Business Flow</h1>
              <LanguageSelector variant="minimal" />
              <ThemeToggle variant="minimal" />
            </div>
            <Input
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="w-64"
            />
            
            {/* Progress Indicator */}
            {nodes.length > 0 && (
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {progressStats.completed}/{progressStats.total} Done
                  </span>
                </div>
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressStats.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {progressStats.percentage}%
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Go Back Button */}
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
              Go Back
            </Button>
            
            {/* Action Buttons */}
            <Button
              onClick={handleNewPlan} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
            <Button
              onClick={handleLoadPlan}
              variant="outline"
              size="sm"
              disabled={isLoadingPlans}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoadingPlans ? 'Loading...' : 'Load Plan'}
            </Button>
            <Button onClick={handleSaveChart} variant="outline" size="sm" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {saveError && (
              <div className="text-red-600 text-sm mt-2">
                {saveError}
              </div>
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Node Type Palette */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Node:</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {Object.entries(NODE_TYPE_CONFIGS).map(([type, config]) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleAddNode(type as NodeType)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
                      <div className="ml-4 pl-4 border-l border-gray-300 dark:border-gray-600 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Connections:</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {edges.length} edge{edges.length !== 1 ? 's' : ''}
              </span>
              {edges.length > 0 && (
                <Button
                  onClick={() => setEdges([])}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All
                </Button>
              )}
              <Button
                onClick={() => {
                  if (nodes.length >= 2) {
                    const testEdge: Edge = {
                      id: `test-edge-${Date.now()}`,
                      source: nodes[0].id,
                      target: nodes[1].id,
                      sourceHandle: 'source',
                      targetHandle: 'target',
                      type: 'smoothstep',
                      animated: true,
                      style: {
                        stroke: '#ef4444',
                        strokeWidth: 3,
                      },
                      markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#ef4444',
                        width: 20,
                        height: 20,
                      },
                    };
                    setEdges(prev => [...prev, testEdge]);
                    console.log('Added test edge:', testEdge);
                  }
                }}
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Test Edge
              </Button>
              <Button
                onClick={() => {
                  if (nodes.length >= 2) {
                    const sequentialEdges: Edge[] = nodes.slice(0, -1).map((node, index) => ({
                      id: `manual-edge-${index}-${Date.now()}`,
                      source: node.id,
                      target: nodes[index + 1].id,
                      sourceHandle: 'source',
                      targetHandle: 'target',
                      type: 'smoothstep',
                      animated: true,
                      style: {
                        stroke: '#10b981',
                        strokeWidth: 3,
                      },
                                              markerEnd: {
                          type: MarkerType.ArrowClosed,
                          color: '#10b981',
                          width: 20,
                          height: 20,
                        },
                    }));
                    setEdges(prev => [...prev, ...sequentialEdges]);
                    console.log('Added sequential edges:', sequentialEdges);
                  }
                }}
                variant="outline"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                Connect All
              </Button>
            </div>
        </div>
      </div>


      {/* React Flow Canvas */}
      <div className="h-[calc(100vh-140px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {/* Empty State - Show when no nodes */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 shadow-lg border dark:border-gray-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Start Your Business Plan</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create a personalized business roadmap with AI-powered guidance</p>
              <Button
                onClick={() => navigate('/questionnaire', { 
                  state: { 
                    isNewPlan: true,
                    clearState: true 
                  } 
                })} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Plan
              </Button>
            </div>
          </div>
        )}

        {/* Connection Instructions - Show when nodes exist but no edges */}
        {nodes.length > 0 && edges.length === 0 && (
          <div className="absolute top-4 left-4 z-10 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">i</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Create Connections</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Drag from one node's edge to another to create connections between your business steps.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Double-click edges to delete them
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Node Detail Modal */}
        {showNodeModal && currentSelectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: NODE_TYPE_CONFIGS[currentSelectedNode.data.type as NodeType]?.color || '#3b82f6' }}
                >
                  <span className="text-lg">
                    {NODE_TYPE_CONFIGS[currentSelectedNode.data.type as NodeType]?.icon || '📋'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentSelectedNode.data.title}</h2>
                  <p className="text-sm text-gray-500 capitalize">{currentSelectedNode.data.type} Node</p>
                </div>
              </div>
              <Button
                onClick={() => setShowNodeModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Detailed Explanation */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Detailed Guide</h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {currentSelectedNode.data.detailedExplanation ? (
                      <div className="space-y-2">
                        {(currentSelectedNode.data.detailedExplanation || '').split('\n').map((line, index) => {
                          const isServiceSuggestion = line.includes('AI Image Generator') || 
                                                    line.includes('AI Marketing Assistant') || 
                                                    line.includes('Business Plan Builder') || 
                                                    line.includes('AI Video Generator') || 
                                                    line.includes('Pricing Calculator') ||
                                                    line.includes('ArtisAI');
                          
                          return (
                            <div key={index} className={`flex items-start ${isServiceSuggestion ? 'bg-blue-100 p-2 rounded border-l-2 border-blue-400' : ''}`}>
                              {line.trim().startsWith('•') ? (
                                <>
                                  <span className={`mr-2 mt-1 ${isServiceSuggestion ? 'text-blue-700' : 'text-blue-600'}`}>•</span>
                                  <span className="flex-1">{line.trim().substring(1).trim()}</span>
                                </>
                              ) : line.trim().startsWith('-') ? (
                                <>
                                  <span className={`mr-2 mt-1 ${isServiceSuggestion ? 'text-blue-700' : 'text-blue-600'}`}>•</span>
                                  <span className="flex-1">{line.trim().substring(1).trim()}</span>
                                </>
                              ) : line.trim() ? (
                                <span className={`flex-1 font-medium ${isServiceSuggestion ? 'text-blue-900' : 'text-gray-900'}`}>{line.trim()}</span>
                              ) : null}
                              {isServiceSuggestion && (
                                <span className="ml-2 text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-full font-medium">
                                  AI Service
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p>{currentSelectedNode.data.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Summary</h3>
                <p className="text-gray-700 leading-relaxed">{currentSelectedNode.data.description}</p>
              </div>

              {/* Location-Specific Insights */}
              {(currentSelectedNode.data.meta?.location || userLocation) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Local Insights for {currentSelectedNode.data.meta?.actualLocation || userLocation?.city || currentSelectedNode.data.meta?.location}
                      {userLocation && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                          📍 Your Location
                        </span>
                      )}
                    </h3>
                    {!currentSelectedNode.data.meta?.locationInsights && (
                      <Button
                        onClick={() => generateLocationInsights(selectedNode)}
                        size="sm"
                        variant="outline"
                        disabled={isGeneratingInsights || locationPermission === 'loading'}
                        className="text-green-600 border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingInsights ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                            Generating...
                          </>
                        ) : locationPermission === 'loading' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            Get Local Insights
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Location Permission Status */}
                  {locationPermission === 'denied' && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Location access denied. Using questionnaire location for insights. 
                        <button 
                          onClick={() => getUserLocation()} 
                          className="ml-1 text-yellow-600 underline hover:text-yellow-700"
                        >
                          Try again
                        </button>
                      </p>
                    </div>
                  )}
                  
                  {locationPermission === 'prompt' && !userLocation && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Allow location access for more accurate local insights. 
                        <button 
                          onClick={() => getUserLocation()} 
                          className="ml-1 text-blue-600 underline hover:text-blue-700"
                        >
                          Enable Location
                        </button>
                      </p>
                    </div>
                  )}
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                    <div className="text-gray-800 leading-relaxed">
                      {currentSelectedNode.data.meta.locationInsights ? (
                        <div className="space-y-2">
                          {(currentSelectedNode.data.meta.locationInsights || '').split('\n').map((line, index) => {
                            const isServiceSuggestion = line.includes('AI Image Generator') || 
                                                      line.includes('AI Marketing Assistant') || 
                                                      line.includes('Business Plan Builder') || 
                                                      line.includes('AI Video Generator') || 
                                                      line.includes('Pricing Calculator') ||
                                                      line.includes('ArtisAI');
                            
                            return (
                              <div key={index} className={`flex items-start ${isServiceSuggestion ? 'bg-blue-50 p-2 rounded border-l-2 border-blue-300' : ''}`}>
                                {line.trim().startsWith('•') ? (
                                  <>
                                    <span className={`mr-2 mt-1 ${isServiceSuggestion ? 'text-blue-600' : 'text-green-600'}`}>•</span>
                                    <span className="flex-1">{line.trim().substring(1).trim()}</span>
                                  </>
                                ) : line.trim().startsWith('-') ? (
                                  <>
                                    <span className={`mr-2 mt-1 ${isServiceSuggestion ? 'text-blue-600' : 'text-green-600'}`}>•</span>
                                    <span className="flex-1">{line.trim().substring(1).trim()}</span>
                                  </>
                                ) : line.trim() ? (
                                  <span className={`flex-1 font-medium ${isServiceSuggestion ? 'text-blue-900' : 'text-gray-900'}`}>{line.trim()}</span>
                                ) : null}
                                {isServiceSuggestion && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    AI Service
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 italic">
                          Location-specific insights will be generated based on your area...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Node Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Status */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                  <Badge 
                    variant="secondary"
                    className="capitalize"
                    style={{ 
                      backgroundColor: currentSelectedNode.data.meta?.status === 'complete' ? '#10b981' : 
                                     currentSelectedNode.data.meta?.status === 'in-progress' ? '#f59e0b' : '#6b7280',
                      color: 'white'
                    }}
                  >
                    {currentSelectedNode.data.meta?.status || 'not-started'}
                  </Badge>
                </div>

                {/* Priority */}
                {currentSelectedNode.data.meta?.priority && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Priority</h4>
                    <Badge 
                      variant="outline"
                      className="capitalize"
                    >
                      {currentSelectedNode.data.meta.priority}
                    </Badge>
                  </div>
                )}

                {/* AI Generated */}
                {currentSelectedNode.data.meta?.ai_generated && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Generated by AI</h4>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">AI Suggested</span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {currentSelectedNode.data.meta?.tags && currentSelectedNode.data.meta.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {currentSelectedNode.data.meta.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {currentSelectedNode.data.onQuickAction && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS[currentSelectedNode.data.type as NodeType]?.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          currentSelectedNode.data.onQuickAction?.(action);
                          setShowNodeModal(false);
                        }}
                        className="text-xs"
                      >
                        <span className="mr-1">{action.icon}</span>
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Status - Bottom of Content */}
              <div className="mt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-6 w-6 ${currentSelectedNode.data.meta?.done ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {currentSelectedNode.data.meta?.done ? 'Completed' : 'In Progress'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentSelectedNode.data.meta?.done 
                          ? 'This task has been marked as completed' 
                          : 'Mark this task as completed when done'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`checkbox-${currentSelectedNode.id}`}
                      checked={currentSelectedNode.data.meta?.done || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleNodeDone(currentSelectedNode.id);
                      }}
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer checked:bg-green-500 checked:border-green-500 checked:hover:bg-green-600 checked:focus:bg-green-500"
                    />
                    <label 
                      htmlFor={`checkbox-${currentSelectedNode.id}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Mark as Done
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setShowNodeModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Generating AI suggestions...</span>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New {selectedNodeType?.charAt(0).toUpperCase() + selectedNodeType?.slice(1)} Node
              </h2>
              <button
                onClick={() => {
                  setShowAddNodeModal(false);
                  setSelectedNodeType(null);
                  setCustomNodeName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Name
                </label>
                <Input
                  value={customNodeName}
                  onChange={(e) => setCustomNodeName(e.target.value)}
                  placeholder={`Enter ${selectedNodeType} name...`}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{selectedNodeType && NODE_TYPE_CONFIGS[selectedNodeType]?.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedNodeType?.charAt(0).toUpperCase() + selectedNodeType?.slice(1)} Node
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  AI will generate detailed features, description, and automatically connect this node to relevant existing nodes.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={generateAINode}
                  disabled={!customNodeName.trim() || isGeneratingNode}
                  className="flex-1"
                >
                  {isGeneratingNode ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddNodeModal(false);
                    setSelectedNodeType(null);
                    setCustomNodeName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Plan Modal */}
      {showLoadPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold">Load Business Plan</h3>
            </div>
            
            {availablePlans.length === 0 ? (
              <div className="text-center py-8 px-6">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No saved plans found</p>
                <Button onClick={() => setShowLoadPlanModal(false)} variant="outline">
                  Close
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {availablePlans.map((plan, index) => (
                    <div
                      key={plan.id || index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <h4 className="font-medium">{plan.title || 'Untitled Plan'}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {new Date(plan.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nodes: {Array.isArray(plan.nodes) ? plan.nodes.length : Object.keys(plan.nodes || {}).length}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-600">
                  <Button onClick={() => setShowLoadPlanModal(false)} variant="outline" className="w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper with ReactFlowProvider
const BusinessFlowWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <BusinessFlow />
    </ReactFlowProvider>
  );
};

export default BusinessFlowWrapper;
