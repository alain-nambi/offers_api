import api from './api';

// Interface for login request data
interface LoginRequest {
  username: string;
  password: string;
}

// Interface for login response data
interface LoginResponse {
  refresh: string;
  access: string;
}

// Interface for user profile data
interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

// Interface for refresh token request
interface RefreshRequest {
  refresh: string;
}

// Interface for refresh token response
interface RefreshResponse {
  access: string;
  refresh?: string;
}

// Authentication API functions
export const authApi = {
  // Function to log in a user
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', data);
    return response.data;
  },

  // Function to get the current user's profile
  profile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/profile/');
    return response.data;
  },

  // Function to refresh access token
  refresh: async (data: RefreshRequest): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>('/auth/refresh/', data);
    return response.data;
  },

  // Function to log out a user
  logout: async (refresh: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh });
  }
};

// Token management utilities
export const tokenManager = {
  // Store tokens in localStorage
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },

  // Get tokens from localStorage
  getTokens: () => ({
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  }),

  // Clear tokens from localStorage
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const { access, refresh } = tokenManager.getTokens();
    return !!(access && refresh);
  },

  // Check if token is expired (basic check)
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },
};