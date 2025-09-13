import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  product_name: string;
  quantity: number;
  material_cost: number;
  selling_price: number;
  total_value: number;
  profit_margin: number;
  last_updated: string;
}

interface InventoryTableProps {
  data: InventoryItem[];
}

export function InventoryTable({ data }: InventoryTableProps) {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'out', color: 'destructive', icon: AlertTriangle };
    if (quantity <= 5) return { status: 'low', color: 'destructive', icon: AlertTriangle };
    if (quantity <= 10) return { status: 'medium', color: 'default', icon: TrendingDown };
    return { status: 'good', color: 'secondary', icon: CheckCircle };
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-ai-primary" />
          Current Inventory
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products in inventory</p>
            <p className="text-sm">Add products to see your inventory here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Cost Price</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Selling Price</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Total Value</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Margin</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const stockStatus = getStockStatus(item.quantity);
                  const StatusIcon = stockStatus.icon;
                  
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium">{item.product_name}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${
                            stockStatus.status === 'out' ? 'text-red-500' :
                            stockStatus.status === 'low' ? 'text-orange-500' :
                            stockStatus.status === 'medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                          <span className="font-medium">{item.quantity}</span>
                          <Badge variant={stockStatus.color as any} className="text-xs">
                            {stockStatus.status === 'out' ? 'Out of Stock' :
                             stockStatus.status === 'low' ? 'Low Stock' :
                             stockStatus.status === 'medium' ? 'Medium' : 'In Stock'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatCurrency(item.material_cost)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatCurrency(item.selling_price)}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {formatCurrency(item.total_value)}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`font-medium ${
                          item.profit_margin > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.profit_margin > 0 ? '+' : ''}{item.profit_margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {formatDate(item.last_updated)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


