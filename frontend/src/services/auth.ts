import api from './api';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  refresh: string;
  access: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', data);
    return response.data;
  },

  profile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/profile/');
    return response.data;
  },

  logout: async (refresh: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh });
  }
};