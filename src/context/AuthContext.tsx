import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (curr: string, next: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.getCurrentUser();
        setUser(res.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        removeStoredToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(email, pass);
      setStoredToken(res.token);
      setUser(res.user);
      showToast('Welcome back to FinancialFree!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Invalid email or password', 'error');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      removeStoredToken();
      setUser(null);
      showToast('Logged out securely.', 'info');
    }
  };

  const changePassword = async (curr: string, next: string): Promise<boolean> => {
    try {
      const res = await api.changePassword(curr, next);
      showToast(res.message || 'Password changed successfully', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
