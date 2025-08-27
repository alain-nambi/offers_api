import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, tokenManager } from '../services/auth';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && tokenManager.isAuthenticated();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (tokenManager.isAuthenticated()) {
        const { access } = tokenManager.getTokens();
        
        // Check if token is expired
        if (access && !tokenManager.isTokenExpired(access)) {
          // Token is valid, get user profile
          const userProfile = await authApi.profile();
          setUser(userProfile);
        } else {
          // Token is expired, try to refresh
          await refreshTokens();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      tokenManager.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async () => {
    try {
      const { refresh } = tokenManager.getTokens();
      if (refresh) {
        const response = await authApi.refresh({ refresh });
        tokenManager.setTokens(response.access, response.refresh || refresh);
        
        // Get updated user profile
        const userProfile = await authApi.profile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenManager.clearTokens();
      setUser(null);
      throw error;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ username, password });
      
      // Store tokens
      tokenManager.setTokens(response.access, response.refresh);
      
      // Get user profile
      const userProfile = await authApi.profile();
      setUser(userProfile);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { refresh } = tokenManager.getTokens();
      if (refresh) {
        await authApi.logout(refresh);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and tokens
      tokenManager.clearTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const userProfile = await authApi.profile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;