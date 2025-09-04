import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Marketing from "./pages/Marketing";
import Storytelling from "./pages/Storytelling";
import Pricing from "./pages/Pricing";
import Voice from "./pages/Voice";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ImageStudio from "./pages/ImageStudio";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/chat" element={<ProtectedRoute feature="AI Chatbot"><Chat /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute feature="Marketing Tools"><Marketing /></ProtectedRoute>} />
          <Route path="/storytelling" element={<ProtectedRoute feature="Storytelling Platform"><Storytelling /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute feature="Pricing Tools"><Pricing /></ProtectedRoute>} />
          <Route path="/voice" element={<ProtectedRoute feature="Voice Commerce"><Voice /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute feature="Dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/images" element={<ProtectedRoute feature="Image Studio"><ImageStudio /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
