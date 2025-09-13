import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, DollarSign, Award, Package } from 'lucide-react';

interface KPIData {
  productsSold: number;
  totalSales: number;
  totalRevenue: number;
  topSeller: string;
  salesGrowth: number;
  productGrowth: number;
  averageOrderValue: number;
  inventoryValue: number;
}

interface KPIsProps {
  data: KPIData;
}

export function KPIs({ data }: KPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Products Sold */}
      <Card className="hover:shadow-soft transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Products Sold</p>
              <p className="text-2xl font-bold text-foreground">{data.productsSold.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500">+{data.productGrowth}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="hover:shadow-soft transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">₹{data.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500">+{data.salesGrowth}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card className="hover:shadow-soft transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">₹{data.averageOrderValue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">Per order</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Value */}
      <Card className="hover:shadow-soft transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold text-foreground">₹{data.inventoryValue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">At cost</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
