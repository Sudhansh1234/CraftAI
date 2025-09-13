import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AddMetricModalProps {
  onMetricAdded?: () => void;
  children?: React.ReactNode;
}

export function AddMetricModal({ onMetricAdded, children }: AddMetricModalProps) {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    metricType: '',
    value: '',
    description: '',
    date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });

  const metricTypes = [
    { value: 'revenue', label: 'Revenue ($)' },
    { value: 'customers', label: 'Number of Customers' },
    { value: 'sales', label: 'Number of Sales' },
    { value: 'orders', label: 'Number of Orders' },
    { value: 'profit', label: 'Profit ($)' },
    { value: 'expenses', label: 'Expenses ($)' },
    { value: 'inventory', label: 'Inventory Value ($)' },
    { value: 'website_visits', label: 'Website Visits' },
    { value: 'social_followers', label: 'Social Media Followers' },
    { value: 'email_subscribers', label: 'Email Subscribers' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/${currentUser.uid}/add-metric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metricType: formData.metricType,
          value: parseFloat(formData.value),
          description: formData.description,
          date: new Date(formData.date).toISOString()
        })
      });

      if (response.ok) {
        setFormData({
          metricType: '',
          value: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setOpen(false);
        onMetricAdded?.();
      } else {
        const error = await response.json();
        console.error('Error adding metric:', error);
      }
    } catch (error) {
      console.error('Error adding metric:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary hover:shadow-medium transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add Metric
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Business Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metricType">Metric Type</Label>
            <Select value={formData.metricType} onValueChange={(value) => handleInputChange('metricType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric type" />
              </SelectTrigger>
              <SelectContent>
                {metricTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              placeholder="Enter metric value"
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this metric"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Metric
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

