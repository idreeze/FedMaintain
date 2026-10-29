import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('fedmaintain_token', response.data.token);
      localStorage.setItem('fedmaintain_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/register', data);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    if (response.data) {
      localStorage.setItem('fedmaintain_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('fedmaintain_token');
    localStorage.removeItem('fedmaintain_user');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('fedmaintain_token');
  },

  getStoredUser(): User | null {
    const userJson = localStorage.getItem('fedmaintain_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },
};
