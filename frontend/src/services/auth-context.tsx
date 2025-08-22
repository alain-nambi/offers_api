import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from './auth';

// User interface defining the structure of user data
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

// AuthContextType interface defining the structure of the authentication context
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component that wraps the application and provides authentication state
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State to store the current user
  const [user, setUser] = useState<User | null>(null);
  // State to track if authentication is loading
  const [loading, setLoading] = useState(true);

  // Effect to check if user is already authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      // Check if there's a stored access token
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          // Try to get user profile with the stored token
          const userData = await authApi.profile();
          setUser(userData);
        } catch (error) {
          // If token is invalid, remove it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      // Finish loading
      setLoading(false);
    };

    initAuth();
  }, []);

  // Function to log in a user
  const login = async (username: string, password: string) => {
    try {
      // Call the login API
      const response = await authApi.login({ username, password });
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      // Get user profile and set user state
      const userData = await authApi.profile();
      setUser(userData);
    } catch (error) {
      // Remove any existing tokens on failed login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  };

  // Function to log out a user
  const logout = () => {
    // Get refresh token
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      // Call logout API to blacklist the refresh token
      authApi.logout(refreshToken).catch(() => {
        // Ignore errors during logout
      });
    }
    
    // Remove tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Clear user state
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Provide the authentication context to child components
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};