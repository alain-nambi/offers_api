import React from "react";
// Import routing components from react-router-dom
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Import authentication context provider
import { AuthProvider } from '@/services/auth-context';
// Import protected route component
import { ProtectedRoute } from '@/services/protected-route';
// Import page components
import LoginPage from '@/components/auth/login-page';
import DashboardPage from "@/components/dashboard/dashboard";

import { Toaster } from "react-hot-toast";

// Main App component
export default function App() {
  return (
    // Wrap the app with Router for routing functionality
    <Router>
      {/* Wrap the app with AuthProvider to provide authentication context */}
      <AuthProvider>
        <Toaster />
        <div className="App">
          {/* Define routes for the application */}
          <Routes>
            {/* Login route - accessible to everyone */}
            <Route path="/login" element={<LoginPage />} />
            {/* Dashboard route - protected and requires authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            {/* Root route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}