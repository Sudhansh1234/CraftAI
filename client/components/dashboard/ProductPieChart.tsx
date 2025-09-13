import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ProductData {
  name: string;
  value: number;
  color: string;
  revenue?: number;
  profit?: number;
}

interface ProductPieChartProps {
  data: ProductData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export function ProductPieChart({ data }: ProductPieChartProps) {
  const totalProducts = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-ai-primary to-ai-secondary" />
          Product Sales Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const data = props.payload;
                  return [
                    `${value} units sold`,
                    `Revenue: ₹${data.revenue?.toLocaleString() || 0}`,
                    `Profit: ₹${data.profit?.toLocaleString() || 0}`
                  ];
                }}
                labelFormatter={(label) => `Product: ${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Total Products: {totalProducts}
        </div>
      </CardContent>
    </Card>
  );
}
