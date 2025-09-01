import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Area
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, Target, Info, RefreshCw } from "lucide-react";

interface SalesMetrics {
  totalSales: number;
  unitsSold: number;
  averagePrice: number;
  inventoryLevel: number;
  totalOrders: number;
  totalCustomers: number;
  sbaGuarantee: number;
  avgGuaranteePercent: number;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  category: 'growth' | 'pricing' | 'risk' | 'market' | 'inventory' | 'expansion';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export default function Dashboard() {
  const [salesMetrics] = useState<SalesMetrics>({
    totalSales: 25000,
    unitsSold: 50,
    averagePrice: 500,
    inventoryLevel: 25,
    totalOrders: 85,
    totalCustomers: 67,
    sbaGuarantee: 18750,
    avgGuaranteePercent: 75
  });

  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const monthlySales = [
    { month: 'Jan', sales: 58 },
    { month: 'Feb', sales: 62 },
    { month: 'Mar', sales: 75 },
    { month: 'Apr', sales: 68 },
    { month: 'May', sales: 82 },
    { month: 'Jun', sales: 79 },
    { month: 'Jul', sales: 85 },
    { month: 'Aug', sales: 72 },
    { month: 'Sep', sales: 89 },
    { month: 'Oct', sales: 95 },
    { month: 'Nov', sales: 102 },
    { month: 'Dec', sales: 115 }
  ];

  const businessStatus = [
    { business: 'Existing', paid: 66.93, default: 33.07 },
    { business: 'New', paid: 65.7, default: 34.3 }
  ];

  const industryBreakdown = [
    { industry: 'Textiles', default: 19.9, color: '#3B82F6' },
    { industry: 'Pottery', default: 12.15, color: '#8B5CF6' },
    { industry: 'Jewelry', default: 10.25, color: '#F97316' },
    { industry: 'Woodcraft', default: 10.05, color: '#22C55E' },
    { industry: 'Metalwork', default: 9.70, color: '#EC4899' },
    { industry: 'Leather', default: 6.47, color: '#A16207' },
    { industry: 'Glass', default: 6.53, color: '#DC2626' },
    { industry: 'Paper', default: 3.70, color: '#16A34A' },
    { industry: 'Bamboo', default: 4.81, color: '#7C3AED' },
    { industry: 'Stone', default: 3.21, color: '#1E40AF' },
    { industry: 'Fiber', default: 2.08, color: '#0EA5E9' },
    { industry: 'Others', default: 1.2, color: '#EAB308' }
  ];

  const defaultTrend = [
    { year: '2019', rate: 19.84 },
    { year: '2020', rate: 27.00 },
    { year: '2021', rate: 31.14 },
    { year: '2022', rate: 16.15 },
    { year: '2023', rate: 3.70 },
    { year: '2024', rate: 2.16 }
  ];

  const assetBackedData = [
    { name: 'Yes', value: 0.69 },
    { name: 'No', value: 99.31 }
  ];

  const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#06B6D4', '#EF4444'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'growth': return 'bg-blue-50 border-blue-500 text-blue-800';
      case 'pricing': return 'bg-green-50 border-green-500 text-green-800';
      case 'risk': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'market': return 'bg-purple-50 border-purple-500 text-purple-800';
      case 'inventory': return 'bg-red-50 border-red-500 text-red-800';
      case 'expansion': return 'bg-indigo-50 border-indigo-500 text-indigo-800';
      default: return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'growth': return '📈';
      case 'pricing': return '💰';
      case 'risk': return '⚠️';
      case 'market': return '🎯';
      case 'inventory': return '📊';
      case 'expansion': return '🚀';
      default: return '💡';
    }
  };

  const generateAISuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate 6 short, actionable business suggestions for a craft business based on this data:
          - Total orders: ${salesMetrics.totalOrders}
          - Total customers: ${salesMetrics.totalCustomers}
          - Revenue: ₹${salesMetrics.totalSales}
          - Inventory: ${salesMetrics.inventoryLevel} units
          - Textiles market share: 19.9%
          - New business default rate: 34.3%
          
          Keep titles under 30 characters and descriptions under 80 characters. Format:
          {
            "suggestions": [
              {
                "title": "Short Title",
                "description": "Brief actionable tip",
                "category": "growth|pricing|risk|market|inventory|expansion",
                "priority": "high|medium|low"
              }
            ]
          }`,
          requestType: 'business_insights'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI Response:', data.content); // Debug log
        
        if (data.content) {
          try {
            // First, try to extract JSON from the response if it's wrapped in text
            let jsonContent = data.content;
            
            // Look for JSON content between curly braces
            const jsonMatch = data.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonContent = jsonMatch[0];
            }
            
            // Try to parse the extracted JSON
            const parsedContent = JSON.parse(jsonContent);
            if (parsedContent.suggestions && Array.isArray(parsedContent.suggestions)) {
              const suggestionsWithIds = parsedContent.suggestions.map((suggestion: any, index: number) => ({
                ...suggestion,
                id: `suggestion-${Date.now()}-${index}`,
                timestamp: new Date()
              }));
              setAiSuggestions(suggestionsWithIds);
              setLastUpdated(new Date());
              console.log('Successfully parsed AI suggestions:', suggestionsWithIds);
              return;
            }
          } catch (parseError) {
            console.log('JSON parsing failed, trying to extract suggestions from text:', parseError);
            
            // Try to extract suggestions from natural language response
            const extractedSuggestions = extractSuggestionsFromText(data.content);
            if (extractedSuggestions.length > 0) {
              setAiSuggestions(extractedSuggestions);
              setLastUpdated(new Date());
              console.log('Extracted suggestions from text:', extractedSuggestions);
              return;
            }
          }
        }
        
        // If all parsing attempts fail, use fallback
        console.log('All parsing attempts failed, using fallback suggestions');
        generateFallbackSuggestions();
      } else {
        console.log('AI API call failed, using fallback suggestions');
        generateFallbackSuggestions();
      }
    } catch (error) {
      console.log('Error calling AI API, using fallback suggestions:', error);
      generateFallbackSuggestions();
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const extractSuggestionsFromText = (text: string): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentSuggestion: Partial<AISuggestion> = {};
    let suggestionCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for lines that might contain suggestions
      if (trimmedLine.includes(':') && trimmedLine.length > 20) {
        const [title, description] = trimmedLine.split(':').map(s => s.trim());
        
        if (title && description && suggestionCount < 6) {
          // Determine category and priority based on content
          const category = determineCategory(title + ' ' + description);
          const priority = determinePriority(title + ' ' + description);
          
          suggestions.push({
            id: `extracted-${Date.now()}-${suggestionCount}`,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            description: description.length > 150 ? description.substring(0, 150) + '...' : description,
            category,
            priority,
            timestamp: new Date()
          });
          
          suggestionCount++;
        }
      }
    }
    
    // If we didn't extract enough suggestions, fill with fallbacks
    while (suggestions.length < 6) {
      const fallbackIndex = suggestions.length;
      suggestions.push({
        id: `fallback-${Date.now()}-${fallbackIndex}`,
        title: `AI Suggestion ${fallbackIndex + 1}`,
        description: 'AI-generated business insight based on your current data.',
        category: 'growth',
        priority: 'medium',
        timestamp: new Date()
      });
    }
    
    return suggestions;
  };

  const determineCategory = (text: string): AISuggestion['category'] => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('growth') || lowerText.includes('expand') || lowerText.includes('increase')) return 'growth';
    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('revenue')) return 'pricing';
    if (lowerText.includes('risk') || lowerText.includes('default') || lowerText.includes('payment')) return 'risk';
    if (lowerText.includes('market') || lowerText.includes('customer') || lowerText.includes('demand')) return 'market';
    if (lowerText.includes('inventory') || lowerText.includes('stock') || lowerText.includes('supply')) return 'inventory';
    if (lowerText.includes('expansion') || lowerText.includes('diversify') || lowerText.includes('new category')) return 'expansion';
    
    return 'growth';
  };

  const determinePriority = (text: string): AISuggestion['priority'] => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('immediate')) return 'high';
    if (lowerText.includes('important') || lowerText.includes('significant')) return 'medium';
    
    return 'medium';
  };

  const generateFallbackSuggestions = () => {
    const fallbackSuggestions: AISuggestion[] = [
      {
        id: 'fallback-1',
        title: 'Expand Textiles',
        description: '19.9% market share - add seasonal variations',
        category: 'growth',
        priority: 'high',
        timestamp: new Date()
      },
      {
        id: 'fallback-2',
        title: 'Premium Pricing',
        description: 'Charge more for custom orders',
        category: 'pricing',
        priority: 'medium',
        timestamp: new Date()
      },
      {
        id: 'fallback-3',
        title: 'Stricter Terms',
        description: '34.3% default rate - tighten payment terms',
        category: 'risk',
        priority: 'high',
        timestamp: new Date()
      },
      {
        id: 'fallback-4',
        title: 'Focus High-Value',
        description: 'Market pottery & jewelry more',
        category: 'market',
        priority: 'medium',
        timestamp: new Date()
      },
      {
        id: 'fallback-5',
        title: 'Restock Soon',
        description: '25 units left - restock before festive',
        category: 'inventory',
        priority: 'high',
        timestamp: new Date()
      },
      {
        id: 'fallback-6',
        title: 'Add Categories',
        description: 'Consider metalwork & leather',
        category: 'expansion',
        priority: 'low',
        timestamp: new Date()
      }
    ];
    setAiSuggestions(fallbackSuggestions);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    generateAISuggestions();
    
    // Auto-refresh suggestions every 5 minutes
    const interval = setInterval(() => {
      generateAISuggestions();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Craft Business - Credit Risk Analysis</h1>
          <p className="text-muted-foreground mt-2">AI-powered insights for your craft business performance</p>
        </div>

        {/* Top Row - KPIs and Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total no of orders</div>
              <div className="mt-1 text-2xl font-bold">{salesMetrics.totalOrders.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total no of customers</div>
              <div className="mt-1 text-2xl font-bold">{salesMetrics.totalCustomers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Order Status</div>
              <div className="mt-1 text-lg font-bold">66.94% Paid</div>
              <div className="text-xs text-muted-foreground">33.06% Pending</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Gross amount approved</div>
              <div className="mt-1 text-2xl font-bold">₹{salesMetrics.totalSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Avg guarantee %</div>
              <div className="mt-1 text-2xl font-bold">{salesMetrics.avgGuaranteePercent}%</div>
              <div className="mt-2 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[{value: 0}, {value: 1}, {value: 2}, {value: 3}, {value: 4}, {value: 5}]}>
                    <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Business Status and Industry Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Business Status */}
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Info className="h-4 w-4 mr-2" />
                Business Status (New/Existing)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={businessStatus} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="business" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paid" stackId="a" fill="#EC4899" name="Paid in full" />
                  <Bar dataKey="default" stackId="a" fill="#3B82F6" name="Default" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Industry Breakdown */}
          <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Info className="h-4 w-4 mr-2" />
                Default rate by business industry
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="industry" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="default" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Third Row - Pie Chart and Trend Line */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Asset Backed Pie Chart */}
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Info className="h-4 w-4 mr-2" />
                Default rate by asset-backed status
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={assetBackedData} dataKey="value" nameKey="name" outerRadius={60}>
                    {assetBackedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Line */}
          <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Info className="h-4 w-4 mr-2" />
                Trend - Default rate by approval year (2019-2024)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={defaultTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - AI Suggestions */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="transition-all duration-300 hover:shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-4 w-4 mr-2" />
                  AI Business Suggestions
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                  <button
                    onClick={generateAISuggestions}
                    disabled={isLoadingSuggestions}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    title="Refresh AI suggestions"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingSuggestions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={`p-4 rounded-lg border-l-4 ${getCategoryColor(suggestion.category)}`}
                    >
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        {getCategoryIcon(suggestion.category)}
                        {suggestion.title}
                        {suggestion.priority === 'high' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">High Priority</span>
                        )}
                      </h4>
                      <p className="text-sm opacity-90">{suggestion.description}</p>
                      <div className="mt-2 text-xs opacity-70">
                        {suggestion.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

