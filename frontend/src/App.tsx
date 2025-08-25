import React, { Suspense } from "react";
// Import routing components from react-router-dom
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Import authentication context provider
import { AuthProvider } from '@/services/auth-context';
// Import protected route component
import { ProtectedRoute } from '@/services/protected-route';
// Import page components
import LoginPage from '@/components/auth/login-page';
import DashboardPage from "@/components/dashboard/dashboard";
import OffersPage from "@/components/offers/offers-page";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageTransition } from '@/components/ui/page-transition';

import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

// Animated route wrapper
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Login route - accessible to everyone */}
        <Route 
          path="/login" 
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          } 
        />
        {/* Dashboard route - protected and requires authentication */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        {/* Offers route - protected and requires authentication */}
        <Route 
          path="/offers" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <OffersPage />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        {/* Root route - redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
};

// Main App component
export default function App() {
  return (
    // Wrap the app with Router for routing functionality
    <Router>
      {/* Wrap the app with AuthProvider to provide authentication context */}
      <AuthProvider>
        <Toaster />
        <div className="App">
          <Suspense fallback={<LoadingSpinner fullScreen message="Loading application..." />}>
            <AnimatedRoutes />
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}