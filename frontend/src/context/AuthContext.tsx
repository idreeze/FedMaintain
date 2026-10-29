import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, User, LoginRequest } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const role: Role | null = user?.role || null;
  const isAuthenticated: boolean = Boolean(token && user);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = authService.getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        setToken(storedToken);
      } catch (error) {
        console.warn('Failed to restore session, clearing auth state:', error);
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
