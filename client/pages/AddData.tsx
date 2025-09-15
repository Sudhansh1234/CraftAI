import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, ArrowLeft, Package, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { aiService } from '@/lib/ai-service';

interface Product {
  id: string;
  product_name: string;
  material_cost: number;
  selling_price: number;
  quantity: number;
  added_date: string;
}

export default function AddData() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Sales form data
  const [salesData, setSalesData] = useState({
    product_name: '',
    quantity: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  // Product form data
  const [productData, setProductData] = useState({
    product_name: '',
    material_cost: '',
    selling_price: '',
    quantity: '',
    added_date: new Date().toISOString().split('T')[0]
  });

  // Calculate profit margin
  const calculateProfitMargin = () => {
    const materialCost = parseFloat(productData.material_cost) || 0;
    const sellingPrice = parseFloat(productData.selling_price) || 0;
    
    if (sellingPrice === 0) return 0;
    
    const profit = sellingPrice - materialCost;
    const margin = (profit / sellingPrice) * 100;
    return margin;
  };

  const profitMargin = calculateProfitMargin();

  // Calculate total sale value automatically
  const calculateTotalSaleValue = () => {
    if (!salesData.product_name || !salesData.quantity) return 0;
    
    const selectedProduct = products.find(p => p.product_name === salesData.product_name);
    if (!selectedProduct) return 0;
    
    const quantity = parseInt(salesData.quantity) || 0;
    const sellingPrice = selectedProduct.selling_price || 0;
    
    return quantity * sellingPrice;
  };

  const totalSaleValue = calculateTotalSaleValue();

  // Function to refresh AI recommendations and generate new insights
  const refreshAIRecommendations = async () => {
    if (!currentUser) return;
    
    try {
      // Trigger AI data refresh by calling the dashboard API
      await fetch(`/api/dashboard/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Generate new AI insights after adding sales or products
      await fetch(`/api/dashboard/${currentUser.uid}/insights/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
    } catch (error) {
      // Silently handle refresh errors
    }
  };

  // Load products from Firebase
  useEffect(() => {
    if (currentUser) {
      loadProducts();
    }
  }, [currentUser]);

  const loadProducts = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingProducts(true);
      const response = await fetch(`/api/dashboard/${currentUser.uid}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.products) {
        // Transform the products data to match our interface
        const transformedProducts = data.products.map((product: any) => ({
          id: product.id,
          product_name: product.name || product.product_name,
          material_cost: product.materialCost || product.material_cost || 0,
          selling_price: product.sellingPrice || product.price || 0,
          quantity: product.quantity || 0,
          added_date: product.dateAdded || product.added_date || new Date().toISOString().split('T')[0]
        }));
        setProducts(transformedProducts);
      } else {
        // If no products found, set empty array
        setProducts([]);
      }
    } catch (error) {
      // Set empty array on error to prevent UI issues
      setProducts([]);
      toast({
        title: "Warning",
        description: "Could not load products. You can still add new ones.",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSalesInputChange = (field: string, value: string) => {
    setSalesData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductInputChange = (field: string, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add sales data.",
        variant: "destructive"
      });
      return;
    }

    if (!salesData.product_name || !salesData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Check if product exists
    const productExists = products.some(p => p.product_name === salesData.product_name);
    if (!productExists) {
      toast({
        title: "Product Not Found",
        description: "This product doesn't exist. Please add it in the Products section first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        metricType: 'sales',
        value: totalSaleValue, // Automatically calculated total sale value
        productName: salesData.product_name,
        quantity: parseInt(salesData.quantity),
        price: totalSaleValue / parseInt(salesData.quantity), // Calculate price per unit
        date: salesData.sale_date || new Date().toISOString().split('T')[0]
      };

      console.log('🚀 Sending sales data:', requestData);
      console.log('📝 Sales form data:', salesData);

      const response = await fetch(`/api/dashboard/${currentUser.uid}/add-metric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add sale');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Sale recorded successfully! AI insights are being generated.",
        });

        // Reset form
        setSalesData({
          product_name: '',
          quantity: '',
          sale_date: new Date().toISOString().split('T')[0]
        });

        // Reload products to update stock
        loadProducts();
        
        // Refresh AI recommendations
        await refreshAIRecommendations();
      } else {
        throw new Error(result.error || 'Failed to add sale');
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record sale. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add products.",
        variant: "destructive"
      });
      return;
    }

    if (!productData.product_name || !productData.material_cost || !productData.selling_price || !productData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        metricType: 'products',
        value: parseFloat(productData.selling_price), // Required field
        productName: productData.product_name,
        materialCost: parseFloat(productData.material_cost),
        sellingPrice: parseFloat(productData.selling_price),
        quantity: parseInt(productData.quantity),
        date: productData.added_date || new Date().toISOString().split('T')[0]
      };

      console.log('🚀 Sending product data:', requestData);
      console.log('📝 Product form data:', productData);

      const response = await fetch(`/api/dashboard/${currentUser.uid}/add-metric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Product added successfully! AI insights are being generated.",
        });

        // Reset form
        setProductData({
          product_name: '',
          material_cost: '',
          selling_price: '',
          quantity: '',
          added_date: new Date().toISOString().split('T')[0]
        });

        // Reload products
        loadProducts();
        
        // Refresh AI recommendations
        await refreshAIRecommendations();
      } else {
        throw new Error(result.error || 'Failed to add product');
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Add Business Data
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentUser?.displayName || currentUser?.email || 'User'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back, {currentUser?.displayName || currentUser?.email || 'User'}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Record your sales transactions and manage your product inventory to track your business performance.
          </p>
        </div>

        {/* Tabs for Sales and Products */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger 
                value="sales" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
              >
                <ShoppingCart className="w-4 h-4" />
                Sales
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
              >
                <Package className="w-4 h-4" />
                Products
              </TabsTrigger>
            </TabsList>

            {/* Sales Tab */}
            <TabsContent value="sales" className="mt-6">
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Record Sale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSalesSubmit} className="space-y-6">
                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="product_name" className="text-gray-700 dark:text-gray-300">Product Name *</Label>
                      <Select
                        value={salesData.product_name}
                        onValueChange={(value) => handleSalesInputChange('product_name', value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          {loadingProducts ? (
                            <SelectItem value="loading" disabled className="text-gray-500 dark:text-gray-400">
                              Loading products...
                            </SelectItem>
                          ) : products.length === 0 ? (
                            <SelectItem value="no-products" disabled className="text-gray-500 dark:text-gray-400">
                              No products found. Add products first.
                            </SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem 
                                key={product.id} 
                                value={product.product_name}
                                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {product.product_name} (Stock: {product.quantity})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {products.length === 0 && !loadingProducts && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          No products found. Please add products in the Products tab first.
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-gray-700 dark:text-gray-300">Quantity Sold *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        placeholder="Enter quantity sold"
                        value={salesData.quantity}
                        onChange={(e) => handleSalesInputChange('quantity', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    {/* Calculated Sale Value */}
                    {salesData.product_name && salesData.quantity && (
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Sale Calculation</Label>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Selling Price:</span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                ${products.find(p => p.product_name === salesData.product_name)?.selling_price || 0}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{salesData.quantity}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Total Sale Value:</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  ${totalSaleValue.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sale Date */}
                    <div className="space-y-2">
                      <Label htmlFor="sale_date" className="text-gray-700 dark:text-gray-300">Sale Date</Label>
                      <Input
                        id="sale_date"
                        type="date"
                        value={salesData.sale_date}
                        onChange={(e) => handleSalesInputChange('sale_date', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={loading || products.length === 0}
                        className="flex-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Recording Sale...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Record Sale
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="mt-6">
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Add Product
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="product_name" className="text-gray-700 dark:text-gray-300">Product Name *</Label>
                      <Input
                        id="product_name"
                        type="text"
                        placeholder="Enter product name"
                        value={productData.product_name}
                        onChange={(e) => handleProductInputChange('product_name', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    {/* Material Cost */}
                    <div className="space-y-2">
                      <Label htmlFor="material_cost" className="text-gray-700 dark:text-gray-300">Material Cost ($) *</Label>
                      <Input
                        id="material_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter material cost"
                        value={productData.material_cost}
                        onChange={(e) => handleProductInputChange('material_cost', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    {/* Selling Price */}
                    <div className="space-y-2">
                      <Label htmlFor="selling_price" className="text-gray-700 dark:text-gray-300">Selling Price ($) *</Label>
                      <Input
                        id="selling_price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter selling price"
                        value={productData.selling_price}
                        onChange={(e) => handleProductInputChange('selling_price', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        required
                      />
                      {/* Profit Margin Display */}
                      {productData.material_cost && productData.selling_price && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profit Margin:</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${
                                profitMargin >= 50 ? 'text-green-600 dark:text-green-400' :
                                profitMargin >= 25 ? 'text-yellow-600 dark:text-yellow-400' :
                                profitMargin >= 0 ? 'text-orange-600 dark:text-orange-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {profitMargin.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                (${(parseFloat(productData.selling_price) - parseFloat(productData.material_cost)).toFixed(2)} profit)
                              </span>
                            </div>
                          </div>
                          {profitMargin < 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              ⚠️ Selling below cost - you'll lose money on this product
                            </p>
                          )}
                          {profitMargin >= 0 && profitMargin < 20 && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              💡 Consider increasing price for better margins
                            </p>
                          )}
                          {profitMargin >= 50 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              🎉 Excellent profit margin!
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stock Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-gray-700 dark:text-gray-300">Stock Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        placeholder="Enter stock quantity"
                        value={productData.quantity}
                        onChange={(e) => handleProductInputChange('quantity', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    {/* Added Date */}
                    <div className="space-y-2">
                      <Label htmlFor="added_date" className="text-gray-700 dark:text-gray-300">Added Date</Label>
                      <Input
                        id="added_date"
                        type="date"
                        value={productData.added_date}
                        onChange={(e) => handleProductInputChange('added_date', e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding Product...
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 mr-2" />
                            Add Product
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Current Products List */}
              {products.length > 0 && (
                <Card className="mt-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-gray-900 dark:text-gray-100">Current Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 pt-2">
                      {products.map((product) => {
                        const profitMargin = product.selling_price > 0 ? 
                          ((product.selling_price - product.material_cost) / product.selling_price * 100) : 0;
                        const profitPerUnit = product.selling_price - product.material_cost;
                        
                        return (
                          <div key={product.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-lg">{product.product_name}</h4>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  profitMargin >= 50 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  profitMargin >= 25 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  profitMargin >= 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {profitMargin.toFixed(1)}% margin
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Material Cost:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">${product.material_cost}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Selling Price:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">${product.selling_price}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{product.quantity} units</p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Profit/Unit:</span>
                                <p className={`font-medium ${
                                  profitPerUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  ${profitPerUnit.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            {product.added_date && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Added: {new Date(product.added_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
