import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  Sparkles,
  MapPin,
  Package,
  DollarSign,
  Megaphone,
  Target,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Question {
  question: string;
  options?: string[];
  type: 'open' | 'multiple-choice' | 'location' | 'craft-type';
  field: string;
  required: boolean;
}

interface QuestionnaireState {
  currentQuestion: number;
  answers: Record<string, any>;
  questions: Question[];
  isComplete: boolean;
  isGenerating: boolean;
  error?: string;
}

const STATIC_QUESTIONS: Question[] = [
  {
    question: "What craft do you focus on?",
    type: 'craft-type',
    field: 'craft',
    required: true,
    options: [
      'Handwoven Textiles',
      'Pottery & Ceramics',
      'Jewelry & Accessories',
      'Woodwork & Carving',
      'Metalwork & Sculpture',
      'Painting & Art',
      'Leatherwork',
      'Bamboo & Cane Work',
      'Other'
    ]
  },
  {
    question: "Where are you located?",
    type: 'location',
    field: 'location',
    required: true,
    options: [
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Chennai',
      'Hyderabad',
      'Pune',
      'Kolkata',
      'Jaipur',
      'Ahmedabad',
      'Other'
    ]
  },
  {
    question: "Do you currently sell your products?",
    type: 'multiple-choice',
    field: 'selling_status',
    required: true,
    options: [
      'Not selling yet',
      'Selling locally only',
      'Selling online only',
      'Selling both locally and online'
    ]
  },
  {
    question: "What's your biggest business challenge right now?",
    type: 'multiple-choice',
    field: 'challenge',
    required: true,
    options: [
      'Pricing Strategy',
      'Finding Customers',
      'Marketing',
      'Suppliers',
      'Online Presence',
      'Other'
    ]
  },
  {
    question: "What's your target market?",
    type: 'multiple-choice',
    field: 'target_market',
    required: true,
    options: [
      'Local customers',
      'National market',
      'International',
      'Tourists',
      'Wholesale buyers',
      'Other'
    ]
  },
  {
    question: "What's your main goal for the next 6 months?",
    type: 'multiple-choice',
    field: 'goal',
    required: true,
    options: [
      'Increase sales',
      'Improve product quality',
      'Expand product line',
      'Find new suppliers',
      'Build online presence',
      'Other'
    ]
  },
  {
    question: "How long have you been practicing your craft?",
    type: 'multiple-choice',
    field: 'experience_level',
    required: true,
    options: [
      'Less than 1 year',
      '1-3 years',
      '3-5 years',
      '5+ years',
      'Other'
    ]
  },
  {
    question: "Do you participate in local markets or fairs?",
    type: 'multiple-choice',
    field: 'local_markets',
    required: true,
    options: [
      'Yes, regularly',
      'Sometimes',
      'Never',
      'Want to start',
      'Other'
    ]
  },
  {
    question: "Tell us about your craft story and what makes it unique:",
    type: 'open',
    field: 'story',
    required: false
  }
];

const Questionnaire: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<QuestionnaireState>({
    currentQuestion: 0,
    answers: {},
    questions: STATIC_QUESTIONS,
    isComplete: false,
    isGenerating: false
  });

  // Debug: Log component mount/unmount
  useEffect(() => {
    console.log('Questionnaire component MOUNTED');
    return () => {
      console.log('Questionnaire component UNMOUNTED');
    };
  }, []);

  // Force reset on mount if it's a new plan (additional safeguard)
  useEffect(() => {
    if (isNewPlan || clearState) {
      console.log('FORCE RESET on mount - clearing all state');
      setState({
        currentQuestion: 0,
        answers: {},
        questions: STATIC_QUESTIONS,
        isComplete: false,
        isGenerating: false,
        error: undefined
      });
      setCurrentAnswer('');
      setShowOtherInput(false);
      setOtherInputValue('');
      setIsLoading(false);
    }
  }, []); // Run only on mount

  // Check if this is an update to existing questionnaire
  const isUpdate = location.state?.isUpdate || false;
  const questionnaireId = location.state?.questionnaireId;
  const existingAnswers = location.state?.existingAnswers || {};
  const isNewPlan = location.state?.isNewPlan || false;
  const clearState = location.state?.clearState || false;

  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false);
  const [otherInputValue, setOtherInputValue] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('Questionnaire useEffect triggered:', {
      isNewPlan,
      clearState,
      isUpdate,
      existingAnswers: Object.keys(existingAnswers),
      locationState: location.state,
      currentState: state
    });

    // If this is a new plan or clear state is requested, reset to initial state
    if (isNewPlan || clearState) {
      console.log('Resetting questionnaire state for new plan - COMPLETE RESET');
      
      // Force complete reset of all state
      setState({
        currentQuestion: 0,
        answers: {},
        questions: STATIC_QUESTIONS,
        isComplete: false,
        isGenerating: false,
        error: undefined
      });
      
      // Reset all other state variables
      setCurrentAnswer('');
      setShowOtherInput(false);
      setOtherInputValue('');
      setIsLoading(false);
      setIsInitialized(true);
      
      console.log('Questionnaire state reset completed');
      return;
    }

    // If this is an update, initialize with existing answers
    if (isUpdate && Object.keys(existingAnswers).length > 0) {
      console.log('Loading existing answers for update:', existingAnswers);
      setState(prev => ({
        ...prev,
        answers: existingAnswers,
        currentQuestion: Math.min(Object.keys(existingAnswers).length, STATIC_QUESTIONS.length - 1)
      }));
    }
    
    // Mark as initialized
    setIsInitialized(true);
  }, [isUpdate, existingAnswers, isNewPlan, clearState]);

  // Static questionnaire - simple progression through predefined questions
  const goToNextQuestion = () => {
    if (state.currentQuestion < STATIC_QUESTIONS.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }));
    } else {
      // All questions completed
      setState(prev => ({
        ...prev,
        isComplete: true
      }));
    }
  };

  const handleAnswer = (answer: string) => {
    if (answer === 'Other') {
      setShowOtherInput(true);
      return;
    }

    const currentQ = state.questions[state.currentQuestion];
    
    // Add null check to prevent the error
    if (!currentQ || !currentQ.field) {
      console.error('Current question is undefined or missing field:', {
        currentQuestion: state.currentQuestion,
        questionsLength: state.questions.length,
        currentQ,
        state
      });
      return;
    }

    const newAnswers = {
      ...state.answers,
      [currentQ.field]: answer
    };

    setState(prev => ({
      ...prev,
      answers: newAnswers
    }));

    setCurrentAnswer('');
    setShowOtherInput(false);
    setOtherInputValue('');

    // Move to next question
    goToNextQuestion();
  };

  const handleOtherSubmit = () => {
    if (!otherInputValue.trim()) return;

    const currentQ = state.questions[state.currentQuestion];
    
    // Add null check to prevent the error
    if (!currentQ || !currentQ.field) {
      console.error('Current question is undefined or missing field in handleOtherSubmit:', {
        currentQuestion: state.currentQuestion,
        questionsLength: state.questions.length,
        currentQ,
        state
      });
      return;
    }

    const newAnswers = {
      ...state.answers,
      [currentQ.field]: otherInputValue.trim()
    };

    setState(prev => ({
      ...prev,
      answers: newAnswers
    }));

    setCurrentAnswer('');
    setShowOtherInput(false);
    setOtherInputValue('');

    // Move to next question
    goToNextQuestion();
  };

  const handleNext = () => {
    if (currentAnswer.trim()) {
      handleAnswer(currentAnswer.trim());
    }
  };

  const handlePrevious = () => {
    if (state.currentQuestion > 0) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1
      }));
      setCurrentAnswer('');
    }
  };

  const generateFlow = async () => {
    try {
      setState(prev => ({ ...prev, isGenerating: true }));
      
      // Save questionnaire if it's an update
      if (isUpdate && questionnaireId) {
        await fetch(`/api/questionnaires/${questionnaireId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            answers: state.answers,
            status: 'completed'
          }),
        });
      }
      
      // Use Gemini AI only for flowchart generation
      const response = await fetch('/api/questionnaire/generate-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: state.answers }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const flowData = await response.json();
      
      // Navigate to Business Flow with generated data
      navigate('/business-flow', { 
        state: { 
          generatedFlow: flowData,
          fromQuestionnaire: true 
        } 
      });
    } catch (error) {
      console.error('Error generating flow:', error);
      
      // Show error state instead of fallback
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        error: 'Failed to generate your business flow. Please try again later.'
      }));
    }
  };

  // Show loading state until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Questionnaire</h2>
          <p className="text-gray-600">
            Please wait while we prepare your questionnaire...
          </p>
        </div>
      </div>
    );
  }

  const currentQ = state.questions[state.currentQuestion];
  const progress = state.questions.length > 0 ? ((state.currentQuestion + 1) / state.questions.length) * 100 : 0;

  // Add safety check for currentQ
  if (!currentQ) {
    console.error('Current question is undefined in render:', {
      currentQuestion: state.currentQuestion,
      questionsLength: state.questions.length,
      state,
      isInitialized
    });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questionnaire Error</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the questionnaire. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Generation Failed</h2>
          <p className="text-gray-600 mb-6">
            {state.error}
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => setState(prev => ({ ...prev, error: undefined }))}
              variant="outline"
              className="flex-1"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/questionnaires')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Back to Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Questionnaire Complete!</CardTitle>
              <p className="text-gray-600">
                We have all the information we need to create your personalized business roadmap.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-lg">Your Profile:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(state.answers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {key.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={generateFlow}
                disabled={state.isGenerating}
                className="w-full gemini-gradient text-white border-0 hover:opacity-90"
                size="lg"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Your Flow...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create My Business Flow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Question {state.currentQuestion + 1} of {state.questions.length}
                </span>
              </div>
              <Badge variant="outline">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-xl">{currentQ?.question}</CardTitle>
            {(isNewPlan || clearState) && (
              <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Starting fresh for your new business plan - Component re-mounted
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentQ?.type === 'multiple-choice' && currentQ.options ? (
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 text-left"
                        onClick={() => handleAnswer(option)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full opacity-0" />
                          </div>
                          <span>{option}</span>
                        </div>
                      </Button>
                    ))}
                    
                    {/* Other input textbox */}
                    {showOtherInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <Input
                          placeholder="Please specify..."
                          value={otherInputValue}
                          onChange={(e) => setOtherInputValue(e.target.value)}
                          className="w-full"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleOtherSubmit}
                            disabled={!otherInputValue.trim()}
                            className="flex-1"
                          >
                            Submit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowOtherInput(false);
                              setOtherInputValue('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : currentQ?.type === 'craft-type' ? (
                  <div className="space-y-3">
                    {currentQ.options?.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 text-left"
                        onClick={() => handleAnswer(option)}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-gray-500" />
                          <span>{option}</span>
                        </div>
                      </Button>
                    ))}
                    
                    {/* Other input textbox */}
                    {showOtherInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <Input
                          placeholder="Please specify your craft type..."
                          value={otherInputValue}
                          onChange={(e) => setOtherInputValue(e.target.value)}
                          className="w-full"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleOtherSubmit}
                            disabled={!otherInputValue.trim()}
                            className="flex-1"
                          >
                            Submit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowOtherInput(false);
                              setOtherInputValue('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : currentQ?.type === 'location' ? (
                  <div className="space-y-3">
                    {currentQ.options?.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 text-left"
                        onClick={() => handleAnswer(option)}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-500" />
                          <span>{option}</span>
                        </div>
                      </Button>
                    ))}
                    
                    {/* Other input textbox */}
                    {showOtherInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <Input
                          placeholder="Please specify your location..."
                          value={otherInputValue}
                          onChange={(e) => setOtherInputValue(e.target.value)}
                          className="w-full"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleOtherSubmit}
                            disabled={!otherInputValue.trim()}
                            className="flex-1"
                          >
                            Submit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowOtherInput(false);
                              setOtherInputValue('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Tell us more about your answer..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={handleNext}
                      disabled={!currentAnswer.trim()}
                      className="w-full"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {currentQ?.type === 'multiple-choice' && (
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={state.currentQuestion === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm text-gray-500">
                  Select an option to continue
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating next question...
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Questionnaire;
