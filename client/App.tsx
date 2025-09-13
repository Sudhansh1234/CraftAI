import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./hooks/useTheme.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BusinessFlow from "./pages/BusinessFlow";
import Questionnaire from "./pages/Questionnaire";
import QuestionnaireManager from "./pages/QuestionnaireManager";

// Wrapper component to force re-mount when starting new plan
const QuestionnaireWrapper = () => {
  const location = useLocation();
  const isNewPlan = location.state?.isNewPlan || false;
  const clearState = location.state?.clearState || false;
  
  // Use a key that changes when it's a new plan to force complete re-mount
  const key = isNewPlan || clearState ? `new-plan-${Date.now()}` : 'questionnaire';
  
  return <Questionnaire key={key} />;
};
import Marketing from "./pages/Marketing";
import Voice from "./pages/Voice";
import Dashboard from "./pages/Dashboard";
import AddData from "./pages/AddData";
import Auth from "./pages/Auth";
import SocialPlayground from "./pages/SocialPlayground";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
                      <Route path="/questionnaire" element={<ProtectedRoute feature="Questionnaire"><QuestionnaireWrapper /></ProtectedRoute>} />
            <Route path="/questionnaires" element={<ProtectedRoute feature="Questionnaire Manager"><QuestionnaireManager /></ProtectedRoute>} />
          <Route path="/business-flow" element={<ProtectedRoute feature="Business Flow"><BusinessFlow /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute feature="Marketing Tools"><Marketing /></ProtectedRoute>} />
          <Route path="/voice" element={<ProtectedRoute feature="Voice Commerce"><Voice /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute feature="Dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/add-data" element={<ProtectedRoute feature="Add Data"><AddData /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute feature="Social Playground"><SocialPlayground /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
