import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, tokenManager } from './auth';
import { tokenRefreshManager } from '../utils/tokenRefresh';
import api from './api';

// Account interface
interface Account {
  balance: number;
}

// User interface defining the structure of user data
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  account?: Account;
}

// AuthContextType interface defining the structure of the authentication context
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
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
      try {
        if (tokenManager.isAuthenticated()) {
          const { access } = tokenManager.getTokens();

          // Check if token is expired
          if (access && !tokenManager.isTokenExpired(access)) {
            // Token is valid, get user profile
            const userData = await authApi.profile();
            setUser(userData);

            // Start token refresh manager
            tokenRefreshManager.start();
          } else {
            // Token is expired, try to refresh
            await refreshTokens();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid tokens
        tokenManager.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      tokenRefreshManager.stop();
    };
  }, []);

  // Function to refresh tokens
  const refreshTokens = async () => {
    try {
      const { refresh } = tokenManager.getTokens();
      if (refresh) {
        const response = await authApi.refresh({ refresh });
        tokenManager.setTokens(response.access, response.refresh || refresh);

        // Get updated user profile
        const userData = await authApi.profile();
        setUser(userData);

        // Start token refresh manager
        tokenRefreshManager.start();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenManager.clearTokens();
      setUser(null);
      throw error;
    }
  };

  // Function to log in a user
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      // Call the login API
      const response = await authApi.login({ username, password });

      // Store tokens using token manager
      tokenManager.setTokens(response.access, response.refresh);

      // Get user profile and set user state
      const userData = await authApi.profile();
      setUser(userData);

      // Start token refresh manager
      tokenRefreshManager.start();
    } catch (error) {
      // Remove any existing tokens on failed login
      tokenManager.clearTokens();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to log out a user
  const logout = async () => {
    try {
      // Stop token refresh manager
      tokenRefreshManager.stop();

      // Get refresh token
      const { refresh } = tokenManager.getTokens();
      if (refresh) {
        // Call logout API to blacklist the refresh token
        await authApi.logout(refresh);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local state and tokens
      tokenManager.clearTokens();
      setUser(null);

      // Update the axios instance to remove the Authorization header
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      if (user && tokenManager.isAuthenticated()) {
        const userData = await authApi.profile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Provide the authentication context to child components
  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      isAuthenticated,
      isLoading: loading,
      refreshUser
    }}>
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