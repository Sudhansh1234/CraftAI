import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlowChart } from '@/components/ui/flow-chart';
import { InsightsSidebar } from '@/components/dashboard/insights-sidebar';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AnalyticsChart } from '@/components/dashboard/analytics-chart';
import { AddInformationModal } from '@/components/dashboard/add-information-modal';
import { 
  Plus, 
  Sparkles, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Settings,
  Bell,
  Search
} from 'lucide-react';

export default function Dashboard() {
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Welcome back, Sarah</h2>
                  <p className="text-muted-foreground">Here's your personalized business journey</p>
                </div>
                
                <AddInformationModal>
                  <Button className="bg-gradient-primary hover:shadow-medium transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Information
                  </Button>
                </AddInformationModal>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-soft transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Goals</p>
                        <p className="text-2xl font-bold text-foreground">3</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-ai-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-ai-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-soft transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Insights</p>
                        <p className="text-2xl font-bold text-foreground">12</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-ai-secondary/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-ai-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-soft transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-foreground">85%</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-ai-success/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-ai-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Analytics Chart */}
            <AnalyticsChart />

            {/* Business Flow Chart */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-ai-primary" />
                    Your Business Journey
                  </CardTitle>
                  <Badge variant="secondary" className="bg-ai-primary/10 text-ai-primary">
                    AI Generated
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Click on any step to explore insights and take quick actions
                </p>
              </CardHeader>
              <CardContent>
                <FlowChart />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <QuickActions />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <InsightsSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}