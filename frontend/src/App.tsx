import React, { Suspense } from "react";
// Import routing components from react-router-dom
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Import authentication context provider
import { AuthProvider } from '@/services/auth-context';
// Import sidebar context provider
import { SidebarProvider } from '@/components/dashboard/sidebar-context';
// Import protected route component
import { ProtectedRoute } from '@/services/protected-route';
// Import page components
import LoginPage from '@/components/auth/login-page';
import DashboardPage from "@/components/dashboard/dashboard";
import OffersPage from "@/components/offers/offers-page";
import SubscriptionsPage from "@/components/subscriptions/subscriptions-page";
import TransactionsList from "@/components/transactions/transactions-list";
import ReportsPage from "@/components/reports/reports-page";
// import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageTransition } from '@/components/ui/page-transition';
// import AuthDebugger from './components/AuthDebugger';

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
        {/* Subscriptions route - protected and requires authentication */}
        <Route 
          path="/subscriptions" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <SubscriptionsPage />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        {/* Transactions route - protected and requires authentication */}
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <TransactionsList />
              </PageTransition>
            </ProtectedRoute>
          } 
        />
        {/* Reports route - protected and requires authentication */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <PageTransition>
                <ReportsPage />
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
        {/* Wrap the app with SidebarProvider to provide sidebar context */}
        <SidebarProvider>
          {/* <AuthDebugger /> */}
          <div className="App">
            {/* <Suspense fallback={<LoadingSpinner fullScreen message="Loading application..." />}> */}
            <AnimatedRoutes />
            {/* </Suspense> */}
          </div>
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}