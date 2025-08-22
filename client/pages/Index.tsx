import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/CountUp";
import { 
  Sparkles, 
  MessageCircle, 
  TrendingUp, 
  BookOpen, 
  DollarSign, 
  Mic, 
  Camera,
  Globe,
  Clock,
  BarChart3,
  Palette,
  Smartphone,
  ArrowRight,
  Play,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const features = [
    {
      icon: TrendingUp,
      title: "AI-Driven Marketing",
      description: "Auto-create social media content in local languages with optimized posting times",
      benefits: ["Smart content generation", "Multi-language support", "Best posting times"],
      href: "/marketing"
    },
    {
      icon: BookOpen,
      title: "Storytelling Platform",
      description: "Transform product stories into engaging videos with multilingual voiceovers",
      benefits: ["Heritage storytelling", "Video creation", "Cultural value highlight"],
      href: "/storytelling"
    },
    {
      icon: BarChart3,
      title: "Smart Recommendations",
      description: "Match products with trends and provide market insights for better sales",
      benefits: ["Festival trend matching", "Buyer preferences", "Regional insights"],
      href: "/marketing"
    },
    {
      icon: DollarSign,
      title: "Dynamic Pricing AI",
      description: "Get competitive pricing suggestions and inventory management alerts",
      benefits: ["Market-based pricing", "Inventory alerts", "Seasonal optimization"],
      href: "/pricing"
    },
    {
      icon: Palette,
      title: "Learning Hub",
      description: "Step-by-step training in digital marketing and customer handling",
      benefits: ["Multi-language training", "Digital marketing tips", "Tradition + modern"],
      href: "/chat"
    },
    {
      icon: Mic,
      title: "Voice-First Commerce",
      description: "Upload product details via voice with AI translation capabilities",
      benefits: ["Native language input", "Auto translation", "Voice dashboard"],
      href: "/voice"
    }
  ];

  const stats = [
    { label: "Artisans Empowered", value: 10000, suffix: "+" },
    { label: "Stories Created", value: 50000, suffix: "+" },
    { label: "Languages Supported", value: 12, suffix: "+" },
    { label: "Revenue Increase", value: 300, suffix: "%" }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 gemini-gradient opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/80 to-background"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div className="mb-12 lg:mb-0">
              <div className="flex items-center space-x-2 mb-6">
                <Badge variant="secondary" className="px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  For Artisans
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
                Empower Your 
                <span className="gemini-text-gradient"> Craft Business</span> with AI
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Transform traditional craftsmanship into digital success. Our AI assistant helps artisans 
                create content, tell stories, optimize pricing, and reach global audiences—all in your native language.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="gemini-gradient text-white border-0 hover:opacity-90" asChild>
                  <Link to="/auth">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Get Started
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="group">
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">12 languages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Voice support</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-card via-card to-secondary/30 p-8">
                <div className="gemini-gradient absolute inset-0 opacity-10"></div>
                <div className="relative">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm font-medium">🎯 Marketing Assistant</p>
                      <p className="text-xs text-muted-foreground mt-1">Creating Instagram post for your handwoven scarf...</p>
                    </div>
                    
                    <div className="bg-secondary rounded-lg p-4">
                      <p className="text-sm">✨ "Handcrafted with love, each thread tells a story of tradition and artistry. 
                      Perfect for the festive season! #HandmadeJewelry #ArtisanCraft #Diwali2024"</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">📱 Instagram</Badge>
                        <Badge variant="secondary" className="text-xs">⏰ Best time: 7 PM</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-primary/10 rounded-lg p-4">
                      <p className="text-sm font-medium">📊 Pricing Suggestion</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on festive demand: ₹2,800 (+15% from base price)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold gemini-text-gradient mb-2">
                  <CountUp
                    end={stat.value}
                    duration={2500}
                    delay={index * 200}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to <span className="gemini-text-gradient">Grow Your Business</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive AI platform bridges the gap between traditional craftsmanship and modern digital commerce
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg gemini-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" className="group/btn p-0 h-auto" asChild>
                      <Link to={feature.href}>
                        Learn more 
                        <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-secondary/30 via-background to-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your <span className="gemini-text-gradient">Artisan Business?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of artisans who are already using AI to grow their craft businesses and reach global audiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gemini-gradient text-white border-0 hover:opacity-90" asChild>
                <Link to="/auth">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Get Started
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Smartphone className="h-5 w-5 mr-2" />
                Try Voice Commerce
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
