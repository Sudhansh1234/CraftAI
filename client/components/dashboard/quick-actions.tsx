import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Users, 
  Hash, 
  Search, 
  Camera, 
  MessageSquare, 
  BarChart3, 
  PlusCircle,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  priority?: 'high' | 'medium' | 'low';
  popular?: boolean;
}

const mockActions: QuickAction[] = [
  {
    id: '1',
    title: 'Add Customer',
    description: 'Add new customer information and contact details',
    icon: <Users className="w-4 h-4" />,
    category: 'Customers',
    priority: 'high',
    popular: true
  },
  {
    id: '2',
    title: 'Add Sale Record',
    description: 'Record a new sale or transaction',
    icon: <PlusCircle className="w-4 h-4" />,
    category: 'Sales',
    priority: 'high',
    popular: true
  },
  {
    id: '3',
    title: 'Add Inventory Item',
    description: 'Add new materials or finished products to inventory',
    icon: <Package className="w-4 h-4" />,
    category: 'Inventory',
    priority: 'medium'
  },
  {
    id: '4',
    title: 'Add Expense',
    description: 'Log business expenses and receipts',
    icon: <Hash className="w-4 h-4" />,
    category: 'Finance',
    priority: 'medium'
  },
  {
    id: '5',
    title: 'Add Order',
    description: 'Create new custom order or project',
    icon: <Target className="w-4 h-4" />,
    category: 'Orders',
    priority: 'high'
  },
  {
    id: '6',
    title: 'Add Supplier',
    description: 'Register new supplier contact and details',
    icon: <MessageSquare className="w-4 h-4" />,
    category: 'Suppliers',
    priority: 'low'
  }
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-ai-primary" />
            Quick Actions
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <PlusCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mockActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start text-left hover:shadow-soft transition-all duration-200 relative group",
                action.priority === 'high' && "border-ai-primary/30 hover:border-ai-primary/50",
                action.popular && "ring-1 ring-ai-primary/20"
              )}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg bg-ai-surface-elevated",
                  action.priority === 'high' && "bg-ai-primary/10 text-ai-primary"
                )}>
                  {action.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{action.title}</span>
                    {action.popular && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {action.category}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {action.priority === 'high' && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-ai-primary rounded-full opacity-60" />
              )}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full text-ai-primary hover:bg-ai-primary/10 hover:text-ai-primary"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask AI Assistant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
