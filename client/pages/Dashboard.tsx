import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SalesGraph } from '@/components/dashboard/SalesGraph';
import { ProductPieChart } from '@/components/dashboard/ProductPieChart';
import { KPIs } from '@/components/dashboard/KPIs';
import { AIRecommendations } from '@/components/dashboard/AIRecommendations';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { aiService, AIDashboardData } from '@/lib/ai-service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import {
  Plus, 
  Sparkles, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Settings,
  Bell,
  Search,
  RefreshCw,
  Database,
  Home
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [aiData, setAiData] = useState<AIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [basicDataLoaded, setBasicDataLoaded] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Load basic data first, then AI data in background
      loadBasicData();
    }
  }, [currentUser]);

  const loadBasicData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // Load basic dashboard data without AI insights
      const data = await aiService.getDashboardData(currentUser.uid);
      setAiData(data);
      setBasicDataLoaded(true);
    } catch (error) {
      setBasicDataLoaded(true); // Show dashboard even if data fails
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        loadBasicData();
      }
    };

    const handleFocus = () => {
      if (currentUser) {
        loadBasicData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);


  const loadAIData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const data = await aiService.getDashboardData(currentUser.uid);
      setAiData(data);
      setBasicDataLoaded(true);
    } catch (error) {
      // Handle Firebase connection errors gracefully
      if (error.message?.includes('UNAVAILABLE') || error.message?.includes('ETIMEDOUT')) {
        setConnectionError(true);
        // Retry after 3 seconds
        setTimeout(() => {
          if (currentUser) {
            setConnectionError(false);
            loadAIData();
          }
        }, 3000);
      } else {
        // Even if AI data fails, show the dashboard with basic data
        setBasicDataLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;
    
    try {
      setRefreshing(true);
      const data = await aiService.getDashboardData(currentUser.uid);
      setAiData(data);
      
      // Show notification when data is refreshed
      toast({
        title: "Dashboard Refreshed",
        description: "Dashboard data has been updated with your latest information.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Generate data from real business metrics
  const generateDataFromMetrics = () => {
    if (!aiData?.businessMetrics) {
      return {
        salesData: [],
        productData: [],
        inventoryData: [],
        kpiData: {
          productsSold: 0,
          totalSales: 0,
          topSeller: 'No data',
          salesGrowth: 0,
          productGrowth: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          inventoryValue: 0,
        }
      };
    }

    const metrics = aiData.businessMetrics;
    
    // Process sales data - use sales collection data
    const salesMetrics = metrics.filter(m => m.metric_type === 'sales');
    
    // Group sales by date
    const salesByDate = salesMetrics.reduce((acc, metric) => {
      const date = metric.sale_date ? metric.sale_date.split('T')[0] : metric.date_recorded?.split('T')[0] || new Date().toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { sales: 0, revenue: 0 };
      }
      
      acc[date].sales += metric.quantity || 0;
      acc[date].revenue += metric.value || (metric.price_per_unit || metric.price || 0) * (metric.quantity || 0);
      
      return acc;
    }, {} as Record<string, { sales: number; revenue: number }>);
    
    // Convert to array and sort by date
    const salesData = Object.entries(salesByDate).map(([date, data]) => ({
      date,
      sales: (data as { sales: number; revenue: number }).sales,
      revenue: (data as { sales: number; revenue: number }).revenue
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Process product data - use products collection data
    const productMetrics = metrics.filter(m => m.metric_type === 'products');
    
    // Group products by name and calculate total quantities sold
    const productSales = salesMetrics.reduce((acc: any, sale) => {
      const productName = sale.product_name || 'Unnamed Product';
      if (!acc[productName]) {
        acc[productName] = {
          quantitySold: 0,
          revenue: 0,
          materialCost: 0,
          sellingPrice: 0
        };
      }
      acc[productName].quantitySold += sale.quantity || 0;
      acc[productName].revenue += (sale.price_per_unit || sale.price || 0) * (sale.quantity || 0);
      return acc;
    }, {});

    // Add inventory data from products collection
    productMetrics.forEach(product => {
      const productName = product.product_name || 'Unnamed Product';
      if (!productSales[productName]) {
        productSales[productName] = {
          quantitySold: 0,
          revenue: 0,
          materialCost: 0,
          sellingPrice: 0
        };
      }
      productSales[productName].materialCost = product.material_cost || 0;
      productSales[productName].sellingPrice = product.selling_price || 0;
    });
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    const productData = Object.entries(productSales).map(([name, data], index) => ({
      name,
      value: (data as any).quantitySold,
      color: colors[index % colors.length],
      revenue: (data as any).revenue,
      profit: (data as any).revenue - ((data as any).materialCost * (data as any).quantitySold)
    })).sort((a, b) => b.value - a.value);

    // Calculate KPIs
    const totalProductsSold = salesMetrics.reduce((sum, metric) => sum + (metric.quantity || 0), 0);
    const totalSales = salesMetrics.reduce((sum, metric) => sum + ((metric.price_per_unit || metric.price || 0) * (metric.quantity || 0)), 0);
    const topSeller = productData.length > 0 ? productData[0].name : 'No data';
    
    // Calculate inventory value from products collection
    const inventoryValue = productMetrics.reduce((sum, product) => {
      const quantity = product.quantity || 0;
      const materialCost = product.material_cost || 0;
      return sum + (quantity * materialCost);
    }, 0);
    
    // Calculate average order value
    const averageOrderValue = salesMetrics.length > 0 ? totalSales / salesMetrics.length : 0;
    
    // Calculate growth (compare last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentSales = salesMetrics.filter(m => {
      const saleDate = m.sale_date ? new Date(m.sale_date) : new Date(m.date_recorded);
      return saleDate >= sevenDaysAgo;
    });
    const previousSales = salesMetrics.filter(m => {
      const saleDate = m.sale_date ? new Date(m.sale_date) : new Date(m.date_recorded);
      return saleDate >= fourteenDaysAgo && saleDate < sevenDaysAgo;
    });
    
    const recentTotal = recentSales.reduce((sum, metric) => sum + ((metric.price_per_unit || metric.price || 0) * (metric.quantity || 0)), 0);
    const previousTotal = previousSales.reduce((sum, metric) => sum + ((metric.price_per_unit || metric.price || 0) * (metric.quantity || 0)), 0);
    const salesGrowth = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    const recentProducts = recentSales.reduce((sum, metric) => sum + (metric.quantity || 0), 0);
    const previousProducts = previousSales.reduce((sum, metric) => sum + (metric.quantity || 0), 0);
    const productGrowth = previousProducts > 0 ? ((recentProducts - previousProducts) / previousProducts) * 100 : 0;

    // Process inventory data from products collection
    const inventoryData = productMetrics.map(product => {
      const materialCost = product.material_cost || 0;
      const sellingPrice = product.selling_price || 0;
      const quantity = product.quantity || 0;
      const totalValue = quantity * materialCost;
      const profitMargin = sellingPrice > 0 ? ((sellingPrice - materialCost) / sellingPrice) * 100 : 0;
      
      return {
        id: product.id || product._id || Math.random().toString(36).substr(2, 9),
        product_name: product.product_name || 'Unnamed Product',
        quantity: quantity,
        material_cost: materialCost,
        selling_price: sellingPrice,
        total_value: totalValue,
        profit_margin: profitMargin,
        last_updated: product.updated_at || product.created_at || new Date().toISOString()
      };
    }).sort((a, b) => b.total_value - a.total_value); // Sort by total value descending

    const kpiData = {
      productsSold: totalProductsSold,
      totalSales: totalSales,
      totalRevenue: totalSales,
      topSeller: topSeller,
      salesGrowth: Math.round(salesGrowth * 10) / 10,
      productGrowth: Math.round(productGrowth * 10) / 10,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
    };

    return { salesData, productData, inventoryData, kpiData };
  };

  const { salesData, productData, inventoryData, kpiData } = generateDataFromMetrics();

  if (loading && !basicDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!aiData || (!aiData.businessMetrics || aiData.businessMetrics.length === 0)) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">ArtisAI</h1>
                  <p className="text-sm text-muted-foreground">Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={refreshing}
                  className="text-muted-foreground"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                <ThemeToggle variant="minimal" />
                <Button variant="ghost" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-ai-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-ai-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Business Data</h2>
              <p className="text-muted-foreground mb-6">
                Start by adding your products and recording sales to see your business analytics and AI insights.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/add-data')}
                  className="bg-gradient-primary hover:shadow-medium transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Data
                </Button>
                <Button 
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  title="Refresh AI recommendations and dashboard data"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh AI Data
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>To get started:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Add products to your inventory</li>
                    <li>Record sales transactions</li>
                    <li>View your business analytics</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ArtisAI</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {currentUser?.displayName || currentUser?.email || 'User'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/add-data')}
                className="text-muted-foreground"
              >
                <Database className="w-4 h-4 mr-2" />
                Add Data
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshData}
                disabled={refreshing}
                className="text-muted-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <ThemeToggle variant="minimal" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome back, {currentUser?.displayName || currentUser?.email || 'User'}
                </h2>
                <p className="text-muted-foreground">Here's your business performance overview</p>
                {currentUser?.email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentUser.email}
                  </p>
                )}
                {connectionError && (
                  <div className="mt-2 p-3 bg-orange-100 border border-orange-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-orange-800">
                        ⚠️ Connection issue detected. Retrying automatically...
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setConnectionError(false);
                          loadAIData();
                        }}
                        className="ml-2"
                      >
                        Retry Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
                <Button 
                  onClick={() => navigate('/add-data')}
                  className="bg-gradient-primary hover:shadow-medium transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Metric
                </Button>
              </div>

              {/* KPIs */}
              <KPIs data={kpiData} />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SalesGraph data={salesData} />
                <ProductPieChart data={productData} />
              </div>

              {/* Inventory Table */}
              <InventoryTable data={inventoryData} />
            </div>
          </div>

          {/* AI Recommendations Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <AIRecommendations />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}