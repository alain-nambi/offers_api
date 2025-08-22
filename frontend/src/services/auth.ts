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

  // Function to log out a user
  logout: async (refresh: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh });
  }
};