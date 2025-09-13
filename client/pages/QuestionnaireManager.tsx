import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Play, Calendar, MapPin, Palette, MoreHorizontal, FileText, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Questionnaire {
  id: string;
  title: string;
  craft: string;
  location: string;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  answers: Record<string, any>;
}

const QuestionnaireManager: React.FC = () => {
  const navigate = useNavigate();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    title: '',
    craft: '',
    location: ''
  });

  // Removed automatic questionnaire loading
  // Users can manually load questionnaires using the refresh button

  const loadQuestionnaires = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/questionnaires/user123`); // Mock user ID
      const data = await response.json();
      setQuestionnaires(data.questionnaires || []);
    } catch (error) {
      console.error('Error loading questionnaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestionnaire = async () => {
    try {
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestionnaire),
      });

      const data = await response.json();
      if (data.questionnaire) {
        setQuestionnaires(prev => [data.questionnaire, ...prev]);
        setNewQuestionnaire({ title: '', craft: '', location: '' });
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Error creating questionnaire:', error);
    }
  };

  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
    try {
      await fetch(`/api/questionnaires/${questionnaireId}`, {
        method: 'DELETE',
      });
      setQuestionnaires(prev => prev.filter(q => q.id !== questionnaireId));
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
    }
  };

  const handleContinueQuestionnaire = (questionnaire: Questionnaire) => {
    // Navigate to questionnaire with existing answers
    navigate('/questionnaire', { 
      state: { 
        questionnaireId: questionnaire.id,
        existingAnswers: questionnaire.answers,
        isUpdate: true
      } 
    });
  };

  const handleStartNew = () => {
    navigate('/questionnaire');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questionnaires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Business Plans</h1>
            <p className="text-gray-600 mt-2">Manage and continue your business questionnaires</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={loadQuestionnaires}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Plans
                </>
              )}
            </Button>
            <Button onClick={handleStartNew} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Edit className="w-4 h-4 mr-2" />
                  Quick Start
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Questionnaire</DialogTitle>
                  <DialogDescription>
                    Set up a new business plan questionnaire with a custom title and details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <Input
                      value={newQuestionnaire.title}
                      onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., My Pottery Business Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Craft Type
                    </label>
                    <Input
                      value={newQuestionnaire.craft}
                      onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, craft: e.target.value }))}
                      placeholder="e.g., Pottery, Jewelry, Textiles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <Input
                      value={newQuestionnaire.location}
                      onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Jaipur, Mumbai"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateQuestionnaire}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* New Plan Card - Always visible at top */}
        <div className="mb-8">
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer" onClick={handleStartNew}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Create New Business Plan</h3>
              <p className="text-blue-700 mb-4">Start a fresh questionnaire to build your personalized business roadmap</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Start New Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Questionnaires Grid */}
        {questionnaires.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No existing plans yet</h3>
            <p className="text-gray-600">Your completed questionnaires will appear here</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Business Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questionnaires.map((questionnaire) => (
              <Card key={questionnaire.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {questionnaire.craft && questionnaire.location 
                          ? `${questionnaire.craft} in ${questionnaire.location}`
                          : 'Business Plan'
                        }
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleContinueQuestionnaire(questionnaire)}>
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteQuestionnaire(questionnaire.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(questionnaire.status)}>
                        {questionnaire.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(questionnaire.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {questionnaire.craft && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Palette className="w-4 h-4 mr-2" />
                          {questionnaire.craft}
                        </div>
                      )}
                      {questionnaire.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {questionnaire.location}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created {formatDate(questionnaire.createdAt)}
                      </div>
                    </div>

                    <div className="pt-3">
                      <Button 
                        onClick={() => handleContinueQuestionnaire(questionnaire)}
                        className="w-full"
                        variant={questionnaire.status === 'completed' ? 'outline' : 'default'}
                      >
                        {questionnaire.status === 'completed' ? 'View Results' : 'Continue'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button 
            onClick={handleStartNew}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireManager;
