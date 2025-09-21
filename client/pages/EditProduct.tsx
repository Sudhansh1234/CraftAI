import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Product {
  id: string;
  product_name: string;
  material_cost: number;
  selling_price: number;
  quantity: number;
  added_date: string;
}

export default function EditProduct() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  
  // Product form data
  const [productData, setProductData] = useState({
    product_name: '',
    material_cost: '',
    selling_price: '',
    quantity: '',
    added_date: ''
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

  useEffect(() => {
    if (currentUser && productId) {
      loadProduct();
    }
  }, [currentUser, productId]);

  const loadProduct = async () => {
    if (!currentUser || !productId) return;
    
    try {
      setLoadingProduct(true);
      const response = await fetch(`/api/dashboard/${currentUser.uid}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.products) {
        const foundProduct = data.products.find((p: any) => p.id === productId);
        
        if (foundProduct) {
          // Helper function to format date for HTML date input
          const formatDateForInput = (dateString: string) => {
            if (!dateString) return new Date().toISOString().split('T')[0];
            
            try {
              const date = new Date(dateString);
              return date.toISOString().split('T')[0];
            } catch (error) {
              console.warn('Invalid date format:', dateString);
              return new Date().toISOString().split('T')[0];
            }
          };

          const transformedProduct = {
            id: foundProduct.id,
            product_name: foundProduct.name || foundProduct.product_name,
            material_cost: foundProduct.materialCost || foundProduct.material_cost || 0,
            selling_price: foundProduct.sellingPrice || foundProduct.price || 0,
            quantity: foundProduct.quantity || 0,
            added_date: formatDateForInput(foundProduct.dateAdded || foundProduct.added_date)
          };
          
          setProduct(transformedProduct);
          setProductData({
            product_name: transformedProduct.product_name,
            material_cost: transformedProduct.material_cost.toString(),
            selling_price: transformedProduct.selling_price.toString(),
            quantity: transformedProduct.quantity.toString(),
            added_date: transformedProduct.added_date
          });
        } else {
          toast({
            title: "Error",
            description: "Product not found.",
            variant: "destructive",
          });
          navigate('/dashboard');
        }
      } else {
        throw new Error('No products found');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Error",
        description: "Could not load product details.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !productId) return;
    
    // Validation
    if (!productData.product_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!productData.material_cost || parseFloat(productData.material_cost) < 0) {
      toast({
        title: "Validation Error",
        description: "Material cost must be a positive number.",
        variant: "destructive",
      });
      return;
    }
    
    if (!productData.selling_price || parseFloat(productData.selling_price) < 0) {
      toast({
        title: "Validation Error",
        description: "Selling price must be a positive number.",
        variant: "destructive",
      });
      return;
    }
    
    if (!productData.quantity || parseInt(productData.quantity) < 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/dashboard/${currentUser.uid}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: productData.product_name.trim(),
          material_cost: parseFloat(productData.material_cost),
          selling_price: parseFloat(productData.selling_price),
          quantity: parseInt(productData.quantity),
          added_date: productData.added_date
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      // Navigate back to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
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
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Edit Product</h1>
                <p className="text-sm text-muted-foreground">Update product information</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <ThemeToggle variant="minimal" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-ai-primary" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    type="text"
                    value={productData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Material Cost and Selling Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material_cost">Material Cost (₹) *</Label>
                    <Input
                      id="material_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={productData.material_cost}
                      onChange={(e) => handleInputChange('material_cost', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price (₹) *</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={productData.selling_price}
                      onChange={(e) => handleInputChange('selling_price', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Profit Margin Display */}
                {productData.material_cost && productData.selling_price && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Profit Margin:</span>
                      <span className={`text-lg font-bold ${
                        profitMargin > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Profit: ₹{(parseFloat(productData.selling_price) - parseFloat(productData.material_cost)).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Quantity and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity in Stock *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={productData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="added_date">Date Added</Label>
                    <Input
                      id="added_date"
                      type="date"
                      value={productData.added_date}
                      onChange={(e) => handleInputChange('added_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-primary hover:shadow-medium transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
