import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, Palette, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ArtisAI
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Your AI-Powered
            <span className="block text-transparent bg-gradient-primary bg-clip-text">
              Artisan Business Hub
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your handcrafted passion into a thriving business with personalized AI insights, 
            dynamic workflows, and intelligent recommendations tailored just for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              asChild
              size="lg" 
              className="bg-gradient-primary hover:shadow-medium transition-all text-lg px-8 py-6"
            >
              <Link to="/dashboard">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <Card className="group hover:shadow-medium transition-all duration-300 border-0 bg-ai-surface shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-ai-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-ai-primary/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-ai-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Dynamic Workflows</h3>
              <p className="text-muted-foreground">
                AI-generated business flows that adapt and evolve as your artisan business grows and changes.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-medium transition-all duration-300 border-0 bg-ai-surface shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-ai-secondary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-ai-secondary/20 transition-colors">
                <Palette className="w-6 h-6 text-ai-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Insights</h3>
              <p className="text-muted-foreground">
                Get personalized recommendations on pricing, marketing, and growth opportunities powered by AI.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-medium transition-all duration-300 border-0 bg-ai-surface shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-ai-success/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-ai-success/20 transition-colors">
                <Users className="w-6 h-6 text-ai-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Global Reach</h3>
              <p className="text-muted-foreground">
                Multi-language support and international market insights to help you reach artisan lovers worldwide.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="max-w-2xl mx-auto bg-gradient-primary text-primary-foreground border-0 shadow-strong">
            <CardContent className="p-8">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Craft?</h3>
              <p className="text-primary-foreground/90 mb-6">
                Join thousands of artisans who have already elevated their businesses with ArtisAI.
              </p>
              <Button 
                asChild
                variant="secondary" 
                size="lg" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link to="/dashboard">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
