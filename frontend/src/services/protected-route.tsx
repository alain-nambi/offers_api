import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';

// Interface for ProtectedRoute component props
interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ProtectedRoute component to guard routes that require authentication
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Get authentication state from the auth context
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading authentication state, show loading indicator
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If user is authenticated, render children, otherwise redirect to login
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};