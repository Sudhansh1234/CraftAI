import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, MapPin, Package, Target, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddInformationModalProps {
  children: React.ReactNode;
  className?: string;
}

export function AddInformationModal({ children, className }: AddInformationModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    location: '',
    productCategories: [] as string[],
    businessGoals: '',
    targetAudience: '',
    currentChallenges: '',
    businessType: ''
  });

  const productCategoryOptions = [
    'Ceramics & Pottery',
    'Textiles & Fabrics',
    'Jewelry & Accessories',
    'Wood Working',
    'Leather Goods',
    'Glass Art',
    'Home Decor',
    'Fashion',
    'Art & Paintings',
    'Sculptures'
  ];

  const handleAddCategory = (category: string) => {
    if (!formData.productCategories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        productCategories: [...prev.productCategories, category]
      }));
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.filter(c => c !== category)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your AI service
    console.log('Submitting form data:', formData);
    setOpen(false);
    // Show a toast notification that the flowchart is being updated
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={className}>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-ai-primary" />
            Add Business Information
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Share more details about your artisan business to get personalized AI insights and recommendations.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm font-medium">
              Business Name
            </Label>
            <Input
              id="businessName"
              placeholder="e.g., Sarah's Handmade Ceramics"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Portland, Oregon"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Business Type</Label>
            <Select value={formData.businessType} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, businessType: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select your business stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Just Starting Out</SelectItem>
                <SelectItem value="established">Established Business</SelectItem>
                <SelectItem value="scaling">Ready to Scale</SelectItem>
                <SelectItem value="hobby">Hobby Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Package className="w-4 h-4" />
              Product Categories
            </Label>
            
            <Select onValueChange={handleAddCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Add product categories" />
              </SelectTrigger>
              <SelectContent>
                {productCategoryOptions.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    disabled={formData.productCategories.includes(category)}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {formData.productCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.productCategories.map((category) => (
                  <Badge 
                    key={category} 
                    variant="secondary" 
                    className="flex items-center gap-1 pr-1"
                  >
                    {category}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveCategory(category)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Business Goals */}
          <div className="space-y-2">
            <Label htmlFor="businessGoals" className="text-sm font-medium flex items-center gap-1">
              <Target className="w-4 h-4" />
              Business Goals
            </Label>
            <Textarea
              id="businessGoals"
              placeholder="e.g., Increase online sales, expand to local markets, launch new product line..."
              value={formData.businessGoals}
              onChange={(e) => setFormData(prev => ({ ...prev, businessGoals: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="text-sm font-medium">
              Target Audience
            </Label>
            <Textarea
              id="targetAudience"
              placeholder="e.g., Young professionals who appreciate handmade home decor..."
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Current Challenges */}
          <div className="space-y-2">
            <Label htmlFor="currentChallenges" className="text-sm font-medium">
              Current Challenges
            </Label>
            <Textarea
              id="currentChallenges"
              placeholder="e.g., Finding the right pricing, marketing on social media, managing inventory..."
              value={formData.currentChallenges}
              onChange={(e) => setFormData(prev => ({ ...prev, currentChallenges: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary hover:shadow-medium transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Update My Flow
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}